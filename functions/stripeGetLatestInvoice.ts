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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice']
    });

    return Response.json({
      invoiceUrl: subscription.latest_invoice?.hosted_invoice_url || null
    });

  } catch (error) {
    return Response.json({ 
      error: error.message
    }, { status: 500 });
  }
});