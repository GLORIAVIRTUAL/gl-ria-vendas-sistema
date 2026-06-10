import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const processedMessages = new Set();

// Compara dois telefones de forma tolerante ao nono dígito (com/sem o 9 após o DDD).
// Ex: "5587988020504" (com 9) deve casar com "558788020504" (sem 9).
function telefonesIguais(tel1, tel2) {
  const limpar = (t) => (t || '').replace(/\D/g, '');
  // Remove o DDI 55 e o "9" extra de celular para gerar uma chave canônica
  const canonico = (t) => {
    let n = limpar(t);
    if (n.startsWith('55')) n = n.slice(2);        // remove DDI Brasil
    // n agora deve ser DDD (2) + número (8 ou 9 dígitos)
    if (n.length === 11 && n[2] === '9') {
      n = n.slice(0, 2) + n.slice(3);              // remove o 9 após o DDD
    }
    return n;
  };
  const a = canonico(tel1);
  const b = canonico(tel2);
  if (!a || !b) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}

// Acumulador de mensagens por telefone (debounce)
// Permite que o cliente envie várias frases e a IA responda apenas uma vez
const pendingTimers = new Map();
const DEBOUNCE_MS = 8000; // espera 8s após a última mensagem antes de responder

Deno.serve(async (req) => {
  console.log('🔔 Webhook Z-API recebido:', req.method);

  // Z-API só envia POST
  if (req.method !== 'POST') {
    return Response.json({ success: true });
  }

  const base44 = createClientFromRequest(req);

  try {
    const body = await req.json();
    console.log('📩 Payload Z-API:', JSON.stringify(body, null, 2));

    // Ignora mensagens enviadas por mim (fromMe) e status replies
    if (body.fromMe === true || body.isStatusReply === true) {
      console.log('⚠️ Mensagem própria ou status reply, ignorando');
      return Response.json({ success: true });
    }

    // Ignora grupos e newsletters
    if (body.isGroup === true || body.isNewsletter === true) {
      console.log('⚠️ Mensagem de grupo/newsletter, ignorando');
      return Response.json({ success: true });
    }

    // Verifica se é um callback de mensagem recebida
    if (body.type !== 'ReceivedCallback') {
      console.log('⚠️ Tipo não é ReceivedCallback:', body.type);
      return Response.json({ success: true });
    }

    const messageId = body.messageId;
    const phone = body.phone;

    if (!phone) {
      console.log('⚠️ Sem telefone no payload');
      return Response.json({ success: true });
    }

    // Evita duplicação
    if (messageId && processedMessages.has(messageId)) {
      console.log('⚠️ Mensagem já processada:', messageId);
      return Response.json({ success: true });
    }
    if (messageId) {
      processedMessages.add(messageId);
      setTimeout(() => processedMessages.delete(messageId), 300000);
    }

    // Extrai conteúdo baseado no tipo de mensagem Z-API
    let content = '';
    let messageType = 'text';
    let mediaUrl = null;

    if (body.text) {
      content = body.text.message || '';
      messageType = 'text';
    } else if (body.image) {
      content = body.image.caption || '[Imagem]';
      messageType = 'image';
      mediaUrl = body.image.imageUrl;
    } else if (body.video) {
      content = body.video.caption || '[Vídeo]';
      messageType = 'video';
      mediaUrl = body.video.videoUrl;
    } else if (body.audio) {
      content = '[Áudio]';
      messageType = 'audio';
      mediaUrl = body.audio.audioUrl;
    } else if (body.document) {
      content = body.document.fileName || '[Documento]';
      messageType = 'document';
      mediaUrl = body.document.documentUrl;
    } else if (body.sticker) {
      content = '[Sticker]';
      messageType = 'image';
      mediaUrl = body.sticker.stickerUrl;
    } else {
      content = '[Mensagem não suportada]';
    }

    const contactName = body.senderName || body.chatName || '';

    console.log('👤 Contato:', contactName || phone);
    console.log('💬 Mensagem:', content);
    console.log('📝 Tipo:', messageType);

    // ===== ORQUESTRADOR DE LLM =====
    // Verifica se o telefone está cadastrado como cliente OpenClaw.
    // Se estiver, este contato é roteado para a LLM do OpenClaw (outro dispositivo),
    // e a IA atual NÃO responde.
    let ehOpenClaw = false;
    try {
      const clientesOpenClaw = await base44.asServiceRole.entities.ClienteOpenClaw.list();
      ehOpenClaw = clientesOpenClaw.some(c => {
        if (c.ativo === false) return false;
        return telefonesIguais(c.telefone_cliente, phone);
      });
    } catch (orqErr) {
      console.error('⚠️ Erro no orquestrador OpenClaw (seguindo com IA atual):', orqErr.message);
      ehOpenClaw = false;
    }

    const llmDestino = ehOpenClaw ? 'openclaw' : 'atual';
    console.log(`🧭 Orquestrador: contato roteado para LLM "${llmDestino}"`);

    // Busca ou cria contato
    let existingContacts = await base44.asServiceRole.entities.Contact.filter({ phone });
    let contact;

    if (existingContacts.length === 0) {
      console.log('➕ Criando novo contato...');
      contact = await base44.asServiceRole.entities.Contact.create({
        phone,
        name: contactName,
        profile_picture: body.senderPhoto || '',
        pipeline_stage: 'novo_lead',
        llm_destino: llmDestino,
        ai_enabled: true,
        is_active: true,
        conversation_finished: false,
        last_message_at: new Date().toISOString()
      });

      // Notifica o dono no celular pessoal sobre cliente novo no chat
      await notificarClienteNovo(contactName || phone, phone);
    } else {
      contact = existingContacts[0];
      const wasFinished = contact.conversation_finished || contact.is_active === false;

      await base44.asServiceRole.entities.Contact.update(contact.id, {
        last_message_at: new Date().toISOString(),
        name: contactName || contact.name,
        profile_picture: body.senderPhoto || contact.profile_picture,
        llm_destino: llmDestino,
        is_active: true,
        conversation_finished: false
      });

      contact.is_active = true;
      contact.conversation_finished = false;
      contact.llm_destino = llmDestino;

      if (wasFinished) {
        console.log('🔄 Nova conversa iniciada (anterior foi finalizada)');
      }
    }

    console.log('💾 Salvando mensagem no banco...');

    await base44.asServiceRole.entities.Message.create({
      contact_id: contact.id,
      direction: 'inbound',
      sender: 'customer',
      content,
      type: messageType,
      media_url: mediaUrl,
      status: 'delivered'
    });

    console.log('✅ Mensagem salva!');

    // ===== ROTEAMENTO OPENCLAW =====
    // O OpenClaw é usado como MOTOR DE AGENTE chamado pelo backend.
    // A Z-API continua sendo o canal oficial de entrada/saída do WhatsApp.
    // Fluxo: cliente → Z-API → webhook → OpenClaw (HTTP) → resposta → Z-API.
    if (contact.llm_destino === 'openclaw') {
      console.log('🦅 Contato OpenClaw: agendando resposta via motor OpenClaw (acumulador)...');

      // Mesmo debounce da IA atual: acumula várias mensagens e responde uma vez
      const existingOC = pendingTimers.get(phone);
      if (existingOC) {
        clearTimeout(existingOC);
        console.log('⏳ Nova mensagem OpenClaw recebida, reiniciando contador...');
      }

      const timerOC = setTimeout(async () => {
        pendingTimers.delete(phone);
        try {
          const fresh = await base44.asServiceRole.entities.Contact.filter({ phone });
          const currentContact = fresh[0] || contact;
          if (currentContact.llm_destino !== 'openclaw') {
            console.log('⚠️ Contato não é mais OpenClaw, ignorando.');
            return;
          }
          console.log('🦅 Acumulador concluído, processando resposta do OpenClaw...');
          await processOpenClawResponse(base44, currentContact, phone);
        } catch (err) {
          console.error('❌ Erro no processamento OpenClaw acumulado:', err);
        }
      }, DEBOUNCE_MS);

      pendingTimers.set(phone, timerOC);

      return Response.json({ success: true, roteado: 'openclaw' });
    }

    // ===== DETECTA PEDIDO DE ATENDIMENTO HUMANO =====
    const querHumano = messageType === 'text' && /\b(humano|atendente|pessoa|falar com algu[ée]m|atendimento humano|quero falar com|suporte humano|gente de verdade|n[aã]o quero rob[ôo]|sem rob[ôo])\b/i.test(content);

    if (querHumano && contact.ai_enabled) {
      console.log('🙋 Cliente pediu atendimento humano. Ativando modo humano...');

      // Cancela qualquer resposta de IA pendente
      const pending = pendingTimers.get(phone);
      if (pending) {
        clearTimeout(pending);
        pendingTimers.delete(phone);
      }

      // Desliga a IA e marca a transferência
      await base44.asServiceRole.entities.Contact.update(contact.id, {
        ai_enabled: false,
        transferido_humano_at: new Date().toISOString()
      });

      // Mensagem de transferência ao cliente
      const msgTransferencia = '👨‍💼 Entendi! Vou te transferir para um de nossos atendentes humanos. Por favor, aguarde um instante que já já alguém vai te responder por aqui. 😊';

      await base44.asServiceRole.entities.Message.create({
        contact_id: contact.id,
        direction: 'outbound',
        sender: 'ai',
        content: msgTransferencia,
        type: 'text',
        status: 'sent'
      });

      await enviarMensagemZapi(phone, msgTransferencia);

      // Notifica o dono que há um cliente aguardando atendimento humano
      await notificarTransferenciaHumano(contact.name || phone, phone);

      return Response.json({ success: true, transferido: true });
    }

    // Se IA estiver habilitada, agenda resposta com acumulador (debounce)
    if (contact.ai_enabled) {
      console.log('🤖 Agendando resposta da IA (acumulador)...');

      // Cancela timer anterior se o cliente ainda está digitando/enviando
      const existing = pendingTimers.get(phone);
      if (existing) {
        clearTimeout(existing);
        console.log('⏳ Nova mensagem recebida, reiniciando contador...');
      }

      const contactId = contact.id;
      const timer = setTimeout(async () => {
        pendingTimers.delete(phone);
        try {
          // Recarrega o contato atualizado antes de responder
          const fresh = await base44.asServiceRole.entities.Contact.filter({ phone });
          const currentContact = fresh[0] || contact;
          if (!currentContact.ai_enabled) {
            console.log('⚠️ IA desabilitada para o contato, ignorando.');
            return;
          }
          console.log('🤖 Acumulador concluído, processando resposta da IA...');
          await processAIResponse(base44, currentContact, phone);
        } catch (err) {
          console.error('❌ Erro no processamento acumulado:', err);
        }
      }, DEBOUNCE_MS);

      pendingTimers.set(phone, timer);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('❌ Erro ao processar webhook Z-API:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ========== FUNÇÃO PARA PROCESSAR IA E RESPONDER VIA Z-API ==========
async function processAIResponse(base44, contact, phone) {
  try {
    const clientToken = (Deno.env.get('CLIENT_TOKEN') || '').trim();
    const instanceToken = (Deno.env.get('TOKEN_DA_INSTANCIA') || '').trim();
    const instanceId = (Deno.env.get('IA_DA_INSTANCIA') || '').trim();

    if (!clientToken || !instanceToken || !instanceId) {
      console.error('❌ Credenciais Z-API incompletas');
      return;
    }

    // Busca configurações da IA
    const aiSettings = await base44.asServiceRole.entities.AISettings.list();
    const settings = aiSettings.find(s => s.is_active) || aiSettings[0];

    if (!settings) {
      console.log('⚠️ Nenhuma configuração de IA encontrada');
      return;
    }

    console.log('⚙️ Config IA:', settings.name);

    // Busca histórico de mensagens
    const allMessages = await base44.asServiceRole.entities.Message.filter(
      { contact_id: contact.id },
      '-created_date',
      50
    );

    const finishIndex = allMessages.findIndex(m =>
      m.content?.includes('*Conversa Finalizada*') ||
      m.content?.includes('Conversa encerrada')
    );

    const recentMessages = finishIndex > -1
      ? allMessages.slice(0, finishIndex).slice(0, 10)
      : allMessages.slice(0, 10);

    const history = recentMessages.reverse().map(m =>
      `${m.sender === 'customer' ? 'Cliente' : 'Assistente'}: ${m.content}`
    ).join('\n');

    // Horário de Recife
    const now = new Date();
    const recifeTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Recife' }));
    const hora = recifeTime.getHours();
    const dia = recifeTime.getDate();
    const mes = recifeTime.getMonth() + 1;
    const ano = recifeTime.getFullYear();
    const diaSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'][recifeTime.getDay()];

    const dataAtualFormatada = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
    const dataAtualISO = `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;

    let saudacao = 'Bom dia';
    if (hora >= 12 && hora < 18) saudacao = 'Boa tarde';
    else if (hora >= 18 || hora < 6) saudacao = 'Boa noite';

    console.log(`🕐 Horário Recife: ${hora}h - Data: ${dataAtualFormatada} (${diaSemana})`);

    const nomeCliente = contact.name || 'Cliente';
    const systemPrompt = settings.system_prompt || 'Você é GLÓRIA, uma assistente virtual inteligente.';

    // É a primeira mensagem da IA nesta conversa?
    const jaRespondeu = recentMessages.some(m => m.sender === 'ai');

    // O prompt salvo no sistema é a fonte principal de comportamento.
    // Aqui anexamos apenas o contexto técnico que a IA precisa para funcionar.
    const fullPrompt = `${systemPrompt}

---
REGRAS DE ESTILO DA RESPOSTA (OBRIGATÓRIO):
- Responda de forma CURTA e direta, como uma conversa real de WhatsApp (no máximo 2 a 3 frases).
- NÃO repita informações, perguntas ou cumprimentos que você já enviou antes no histórico.
${jaRespondeu
  ? `- ⚠️ VOCÊ JÁ ESTÁ NO MEIO DA CONVERSA. É TERMINANTEMENTE PROIBIDO usar qualquer saudação (NÃO diga "Bom dia", "Boa tarde", "Boa noite", "Olá", "Oi"). Vá direto ao ponto.`
  : `- Esta é a PRIMEIRA mensagem da IA. Você PODE iniciar com a saudação "${saudacao}" uma única vez.`}
- Faça apenas UMA pergunta por vez. Não envie textos longos nem listas extensas.
- O cliente pode ter enviado várias frases seguidas; leia todas e responda UMA única vez, de forma natural.

---
CONTEXTO TÉCNICO (use apenas como referência, siga sempre as instruções acima):
- Data de HOJE: ${dataAtualFormatada} (${diaSemana})
- Data ISO de hoje: ${dataAtualISO}
- Horário atual em Recife: ${hora}h
- Nome do cliente: ${nomeCliente}
- Telefone do cliente: ${phone}
- Esta ${jaRespondeu ? 'NÃO é a primeira mensagem da conversa (já conversaram antes)' : 'É a primeira mensagem da IA nesta conversa'}.

PARA AGENDAR uma reunião, quando tiver todos os dados, inclua no final da resposta um bloco neste formato exato:
[AGENDAR]
NOME: nome completo
EMAIL: email do cliente
TELEFONE: ${phone}
DATA: YYYY-MM-DD (apenas datas futuras e em dias úteis, horários 08:00 às 20:00)
HORARIO: HH:MM
[/AGENDAR]

HISTÓRICO DA CONVERSA (as últimas mensagens "Cliente:" são as mais recentes, responda a elas):
${history}`;

    console.log('🔄 Chamando IA...');

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt
    });

    console.log('✅ Resposta da IA:', aiResponse);

    // Verifica comando de agendamento
    let finalResponse = aiResponse;

    // Reforço: se não for a primeira mensagem, remove saudações que a IA tenha inserido
    if (jaRespondeu) {
      finalResponse = finalResponse.replace(
        /^\s*(bom dia|boa tarde|boa noite|ol[áa]|oi)[\s!,.]*/i,
        ''
      ).replace(/^\s+/, '');
    }
    const agendarMatch = aiResponse.match(/\[AGENDAR\]([\s\S]*?)\[\/AGENDAR\]/);

    if (agendarMatch) {
      console.log('📅 Detectado comando de agendamento!');
      const agendarBlock = agendarMatch[1];

      const extractField = (field) => {
        const match = agendarBlock.match(new RegExp(`${field}:\\s*(.+)`, 'i'));
        return match ? match[1].trim() : '';
      };

      const nome = extractField('NOME');
      const email = extractField('EMAIL');
      const telefone = extractField('TELEFONE') || phone;
      const produto = extractField('PRODUTO');
      const data = extractField('DATA');
      const horario = extractField('HORARIO');

      console.log('📋 Dados extraídos:', { nome, email, telefone, produto, data, horario });

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataAgendamento = new Date(data + 'T00:00:00');
      const dataValida = !isNaN(dataAgendamento.getTime()) && dataAgendamento > hoje;
      const diaSemanaAgendamento = dataAgendamento.getDay();
      const ehFimDeSemana = diaSemanaAgendamento === 0 || diaSemanaAgendamento === 6;

      const nomeValido = nome && nome.length > 2 && !nome.includes('[') && nome.toLowerCase() !== 'cliente';
      const emailValido = email && email.includes('@') && !email.includes('[');
      const horarioValido = horario && /^\d{2}:\d{2}$/.test(horario);

      if (nomeValido && emailValido && dataValida && horarioValido && !ehFimDeSemana) {
        try {
          // Cria evento no Google Calendar
          let meetLink = null;
          try {
            const startDateTime = `${data}T${horario}:00`;
            const [horaNum] = horario.split(':').map(Number);
            const endDateTime = `${data}T${(horaNum + 1).toString().padStart(2, '0')}:${horario.split(':')[1]}:00`;

            const clientId = (Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') || '').replace('client_id=', '').trim();
            const clientSecret = (Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') || '').replace('client_secret=', '').trim();
            const refreshToken = (Deno.env.get('GOOGLE_CALENDAR_REFRESH_TOKEN') || '').replace('refresh_token=', '').trim();

            if (clientId && clientSecret && refreshToken) {
              const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  client_id: clientId,
                  client_secret: clientSecret,
                  refresh_token: refreshToken,
                  grant_type: 'refresh_token',
                }),
              });

              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                const event = {
                  summary: `Reunião - ${nome}`,
                  description: `Cliente: ${nome}\nEmail: ${email}\nTelefone: ${telefone}\n\nAgendado via WhatsApp IA (Z-API)`,
                  start: { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' },
                  end: { dateTime: endDateTime, timeZone: 'America/Sao_Paulo' },
                  attendees: [{ email, displayName: nome }],
                  conferenceData: {
                    createRequest: {
                      requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      conferenceSolutionKey: { type: 'hangoutsMeet' }
                    }
                  },
                  reminders: {
                    useDefault: false,
                    overrides: [
                      { method: 'email', minutes: 24 * 60 },
                      { method: 'popup', minutes: 30 },
                    ],
                  },
                };

                const calendarResponse = await fetch(
                  'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${tokenData.access_token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(event),
                  }
                );

                if (calendarResponse.ok) {
                  const eventData = await calendarResponse.json();
                  console.log('📅 Evento criado:', eventData.id);
                  const videoEntry = eventData.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video');
                  meetLink = videoEntry?.uri || eventData.hangoutLink || null;
                  console.log('✅ Link do Meet:', meetLink);
                } else {
                  console.error('❌ Erro Calendar:', await calendarResponse.text());
                }
              }
            }
          } catch (calendarError) {
            console.error('⚠️ Erro Calendar:', calendarError.message);
          }

          // Cria agendamento
          const novoAgendamento = await base44.asServiceRole.entities.Agendamento.create({
            nome_cliente: nome,
            email_cliente: email,
            telefone_cliente: telefone,
            data,
            horario,
            link_reuniao: meetLink || '',
            status: 'Agendada',
            origem: 'Chatbot',
            observacoes: `Agendado via WhatsApp IA (Z-API) - Contato: ${contact.name || phone}`
          });

          console.log('✅ Agendamento criado!');

          // Cria Lead no CRM no estágio "Reunião Marcada"
          try {
            await base44.asServiceRole.entities.Lead.create({
              nome_cliente: nome,
              email_cliente: email,
              telefone_cliente: telefone,
              estagio: 'Reuniao_Marcada',
              data_reuniao: data,
              agendamento_id: novoAgendamento.id,
              observacoes: `Reunião marcada via WhatsApp IA (Z-API) - ${data} às ${horario}`,
              proximos_passos: 'Realizar reunião agendada'
            });
            console.log('✅ Lead criado no CRM (Reunião Marcada)!');
          } catch (leadError) {
            console.error('⚠️ Erro ao criar Lead no CRM:', leadError.message);
          }

          finalResponse = aiResponse.replace(/\[AGENDAR\][\s\S]*?\[\/AGENDAR\]/, '').trim();
          finalResponse += `\n\n✅ *Agendamento Confirmado!*\n👤 Nome: ${nome}\n📅 Data: ${data}\n⏰ Horário: ${horario}`;
          if (meetLink) finalResponse += `\n🔗 Link da reunião: ${meetLink}`;
          finalResponse += `\n\nAguardamos você! 🎉`;

        } catch (agendaError) {
          console.error('❌ Erro agendamento:', agendaError);
          finalResponse = aiResponse.replace(/\[AGENDAR\][\s\S]*?\[\/AGENDAR\]/, '').trim();
          finalResponse += '\n\n⚠️ Houve um problema ao confirmar seu agendamento. Por favor, tente novamente.';
        }
      } else {
        let faltam = [];
        if (!nomeValido) faltam.push('nome completo');
        if (!emailValido) faltam.push('email válido');
        if (!dataValida) faltam.push('data válida (futura)');
        if (!horarioValido) faltam.push('horário no formato HH:MM');
        if (ehFimDeSemana) faltam.push('data em dia útil');

        finalResponse = aiResponse.replace(/\[AGENDAR\][\s\S]*?\[\/AGENDAR\]/, '').trim();
        if (faltam.length > 0) {
          finalResponse += `\n\nPara completar seu agendamento, preciso que você informe: ${faltam.join(', ')}.`;
        }
      }
    }

    // Salva resposta no banco
    await base44.asServiceRole.entities.Message.create({
      contact_id: contact.id,
      direction: 'outbound',
      sender: 'ai',
      content: finalResponse,
      type: 'text',
      status: 'sent'
    });

    // Envia via Z-API
    console.log('📤 Enviando resposta via Z-API...');

    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;

    let telefoneFormatado = phone.replace(/\D/g, '');
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }

    const sendResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({
        phone: telefoneFormatado,
        message: finalResponse
      })
    });

    if (sendResponse.ok) {
      console.log('✅ Mensagem enviada via Z-API!');
    } else {
      const errorText = await sendResponse.text();
      console.error('❌ Erro ao enviar via Z-API:', errorText);
    }

  } catch (error) {
    console.error('❌ Erro no processamento da IA:', error);
  }
}

// ========== PROCESSA RESPOSTA VIA OPENCLAW E ENVIA PELA Z-API ==========
async function processOpenClawResponse(base44, contact, phone) {
  try {
    const openclawUrl = (Deno.env.get('OPENCLAW_API_URL') || '').trim();
    const openclawKey = (Deno.env.get('OPENCLAW_API_KEY') || '').trim();

    if (!openclawUrl || !openclawKey) {
      console.error('❌ Credenciais OpenClaw incompletas (OPENCLAW_API_URL / OPENCLAW_API_KEY)');
      return;
    }

    // Garante que a URL aponte para /v1/chat/completions (formato OpenAI)
    let chatUrl = openclawUrl;
    if (!chatUrl.includes('/chat/completions')) {
      chatUrl = chatUrl.replace(/\/+$/, '');
      if (chatUrl.endsWith('/v1')) chatUrl += '/chat/completions';
      else chatUrl += '/v1/chat/completions';
    }

    // Busca histórico recente da conversa para dar contexto ao OpenClaw
    const allMessages = await base44.asServiceRole.entities.Message.filter(
      { contact_id: contact.id },
      '-created_date',
      10
    );

    const messages = allMessages
      .reverse()
      .map(m => ({
        role: m.sender === 'customer' ? 'user' : 'assistant',
        content: m.content || ''
      }))
      .filter(m => m.content);

    console.log('🦅 Chamando motor OpenClaw (formato OpenAI):', chatUrl);

    const ocResponse = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openclawKey}`
      },
      body: JSON.stringify({
        model: 'openclaw/default',
        messages
      }),
      signal: AbortSignal.timeout(120000)
    });

    if (!ocResponse.ok) {
      console.error('❌ Erro ao chamar OpenClaw:', await ocResponse.text());
      return;
    }

    const ocData = await ocResponse.json();
    // Formato OpenAI: choices[0].message.content (com fallbacks)
    const reply = (
      ocData.choices?.[0]?.message?.content ||
      ocData.reply || ocData.response || ocData.message || ocData.text || ''
    ).toString().trim();

    if (!reply) {
      console.error('❌ OpenClaw não retornou texto de resposta. Payload:', JSON.stringify(ocData));
      return;
    }

    console.log('✅ Resposta do OpenClaw:', reply);

    // Salva a resposta no banco
    await base44.asServiceRole.entities.Message.create({
      contact_id: contact.id,
      direction: 'outbound',
      sender: 'ai',
      content: reply,
      type: 'text',
      status: 'sent'
    });

    // Envia a resposta do OpenClaw pelo canal oficial (Z-API)
    await enviarMensagemZapi(phone, reply);

  } catch (error) {
    console.error('❌ Erro no processamento OpenClaw:', error.message);
  }
}

// ========== ENVIA UMA MENSAGEM DE TEXTO VIA Z-API ==========
async function enviarMensagemZapi(phone, message) {
  try {
    const clientToken = (Deno.env.get('CLIENT_TOKEN') || '').trim();
    const instanceToken = (Deno.env.get('TOKEN_DA_INSTANCIA') || '').trim();
    const instanceId = (Deno.env.get('IA_DA_INSTANCIA') || '').trim();

    if (!clientToken || !instanceToken || !instanceId) {
      console.error('❌ Credenciais Z-API incompletas para envio');
      return;
    }

    let telefoneFormatado = phone.replace(/\D/g, '');
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }

    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;
    const res = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({ phone: telefoneFormatado, message })
    });

    if (res.ok) {
      console.log('✅ Mensagem enviada via Z-API!');
    } else {
      console.error('❌ Erro ao enviar via Z-API:', await res.text());
    }
  } catch (error) {
    console.error('⚠️ Erro ao enviar mensagem Z-API:', error.message);
  }
}

// ========== NOTIFICA O DONO SOBRE TRANSFERÊNCIA PARA HUMANO ==========
async function notificarTransferenciaHumano(nomeContato, telefoneCliente) {
  try {
    const clientToken = (Deno.env.get('CLIENT_TOKEN') || '').trim();
    const instanceToken = (Deno.env.get('TOKEN_DA_INSTANCIA') || '').trim();
    const instanceId = (Deno.env.get('IA_DA_INSTANCIA') || '').trim();

    if (!clientToken || !instanceToken || !instanceId) return;

    const meuNumero = '5587988020504';
    const mensagem = `🙋 *Cliente pediu atendimento humano!*\n\n👤 Nome: ${nomeContato}\n📱 Telefone: ${telefoneCliente}\n\nA IA foi desligada para este contato. Responda manualmente pelo sistema.`;

    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;
    await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({ phone: meuNumero, message: mensagem })
    });
    console.log('✅ Dono notificado sobre transferência para humano!');
  } catch (error) {
    console.error('⚠️ Erro ao notificar transferência:', error.message);
  }
}

// ========== NOTIFICA O DONO SOBRE CLIENTE NOVO NO CHAT ==========
async function notificarClienteNovo(nomeContato, telefoneCliente) {
  try {
    const clientToken = (Deno.env.get('CLIENT_TOKEN') || '').trim();
    const instanceToken = (Deno.env.get('TOKEN_DA_INSTANCIA') || '').trim();
    const instanceId = (Deno.env.get('IA_DA_INSTANCIA') || '').trim();

    if (!clientToken || !instanceToken || !instanceId) {
      console.error('❌ Credenciais Z-API incompletas para notificação');
      return;
    }

    const meuNumero = '5587988020504';
    const mensagem = `🔔 *Novo cliente no chat da Glória!*\n\n👤 Nome: ${nomeContato}\n📱 Telefone: ${telefoneCliente}\n\nUm novo contato acabou de iniciar uma conversa.`;

    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;

    const res = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({ phone: meuNumero, message: mensagem })
    });

    if (res.ok) {
      console.log('✅ Notificação de cliente novo enviada ao dono!');
    } else {
      console.error('❌ Erro ao notificar dono:', await res.text());
    }
  } catch (error) {
    console.error('⚠️ Erro ao notificar cliente novo:', error.message);
  }
}