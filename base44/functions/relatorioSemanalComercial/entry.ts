import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function dentroDaSemana(valor, inicio) {
  if (!valor) return false;
  return new Date(valor).getTime() >= inicio;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {
      user = null;
    }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const inicio = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const svc = base44.asServiceRole;

    const prospects = await svc.entities.Prospect.list('-created_date', 1000);
    const envios = await svc.entities.CadenciaEnvio.list('-created_date', 1000);
    const leads = await svc.entities.Lead.list('-created_date', 1000);

    const novosProspects = prospects.filter((p) => dentroDaSemana(p.created_date, inicio));
    const analisados = prospects.filter((p) => dentroDaSemana(p.analisado_em, inicio));
    const quentes = analisados.filter((p) => (p.score || 0) >= 70);
    const enviados = envios.filter((e) => e.status === 'enviado' && dentroDaSemana(e.data_envio, inicio));
    const errosEnvio = envios.filter((e) => e.status === 'erro' && dentroDaSemana(e.created_date, inicio));
    const respostas = prospects.filter((p) => dentroDaSemana(p.respondeu_em, inicio));
    const novosLeads = leads.filter((l) => dentroDaSemana(l.created_date, inicio));

    const linhas = [
      `Novos prospects: ${novosProspects.length}`,
      `Qualificados pela IA: ${analisados.length} (${quentes.length} quentes)`,
      `Mensagens enviadas: ${enviados.length}`,
      `Erros de envio: ${errosEnvio.length}`,
      `Prospects que responderam: ${respostas.length}`,
      `Novos leads no CRM: ${novosLeads.length}`
    ];

    const topRespostas = respostas
      .slice(0, 10)
      .map((p) => `- ${p.razao_social} (${p.municipio || '-'}/${p.uf || '-'}) score ${p.score ?? '-'}`);

    const body = [
      'Resumo comercial dos últimos 7 dias:',
      '',
      ...linhas,
      '',
      topRespostas.length ? 'Respostas recebidas:' : 'Nenhuma resposta recebida nesta semana.',
      ...topRespostas
    ].join('\n');

    const usuarios = await svc.entities.User.list();
    const admins = usuarios.filter((u) => u.role === 'admin' && u.email);
    if (admins.length === 0) {
      return Response.json({ ok: false, motivo: 'Nenhum admin com e-mail encontrado' });
    }

    for (const admin of admins) {
      await svc.integrations.Core.SendEmail({
        to: admin.email,
        subject: 'Relatório semanal do Motor Comercial',
        body,
        from_name: 'Glória Vendas'
      });
    }

    return Response.json({ ok: true, enviadoPara: admins.map((a) => a.email), metricas: linhas });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}