import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== START agendarviachatbot (PÚBLICO) ===');
  
  try {
    const base44 = createClientFromRequest(req);
    
    let body = await req.json();
    console.log('📦 Request body original:', JSON.stringify(body, null, 2));

    if (body.arguments) {
      console.log('🔄 Detectado formato do chatbot, extraindo arguments...');
      body = body.arguments;
    }

    console.log('📦 Body processado:', JSON.stringify(body, null, 2));

    const { 
      nome_cliente, 
      email_cliente, 
      telefone_cliente,
      nome_empresa,
      site_instagram_empresa,
      processo_resolver,
      produto, 
      data, 
      horario, 
      observacoes,
      api_key 
    } = body;

    if (nome_cliente?.includes('{{') || nome_cliente?.includes('}}')) {
      console.error('❌ Variável nome_cliente não foi substituída:', nome_cliente);
      return Response.json({ 
        error: 'Variável não substituída',
        message: 'O campo nome_cliente ainda contém {{}}',
        field: 'nome_cliente',
        value: nome_cliente
      }, { status: 400 });
    }

    if (email_cliente?.includes('{{') || email_cliente?.includes('}}')) {
      console.error('❌ Variável email_cliente não foi substituída:', email_cliente);
      return Response.json({ 
        error: 'Variável não substituída',
        message: 'O campo email_cliente ainda contém {{}}',
        field: 'email_cliente',
        value: email_cliente
      }, { status: 400 });
    }

    const expectedApiKey = Deno.env.get('CHATBOT_API_KEY') || 'apiflskcjfjhsydkifms';
    console.log('🔑 API Key recebida:', api_key);
    
    if (api_key !== expectedApiKey) {
      console.error('❌ API Key inválida');
      return Response.json({ 
        error: 'Unauthorized',
        message: 'API Key inválida'
      }, { status: 401 });
    }

    if (!nome_cliente || !email_cliente || !nome_empresa || !site_instagram_empresa || !processo_resolver || !data || !horario) {
      console.error('❌ Campos obrigatórios faltando');
      return Response.json({ 
        error: 'Campos obrigatórios faltando',
        message: 'nome_cliente, email_cliente, nome_empresa, site_instagram_empresa, processo_resolver, data e horario são obrigatórios'
      }, { status: 400 });
    }

    const horariosValidos = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    if (!horariosValidos.includes(horario)) {
      return Response.json({ 
        error: 'Horário inválido',
        message: `Horário deve ser um de: ${horariosValidos.join(', ')}`
      }, { status: 400 });
    }

    console.log('🔍 Verificando disponibilidade para:', data, horario);
    const agendamentosExistentes = await base44.asServiceRole.entities.Agendamento.filter({
      data,
      horario
    });

    const agendamentosAtivos = agendamentosExistentes.filter(ag => ag.status !== 'Cancelada');
    console.log('✅ Agendamentos ativos:', agendamentosAtivos.length);

    if (agendamentosAtivos.length > 0) {
      console.error('❌ Horário ocupado');
      return Response.json({ 
        error: 'Horário não disponível',
        message: 'Este horário já está ocupado. Por favor, escolha outro horário.'
      }, { status: 409 });
    }

    console.log('📅 Criando evento no Google Calendar...');
    const startDateTime = `${data}T${horario}:00`;
    const [hora, minuto] = horario.split(':');
    const endHora = String(parseInt(hora) + 1).padStart(2, '0');
    const endDateTime = `${data}T${endHora}:${minuto}:00`;

    const calendarResponse = await base44.asServiceRole.functions.invoke('createGoogleCalendarEvent', {
      summary: `Reunião - ${nome_cliente}`,
      description: `Cliente: ${nome_cliente}\nEmail: ${email_cliente}\nTelefone: ${telefone_cliente || 'Não informado'}\nEmpresa: ${nome_empresa}\nSite ou Instagram: ${site_instagram_empresa}\nProcesso que deseja resolver: ${processo_resolver}\n\nObservações: ${observacoes || 'Nenhuma'}\n\n🌐 Agendado via Chatbot`,
      startDateTime,
      endDateTime,
      attendeeEmail: email_cliente,
      attendeeName: nome_cliente
    });

    if (calendarResponse.status !== 200 || !calendarResponse.data || calendarResponse.data.error) {
      throw new Error(calendarResponse.data?.message || calendarResponse.data?.error || 'Erro ao criar evento no Google Calendar');
    }

    console.log('💾 Criando agendamento no banco...');
    const agendamento = await base44.asServiceRole.entities.Agendamento.create({
      nome_cliente,
      email_cliente,
      telefone_cliente: telefone_cliente || '',
      nome_empresa,
      site_instagram_empresa,
      processo_resolver,
      produto: produto || '',
      data,
      horario,
      observacoes: observacoes || '',
      link_reuniao: calendarResponse.data.meetLink || '',
      status: 'Agendada',
      origem: 'Chatbot'
    });

    console.log('👤 Criando lead no CRM...');
    await base44.asServiceRole.entities.Lead.create({
      nome_cliente,
      nome_empresa,
      email_cliente,
      telefone_cliente: telefone_cliente || '',
      data_reuniao: data,
      observacoes: observacoes || '',
      agendamento_id: agendamento.id,
      estagio: 'Reuniao_Marcada',
      prioridade: 'Media'
    });

    // 📧 ENVIAR EMAIL DE CONFIRMAÇÃO IMEDIATAMENTE
    try {
      console.log('📧 Enviando email de confirmação...');
      
      const dataFormatada = new Date(data).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });

      const assuntoConfirmacao = `✅ Reunião Confirmada`;
      const corpoConfirmacao = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom, #f8fafc, #e0e7ff); border-radius: 10px;">
          <div style="background: linear-gradient(to right, #3b82f6, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Reunião Confirmada!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">
              Olá <strong>${nome_cliente}</strong>! 👋
            </p>
            
            <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">
              Sua reunião foi confirmada com sucesso! Estamos ansiosos para conversar com você.
            </p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">📋 Detalhes da Reunião</h2>
              <p style="margin: 10px 0; color: #334155;"><strong>📅 Data:</strong> ${dataFormatada}</p>
              <p style="margin: 10px 0; color: #334155;"><strong>⏰ Horário:</strong> ${horario}</p>
            </div>
            
            ${calendarResponse.data.meetLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${calendarResponse.data.meetLink}" 
                   style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                  🎥 Acessar Link da Reunião
                </a>
              </div>
            ` : ''}
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-top: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>💡 Dica:</strong> Você receberá um lembrete por email 2 horas antes da reunião.
              </p>
            </div>
            
            <p style="margin-top: 30px; color: #64748b; font-size: 14px; text-align: center;">
              Caso precise cancelar ou reagendar, entre em contato conosco.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Glória Vendas - Sistema de Agendamento<br>
                Este é um email automático, não responda.
              </p>
            </div>
          </div>
        </div>
      `;

      // Envia o email de confirmação
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Glória Vendas',
        to: email_cliente,
        subject: assuntoConfirmacao,
        body: corpoConfirmacao
      });

      // Registra o disparo como enviado
      await base44.asServiceRole.entities.DisparoEmail.create({
        agendamento_id: agendamento.id,
        email_destinatario: email_cliente,
        assunto: assuntoConfirmacao,
        corpo: corpoConfirmacao,
        tipo: 'Confirmacao',
        status: 'Enviado',
        data_envio: new Date().toISOString()
      });

      console.log('✅ Email de confirmação enviado!');
    } catch (error) {
      console.error('⚠️ Erro ao enviar email de confirmação:', error);
      // Não quebra o fluxo se o email falhar
    }

    // 📧 PROGRAMAR EMAIL DE LEMBRETE 2 HORAS ANTES
    try {
      console.log('📧 Programando email de lembrete...');
      
      const dataHoraReuniao = new Date(`${data}T${horario}:00`);
      const dataHoraLembrete = new Date(dataHoraReuniao.getTime() - (2 * 60 * 60 * 1000));
      
      const dataFormatada = new Date(data).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });

      const assuntoLembrete = `⏰ Lembrete: Reunião em 2h`;
      const corpoLembrete = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom, #fef3c7, #fde68a); border-radius: 10px;">
          <div style="background: linear-gradient(to right, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Lembrete de Reunião</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">
              Olá <strong>${nome_cliente}</strong>! 👋
            </p>
            
            <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">
              Este é um lembrete de que sua reunião está chegando!
            </p>
            
            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
              <h2 style="color: #92400e; margin-top: 0; font-size: 24px;">⏰ Em 2 horas</h2>
              <p style="margin: 10px 0; color: #78350f; font-size: 18px;"><strong>📅 ${dataFormatada}</strong></p>
              <p style="margin: 10px 0; color: #78350f; font-size: 18px;"><strong>🕐 ${horario}</strong></p>
            </div>
            
            ${calendarResponse.data.meetLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${calendarResponse.data.meetLink}" 
                   style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                  🎥 Entrar na Reunião Agora
                </a>
              </div>
            ` : ''}
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin-top: 20px;">
              <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                <strong>💡 Prepare-se:</strong> Teste seu microfone e câmera antes da reunião para garantir uma ótima experiência!
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Glória Vendas - Sistema de Agendamento<br>
                Este é um email automático, não responda.
              </p>
            </div>
          </div>
        </div>
      `;

      // Programa o lembrete
      await base44.asServiceRole.entities.DisparoEmail.create({
        agendamento_id: agendamento.id,
        email_destinatario: email_cliente,
        assunto: assuntoLembrete,
        corpo: corpoLembrete,
        tipo: 'Lembrete',
        status: 'Programado',
        data_programada: dataHoraLembrete.toISOString(),
        horas_antes: 2
      });

      console.log('✅ Email de lembrete programado!');
    } catch (error) {
      console.error('⚠️ Erro ao programar lembrete:', error);
    }

    console.log('✅ Agendamento criado com sucesso! Link:', calendarResponse.data.meetLink);

    return Response.json({
      success: true,
      message: 'Reunião agendada com sucesso!',
      agendamento: {
        id: agendamento.id,
        nome_cliente,
        email_cliente,
        data,
        horario,
        link_reuniao: calendarResponse.data.meetLink,
        status: 'Agendada',
        origem: 'Chatbot'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ ERRO:', error);
    return Response.json({ 
      error: 'Erro ao processar agendamento',
      message: error.message
    }, { status: 500 });
  } finally {
    console.log('=== END agendarviachatbot ===\n');
  }
});