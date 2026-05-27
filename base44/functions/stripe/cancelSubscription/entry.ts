import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId } = await req.json();
    if (!subscriptionId) {
      return Response.json({ error: 'subscriptionId obrigatório' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    return Response.json({
      success: true,
      subscription,
      status: subscription.status
    });

  } catch (error) {
    return Response.json({ 
      error: 'Falha ao cancelar',
      message: error.message
    }, { status: 500 });
  }
});