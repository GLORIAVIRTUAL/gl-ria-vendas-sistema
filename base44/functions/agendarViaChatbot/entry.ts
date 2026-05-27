
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== START agendarViaChatbot ===');
  
  try {
    // Inicializa o client com service role (já que não tem user autenticado)
    const base44 = createClientFromRequest(req);

    // Parse do body
    const body = await req.json();
    console.log('📦 Request body:', body);

    const { 
      nome_cliente, 
      email_cliente, 
      telefone_cliente, 
      produto, 
      data, 
      horario, 
      observacoes,
      api_key 
    } = body;

    // Validação de API Key para segurança
    const expectedApiKey = Deno.env.get('CHATBOT_API_KEY') || 'sua-chave-secreta-aqui';
    if (api_key !== expectedApiKey) {
      console.error('❌ API Key inválida');
      return Response.json({ 
        error: 'Unauthorized',
        message: 'API Key inválida'
      }, { status: 401 });
    }

    // Validação de campos obrigatórios
    if (!nome_cliente || !email_cliente || !produto || !data || !horario) {
      console.error('❌ Campos obrigatórios faltando');
      return Response.json({ 
        error: 'Campos obrigatórios faltando',
        message: 'nome_cliente, email_cliente, produto, data e horario são obrigatórios'
      }, { status: 400 });
    }

    // Validação de produto
    const produtosValidos = ['Gloria_Atendente', 'Gloria_Clinica', 'Maquina_de_Videos', 'Gloria_Financas', 'Avatar_ao_Vivo'];
    if (!produtosValidos.includes(produto)) {
      return Response.json({ 
        error: 'Produto inválido',
        message: `Produto deve ser um de: ${produtosValidos.join(', ')}`
      }, { status: 400 });
    }

    // Validação de horário
    const horariosValidos = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    if (!horariosValidos.includes(horario)) {
      return Response.json({ 
        error: 'Horário inválido',
        message: `Horário deve ser um de: ${horariosValidos.join(', ')}`
      }, { status: 400 });
    }

    // Verifica disponibilidade
    const agendamentosExistentes = await base44.asServiceRole.entities.Agendamento.filter({
      data,
      horario
    });

    if (agendamentosExistentes.length > 0) {
      return Response.json({ 
        error: 'Horário não disponível',
        message: 'Este horário já está ocupado. Por favor, escolha outro horário.'
      }, { status: 409 });
    }

    const produtoNomes = {
      Gloria_Atendente: 'Glória Atendente',
      Gloria_Clinica: 'Glória Clínica',
      Maquina_de_Videos: 'Máquina de Vídeos',
      Gloria_Financas: 'Glória Finanças',
      Avatar_ao_Vivo: 'Avatar ao Vivo'
    };

    // Cria evento no Google Calendar
    console.log('📅 Criando evento no Google Calendar...');
    const startDateTime = `${data}T${horario}:00`;
    const [hora, minuto] = horario.split(':');
    const endHora = String(parseInt(hora) + 1).padStart(2, '0');
    const endDateTime = `${data}T${endHora}:${minuto}:00`;

    const calendarResponse = await base44.asServiceRole.functions.invoke('createGoogleCalendarEvent', {
      summary: `Reunião - ${produtoNomes[produto]} - ${nome_cliente}`,
      description: `Reunião sobre ${produtoNomes[produto]}\n\nCliente: ${nome_cliente}\nEmail: ${email_cliente}\nTelefone: ${telefone_cliente || 'Não informado'}\n\nObservações: ${observacoes || 'Nenhuma'}`,
      startDateTime,
      endDateTime,
      attendeeEmail: email_cliente,
      attendeeName: nome_cliente
    });

    if (calendarResponse.status !== 200 || !calendarResponse.data || calendarResponse.data.error) {
      throw new Error(calendarResponse.data?.message || calendarResponse.data?.error || 'Erro ao criar evento no Google Calendar');
    }

    // Cria agendamento no banco
    console.log('💾 Criando agendamento no banco...');
    const agendamento = await base44.asServiceRole.entities.Agendamento.create({
      nome_cliente,
      email_cliente,
      telefone_cliente: telefone_cliente || '',
      produto,
      data,
      horario,
      observacoes: observacoes || '',
      link_reuniao: calendarResponse.data.meetLink || '',
      status: 'Agendada'
    });

    // Cria lead no CRM
    console.log('👤 Criando lead no CRM...');
    await base44.asServiceRole.entities.Lead.create({
      nome_cliente,
      email_cliente,
      telefone_cliente: telefone_cliente || '',
      produto_interesse: produto,
      data_reuniao: data,
      observacoes: observacoes || '',
      agendamento_id: agendamento.id,
      estagio: 'Reuniao_Marcada',
      prioridade: 'Media'
    });

    // Não envia email - apenas retorna o link
    console.log('✅ Agendamento criado com sucesso! Link:', calendarResponse.data.meetLink);

    return Response.json({
      success: true,
      message: 'Reunião agendada com sucesso!',
      agendamento: {
        id: agendamento.id,
        nome_cliente,
        email_cliente,
        produto: produtoNomes[produto],
        data,
        horario,
        link_reuniao: calendarResponse.data.meetLink,
        status: 'Agendada'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ ERRO:', error);
    return Response.json({ 
      error: 'Erro ao processar agendamento',
      message: error.message
    }, { status: 500 });
  } finally {
    console.log('=== END agendarViaChatbot ===\n');
  }
});
