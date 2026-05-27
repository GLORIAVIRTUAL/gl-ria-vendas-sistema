import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    // Valida webhook do Stripe
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Processa diferentes tipos de eventos
    switch (event.type) {
      // 🆕 NOVO: Quando um checkout é concluído no site
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('✅ Checkout concluído:', session.id);

        // Busca detalhes do customer e subscription
        const customer = await stripe.customers.retrieve(session.customer);
        const subscription = session.subscription 
          ? await stripe.subscriptions.retrieve(session.subscription)
          : null;

        if (!subscription) {
          console.log('⚠️ Checkout sem assinatura, ignorando...');
          break;
        }

        // Extrai informações do produto
        const lineItem = subscription.items.data[0];
        const price = lineItem.price;
        const product = await stripe.products.retrieve(price.product);

        // Mapeia nome do produto para enum
        const produtoMap = {
          'Glória Atendente': 'Gloria_Atendente',
          'Glória Clínica': 'Gloria_Clinica',
          'Máquina de Vídeos': 'Maquina_de_Videos',
          'Glória Finanças': 'Gloria_Financas',
          'Avatar ao Vivo': 'Avatar_ao_Vivo'
        };

        const produtoEnum = produtoMap[product.name] || 'Gloria_Atendente';

        // Verifica se já existe negócio para esta assinatura
        const existente = await base44.asServiceRole.entities.NegocioFechado.filter({
          stripe_subscription_id: subscription.id
        });

        if (existente.length > 0) {
          console.log('⚠️ Negócio já existe para esta assinatura');
          break;
        }

        // Cria negócio automaticamente
        const negocio = await base44.asServiceRole.entities.NegocioFechado.create({
          nome_cliente: customer.name || 'Cliente',
          nome_empresa: customer.name || 'Empresa',
          email_cliente: customer.email,
          telefone_cliente: customer.phone || '',
          produto: produtoEnum,
          valor_mensalidade: price.unit_amount / 100, // Stripe usa centavos
          dia_cobranca: new Date(subscription.current_period_start * 1000).getDate(),
          data_primeira_cobranca: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
          forma_pagamento: session.payment_method_types[0] === 'card' ? 'card' : 'boleto',
          status_pagamento: 'Ativo',
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          observacoes: '✨ Criado automaticamente via webhook do site'
        });

        // Cria lead no CRM
        const lead = await base44.asServiceRole.entities.Lead.create({
          nome_cliente: customer.name || 'Cliente',
          nome_empresa: customer.name || 'Empresa',
          email_cliente: customer.email,
          telefone_cliente: customer.phone || '',
          produto_interesse: produtoEnum,
          estagio: 'Negocio_Fechado',
          valor_estimado: price.unit_amount / 100,
          observacoes: '✨ Criado automaticamente via webhook do site',
          prioridade: 'Alta',
          negocio_id: negocio.id
        });

        console.log('✅ Negócio e Lead criados automaticamente!');

        // 📧 ENVIAR EMAIL COM FORMULÁRIO DE ONBOARDING
        try {
          const formularioUrl = `https://preview--agenda-gloria-766ae684.base44.app/api/functions/formularioOnboarding?lead_id=${lead.id}&email=${encodeURIComponent(customer.email)}`;
          
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: customer.email,
            subject: '🎉 Bem-vindo! Complete seu cadastro',
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">🎉 Pagamento Confirmado!</h1>
                </div>
                
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px; color: #374151;">Olá <strong>${customer.name || 'Cliente'}</strong>,</p>
                  
                  <p style="font-size: 16px; color: #374151;">
                    Seu pagamento foi confirmado com sucesso! 🎊
                  </p>
                  
                  <p style="font-size: 16px; color: #374151;">
                    Para que possamos configurar seus serviços corretamente, por favor complete seu cadastro clicando no botão abaixo:
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${formularioUrl}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                      📋 Completar Cadastro
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #6b7280;">
                    Ou copie e cole este link no seu navegador:<br>
                    <a href="${formularioUrl}" style="color: #667eea; word-break: break-all;">${formularioUrl}</a>
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="font-size: 14px; color: #6b7280; text-align: center;">
                    Qualquer dúvida, estamos à disposição!<br>
                    <strong>Equipe Glória Vendas</strong>
                  </p>
                </div>
              </div>
            `
          });
          console.log('✅ Email de onboarding enviado!');
        } catch (emailError) {
          console.error('⚠️ Erro ao enviar email:', emailError);
        }

        // 📱 ENVIAR WHATSAPP COM FORMULÁRIO (se tiver telefone)
        if (customer.phone) {
          try {
            const formularioUrl = `https://preview--agenda-gloria-766ae684.base44.app/api/functions/formularioOnboarding?lead_id=${lead.id}&email=${encodeURIComponent(customer.email)}`;
            
            await base44.asServiceRole.functions.invoke('whatsapp_sendMessage', {
              phone: customer.phone,
              message: `🎉 *Pagamento Confirmado!*

Olá ${customer.name || 'Cliente'}!

Seu pagamento foi aprovado com sucesso! 🎊

Para configurarmos seus serviços, complete seu cadastro aqui:

${formularioUrl}

📋 *É rápido e fácil!*

Qualquer dúvida, estamos à disposição!

_Equipe Glória Vendas_`
            });
            console.log('✅ WhatsApp de onboarding enviado!');
          } catch (whatsappError) {
            console.error('⚠️ Erro ao enviar WhatsApp:', whatsappError);
          }
        }

        break;
      }

      // 🆕 NOVO: Quando uma assinatura é criada diretamente
      case 'customer.subscription.created': {
        const subscription = event.data.object;
        console.log('✅ Assinatura criada:', subscription.id);

        // Verifica se já existe (pode ter sido criado pelo checkout.session.completed)
        const existente = await base44.asServiceRole.entities.NegocioFechado.filter({
          stripe_subscription_id: subscription.id
        });

        if (existente.length > 0) {
          console.log('⚠️ Negócio já existe, ignorando...');
          break;
        }

        // Busca customer
        const customer = await stripe.customers.retrieve(subscription.customer);
        const lineItem = subscription.items.data[0];
        const price = lineItem.price;
        const product = await stripe.products.retrieve(price.product);

        const produtoMap = {
          'Glória Atendente': 'Gloria_Atendente',
          'Glória Clínica': 'Gloria_Clinica',
          'Máquina de Vídeos': 'Maquina_de_Videos',
          'Glória Finanças': 'Gloria_Financas',
          'Avatar ao Vivo': 'Avatar_ao_Vivo'
        };

        const produtoEnum = produtoMap[product.name] || 'Gloria_Atendente';

        // Cria negócio
        await base44.asServiceRole.entities.NegocioFechado.create({
          nome_cliente: customer.name || 'Cliente',
          nome_empresa: customer.name || 'Empresa',
          email_cliente: customer.email,
          telefone_cliente: customer.phone || '',
          produto: produtoEnum,
          valor_mensalidade: price.unit_amount / 100,
          dia_cobranca: new Date(subscription.current_period_start * 1000).getDate(),
          data_primeira_cobranca: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
          forma_pagamento: 'card', // Assume cartão por padrão
          status_pagamento: 'Ativo',
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          observacoes: '✨ Criado automaticamente via webhook'
        });

        console.log('✅ Negócio criado automaticamente!');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const negocioId = invoice.subscription_details?.metadata?.negocio_id;
        
        if (negocioId) {
          await base44.asServiceRole.entities.NegocioFechado.update(negocioId, {
            status_pagamento: 'Ativo'
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const negocioId = invoice.subscription_details?.metadata?.negocio_id;
        
        if (negocioId) {
          await base44.asServiceRole.entities.NegocioFechado.update(negocioId, {
            status_pagamento: 'Inadimplente'
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const negocioId = subscription.metadata?.negocio_id;
        
        if (negocioId) {
          await base44.asServiceRole.entities.NegocioFechado.update(negocioId, {
            status_pagamento: 'Cancelado'
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const negocioId = subscription.metadata?.negocio_id;
        
        if (negocioId && subscription.status === 'active') {
          await base44.asServiceRole.entities.NegocioFechado.update(negocioId, {
            status_pagamento: 'Ativo'
          });
        }
        break;
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: 'Webhook processing failed',
      message: error.message
    }, { status: 500 });
  }
});