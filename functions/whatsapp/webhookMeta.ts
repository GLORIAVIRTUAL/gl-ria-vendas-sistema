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
            await processAIResponse(base44, contact, phone);
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
async function processAIResponse(base44, contact, phone) {
  try {
            // Busca configurações da IA
            const aiSettings = await base44.asServiceRole.entities.AISettings.list();
            const settings = aiSettings.find(s => s.is_active) || aiSettings[0];

            if (!settings) {
              console.log('⚠️ Nenhuma configuração de IA encontrada');
              return;
            }

            console.log('⚙️ Usando configuração:', settings.name);

            // Horário de Brasília
            const now = new Date();
            const brasiliaTime = new Intl.DateTimeFormat('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              dateStyle: 'full',
              timeStyle: 'long'
            }).format(now);

            // Busca histórico completo em ordem decrescente (mais recente primeiro)
            const allMessages = await base44.asServiceRole.entities.Message.filter(
              { contact_id: contact.id },
              '-created_date',
              30
            );

            // Separa mensagens do cliente que ainda não foram respondidas pela IA
            // Pega mensagens do cliente até encontrar uma resposta da IA
            const recentCustomerMessages = [];
            for (const msg of allMessages) {
              if (msg.sender === 'ai') {
                // Encontrou resposta da IA, para de acumular
                break;
              }
              if (msg.sender === 'customer') {
                recentCustomerMessages.unshift(msg); // Adiciona no início para manter ordem cronológica
              }
            }

            // Acumula conteúdo das mensagens do cliente
            const currentMessage = recentCustomerMessages
              .map(m => m.content)
              .join('\n');

            console.log(`📦 Acumuladas ${recentCustomerMessages.length} mensagens do cliente`);
            console.log(`📝 Conteúdo acumulado: ${currentMessage.substring(0, 100)}...`);

            // Monta histórico formatado (mensagens antigas, exceto as sendo processadas agora)
            const olderMessages = allMessages
              .filter(m => !recentCustomerMessages.some(rcm => rcm.id === m.id))
              .reverse(); // Inverte para ordem cronológica
            
            const conversationContext = olderMessages
              .map(m => {
                let msg = `${m.sender === 'customer' ? 'Cliente' : 'GLÓRIA'}: ${m.content}`;
                if (m.type !== 'text' && m.media_url) {
                  msg += ` [${m.type.toUpperCase()}]`;
                }
                return msg;
              })
              .join('\n');

            // Verifica palavras de transferência
            const shouldTransfer = (settings.transfer_keywords || []).some(keyword =>
              currentMessage.toLowerCase().includes(keyword.toLowerCase())
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

            // Horários comerciais
            const horariosComerciais = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

            // Busca campos personalizados já capturados e extrai dados da conversa ANTES de enviar para IA
            const customFields = contact.custom_fields || {};
            const updateFields = { ...customFields };
            
            // Extrai produto
            if (!updateFields.produto) {
              const produtoMatch = currentMessage.match(/(atendimento|videos|clinica|vendas|sites|especialistas|avatar)/i);
              if (produtoMatch) {
                const produtoMap = {
                  'atendimento': 'Atendimento_IA_24_7',
                  'videos': 'Maquina_de_Videos',
                  'clinica': 'Gloria_Clinica',
                  'vendas': 'Gloria_Vendas',
                  'sites': 'Sites_em_24_Horas',
                  'especialistas': 'Especialistas_Virtuais',
                  'avatar': 'Especialistas_Virtuais'
                };
                updateFields.produto = produtoMap[produtoMatch[1].toLowerCase()];
              }
            }
            
            // Extrai nome
            if (!updateFields.nome_cliente && !contact.name) {
              const nomeMatch = currentMessage.match(/(?:me chamo|meu nome é|meu nome e|sou o|sou a|meu nome:|nome:)\s*([A-Za-zÀ-ÿ\s]+?)(?:\.|,|$|\n)/i);
              if (nomeMatch) updateFields.nome_cliente = nomeMatch[1].trim();
            }
            
            // Extrai email
            if (!updateFields.email_cliente && !contact.email) {
              const emailMatch = currentMessage.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
              if (emailMatch) updateFields.email_cliente = emailMatch[1];
            }
            
            // Extrai telefone
            if (!updateFields.telefone_cliente && contact.phone) {
              updateFields.telefone_cliente = contact.phone;
            }
            
            // Extrai data
            if (!updateFields.data) {
              // Verifica se é "amanhã" ou "depois de amanhã"
              if (/amanh[ãa]|amanha/i.test(currentMessage)) {
                const amanha = new Date();
                amanha.setDate(amanha.getDate() + 1);
                updateFields.data = amanha.toISOString().split('T')[0];
                console.log('📅 Cliente disse "amanhã", data calculada:', updateFields.data);
              } else if (/depois de amanh[ãa]|depois de amanha|daqui a 2 dias|2 dias/i.test(currentMessage)) {
                const depoisAmanha = new Date();
                depoisAmanha.setDate(depoisAmanha.getDate() + 2);
                updateFields.data = depoisAmanha.toISOString().split('T')[0];
                console.log('📅 Cliente disse "depois de amanhã", data calculada:', updateFields.data);
              } else if (/hoje/i.test(currentMessage)) {
                const hoje = new Date();
                updateFields.data = hoje.toISOString().split('T')[0];
                console.log('📅 Cliente disse "hoje", data calculada:', updateFields.data);
              } else if (/daqui a (\d+) dias?/i.test(currentMessage)) {
                const match = currentMessage.match(/daqui a (\d+) dias?/i);
                const dias = parseInt(match[1]);
                const data = new Date();
                data.setDate(data.getDate() + dias);
                updateFields.data = data.toISOString().split('T')[0];
                console.log(`📅 Cliente disse "daqui a ${dias} dias", data calculada:`, updateFields.data);
              } else {
                // Tenta extrair data no formato dd/mm ou dd-mm
                const dataMatch = currentMessage.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
                if (dataMatch) {
                  const dia = dataMatch[1].padStart(2, '0');
                  const mes = dataMatch[2].padStart(2, '0');
                  const ano = dataMatch[3] ? (dataMatch[3].length === 2 ? '20' + dataMatch[3] : dataMatch[3]) : new Date().getFullYear();
                  updateFields.data = `${ano}-${mes}-${dia}`;
                }
              }
            }
            
            // Extrai horário (aceita vários formatos)
            if (!updateFields.horario) {
              const horarioMatch = currentMessage.match(/(\d{1,2}):(\d{2})|(\d{1,2})h|(\d{1,2})\s*horas?|as\s*(\d{1,2})/i);
              if (horarioMatch) {
                const hora = horarioMatch[1] || horarioMatch[3] || horarioMatch[4] || horarioMatch[5];
                const minuto = horarioMatch[2] || '00';
                updateFields.horario = `${hora.padStart(2, '0')}:${minuto}`;
              }
            }
            
            // Salva dados extraídos ANTES de chamar a IA
            if (JSON.stringify(updateFields) !== JSON.stringify(customFields)) {
              console.log('💾 Salvando dados extraídos ANTES da IA:', updateFields);
              await base44.asServiceRole.entities.Contact.update(contact.id, {
                custom_fields: updateFields
              });
            }
            
            const produtoSalvo = updateFields.produto;
            const dataSalva = updateFields.data;
            const horarioSalvo = updateFields.horario;
            const nomeClienteSalvo = updateFields.nome_cliente || contact.name;
            const emailClienteSalvo = updateFields.email_cliente || contact.email;
            const telefoneSalvo = updateFields.telefone_cliente || contact.phone;

            // SEMPRE verifica horários disponíveis se tiver data
            let horariosInfo = '';
            if (dataSalva) {
              console.log('📅 Consultando horários para:', dataSalva);

              // Busca agendamentos do dia
              const agendamentosDoDia = await base44.asServiceRole.entities.Agendamento.filter({
                data: dataSalva
              });

              const horariosOcupados = agendamentosDoDia
                .filter(a => a.status === 'Agendada' || a.status === 'Confirmada')
                .map(a => a.horario);

              const horariosLivres = horariosComerciais.filter(h => !horariosOcupados.includes(h));

              if (horariosLivres.length > 0) {
                horariosInfo = `\n\n🕐 HORÁRIOS DISPONÍVEIS EM ${dataSalva}:\n${horariosLivres.join(', ')}\n\n⚠️ IMPORTANTE: VOCÊ DEVE SUGERIR APENAS HORÁRIOS DESTA LISTA! Não invente horários.`;
              } else {
                horariosInfo = `\n\n❌ Nenhum horário disponível em ${dataSalva}. Pergunte outra data ao cliente.`;
              }
            }

            // Identifica quais dados ainda faltam
            const dadosFaltantes = [];
            if (!produtoSalvo) dadosFaltantes.push('produto de interesse');
            if (!nomeClienteSalvo) dadosFaltantes.push('nome completo');
            if (!emailClienteSalvo) dadosFaltantes.push('email');
            if (!telefoneSalvo) dadosFaltantes.push('telefone');
            if (!dataSalva) dadosFaltantes.push('data desejada');
            if (!horarioSalvo) dadosFaltantes.push('horário preferido');

            // Monta resumo dos dados já coletados
            let dadosColetados = '';
            if (produtoSalvo) dadosColetados += `\n✅ Produto: ${produtoSalvo}`;
            if (nomeClienteSalvo) dadosColetados += `\n✅ Nome: ${nomeClienteSalvo}`;
            if (emailClienteSalvo) dadosColetados += `\n✅ Email: ${emailClienteSalvo}`;
            if (telefoneSalvo) dadosColetados += `\n✅ Telefone: ${telefoneSalvo}`;
            if (dataSalva) dadosColetados += `\n✅ Data: ${dataSalva}`;
            if (horarioSalvo) dadosColetados += `\n✅ Horário: ${horarioSalvo}`;

            // Monta prompt completo
            const systemPrompt = settings.system_prompt || 'Você é GLÓRIA, uma assistente virtual inteligente e prestativa.';
            
            const fullPrompt = `${systemPrompt}

📅 INFORMAÇÕES ATUAIS:
- Data/Hora em Brasília: ${brasiliaTime}
- Cliente: ${contact.name || 'Não informado'}
- Telefone: ${contact.phone}

💬 HISTÓRICO DA CONVERSA:
${conversationContext || 'Esta é a primeira mensagem.'}

📨 MENSAGENS ATUAIS DO CLIENTE (acumuladas):
${currentMessage}
${horariosInfo}

${shouldTransfer ? '⚠️ ATENÇÃO: Cliente solicitou falar com humano. Informe que está transferindo para atendente.' : ''}

📊 DADOS JÁ COLETADOS DO CLIENTE:${dadosColetados || '\n❌ Nenhum dado coletado ainda'}

${dadosFaltantes.length > 0 ? `⚠️ DADOS QUE AINDA FALTAM: ${dadosFaltantes.join(', ')}` : '✅ TODOS OS DADOS COLETADOS! Pronto para agendar.'}

🎯 REGRAS OBRIGATÓRIAS - SIGA RIGOROSAMENTE:

1. ⛔ NUNCA REPITA PERGUNTAS
   - Verifique "DADOS JÁ COLETADOS" antes de perguntar qualquer coisa
   - Se o dado já está lá, NÃO PERGUNTE novamente
   
2. ⏰ HORÁRIOS - REGRA CRÍTICA
   - Se aparecer "HORÁRIOS DISPONÍVEIS", APENAS sugira horários dessa lista
   - NUNCA sugira horários que não estão na lista
   - Se não houver lista de horários, pergunte a data primeiro
   
3. ✅ QUANDO AGENDAR
   - Se "DADOS QUE AINDA FALTAM" está vazio, use [AGENDAR] IMEDIATAMENTE
   - Não pergunte confirmação, apenas agende
   
4. 📝 PERGUNTAS
   - Pergunte apenas 1 dado por vez
   - Só pergunte dados da lista "DADOS QUE AINDA FALTAM"

📦 PRODUTOS DISPONÍVEIS:
${produtosDisponiveis.map(p => `- ${p.replace(/_/g, ' ')}`).join('\n')}

📋 COMANDO PARA AGENDAR:
[AGENDAR]
NOME: ${nomeClienteSalvo || 'extrair da conversa ou perguntar'}
EMAIL: ${emailClienteSalvo || 'extrair ou perguntar'}
TELEFONE: ${telefoneSalvo || 'extrair ou perguntar'}
PRODUTO: ${produtoSalvo || 'extrair ou perguntar'}
DATA: ${dataSalva || 'extrair ou perguntar'}
HORARIO: ${horarioSalvo || 'extrair ou perguntar'}
[/AGENDAR]

Seja eficiente. Não repita perguntas. Foque nos dados faltantes.`;

            console.log('🔄 Enviando para IA...');

            // Busca mídias das mensagens acumuladas
            let fileUrls = [];
            for (const msg of recentCustomerMessages) {
              if (msg.type !== 'text' && msg.media_url) {
                // Se já é uma URL do base44, usa diretamente
                if (msg.media_url.includes('supabase.co') || msg.media_url.includes('base44')) {
                  fileUrls.push(msg.media_url);
                  console.log('✅ Mídia já processada:', msg.media_url);
                } else {
                  // Precisa baixar do Meta
                  try {
                    console.log('📥 Baixando mídia do Meta:', msg.media_url);
                    const ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');
                    
                    const mediaInfoResponse = await fetch(
                      `https://graph.facebook.com/v18.0/${msg.media_url}`,
                      {
                        headers: {
                          'Authorization': `Bearer ${ACCESS_TOKEN}`
                        }
                      }
                    );
                    
                    if (mediaInfoResponse.ok) {
                      const mediaInfo = await mediaInfoResponse.json();
                      const mediaDownloadUrl = mediaInfo.url;
                      
                      const mediaResponse = await fetch(mediaDownloadUrl, {
                        headers: {
                          'Authorization': `Bearer ${ACCESS_TOKEN}`
                        }
                      });
                      
                      if (mediaResponse.ok) {
                        const mediaBlob = await mediaResponse.blob();
                        const mediaFile = new File([mediaBlob], `media_${Date.now()}.${mediaInfo.mime_type?.split('/')[1] || 'bin'}`, {
                          type: mediaInfo.mime_type
                        });
                        
                        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
                          file: mediaFile
                        });
                        
                        fileUrls.push(file_url);
                        console.log('✅ Mídia enviada para IA:', file_url);
                        
                        await base44.asServiceRole.entities.Message.update(msg.id, {
                          media_url: file_url
                        });
                      }
                    }
                  } catch (mediaError) {
                    console.error('⚠️ Erro ao processar mídia:', mediaError);
                  }
                }
              }
            }

            // Chama a IA
            let responseText;
            try {
              const llmParams = {
                prompt: fullPrompt,
                model: settings.ai_model || 'gpt-4o'
              };
              
              // Adiciona arquivos se houver
              if (fileUrls.length > 0) {
                llmParams.file_urls = fileUrls;
                console.log('📎 Enviando arquivos para IA:', fileUrls);
              }
              
              responseText = await base44.asServiceRole.integrations.Core.InvokeLLM(llmParams);
              
              console.log('✅ IA respondeu:', responseText);

              // Verifica se a IA quer agendar
              if (responseText.includes('[AGENDAR]')) {
                console.log('📅 IA solicitou agendamento, processando...');
                
                const match = responseText.match(/\[AGENDAR\]([\s\S]*?)\[\/AGENDAR\]/);
                if (match) {
                  const dados = match[1];
                  const nome = dados.match(/NOME:\s*(.+)/)?.[1]?.trim();
                  const email = dados.match(/EMAIL:\s*(.+)/)?.[1]?.trim();
                  const telefone = dados.match(/TELEFONE:\s*(.+)/)?.[1]?.trim();
                  const produto = dados.match(/PRODUTO:\s*(.+)/)?.[1]?.trim();
                  const data = dados.match(/DATA:\s*(.+)/)?.[1]?.trim();
                  const horario = dados.match(/HORARIO:\s*(.+)/)?.[1]?.trim();

                  console.log('📋 Extraído:', { nome, email, telefone, produto, data, horario });

                  if (nome && email && telefone && produto && data && horario) {
                    // Verifica disponibilidade
                    const todosAgendamentos = await base44.asServiceRole.entities.Agendamento.filter({
                      data,
                      horario
                    });

                    const ocupado = todosAgendamentos.some(a => 
                      a.status === 'Agendada' || a.status === 'Confirmada'
                    );

                    if (ocupado) {
                      responseText = responseText.replace(/\[AGENDAR\][\s\S]*?\[\/AGENDAR\]/, '').trim();
                      responseText += '\n\n❌ Este horário foi ocupado agora mesmo! Por favor, escolha outro.';
                    } else {
                      // Normaliza o nome do produto
                      const produtoMap = {
                        'Atendimento_IA_24_7': 'Atendimento_IA_24_7',
                        'Maquina_de_Videos': 'Maquina_de_Videos',
                        'Gloria_Clinica': 'Gloria_Clinica',
                        'Gloria_Vendas': 'Gloria_Vendas',
                        'Especialistas_Virtuais': 'Especialistas_Virtuais',
                        'Sites_em_24_Horas': 'Sites_em_24_Horas',
                        'gloria_sites': 'Sites_em_24_Horas',
                        'sites': 'Sites_em_24_Horas'
                      };
                      
                      const produtoNormalizado = produtoMap[produto] || produto;
                      
                      const produtoNomes = {
                        'Atendimento_IA_24_7': 'Glória Atendimento IA 24/7',
                        'Maquina_de_Videos': 'Máquina de Vídeos',
                        'Gloria_Clinica': 'Glória Clínica',
                        'Gloria_Vendas': 'Glória Vendas',
                        'Especialistas_Virtuais': 'Especialistas Virtuais',
                        'Sites_em_24_Horas': 'Sites em 24 Horas'
                      };

                      // Cria evento no Google Calendar (link real do Meet)
                      console.log('📅 Criando evento no Google Calendar...');
                      const startDateTime = `${data}T${horario}:00`;
                      const [hora, minuto] = horario.split(':');
                      const endHora = String(parseInt(hora) + 1).padStart(2, '0');
                      const endDateTime = `${data}T${endHora}:${minuto}:00`;

                      let linkReuniao = '';
                      try {
                        const calendarResponse = await base44.asServiceRole.functions.invoke('createGoogleCalendarEvent', {
                          summary: `Reunião - ${produtoNomes[produtoNormalizado] || produtoNormalizado} - ${nome}`,
                          description: `Reunião sobre ${produtoNomes[produtoNormalizado] || produtoNormalizado}\n\nCliente: ${nome}\nEmail: ${email}\nTelefone: ${telefone}\n\nAgendamento via IA WhatsApp`,
                          startDateTime,
                          endDateTime,
                          attendeeEmail: email,
                          attendeeName: nome
                        });

                        if (calendarResponse.status === 200 && calendarResponse.data?.meetLink) {
                          linkReuniao = calendarResponse.data.meetLink;
                          console.log('✅ Link do Meet criado:', linkReuniao);
                        } else {
                          console.error('⚠️ Erro ao criar evento:', calendarResponse.data);
                          linkReuniao = 'Link será enviado por email';
                        }
                      } catch (calError) {
                        console.error('❌ Erro ao criar evento no Google Calendar:', calError);
                        linkReuniao = 'Link será enviado por email';
                      }
                      
                      const agendamento = await base44.asServiceRole.entities.Agendamento.create({
                        nome_cliente: nome,
                        email_cliente: email,
                        telefone_cliente: telefone,
                        produto: produtoNormalizado,
                        data: data,
                        horario: horario,
                        link_reuniao: linkReuniao,
                        status: 'Agendada',
                        origem: 'Chatbot',
                        observacoes: 'Agendamento via IA WhatsApp - GLÓRIA'
                      });

                      console.log('✅ Agendamento criado:', agendamento.id);

                      // Cria Lead no CRM
                      await base44.asServiceRole.entities.Lead.create({
                        nome_cliente: nome,
                        email_cliente: email,
                        telefone_cliente: telefone,
                        produto_interesse: produtoNormalizado,
                        data_reuniao: data,
                        observacoes: 'Lead via IA WhatsApp',
                        agendamento_id: agendamento.id,
                        estagio: 'Reuniao_Marcada',
                        prioridade: 'Media'
                      });

                      // Remove comando da resposta
                      responseText = responseText.replace(/\[AGENDAR\][\s\S]*?\[\/AGENDAR\]/, '').trim();
                      
                      // Adiciona confirmação
                      const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
                      responseText += `\n\n✅ *Reunião agendada com sucesso!*\n\n📅 Data: ${dataFormatada}\n🕐 Horário: ${horario}\n💼 Produto: ${produtoNomes[produtoNormalizado] || produtoNormalizado}\n🔗 Link: ${linkReuniao}\n\nVocê receberá um email de confirmação em breve!`;

                      // Atualiza contato
                      await base44.asServiceRole.entities.Contact.update(contact.id, {
                        name: nome,
                        email: email,
                        pipeline_stage: 'qualificado'
                      });
                    }
                  } else {
                    responseText = responseText.replace(/\[AGENDAR\][\s\S]*?\[\/AGENDAR\]/, '').trim();
                    responseText += '\n\n⚠️ Preciso de todas as informações para agendar. Me informe: nome, email, telefone, produto e horário desejado.';
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

            // Divide a resposta em blocos menores (quebra por \n\n ou a cada 300 caracteres)
            const dividirEmBlocos = (texto) => {
              const blocos = [];
              const paragrafos = texto.split('\n\n');
              
              for (const paragrafo of paragrafos) {
                if (paragrafo.trim().length === 0) continue;
                
                if (paragrafo.length <= 400) {
                  blocos.push(paragrafo.trim());
                } else {
                  // Se o parágrafo é muito grande, divide em frases
                  const frases = paragrafo.match(/[^.!?]+[.!?]+/g) || [paragrafo];
                  let blocoAtual = '';
                  
                  for (const frase of frases) {
                    if ((blocoAtual + frase).length <= 400) {
                      blocoAtual += frase;
                    } else {
                      if (blocoAtual) blocos.push(blocoAtual.trim());
                      blocoAtual = frase;
                    }
                  }
                  if (blocoAtual) blocos.push(blocoAtual.trim());
                }
              }
              
              return blocos.length > 0 ? blocos : [texto];
            };

            const blocosMensagem = dividirEmBlocos(responseText);
            console.log(`📦 Mensagem dividida em ${blocosMensagem.length} blocos`);

            const PHONE_NUMBER_ID = Deno.env.get('META_PHONE_NUMBER_ID');
            const ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');

            if (PHONE_NUMBER_ID && ACCESS_TOKEN) {
              // Envia cada bloco com delay
              for (let i = 0; i < blocosMensagem.length; i++) {
                const blocoTexto = blocosMensagem[i];
                
                // Delay entre mensagens (exceto a primeira)
                if (i > 0) {
                  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
                }

                console.log(`📤 Enviando bloco ${i + 1}/${blocosMensagem.length}...`);
                
                // Salva no banco
                const mensagemSalva = await base44.asServiceRole.entities.Message.create({
                  contact_id: contact.id,
                  direction: 'outbound',
                  sender: 'ai',
                  content: blocoTexto,
                  type: 'text',
                  status: 'sent',
                  extracted_data: {}
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
            } else {
              console.error('❌ Credenciais Meta não configuradas (META_PHONE_NUMBER_ID ou META_ACCESS_TOKEN)');
            }

  } catch (error) {
    console.error('❌ Erro ao processar resposta da IA:', error);
  }
}