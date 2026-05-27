import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

Deno.serve(async (req) => {
  console.log('🚀 stripeCreateSubscription iniciada');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      console.log('❌ Não autenticado');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User:', user.email);

    const body = await req.json();
    console.log('📦 Body:', JSON.stringify(body));

    const { customerId, priceAmount, productName, negocioId, afiliadoStripeAccountId, percentualComissao } = body;

    if (!customerId || !priceAmount || !productName) {
      console.log('❌ Campos faltando');
      return Response.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    console.log('1️⃣ Criando produto...');
    const product = await stripe.products.create({
      name: productName,
      metadata: { negocio_id: negocioId || '' }
    });
    console.log('✅ Produto:', product.id);

    console.log('2️⃣ Criando preço...');
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(parseFloat(priceAmount) * 100),
      currency: 'brl',
      recurring: { interval: 'month' }
    });
    console.log('✅ Preço:', price.id);

    console.log('3️⃣ Preparando assinatura...');
    const subscriptionData = {
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card', 'boleto'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: { negocio_id: negocioId || '' },
      // 🔔 ATIVA ENVIO AUTOMÁTICO DE EMAIL
      collection_method: 'send_invoice',
      days_until_due: 3 // Cliente tem 3 dias para pagar
    };

    let comissaoConfigurada = false;
    if (afiliadoStripeAccountId && percentualComissao > 0) {
      console.log('4️⃣ Configurando afiliado:', afiliadoStripeAccountId);
      try {
        const account = await stripe.accounts.retrieve(afiliadoStripeAccountId);
        console.log('Conta:', { id: account.id, charges_enabled: account.charges_enabled });
        
        if (account.charges_enabled) {
          const valorTotal = Math.round(parseFloat(priceAmount) * 100);
          const valorAfiliado = Math.round(valorTotal * (percentualComissao / 100));
          const valorEmpresa = valorTotal - valorAfiliado;
          
          console.log('Valores:', {
            total: valorTotal + ' centavos (R$ ' + priceAmount + ')',
            afiliado: valorAfiliado + ' centavos (' + percentualComissao + '%)',
            empresa: valorEmpresa + ' centavos (' + (100 - percentualComissao) + '%)'
          });

          subscriptionData.transfer_data = {
            destination: afiliadoStripeAccountId,
            amount_percent: percentualComissao
          };
          
          comissaoConfigurada = true;
          console.log('✅ Transfer configurado: ' + percentualComissao + '% vai para afiliado');
        } else {
          console.log('⚠️ Conta não habilitada');
        }
      } catch (err) {
        console.error('❌ Erro afiliado:', err.message);
      }
    } else {
      console.log('4️⃣ Sem afiliado');
    }

    console.log('5️⃣ Criando assinatura...');
    const subscription = await stripe.subscriptions.create(subscriptionData);
    console.log('✅ Assinatura:', subscription.id);

    // 🔔 Finaliza a invoice para forçar envio do email
    if (subscription.latest_invoice) {
      console.log('6️⃣ Finalizando invoice para enviar email...');
      const invoice = await stripe.invoices.finalizeInvoice(subscription.latest_invoice.id, {
        auto_advance: true // Garante que o Stripe envia o email
      });
      console.log('✅ Invoice finalizada:', invoice.id);
      console.log('📧 Email será enviado automaticamente pelo Stripe!');
    }

    return Response.json({
      success: true,
      subscriptionId: subscription.id,
      invoiceUrl: subscription.latest_invoice?.hosted_invoice_url,
      comissaoConfigurada
    });

  } catch (error) {
    console.error('💥 ERRO:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});