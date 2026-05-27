import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('Unauthorized: No user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Create payment link request:', body);

    const { 
      priceAmount, 
      productName,
      customerEmail,
      negocioId
    } = body;

    if (!priceAmount || !productName || !customerEmail) {
      console.error('Missing required fields:', {
        priceAmount: !!priceAmount,
        productName: !!productName,
        customerEmail: !!customerEmail
      });
      return Response.json({ 
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return Response.json({ 
        error: 'Stripe not configured',
        message: 'STRIPE_SECRET_KEY is not set'
      }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);

    // Cria produto
    console.log('Creating product for payment link:', productName);
    const product = await stripe.products.create({
      name: productName,
      metadata: {
        negocio_id: negocioId || ''
      }
    });
    console.log('Product created:', product.id);

    // Cria preço
    console.log('Creating price for amount:', priceAmount);
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(priceAmount * 100),
      currency: 'brl',
      recurring: {
        interval: 'month'
      }
    });
    console.log('Price created:', price.id);

    // Cria link de pagamento
    console.log('Creating payment link');
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price: price.id,
        quantity: 1
      }],
      customer_creation: 'always',
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${req.headers.get('origin') || 'https://app.base44.com'}/negocios`
        }
      },
      metadata: {
        negocio_id: negocioId || '',
        customer_email: customerEmail
      }
    });

    console.log('Payment link created successfully:', paymentLink.id);

    return Response.json({
      success: true,
      paymentLink: paymentLink.url,
      linkId: paymentLink.id
    });

  } catch (error) {
    console.error('Error creating payment link:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: 'Failed to create payment link',
      message: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});