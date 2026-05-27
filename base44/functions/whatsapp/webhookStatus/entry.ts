import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    // ZAPI envia webhooks via POST
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    console.log('📩 Webhook recebido do ZAPI:', JSON.stringify(body, null, 2));

    const base44 = createClientFromRequest(req);

    // Estrutura do webhook ZAPI para status de mensagem:
    // {
    //   "messageId": "3EB0...",
    //   "phone": "5511999999999",
    //   "status": "SENT" | "RECEIVED" | "READ" | "DELETED" | "FAILED",
    //   "momment": 1234567890,
    //   ...
    // }

    const { messageId, phone, status, momment } = body;

    if (!messageId || !phone) {
      console.log('⚠️ Webhook sem messageId ou phone, ignorando...');
      return Response.json({ success: true, message: 'Webhook ignorado' });
    }

    // Busca o disparo pelo telefone
    const disparos = await base44.asServiceRole.entities.DisparoWhatsApp.filter({
      telefone: phone
    });

    if (disparos.length === 0) {
      console.log(`⚠️ Nenhum disparo encontrado para o telefone ${phone}`);
      return Response.json({ success: true, message: 'Disparo não encontrado' });
    }

    // Pega o último disparo para este telefone
    const disparo = disparos[disparos.length - 1];

    // Mapeia status do ZAPI para nosso sistema
    let novoStatus = disparo.status;
    let erroMensagem = disparo.erro_mensagem;

    switch (status?.toUpperCase()) {
      case 'SENT':
      case 'RECEIVED':
      case 'READ':
        novoStatus = 'Enviado';
        erroMensagem = null;
        break;
      case 'FAILED':
      case 'DELETED':
        novoStatus = 'Erro';
        erroMensagem = `Status ZAPI: ${status}`;
        break;
    }

    // Atualiza o disparo
    await base44.asServiceRole.entities.DisparoWhatsApp.update(disparo.id, {
      status: novoStatus,
      erro_mensagem: erroMensagem,
      data_envio: novoStatus === 'Enviado' ? new Date().toISOString() : disparo.data_envio
    });

    console.log(`✅ Status atualizado para disparo ${disparo.id}: ${novoStatus}`);

    return Response.json({
      success: true,
      message: 'Status atualizado com sucesso',
      disparo_id: disparo.id,
      novo_status: novoStatus
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});