import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Libera para novas cadências os prospects que pediram para ser contatados
// mais tarde (ex: retorno de férias), quando a data de retomada chega.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_erroAuth) {
      user = null;
    }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const db = base44.asServiceRole;
    const agora = new Date().toISOString();

    const vencidos = await db.entities.EmailNotificacao.filter(
      { retomar_em: { $lte: agora } },
      'retomar_em',
      200
    );

    const pendentes = vencidos.filter((email) => !email.retomado_em);
    const retomados = [];

    for (const email of pendentes) {
      try {
        if (email.prospect_id) {
          const prospect = await db.entities.Prospect.get(email.prospect_id);
          // Só reabre quem não pediu opt-out.
          if (prospect && !prospect.opt_out) {
            await db.entities.Prospect.update(prospect.id, { respondeu_em: null, status: 'salvo' });
            retomados.push(prospect.nome_fantasia || prospect.razao_social);
          }
        }
        await db.entities.EmailNotificacao.update(email.id, { retomado_em: agora });
      } catch (erroItem) {
        console.error(`Erro ao retomar contato do e-mail ${email.id}:`, erroItem.message);
      }
    }

    console.log(`Retomada de contatos: ${retomados.length} prospect(s) liberados de ${pendentes.length} pendência(s).`);
    return Response.json({ success: true, pendentes: pendentes.length, retomados: retomados.length, empresas: retomados });
  } catch (error) {
    console.error('Erro na retomada de contatos agendados:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}