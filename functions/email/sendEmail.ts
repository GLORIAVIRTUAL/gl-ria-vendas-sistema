import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email_destinatario, assunto, corpo, agendamento_id } = await req.json();

    if (!email_destinatario || !assunto || !corpo) {
      return Response.json({ 
        error: 'Campos obrigatórios faltando',
        message: 'email_destinatario, assunto e corpo são obrigatórios'
      }, { status: 400 });
    }

    console.log('📧 Enviando email para:', email_destinatario);

    // Envia o email usando a integração Core.SendEmail
    const resultado = await base44.integrations.Core.SendEmail({
      from_name: 'Glória Vendas',
      to: email_destinatario,
      subject: assunto,
      body: corpo
    });

    console.log('✅ Email enviado com sucesso!');

    // Se tiver agendamento_id, cria registro no banco
    if (agendamento_id) {
      await base44.entities.DisparoEmail.create({
        agendamento_id,
        email_destinatario,
        assunto,
        corpo,
        tipo: 'Confirmacao',
        status: 'Enviado',
        data_envio: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      message: 'Email enviado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return Response.json({ 
      error: 'Erro ao enviar email',
      message: error.message
    }, { status: 500 });
  }
});