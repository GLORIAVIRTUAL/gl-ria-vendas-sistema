import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    // Valida que é um POST
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    
    // Valida se tem os dados necessários
    if (!body.emails || !Array.isArray(body.emails)) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log('📧 Recebidos', body.emails.length, 'emails novos do Google Apps Script');

    // Cria os registros de notificação no sistema
    const base44 = createClientFromRequest(req);

    // Salva cada email como uma notificação (evitando duplicatas)
    for (const email of body.emails) {
      // Verifica se já existe um email idêntico (mesmo assunto e remetente) criado recentemente
      const emailsExistentes = await base44.asServiceRole.entities.EmailNotificacao.filter({
        subject: email.subject || 'Sem assunto',
        from: email.from
      }, '-created_date', 1);

      // Se já existe um email igual criado nas últimas 2 horas, ignora
      if (emailsExistentes.length > 0) {
        const ultimoEmail = emailsExistentes[0];
        const diferencaHoras = (new Date() - new Date(ultimoEmail.created_date)) / (1000 * 60 * 60);

        if (diferencaHoras < 2) {
          console.log('📧 Email duplicado ignorado:', email.subject);
          continue; // Pula este email
        }
      }

      // Cria o novo email
      await base44.asServiceRole.entities.EmailNotificacao.create({
        subject: email.subject || 'Sem assunto',
        from: email.from,
        text: email.text || '',
        lido: false
      });

      console.log('✅ Email novo salvo:', email.subject);
    }

    return Response.json({ 
      success: true, 
      received: body.emails.length,
      message: 'Emails recebidos com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});