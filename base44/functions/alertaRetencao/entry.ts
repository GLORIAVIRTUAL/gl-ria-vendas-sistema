import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { calcularSaude } from '../../shared/saudeCliente.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Quando chamado por um usuário logado, apenas admins podem executar.
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const negocios = await base44.asServiceRole.entities.NegocioFechado.list('-created_date', 500);

    const emRisco = negocios
      .map((n) => ({ negocio: n, saude: calcularSaude(n) }))
      .filter((i) => i.saude.faixa === 'Risco' && i.negocio.status_pagamento !== 'Cancelado')
      .sort((a, b) => a.saude.score - b.saude.score);

    console.log(`Clientes analisados: ${negocios.length} | em risco: ${emRisco.length}`);

    if (emRisco.length === 0) {
      return Response.json({ ok: true, analisados: negocios.length, em_risco: 0, emails_enviados: 0 });
    }

    const linhas = emRisco.map(({ negocio, saude }) =>
      `• ${negocio.nome_empresa || negocio.nome_cliente} — score ${saude.score} | R$ ${(negocio.valor_mensalidade || 0).toLocaleString('pt-BR')}/mês | ${saude.alertas.join('; ')}`
    ).join('\n');

    const mrrEmRisco = emRisco.reduce((s, i) => s + (i.negocio.valor_mensalidade || 0), 0);

    const corpo = `Alerta diário de retenção\n\n${emRisco.length} cliente(s) em risco de cancelamento.\nMRR em risco: R$ ${mrrEmRisco.toLocaleString('pt-BR')}\n\n${linhas}\n\nAbra a página "Pós-venda e Retenção" no sistema para agir.`;

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    let enviados = 0;

    for (const admin of admins) {
      if (!admin.email) continue;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `⚠️ ${emRisco.length} cliente(s) em risco de churn`,
        body: corpo,
        from_name: 'Glória Vendas'
      });
      enviados++;
    }

    return Response.json({ ok: true, analisados: negocios.length, em_risco: emRisco.length, mrr_em_risco: mrrEmRisco, emails_enviados: enviados });
  } catch (error) {
    console.error('Erro no alerta de retenção:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}