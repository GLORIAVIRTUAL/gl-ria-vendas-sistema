import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('🔔 Webhook Meta recebido:', req.method);
  
  const base44 = createClientFromRequest(req);

  // ========== VERIFICAÇÃO DO WEBHOOK (GET) ==========
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('🔐 Verificação do webhook:');
    console.log('   Mode:', mode);
    console.log('   Token recebido:', token);
    console.log('   Challenge:', challenge);

    const VERIFY_TOKEN = (Deno.env.get('META_VERIFY_TOKEN') || '').trim();
    console.log('   Token esperado:', VERIFY_TOKEN);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verificado com sucesso!');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('❌ Token inválido ou modo incorreto');
      return new Response('Forbidden', { status: 403 });
    }
  }

  // ========== RECEBER MENSAGENS (POST) ==========
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('📩 Payload recebido:', JSON.stringify(body, null, 2));

      // Extrai dados do payload - suporta ambos os formatos
      let value;

      // Formato 1: Payload completo do Meta (com entry/changes)
      if (body.entry) {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        value = changes?.value;
      } 
      // Formato 2: Payload direto (só o value)
      else if (body.value) {
        value = body.value;
      }
      // Formato 3: Payload é o próprio value
      else if (body.messages || body.metadata) {
        value = body;
      }

      const messages = value?.messages || [];
      const contacts = value?.contacts || [];
      const phoneNumberId = value?.metadata?.phone_number_id;

      console.log('📱 Phone Number ID:', phoneNumberId);
      console.log('📨 Total de mensagens:', messages.length);

      if (messages.length === 0) {
        console.log('⚠️ Nenhuma mensagem no payload (pode ser status update)');
        return Response.json({ success: true });
      }

      // Processa cada mensagem
      for (const message of messages) {
        const phone = message.from;
        const timestamp = message.timestamp;
        
        // Extrai conteúdo baseado no tipo
        let content = '';
        let messageType = 'text';
        let mediaId = null;

        switch (message.type) {
          case 'text':
            content = message.text?.body || '';
            break;
          case 'image':
            content = message.image?.caption || '[Imagem]';
            messageType = 'image';
            mediaId = message.image?.id;
            break;
          case 'video':
            content = message.video?.caption || '[Vídeo]';
            messageType = 'video';
            mediaId = message.video?.id;
            break;
          case 'audio':
            content = '[Áudio]';
            messageType = 'audio';
            mediaId = message.audio?.id;
            break;
          case 'document':
            content = message.document?.filename || '[Documento]';
            messageType = 'document';
            mediaId = message.document?.id;
            break;
          default:
            content = `[${message.type}]`;
        }

        // Nome do contato
        const contactInfo = contacts.find(c => c.wa_id === phone);
        const contactName = contactInfo?.profile?.name || '';

        console.log('👤 Contato:', contactName || phone);
        console.log('💬 Mensagem:', content);
        console.log('📝 Tipo:', messageType);

        // Busca ou cria contato
        let existingContacts = await base44.asServiceRole.entities.Contact.filter({ phone });
        let contact;

        if (existingContacts.length === 0) {
          console.log('➕ Criando novo contato...');
          contact = await base44.asServiceRole.entities.Contact.create({
            phone,
            name: contactName,
            pipeline_stage: 'novo_lead',
            ai_enabled: true,
            is_active: true,
            last_message_at: new Date(parseInt(timestamp) * 1000).toISOString()
          });
        } else {
          contact = existingContacts[0];
          await base44.asServiceRole.entities.Contact.update(contact.id, {
            last_message_at: new Date(parseInt(timestamp) * 1000).toISOString(),
            name: contactName || contact.name
          });
        }

        console.log('💾 Salvando mensagem no banco...');
        
        // Salva mensagem
        await base44.asServiceRole.entities.Message.create({
          contact_id: contact.id,
          direction: 'inbound',
          sender: 'customer',
          content,
          type: messageType,
          media_url: mediaId,
          status: 'delivered'
        });

        console.log('✅ Mensagem salva!');

        // Se IA estiver habilitada, processa resposta
        if (contact.ai_enabled) {
          console.log('🤖 Processando resposta da IA...');
          await processAIResponse(base44, contact, phone, content);
        }
      }

      return Response.json({ success: true });

    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
});

// ========== FUNÇÃO PARA PROCESSAR IA E RESPONDER ==========
async function processAIResponse(base44, contact, phone, customerMessage) {
  try {
    const PHONE_NUMBER_ID = (Deno.env.get('META_PHONE_NUMBER_ID') || '').trim();
    const ACCESS_TOKEN = (Deno.env.get('META_ACCESS_TOKEN') || '').trim();

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      console.error('❌ META_PHONE_NUMBER_ID ou META_ACCESS_TOKEN não configurados');
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
    const recentMessages = await base44.asServiceRole.entities.Message.filter(
      { contact_id: contact.id },
      '-created_date',
      10
    );

    // Monta contexto
    const history = recentMessages.reverse().map(m => 
      `${m.sender === 'customer' ? 'Cliente' : 'Assistente'}: ${m.content}`
    ).join('\n');

    const systemPrompt = settings.system_prompt || 'Você é GLÓRIA, uma assistente virtual inteligente.';
    const fullPrompt = `${systemPrompt}\n\nHistórico:\n${history}\n\nCliente: ${customerMessage}`;

    console.log('🔄 Chamando IA...');

    // Chama a IA
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt
    });

    console.log('✅ Resposta da IA:', aiResponse);

    // Verifica se a resposta contém comando de agendamento
    let finalResponse = aiResponse;
    const agendarMatch = aiResponse.match(/\[AGENDAR\]([\s\S]*?)\[\/AGENDAR\]/);
    
    if (agendarMatch) {
      console.log('📅 Detectado comando de agendamento!');
      const agendarBlock = agendarMatch[1];
      
      // Extrai dados do bloco
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
      
      // Valida se tem os dados mínimos necessários
      if (nome && produto && data && horario && nome !== '[nome completo]' && data !== '[AAAA-MM-DD]') {
        try {
          // Cria o agendamento
          const agendamento = await base44.asServiceRole.entities.Agendamento.create({
            nome_cliente: nome,
            email_cliente: email || `${telefone}@whatsapp.temp`,
            telefone_cliente: telefone,
            produto: produto,
            data: data,
            horario: horario,
            status: 'Agendada',
            origem: 'Chatbot',
            observacoes: `Agendado via WhatsApp IA - Contato: ${contact.name || phone}`
          });
          
          console.log('✅ Agendamento criado com sucesso! ID:', agendamento.id);
          
          // Remove o bloco [AGENDAR] e adiciona confirmação
          finalResponse = aiResponse.replace(/\[AGENDAR\][\s\S]*?\[\/AGENDAR\]/, '').trim();
          finalResponse += `\n\n✅ *Agendamento Confirmado!*\n📅 Data: ${data}\n⏰ Horário: ${horario}\n📦 Produto: ${produto.replace(/_/g, ' ')}\n\nAguardamos você! 🎉`;
          
        } catch (agendaError) {
          console.error('❌ Erro ao criar agendamento:', agendaError);
          finalResponse = aiResponse.replace(/\[AGENDAR\][\s\S]*?\[\/AGENDAR\]/, '').trim();
          finalResponse += '\n\n⚠️ Houve um problema ao confirmar seu agendamento. Por favor, tente novamente ou entre em contato conosco.';
        }
      } else {
        console.log('⚠️ Dados incompletos ou com placeholders, não criando agendamento');
        // Remove o bloco mas não confirma
        finalResponse = aiResponse.replace(/\[AGENDAR\][\s\S]*?\[\/AGENDAR\]/, '').trim();
        finalResponse += '\n\nPor favor, me informe os dados que faltam para completar seu agendamento.';
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

    // Envia via WhatsApp
    console.log('📤 Enviando resposta via WhatsApp...');
    
    const sendResponse = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: finalResponse }
        })
      }
    );

    if (sendResponse.ok) {
      console.log('✅ Mensagem enviada com sucesso!');
    } else {
      const errorText = await sendResponse.text();
      console.error('❌ Erro ao enviar:', errorText);
    }

  } catch (error) {
    console.error('❌ Erro no processamento da IA:', error);
  }
}