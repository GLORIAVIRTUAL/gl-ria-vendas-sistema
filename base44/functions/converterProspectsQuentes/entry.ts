import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SCORE_MINIMO = 80;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const db = base44.asServiceRole.entities;
    const prospects = await db.Prospect.filter({ status: 'salvo' }, '-score', 200);

    const quentes = prospects.filter(
      (p) => (p.score || 0) >= SCORE_MINIMO && !p.crm_lead_id && (p.email || p.telefone || p.whatsapp)
    );

    const convertidos = [];
    const erros = [];

    for (const p of quentes) {
      try {
        const lead = await db.Lead.create({
          nome_cliente: p.nome_fantasia || p.razao_social,
          nome_empresa: p.razao_social,
          email_cliente: p.email || undefined,
          telefone_cliente: p.whatsapp || p.telefone || undefined,
          estagio: 'Prospeccao',
          prioridade: (p.score || 0) >= 90 ? 'Alta' : 'Media',
          observacoes: [
            `Convertido automaticamente da prospecção (score ${p.score}).`,
            p.analise_resumo,
            p.abordagem_sugerida ? `Abordagem sugerida: ${p.abordagem_sugerida}` : null,
          ].filter(Boolean).join('\n\n'),
          proximos_passos: p.abordagem_sugerida || 'Primeiro contato comercial',
        });

        await db.Prospect.update(p.id, { status: 'no_crm', crm_lead_id: lead.id });
        convertidos.push({ prospect_id: p.id, lead_id: lead.id, empresa: p.razao_social });
      } catch (e) {
        erros.push({ prospect_id: p.id, erro: e.message });
      }
    }

    return Response.json({
      score_minimo: SCORE_MINIMO,
      analisados: prospects.length,
      elegiveis: quentes.length,
      convertidos: convertidos.length,
      detalhes: convertidos,
      erros,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}