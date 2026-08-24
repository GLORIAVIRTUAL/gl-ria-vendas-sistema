import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const momento = (ag) => Date.parse(`${ag.data}T${ag.horario}:00-03:00`);

const mensagemWhatsApp = (ag, horas) => `🔔 *Lembrete de reunião*\n\nOlá ${ag.nome_cliente}! Sua reunião com a Glória Virtual será ${horas === 24 ? 'amanhã' : 'em aproximadamente 1 hora'}.\n\n📅 ${new Date(`${ag.data}T12:00:00-03:00`).toLocaleDateString('pt-BR', { timeZone: 'America/Recife' })}\n⏰ ${ag.horario}${ag.link_reuniao ? `\n🔗 ${ag.link_reuniao}` : ''}\n\nAté lá!`;

const corpoEmail = (ag) => `<p>Olá <strong>${ag.nome_cliente}</strong>,</p><p>Este é um lembrete de que sua reunião com a Glória Virtual será em aproximadamente 2 horas.</p><p><strong>Data:</strong> ${new Date(`${ag.data}T12:00:00-03:00`).toLocaleDateString('pt-BR', { timeZone: 'America/Recife' })}<br><strong>Horário:</strong> ${ag.horario}</p>${ag.link_reuniao ? `<p><a href="${ag.link_reuniao}">Acessar reunião</a></p>` : ''}<p>Até lá!</p>`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (user && user.role !== 'admin') return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    const db = base44.asServiceRole;
    const agora = Date.now();
    const maximo = agora + 30 * 86400000;
    const agendamentos = await db.entities.Agendamento.list('data', 500);
    const futuros = agendamentos.filter((ag) => {
      const t = momento(ag);
      return ['Agendada', 'Confirmada'].includes(ag.status) && Number.isFinite(t) && t > agora && t <= maximo;
    });

    let criadosWhatsApp = 0;
    let criadosEmail = 0;

    for (const ag of futuros) {
      const t = momento(ag);
      if (ag.telefone_cliente) {
        const existentes = await db.entities.DisparoWhatsApp.filter({ agendamento_id: ag.id }, '-created_date', 20);
        for (const horas of [24, 1]) {
          const jaExiste = existentes.some((e) => Number(e.horas_antes) === horas);
          const programada = t - horas * 3600000;
          if (!jaExiste && programada > agora) {
            await db.entities.DisparoWhatsApp.create({
              agendamento_id: ag.id,
              telefone: ag.telefone_cliente,
              mensagem: mensagemWhatsApp(ag, horas),
              status: 'Programado',
              data_programada: new Date(programada).toISOString(),
              horas_antes: horas
            });
            criadosWhatsApp += 1;
          }
        }
      }

      if (ag.email_cliente) {
        const existentes = await db.entities.DisparoEmail.filter({ agendamento_id: ag.id, tipo: 'Lembrete' }, '-created_date', 20);
        const horas = 2;
        const programada = t - horas * 3600000;
        const jaExiste = existentes.some((e) => Number(e.horas_antes) === horas);
        if (!jaExiste && programada > agora) {
          await db.entities.DisparoEmail.create({
            agendamento_id: ag.id,
            email_destinatario: ag.email_cliente,
            assunto: `⏰ Lembrete: reunião com a Glória Virtual às ${ag.horario}`,
            corpo: corpoEmail(ag),
            tipo: 'Lembrete',
            status: 'Programado',
            data_programada: new Date(programada).toISOString(),
            horas_antes: horas
          });
          criadosEmail += 1;
        }
      }
    }

    return Response.json({ success: true, agendamentos_verificados: futuros.length, criados_whatsapp: criadosWhatsApp, criados_email: criadosEmail });
  } catch (error) {
    console.error('Erro ao preparar lembretes:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}