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

        // Se IA estiver habilitada, processa resposta automática
        if (contact.ai_enabled) {
          console.log('🤖 IA habilitada para este contato');
          
          try {
            // Busca configurações da IA
            const aiSettings = await base44.asServiceRole.entities.AISettings.list();
            const settings = aiSettings.find(s => s.is_active) || aiSettings[0];

            if (!settings) {
              console.log('⚠️ Nenhuma configuração de IA encontrada');
              continue;
            }

            console.log('⚙️ Usando configuração:', settings.name);

            // Horário de Brasília
            const now = new Date();
            const brasiliaTime = new Intl.DateTimeFormat('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              dateStyle: 'full',
              timeStyle: 'long'
            }).format(now);

            // Busca histórico de mensagens do contato (últimas 15)
            const history = await base44.asServiceRole.entities.Message.filter(
              { contact_id: contact.id },
              'created_date',
              15
            );

            // Monta histórico formatado
            const conversationContext = history
              .map(m => `${m.sender === 'customer' ? 'Cliente' : 'GLÓRIA'}: ${m.content}`)
              .join('\n');

            // Verifica palavras de transferência
            const shouldTransfer = (settings.transfer_keywords || []).some(keyword =>
              content.toLowerCase().includes(keyword.toLowerCase())
            );

            // Produtos disponíveis
            const produtosDisponiveis = [
              'Atendimento_IA_24_7',
              'Maquina_de_Videos', 
              'Gloria_Clinica',
              'Gloria_Vendas',
              'Especialistas_Virtuais',
              'Sites_em_24_Horas'
            ];

            // Monta prompt completo com ferramentas
            const systemPrompt = settings.system_prompt || 'Você é GLÓRIA, uma assistente virtual inteligente e prestativa.';
            
            const fullPrompt = `${systemPrompt}

📅 INFORMAÇÕES ATUAIS:
- Data/Hora em Brasília: ${brasiliaTime}
- Cliente: ${contact.name || 'Não informado'}
- Telefone: ${contact.phone}

💬 HISTÓRICO DA CONVERSA:
${conversationContext || 'Esta é a primeira mensagem.'}

📨 MENSAGEM ATUAL DO CLIENTE:
${content}

${shouldTransfer ? '⚠️ ATENÇÃO: Cliente solicitou falar com humano. Informe que está transferindo para atendente.' : ''}

🛠️ FERRAMENTAS DISPONÍVEIS:
Você pode realizar agendamentos de reuniões! 

PRODUTOS DISPONÍVEIS:
${produtosDisponiveis.map(p => `- ${p.replace(/_/g, ' ')}`).join('\n')}

HORÁRIOS DISPONÍVEIS: 08:00 às 20:00 (de hora em hora)

Se o cliente pedir para:
1. CONSULTAR HORÁRIOS: responda normalmente perguntando a data e produto desejado
2. AGENDAR REUNIÃO: quando tiver Nome, Email, Telefone, Produto e Data/Horário, use o formato especial:

[AÇÃO:AGENDAR]
NOME: nome completo
EMAIL: email@exemplo.com
TELEFONE: telefone
PRODUTO: nome_do_produto
DATA: AAAA-MM-DD
HORARIO: HH:00
[/AÇÃO]

Após isso, continue a conversa normalmente.`;

            console.log('🔄 Enviando para IA com ferramentas...');

            // Chama a IA
            let responseText;
            try {
              responseText = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: fullPrompt
              });
              
              console.log('✅ IA respondeu:', responseText);

              // Verifica se a IA quer agendar
              if (responseText.includes('[AÇÃO:AGENDAR]')) {
                console.log('📅 IA solicitou agendamento, processando...');
                
                // Extrai dados do agendamento
                const match = responseText.match(/\[AÇÃO:AGENDAR\]([\s\S]*?)\[\/AÇÃO\]/);
                if (match) {
                  const dados = match[1];
                  const nome = dados.match(/NOME:\s*(.+)/)?.[1]?.trim();
                  const email = dados.match(/EMAIL:\s*(.+)/)?.[1]?.trim();
                  const telefone = dados.match(/TELEFONE:\s*(.+)/)?.[1]?.trim();
                  const produto = dados.match(/PRODUTO:\s*(.+)/)?.[1]?.trim();
                  const data = dados.match(/DATA:\s*(.+)/)?.[1]?.trim();
                  const horario = dados.match(/HORARIO:\s*(.+)/)?.[1]?.trim();

                  console.log('📋 Dados extraídos:', { nome, email, telefone, produto, data, horario });

                  // Verifica disponibilidade
                  const agendamentosNaData = await base44.asServiceRole.entities.Agendamento.filter({
                    data,
                    horario,
                    status: { $in: ['Agendada', 'Confirmada'] }
                  });

                  if (agendamentosNaData.length > 0) {
                    responseText = responseText.replace(/\[AÇÃO:AGENDAR\][\s\S]*?\[\/AÇÃO\]/, '').trim();
                    responseText += '\n\n❌ Ops! Este horário já está ocupado. Tente outro horário ou data.';
                  } else {
                    // Cria agendamento
                    const novoAgendamento = await base44.asServiceRole.entities.Agendamento.create({
                      nome_cliente: nome || contact.name || 'Cliente',
                      email_cliente: email || '',
                      telefone_cliente: telefone || contact.phone,
                      produto: produto,
                      data: data,
                      horario: horario,
                      link_reuniao: `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}`,
                      status: 'Agendada',
                      origem: 'Chatbot',
                      observacoes: 'Agendamento via IA - WhatsApp'
                    });

                    console.log('✅ Agendamento criado:', novoAgendamento.id);

                    // Remove tag de ação da resposta
                    responseText = responseText.replace(/\[AÇÃO:AGENDAR\][\s\S]*?\[\/AÇÃO\]/, '').trim();
                    responseText += `\n\n✅ Reunião agendada com sucesso!\n📅 ${data} às ${horario}\n🔗 Link: ${novoAgendamento.link_reuniao}`;

                    // Atualiza contato
                    await base44.asServiceRole.entities.Contact.update(contact.id, {
                      name: nome || contact.name,
                      email: email || contact.email,
                      pipeline_stage: 'qualificado'
                    });
                  }
                }
              }
              
            } catch (llmError) {
              console.error('❌ Erro na LLM:', llmError);
              responseText = 'Desculpe, estou com dificuldades técnicas. Um atendente humano irá ajudá-lo em breve.';
            }

            // Garante que sempre tem resposta
            if (!responseText || responseText.trim() === '') {
              responseText = 'Desculpe, não consegui processar sua mensagem. Pode repetir?';
            }

            // Se deve transferir para humano, desabilita IA
            if (shouldTransfer) {
              await base44.asServiceRole.entities.Contact.update(contact.id, {
                ai_enabled: false
              });
              console.log('👤 Conversa transferida para atendente humano');
            }

            // Salva resposta da IA no banco
            console.log('💾 Salvando resposta da IA no banco...');
            await base44.asServiceRole.entities.Message.create({
              contact_id: contact.id,
              direction: 'outbound',
              sender: 'ai',
              content: responseText,
              type: 'text',
              status: 'sent',
              extracted_data: {}
            });

            // Envia via WhatsApp API do Meta
            const PHONE_NUMBER_ID = Deno.env.get('META_PHONE_NUMBER_ID');
            const ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');

            if (PHONE_NUMBER_ID && ACCESS_TOKEN) {
              console.log('📤 Enviando mensagem via Meta API...');
              
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
                    text: { body: responseText }
                  })
                }
              );

              if (sendResponse.ok) {
                const result = await sendResponse.json();
                console.log('✅ Mensagem enviada com sucesso via Meta!', result);
                
                // Atualiza status da mensagem
                const lastAIMessage = await base44.asServiceRole.entities.Message.filter(
                  { contact_id: contact.id, sender: 'ai' },
                  '-created_date',
                  1
                );
                if (lastAIMessage.length > 0) {
                  await base44.asServiceRole.entities.Message.update(lastAIMessage[0].id, {
                    status: 'delivered'
                  });
                }
              } else {
                const errorText = await sendResponse.text();
                console.error('❌ Erro ao enviar via Meta:', errorText);
                
                // Marca como falha
                const lastAIMessage = await base44.asServiceRole.entities.Message.filter(
                  { contact_id: contact.id, sender: 'ai' },
                  '-created_date',
                  1
                );
                if (lastAIMessage.length > 0) {
                  await base44.asServiceRole.entities.Message.update(lastAIMessage[0].id, {
                    status: 'failed',
                    error_message: errorText
                  });
                }
              }
            } else {
              console.error('❌ Credenciais Meta não configuradas (META_PHONE_NUMBER_ID ou META_ACCESS_TOKEN)');
            }

          } catch (error) {
            console.error('❌ Erro ao processar IA:', error);
          }
        } else {
          console.log('🚫 IA desabilitada para este contato (modo humano)');
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