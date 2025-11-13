import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agendamento_id, horas_antes, tipo } = await req.json();

    if (!agendamento_id || horas_antes === undefined || horas_antes === null) {
      return Response.json({ 
        error: 'Campos obrigatórios faltando',
        message: 'agendamento_id e horas_antes são obrigatórios'
      }, { status: 400 });
    }

    if (!tipo) {
      return Response.json({ 
        error: 'Tipo obrigatório',
        message: 'tipo deve ser Confirmacao ou Lembrete'
      }, { status: 400 });
    }

    // Busca o agendamento
    const agendamentos = await base44.entities.Agendamento.filter({ id: agendamento_id });
    if (!agendamentos || agendamentos.length === 0) {
      return Response.json({ 
        error: 'Agendamento não encontrado'
      }, { status: 404 });
    }

    const agendamento = agendamentos[0];

    // Calcula horário do disparo
    const dataHoraReuniao = new Date(`${agendamento.data}T${agendamento.horario}`);
    const dataHoraDisparo = new Date(dataHoraReuniao.getTime() - (horas_antes * 60 * 60 * 1000));

    // Monta o assunto e corpo do email
    const produtoNomes = {
      'Atendimento_IA_24_7': 'Atendimento IA 24/7',
      'Maquina_de_Videos': 'Máquina de Vídeos',
      'Gloria_Clinica': 'Glória Clínica',
      'Gloria_Vendas': 'Glória Vendas',
      'Especialistas_Virtuais': 'Especialistas Virtuais',
      'Sites_em_24_Horas': 'Sites em 24 Horas'
    };

    const produtoNome = produtoNomes[agendamento.produto] || agendamento.produto;
    const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });

    let assunto, corpo;

    if (tipo === 'Confirmacao') {
      assunto = `✅ Reunião Confirmada - ${produtoNome}`;
      corpo = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom, #f8fafc, #e0e7ff); border-radius: 10px;">
          <div style="background: linear-gradient(to right, #3b82f6, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Reunião Confirmada!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">
              Olá <strong>${agendamento.nome_cliente}</strong>! 👋
            </p>
            
            <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">
              Sua reunião foi confirmada com sucesso! Estamos ansiosos para conversar com você sobre <strong>${produtoNome}</strong>.
            </p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">📋 Detalhes da Reunião</h2>
              <p style="margin: 10px 0; color: #334155;"><strong>📅 Data:</strong> ${dataFormatada}</p>
              <p style="margin: 10px 0; color: #334155;"><strong>⏰ Horário:</strong> ${agendamento.horario}</p>
              <p style="margin: 10px 0; color: #334155;"><strong>📦 Produto:</strong> ${produtoNome}</p>
            </div>
            
            ${agendamento.link_reuniao ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${agendamento.link_reuniao}" 
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
    } else {
      assunto = `⏰ Lembrete: Reunião em ${horas_antes}h - ${produtoNome}`;
      corpo = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom, #fef3c7, #fde68a); border-radius: 10px;">
          <div style="background: linear-gradient(to right, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Lembrete de Reunião</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">
              Olá <strong>${agendamento.nome_cliente}</strong>! 👋
            </p>
            
            <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">
              Este é um lembrete de que sua reunião sobre <strong>${produtoNome}</strong> está chegando!
            </p>
            
            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
              <h2 style="color: #92400e; margin-top: 0; font-size: 24px;">⏰ Em ${horas_antes} hora${horas_antes > 1 ? 's' : ''}</h2>
              <p style="margin: 10px 0; color: #78350f; font-size: 18px;"><strong>📅 ${dataFormatada}</strong></p>
              <p style="margin: 10px 0; color: #78350f; font-size: 18px;"><strong>🕐 ${agendamento.horario}</strong></p>
            </div>
            
            ${agendamento.link_reuniao ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${agendamento.link_reuniao}" 
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
    }

    // 🔥 SE FOR CONFIRMAÇÃO (horas_antes = 0), ENVIA IMEDIATAMENTE
    if (horas_antes === 0 && tipo === 'Confirmacao') {
      console.log('📧 Enviando email de confirmação IMEDIATAMENTE...');
      
      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Glória Vendas',
          to: agendamento.email_cliente,
          subject: assunto,
          body: corpo
        });

        // Registra como enviado
        const disparo = await base44.entities.DisparoEmail.create({
          agendamento_id: agendamento.id,
          email_destinatario: agendamento.email_cliente,
          assunto,
          corpo,
          tipo: 'Confirmacao',
          status: 'Enviado',
          data_envio: new Date().toISOString()
        });

        return Response.json({
          success: true,
          message: 'Email de confirmação enviado imediatamente',
          disparo_id: disparo.id,
          enviado_em: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        throw error;
      }
    }

    // 🔥 SENÃO, PROGRAMA PARA O FUTURO
    const disparo = await base44.entities.DisparoEmail.create({
      agendamento_id: agendamento.id,
      email_destinatario: agendamento.email_cliente,
      assunto,
      corpo,
      tipo,
      status: 'Programado',
      data_programada: dataHoraDisparo.toISOString(),
      horas_antes: horas_antes
    });

    return Response.json({
      success: true,
      message: 'Email programado com sucesso',
      disparo_id: disparo.id,
      data_disparo: dataHoraDisparo.toISOString()
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: 'Erro interno',
      message: error.message
    }, { status: 500 });
  }
});