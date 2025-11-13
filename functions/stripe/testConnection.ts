import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

Deno.serve(async (req) => {
  const diagnostico = { etapas: [] };

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      diagnostico.etapas.push({ passo: 'Autenticação', status: '❌ ERRO', erro: 'Não autenticado' });
      return Response.json(diagnostico, { status: 401 });
    }

    diagnostico.etapas.push({ passo: 'Autenticação', status: '✅ OK', usuario: user.email });

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      diagnostico.etapas.push({ passo: 'Chave Stripe', status: '❌ ERRO', erro: 'Não configurada' });
      return Response.json(diagnostico, { status: 500 });
    }

    diagnostico.etapas.push({
      passo: 'Chave Stripe',
      status: '✅ OK',
      tipo: stripeKey.startsWith('sk_live_') ? 'PRODUÇÃO' : 'TESTE'
    });

    const stripe = new Stripe(stripeKey);
    const balance = await stripe.balance.retrieve();
    diagnostico.etapas.push({ passo: 'Conexão Stripe', status: '✅ OK' });

    const afiliados = await base44.entities.Afiliado.list();
    if (afiliados.length > 0) {
      const af = afiliados[0];
      diagnostico.etapas.push({ passo: 'Afiliado', status: '✅ OK', nome: af.nome });
      
      try {
        const account = await stripe.accounts.retrieve(af.stripe_connect_account_id);
        diagnostico.etapas.push({
          passo: 'Conta Conectada',
          status: account.charges_enabled ? '✅ OK' : '⚠️ AVISO',
          charges_enabled: account.charges_enabled
        });
      } catch (error) {
        diagnostico.etapas.push({ passo: 'Conta Conectada', status: '❌ ERRO', erro: error.message });
      }
    }

    diagnostico.resultado_final = '✅ OK';
    return Response.json(diagnostico);

  } catch (error) {
    diagnostico.etapas.push({ passo: 'Erro', status: '❌ ERRO', erro: error.message });
    return Response.json(diagnostico, { status: 500 });
  }
});