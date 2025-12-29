import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Webhook verification do Meta (GET request)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'gloria_webhook_token_2025';

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

      // Estrutura do webhook do Meta:
      // {
      //   "object": "whatsapp_business_account",
      //   "entry": [{
      //     "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      //     "changes": [{
      //       "value": {
      //         "messaging_product": "whatsapp",
      //         "metadata": { "display_phone_number": "...", "phone_number_id": "..." },
      //         "contacts": [{ "profile": { "name": "..." }, "wa_id": "..." }],
      //         "messages": [{
      //           "from": "5511999999999",
      //           "id": "wamid.xxx",
      //           "timestamp": "1234567890",
      //           "type": "text",
      //           "text": { "body": "Olá" }
      //         }]
      //       },
      //       "field": "messages"
      //     }]
      //   }]
      // }

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages || [];
      const contacts = value?.contacts || [];

      if (messages.length === 0) {
        console.log('⚠️ Nenhuma mensagem no webhook, ignorando...');
        return Response.json({ success: true });
      }

      for (const message of messages) {
        const phone = message.from;
        const messageId = message.id;
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
            mediaUrl = message.image?.id; // Meta envia ID, precisa buscar URL depois
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

        // Salva a mensagem
        console.log('💾 Salvando mensagem de:', phone);
        const savedMessage = await base44.asServiceRole.entities.Message.create({
          contact_id: contact.id,
          direction: 'inbound',
          sender: 'customer',
          content,
          type: messageType,
          media_url: mediaUrl,
          status: 'delivered'
        });

        // Se IA estiver habilitada, processa resposta automática
        if (contact.ai_enabled) {
          console.log('🤖 IA habilitada, processando resposta...');
          
          try {
            // Busca configurações da IA
            const aiSettings = await base44.asServiceRole.entities.AISettings.list();
            const settings = aiSettings.find(s => s.is_active) || aiSettings[0];

            if (settings) {
              // Busca histórico de mensagens do contato
              const history = await base44.asServiceRole.entities.Message.filter(
                { contact_id: contact.id },
                'created_date',
                20
              );

              // Monta contexto para a IA
              const conversationHistory = history.map(m => ({
                role: m.sender === 'customer' ? 'user' : 'assistant',
                content: m.content
              }));

              // Chama a IA para gerar resposta
              const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: content,
                response_json_schema: {
                  type: "object",
                  properties: {
                    response: { type: "string" },
                    should_transfer_to_human: { type: "boolean" },
                    extracted_data: { type: "object" }
                  }
                }
              });

              console.log('🤖 Resposta da IA:', aiResponse);

              // Se deve transferir para humano, desabilita IA
              if (aiResponse.should_transfer_to_human) {
                await base44.asServiceRole.entities.Contact.update(contact.id, {
                  ai_enabled: false
                });
                console.log('👤 Conversa transferida para humano');
              }

              // Salva resposta da IA
              if (aiResponse.response) {
                await base44.asServiceRole.entities.Message.create({
                  contact_id: contact.id,
                  direction: 'outbound',
                  sender: 'ai',
                  content: aiResponse.response,
                  type: 'text',
                  status: 'pending',
                  extracted_data: aiResponse.extracted_data || {}
                });

                // Envia via WhatsApp API do Meta
                const PHONE_NUMBER_ID = Deno.env.get('META_PHONE_NUMBER_ID');
                const ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');

                if (PHONE_NUMBER_ID && ACCESS_TOKEN) {
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
                        text: { body: aiResponse.response }
                      })
                    }
                  );

                  if (sendResponse.ok) {
                    console.log('✅ Mensagem enviada via Meta API');
                  } else {
                    console.error('❌ Erro ao enviar via Meta:', await sendResponse.text());
                  }
                }
              }
            }
          } catch (error) {
            console.error('❌ Erro ao processar IA:', error);
          }
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