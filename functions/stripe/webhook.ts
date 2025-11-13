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
        await base44.asServiceRole.entities.NegocioFechado.create({
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
        await base44.asServiceRole.entities.Lead.create({
          nome_cliente: customer.name || 'Cliente',
          nome_empresa: customer.name || 'Empresa',
          email_cliente: customer.email,
          telefone_cliente: customer.phone || '',
          produto_interesse: produtoEnum,
          estagio: 'Negocio_Fechado',
          valor_estimado: price.unit_amount / 100,
          observacoes: '✨ Criado automaticamente via webhook do site',
          prioridade: 'Alta'
        });

        console.log('✅ Negócio e Lead criados automaticamente!');
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