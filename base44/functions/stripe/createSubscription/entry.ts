import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

Deno.serve(async (req) => {
  console.log('🚀 Iniciando createSubscription');
  
  try {
    // Step 1: Auth
    console.log('1️⃣ Verificando autenticação...');
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      console.log('❌ Não autenticado');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ Autenticado:', user.email);

    // Step 2: Parse body
    console.log('2️⃣ Lendo body...');
    const body = await req.json();
    console.log('✅ Body recebido:', JSON.stringify(body, null, 2));

    const { customerId, priceAmount, productName, billingDay, negocioId, afiliadoStripeAccountId, percentualComissao } = body;

    // Step 3: Validate
    console.log('3️⃣ Validando campos...');
    if (!customerId || !priceAmount || !productName) {
      console.log('❌ Campos faltando:', { customerId, priceAmount, productName });
      return Response.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }
    console.log('✅ Campos válidos');

    // Step 4: Init Stripe
    console.log('4️⃣ Inicializando Stripe...');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.log('❌ STRIPE_SECRET_KEY não configurada');
      return Response.json({ error: 'Stripe não configurado' }, { status: 500 });
    }
    const stripe = new Stripe(stripeKey);
    console.log('✅ Stripe inicializado');

    // Step 5: Create product
    console.log('5️⃣ Criando produto...');
    const product = await stripe.products.create({
      name: productName,
      metadata: {
        negocio_id: negocioId || '',
        base44_app_id: Deno.env.get('BASE44_APP_ID') || ''
      }
    });
    console.log('✅ Produto criado:', product.id);

    // Step 6: Create price
    console.log('6️⃣ Criando preço...');
    const amount = Math.round(parseFloat(priceAmount) * 100);
    console.log('Valor calculado:', amount, 'centavos');
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: 'brl',
      recurring: { interval: 'month' }
    });
    console.log('✅ Preço criado:', price.id);

    // Step 7: Prepare subscription
    console.log('7️⃣ Preparando assinatura...');
    const subscriptionData = {
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        negocio_id: negocioId || '',
        base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
        billing_day: billingDay?.toString() || '1'
      },
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card', 'boleto'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    };
    console.log('✅ Dados preparados');

    // Step 8: Check affiliate
    let comissaoConfigurada = false;
    if (afiliadoStripeAccountId && percentualComissao && percentualComissao > 0) {
      console.log('8️⃣ Verificando afiliado:', afiliadoStripeAccountId);
      try {
        const account = await stripe.accounts.retrieve(afiliadoStripeAccountId);
        console.log('Conta afiliado:', { 
          id: account.id, 
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled
        });
        
        if (account.charges_enabled) {
          subscriptionData.application_fee_percent = percentualComissao;
          subscriptionData.on_behalf_of = afiliadoStripeAccountId;
          comissaoConfigurada = true;
          console.log('✅ Comissão configurada:', percentualComissao + '%');
        } else {
          console.warn('⚠️ Conta não habilitada, pulando comissão');
        }
      } catch (error) {
        console.error('❌ Erro ao validar afiliado:', error.message);
      }
    } else {
      console.log('8️⃣ Sem afiliado');
    }

    // Step 9: Create subscription
    console.log('9️⃣ Criando assinatura...');
    console.log('Dados finais:', JSON.stringify(subscriptionData, null, 2));
    const subscription = await stripe.subscriptions.create(subscriptionData);
    console.log('✅ Assinatura criada:', subscription.id);

    // Step 10: Return
    console.log('🎉 Sucesso!');
    return Response.json({
      success: true,
      subscriptionId: subscription.id,
      customerId,
      status: subscription.status,
      invoiceId: subscription.latest_invoice?.id,
      invoiceUrl: subscription.latest_invoice?.hosted_invoice_url,
      comissaoConfigurada
    });

  } catch (error) {
    console.error('💥 ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    console.error('Type:', error.type);
    console.error('Message:', error.message);
    
    return Response.json({ 
      error: 'Erro ao criar assinatura',
      message: error.message,
      type: error.type || 'unknown',
      stack: error.stack
    }, { status: 500 });
  }
});