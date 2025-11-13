import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== START verificarDisponibilidade (PÚBLICO) ===');
  
  try {
    // ✅ ENDPOINT PÚBLICO - Usa asServiceRole para não precisar de autenticação
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    console.log('📦 Request body:', body);

    const { data, api_key } = body;

    const expectedApiKey = Deno.env.get('CHATBOT_API_KEY') || 'apiflskcjfjhsydkifms';
    if (api_key !== expectedApiKey) {
      console.error('❌ API Key inválida');
      return Response.json({ 
        error: 'Unauthorized',
        message: 'API Key inválida'
      }, { status: 401 });
    }

    if (!data) {
      return Response.json({ 
        error: 'Campo data é obrigatório'
      }, { status: 400 });
    }

    const agendamentos = await base44.asServiceRole.entities.Agendamento.filter({
      data
    });

    const todosHorarios = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];

    const horariosOcupados = agendamentos
      .filter(ag => ag.status !== 'Cancelada')
      .map(ag => ag.horario);

    const horariosDisponiveis = todosHorarios.filter(h => !horariosOcupados.includes(h));

    console.log('✅ Disponibilidade verificada');

    return Response.json({
      success: true,
      data,
      total_horarios: todosHorarios.length,
      horarios_disponiveis: horariosDisponiveis.length,
      horarios: horariosDisponiveis,
      horarios_ocupados: horariosOcupados
    }, { status: 200 });

  } catch (error) {
    console.error('❌ ERRO:', error);
    return Response.json({ 
      error: 'Erro ao verificar disponibilidade',
      message: error.message
    }, { status: 500 });
  } finally {
    console.log('=== END verificarDisponibilidade ===\n');
  }
});