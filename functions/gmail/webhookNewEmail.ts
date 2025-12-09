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

    // Salva cada email como uma notificação
    for (const email of body.emails) {
      await base44.asServiceRole.entities.EmailNotificacao.create({
        subject: email.subject || 'Sem assunto',
        from: email.from,
        text: email.text || '',
        lido: false
      });
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