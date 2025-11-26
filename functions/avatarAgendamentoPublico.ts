// API PÚBLICA para Avatar Interativo - não requer autenticação
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const HORARIOS_DISPONIVEIS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

// Formata data para yyyy-MM-dd
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Verifica se é dia útil (segunda a sexta)
function isDiaUtil(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

// Formata data para exibição em português
function formatarDataExibicao(dataStr) {
  const [ano, mes, dia] = dataStr.split('-');
  const data = new Date(ano, mes - 1, dia);
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
  return `${diasSemana[data.getDay()]}, ${dia} de ${meses[data.getMonth()]}`;
}

// Busca próximo horário disponível
async function buscarProximoHorarioDisponivel(base44, diasParaBuscar = 14) {
  const agendamentos = await base44.entities.Agendamento.filter({ status: { $ne: 'Cancelada' } });
  
  const horariosOcupados = new Set();
  agendamentos.forEach(ag => {
    horariosOcupados.add(`${ag.data}_${ag.horario}`);
  });

  const hoje = new Date();
  const horaAtual = hoje.getHours();
  const minutoAtual = hoje.getMinutes();

  for (let i = 0; i < diasParaBuscar; i++) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i);
    
    if (!isDiaUtil(data)) continue;
    
    const dataStr = formatDate(data);
    
    for (const horario of HORARIOS_DISPONIVEIS) {
      const [hora, minuto] = horario.split(':').map(Number);
      
      if (i === 0 && (hora < horaAtual + 1 || (hora === horaAtual + 1 && minuto <= minutoAtual))) {
        continue;
      }
      
      const chave = `${dataStr}_${horario}`;
      if (!horariosOcupados.has(chave)) {
        return { data: dataStr, horario };
      }
    }
  }
  
  return null;
}

Deno.serve(async (req) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    // Inicializa o SDK usando service role para acesso público
    const base44 = createClientFromRequest(req);
    const sdk = base44.asServiceRole; // Usa service role para não precisar de auth do usuário

    const url = new URL(req.url);
    
    // ========================================
    // GET /proximo-horario - Busca próximo horário disponível
    // ========================================
    if (req.method === 'GET' && url.searchParams.get('acao') === 'proximo-horario') {
      const proximo = await buscarProximoHorarioDisponivel(sdk);
      
      if (!proximo) {
        return Response.json({
          sucesso: false,
          mensagem: "Não há horários disponíveis nos próximos 14 dias."
        }, { status: 200, headers });
      }
      
      return Response.json({
        sucesso: true,
        data: proximo.data,
        horario: proximo.horario,
        data_formatada: formatarDataExibicao(proximo.data),
        mensagem: `O próximo horário disponível é ${formatarDataExibicao(proximo.data)} às ${proximo.horario}.`
      }, { status: 200, headers });
    }

    // ========================================
    // GET /horarios-disponiveis - Lista horários de uma data específica
    // ========================================
    if (req.method === 'GET' && url.searchParams.get('acao') === 'horarios-disponiveis') {
      const data = url.searchParams.get('data');
      
      if (!data) {
        return Response.json({
          sucesso: false,
          mensagem: "Informe a data no formato YYYY-MM-DD"
        }, { status: 400, headers });
      }

      const agendamentos = await sdk.entities.Agendamento.filter({ 
        data: data,
        status: { $ne: 'Cancelada' }
      });
      
      const horariosOcupados = new Set(agendamentos.map(ag => ag.horario));
      const horariosLivres = HORARIOS_DISPONIVEIS.filter(h => !horariosOcupados.has(h));
      
      return Response.json({
        sucesso: true,
        data: data,
        data_formatada: formatarDataExibicao(data),
        horarios_disponiveis: horariosLivres,
        total_disponiveis: horariosLivres.length
      }, { status: 200, headers });
    }

    // ========================================
    // POST /agendar - Cria agendamento simplificado
    // ========================================
    if (req.method === 'POST') {
      const body = await req.json();
      const { nome_cliente, telefone_cliente, email_cliente, produto, data, horario, usar_proximo_horario } = body;

      if (!nome_cliente) {
        return Response.json({
          sucesso: false,
          mensagem: "Nome do cliente é obrigatório"
        }, { status: 400, headers });
      }

      if (!telefone_cliente && !email_cliente) {
        return Response.json({
          sucesso: false,
          mensagem: "Informe pelo menos telefone ou email"
        }, { status: 400, headers });
      }

      let dataAgendamento = data;
      let horarioAgendamento = horario;

      if (usar_proximo_horario || (!data && !horario)) {
        const proximo = await buscarProximoHorarioDisponivel(sdk);
        if (!proximo) {
          return Response.json({
            sucesso: false,
            mensagem: "Não há horários disponíveis nos próximos 14 dias."
          }, { status: 200, headers });
        }
        dataAgendamento = proximo.data;
        horarioAgendamento = proximo.horario;
      }

      if (!dataAgendamento || !horarioAgendamento) {
        return Response.json({
          sucesso: false,
          mensagem: "Informe data e horário ou use usar_proximo_horario: true"
        }, { status: 400, headers });
      }

      // Verifica disponibilidade
      const agendamentosExistentes = await sdk.entities.Agendamento.filter({
        data: dataAgendamento,
        horario: horarioAgendamento,
        status: { $ne: 'Cancelada' }
      });

      if (agendamentosExistentes.length > 0) {
        const proximo = await buscarProximoHorarioDisponivel(sdk);
        return Response.json({
          sucesso: false,
          mensagem: `Horário ${horarioAgendamento} do dia ${formatarDataExibicao(dataAgendamento)} não está disponível.`,
          sugestao: proximo ? {
            data: proximo.data,
            horario: proximo.horario,
            mensagem: `Próximo disponível: ${formatarDataExibicao(proximo.data)} às ${proximo.horario}`
          } : null
        }, { status: 200, headers });
      }

      const produtoFinal = produto || 'Gloria_Vendas';
      const emailFinal = email_cliente || `${telefone_cliente}@avatar.temp`;

      // Cria evento no Google Calendar
      let linkReuniao = '';
      try {
        const startDateTime = `${dataAgendamento}T${horarioAgendamento}:00`;
        const [hora, minuto] = horarioAgendamento.split(':');
        const endHora = String(parseInt(hora) + 1).padStart(2, '0');
        const endDateTime = `${dataAgendamento}T${endHora}:${minuto}:00`;

        const produtoNomes = {
          'Gloria_Vendas': 'Glória Vendas',
          'Gloria_Clinica': 'Glória Clínica',
          'Gloria_Atendente': 'Glória Atendente',
          'Maquina_de_Videos': 'Máquina de Vídeos',
          'Atendimento_IA_24_7': 'Atendimento IA 24/7',
          'Especialistas_Virtuais': 'Especialistas Virtuais',
          'Sites_em_24_Horas': 'Sites em 24 Horas'
        };
        const produtoNome = produtoNomes[produtoFinal] || produtoFinal;

        const calendarResponse = await sdk.functions.invoke('createGoogleCalendarEvent', {
          summary: `Reunião - ${produtoNome} - ${nome_cliente}`,
          description: `Reunião sobre ${produtoNome}\n\nCliente: ${nome_cliente}\nTelefone: ${telefone_cliente || 'Não informado'}\nEmail: ${emailFinal}\n\nAgendado via Avatar Interativo`,
          startDateTime,
          endDateTime,
          attendeeEmail: emailFinal,
          attendeeName: nome_cliente
        });

        if (calendarResponse.status === 200 && calendarResponse.data?.meetLink) {
          linkReuniao = calendarResponse.data.meetLink;
        }
      } catch (calendarError) {
        console.error('Erro ao criar evento no Google Calendar:', calendarError);
      }

      const agendamento = await sdk.entities.Agendamento.create({
        nome_cliente,
        email_cliente: emailFinal,
        telefone_cliente: telefone_cliente || '',
        produto: produtoFinal,
        data: dataAgendamento,
        horario: horarioAgendamento,
        link_reuniao: linkReuniao,
        status: 'Agendada',
        origem: 'Chatbot',
        observacoes: 'Agendado via Avatar Interativo'
      });

      await sdk.entities.Lead.create({
        nome_cliente,
        email_cliente: emailFinal,
        telefone_cliente: telefone_cliente || '',
        produto_interesse: produtoFinal,
        data_reuniao: dataAgendamento,
        agendamento_id: agendamento.id,
        estagio: 'Reuniao_Marcada',
        prioridade: 'Media',
        observacoes: 'Lead criado via Avatar Interativo'
      });

      let mensagemConfirmacao = `✅ Reunião agendada com sucesso!\n\n📅 ${formatarDataExibicao(dataAgendamento)} às ${horarioAgendamento}`;
      if (linkReuniao) {
        mensagemConfirmacao += `\n\n🔗 Link da reunião:\n${linkReuniao}`;
      }

      // Envia webhook para o chatbot enviar confirmação no WhatsApp
      try {
        await fetch('https://ra-bcknd.com/v1/api-trigger/cayly9lw2sl4z6jtvs5v', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agendamento_id: agendamento.id,
            nome_cliente,
            telefone_cliente: telefone_cliente || '',
            email_cliente: emailFinal,
            data: dataAgendamento,
            horario: horarioAgendamento,
            data_formatada: formatarDataExibicao(dataAgendamento),
            produto: produtoFinal,
            link_reuniao: linkReuniao,
            mensagem: mensagemConfirmacao
          })
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook:', webhookError);
      }

      return Response.json({
        sucesso: true,
        mensagem: mensagemConfirmacao,
        agendamento: {
          id: agendamento.id,
          nome_cliente,
          data: dataAgendamento,
          horario: horarioAgendamento,
          data_formatada: formatarDataExibicao(dataAgendamento),
          produto: produtoFinal,
          link_reuniao: linkReuniao
        }
      }, { status: 200, headers });
    }

    return Response.json({
      sucesso: false,
      mensagem: "Ação não reconhecida. Use GET com ?acao=proximo-horario ou ?acao=horarios-disponiveis&data=YYYY-MM-DD, ou POST para agendar."
    }, { status: 400, headers });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({
      sucesso: false,
      mensagem: error.message || 'Erro interno'
    }, { status: 500, headers });
  }
});