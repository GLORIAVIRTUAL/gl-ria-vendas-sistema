
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agendamento_id, horas_antes } = await req.json();

    if (!agendamento_id || !horas_antes) {
      return Response.json({ 
        error: 'Campos obrigatórios faltando',
        message: 'agendamento_id e horas_antes são obrigatórios'
      }, { status: 400 });
    }

    // Busca o agendamento
    const agendamentos = await base44.entities.Agendamento.filter({ id: agendamento_id });
    if (!agendamentos || agendamentos.length === 0) {
      return Response.json({ 
        error: 'Agendamento não encontrado'
      }, { status: 404 });
    }

    const agendamento = agendamentos[0];

    // Calcula horário do disparo
    const dataHoraReuniao = new Date(`${agendamento.data}T${agendamento.horario}`);
    const dataHoraDisparo = new Date(dataHoraReuniao.getTime() - (horas_antes * 60 * 60 * 1000));

    // Monta a mensagem
    const produtoNomes = {
      'Gloria_Atendente': 'Glória Atendente',
      'Gloria_Clinica': 'Glória Clínica',
      'Maquina_de_Videos': 'Máquina de Vídeos',
      'Gloria_Financas': 'Glória Finanças',
      'Avatar_ao_Vivo': 'Avatar ao Vivo'
    };

    const mensagem = `🔔 *Lembrete de Reunião*

Olá ${agendamento.nome_cliente}! 👋

Sua reunião sobre *${produtoNomes[agendamento.produto]}* está agendada para:

📅 *Data:* ${new Date(agendamento.data).toLocaleDateString('pt-BR')}
⏰ *Horário:* ${agendamento.horario}

🎥 *Link da reunião:*
${agendamento.link_reuniao}

Estamos ansiosos para conversar com você! 🚀

_Enviado automaticamente pelo sistema Glória Vendas_`;

    // Registra o disparo programado
    const disparo = await base44.entities.DisparoWhatsApp.create({
      agendamento_id: agendamento.id,
      telefone: agendamento.telefone_cliente,
      mensagem,
      status: 'Programado',
      data_programada: dataHoraDisparo.toISOString(),
      horas_antes
    });

    return Response.json({
      success: true,
      message: 'Lembrete programado com sucesso',
      disparo_id: disparo.id,
      data_disparo: dataHoraDisparo.toISOString()
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: 'Erro interno',
      message: error.message
    }, { status: 500 });
  }
});
