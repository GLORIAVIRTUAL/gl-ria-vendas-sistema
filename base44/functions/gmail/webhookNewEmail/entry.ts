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
      // Cria um identificador único para o email (hash do subject + from + primeiras 100 chars do texto)
      const emailId = `${email.subject || 'sem_assunto'}_${email.from}_${(email.text || '').substring(0, 100)}`;

      // Verifica se já existe um email idêntico nos últimos 30 dias
      const todosEmails = await base44.asServiceRole.entities.EmailNotificacao.list('-created_date', 1000);

      const emailDuplicado = todosEmails.find(e => {
        const existingId = `${e.subject || 'sem_assunto'}_${e.from}_${(e.text || '').substring(0, 100)}`;
        return existingId === emailId;
      });

      if (emailDuplicado) {
        console.log('📧 Email duplicado ignorado:', email.subject);
        continue;
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