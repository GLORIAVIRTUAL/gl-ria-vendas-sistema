import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Map para controlar timeouts de processamento por contato
const processingTimeouts = new Map();
const DELAY_MS = 8000; // 8 segundos

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Webhook verification do Meta (GET request)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN')?.trim() || 'gloria_webhook_token_2025';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verificado pelo Meta');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('❌ Token de verificação inválido');
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Receber mensagens (POST request)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('📩 Webhook recebido do Meta:', JSON.stringify(body, null, 2));

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages || [];
      const contacts = value?.contacts || [];
      
      // Identifica qual número recebeu a mensagem
      const recipientPhoneId = value?.metadata?.phone_number_id;
      console.log('📞 Mensagem recebida no número ID:', recipientPhoneId);

      if (messages.length === 0) {
        console.log('⚠️ Nenhuma mensagem no webhook, ignorando...');
        return Response.json({ success: true });
      }

      for (const message of messages) {
        const phone = message.from;
        const timestamp = message.timestamp;
        let content = '';
        let messageType = 'text';
        let mediaUrl = null;

        // Extrai conteúdo baseado no tipo
        switch (message.type) {
          case 'text':
            content = message.text?.body || '';
            break;
          case 'image':
            content = message.image?.caption || 'Imagem enviada';
            messageType = 'image';
            mediaUrl = message.image?.id;
            break;
          case 'video':
            content = message.video?.caption || 'Vídeo enviado';
            messageType = 'video';
            mediaUrl = message.video?.id;
            break;
          case 'audio':
            content = 'Áudio enviado';
            messageType = 'audio';
            mediaUrl = message.audio?.id;
            break;
          case 'document':
            content = message.document?.filename || 'Documento enviado';
            messageType = 'document';
            mediaUrl = message.document?.id;
            break;
          default:
            content = `Mensagem do tipo: ${message.type}`;
        }

        const contactProfile = contacts.find(c => c.wa_id === phone);
        const contactName = contactProfile?.profile?.name || '';

        // Busca configuração do Gateway para este número
        let gatewayConfig = null;
        if (recipientPhoneId) {
          const gateways = await base44.asServiceRole.entities.WhatsAppGateway.filter({ 
            phone_number_id: recipientPhoneId,
            ativo: true 
          });
          gatewayConfig = gateways[0];
          console.log('🔧 Gateway encontrado:', gatewayConfig?.nome_identificacao || 'Não encontrado');
        }

        // Busca ou cria o contato
        let existingContacts = await base44.asServiceRole.entities.Contact.filter({ phone });
        let contact;

        if (existingContacts.length === 0) {
          console.log('👤 Criando novo contato:', phone);
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

        // Salva a mensagem do cliente
        console.log('💾 Salvando mensagem de:', phone);
        await base44.asServiceRole.entities.Message.create({
          contact_id: contact.id,
          direction: 'inbound',
          sender: 'customer',
          content,
          type: messageType,
          media_url: mediaUrl,
          status: 'delivered'
        });

        // Envia push notification
        try {
          await base44.asServiceRole.functions.invoke('sendPushNotification', {
            title: `💬 ${contactName || phone}`,
            body: content.substring(0, 100),
            contact_id: contact.id,
            data: { contact_id: contact.id, phone }
          });
          console.log('✅ Push notification enviada');
        } catch (pushError) {
          console.error('⚠️ Erro ao enviar push:', pushError);
        }

        // Se IA estiver habilitada, agenda processamento com delay
        if (contact.ai_enabled) {
          console.log('⏰ Agendando processamento em 8 segundos...');
          
          // Cancela timeout anterior se existir
          if (processingTimeouts.has(contact.id)) {
            clearTimeout(processingTimeouts.get(contact.id));
          }
          
          // Agenda novo processamento
          const timeoutId = setTimeout(async () => {
            console.log('🚀 Iniciando processamento após delay para:', phone);
            processingTimeouts.delete(contact.id);
            
            // Processa todas as mensagens acumuladas
            await processAIResponse(base44, contact, phone, gatewayConfig);
          }, DELAY_MS);
          
          processingTimeouts.set(contact.id, timeoutId);
          continue;
        }
      }

      return Response.json({ success: true });

    } catch (error) {
      console.error('❌ Erro no webhook:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
});

// Função para processar resposta da IA
async function processAIResponse(base44, contact, phone, gatewayConfig = null) {
  try {
    // Usa configurações do Gateway ou fallback para secrets globais
    const PHONE_NUMBER_ID = (gatewayConfig?.phone_number_id || Deno.env.get('META_PHONE_NUMBER_ID'))?.trim();
    const ACCESS_TOKEN = (gatewayConfig?.access_token || Deno.env.get('META_ACCESS_TOKEN'))?.trim();
    
    console.log('🔧 Usando:', gatewayConfig ? `Gateway: ${gatewayConfig.nome_identificacao}` : 'Secrets Globais');
    console.log('📞 PHONE_NUMBER_ID:', PHONE_NUMBER_ID ? PHONE_NUMBER_ID.substring(0, 10) + '***' : 'NÃO DEFINIDO');

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      console.error('❌ Credenciais Meta não configuradas');
      return;
    }

    // Busca configurações da IA
    const aiSettings = await base44.asServiceRole.entities.AISettings.list();
    const settings = aiSettings.find(s => s.is_active) || aiSettings[0];

    if (!settings) {
      console.log('⚠️ Nenhuma configuração de IA encontrada');
      return;
    }

    console.log('⚙️ Usando configuração:', settings.name);

    // Busca mensagens recentes do cliente
    const allMessages = await base44.asServiceRole.entities.Message.filter(
      { contact_id: contact.id },
      '-created_date',
      30
    );

    const recentCustomerMessages = [];
    for (const msg of allMessages) {
      if (msg.sender === 'ai') break;
      if (msg.sender === 'customer') {
        recentCustomerMessages.unshift(msg);
      }
    }

    console.log(`📦 Acumuladas ${recentCustomerMessages.length} mensagens do cliente para processar`);

    const currentMessage = recentCustomerMessages.map(m => m.content).join('\n\n');
    console.log(`📝 MENSAGEM:\n${currentMessage}`);

    // Monta prompt simples
    const systemPrompt = settings.system_prompt || 'Você é GLÓRIA, uma assistente virtual inteligente.';
    const fullPrompt = `${systemPrompt}\n\nCliente escreveu: ${currentMessage}`;

    console.log('🔄 Enviando para IA...');

    // Chama a IA
    const responseText = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      model: settings.ai_model || 'gpt-4o'
    });
    
    console.log('✅ IA respondeu:', responseText);

    // Divide resposta em blocos
    const blocos = responseText.split('\n\n').filter(b => b.trim());
    console.log(`📦 Mensagem dividida em ${blocos.length} blocos`);

    // Envia cada bloco
    for (let i = 0; i < blocos.length; i++) {
      const blocoTexto = blocos[i];
      
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      console.log(`📤 Enviando bloco ${i + 1}/${blocos.length}...`);
      
      // Salva no banco
      const mensagemSalva = await base44.asServiceRole.entities.Message.create({
        contact_id: contact.id,
        direction: 'outbound',
        sender: 'ai',
        content: blocoTexto,
        type: 'text',
        status: 'sent'
      });
      
      // Envia via WhatsApp
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
            text: { body: blocoTexto }
          })
        }
      );

      if (sendResponse.ok) {
        console.log(`✅ Bloco ${i + 1} enviado`);
        await base44.asServiceRole.entities.Message.update(mensagemSalva.id, {
          status: 'delivered'
        });
      } else {
        const errorText = await sendResponse.text();
        console.error(`❌ Erro no bloco ${i + 1}:`, errorText);
        await base44.asServiceRole.entities.Message.update(mensagemSalva.id, {
          status: 'failed',
          error_message: errorText
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar resposta da IA:', error);
  }
}