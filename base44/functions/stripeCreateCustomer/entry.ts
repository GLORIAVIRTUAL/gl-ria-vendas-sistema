import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, name, phone } = await req.json();
    if (!email || !name) {
      return Response.json({ error: 'Email e name obrigatórios' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const customer = await stripe.customers.create({
      email,
      name,
      phone: phone || undefined,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
        created_by: user.email
      }
    });

    return Response.json({
      success: true,
      customerId: customer.id
    });

  } catch (error) {
    return Response.json({ 
      error: error.message
    }, { status: 500 });
  }
});