import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import nodemailer from 'npm:nodemailer@6.9.16';

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

    const gmailEmail = (Deno.env.get('GMAIL_EMAIL') || '').trim();
    const gmailPassword = (Deno.env.get('GMAIL_APP_PASSWORD') || '').trim();
    if (!gmailEmail || !gmailPassword) {
      return Response.json({ error: 'Gmail não configurado' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailEmail, pass: gmailPassword }
    });

    await transporter.sendMail({
      from: `Glória Vendas <${gmailEmail}>`,
      to: email_destinatario,
      subject: assunto,
      html: corpo,
      text: corpo.replace(/<[^>]*>/g, '')
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