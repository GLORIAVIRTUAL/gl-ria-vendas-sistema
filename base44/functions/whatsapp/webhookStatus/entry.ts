import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    // ZAPI envia webhooks via POST
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    console.log('📩 Webhook de status do ZAPI:', JSON.stringify(body, null, 2));

    const base44 = createClientFromRequest(req);

    // Estrutura do webhook ZAPI para status de mensagem:
    // {
    //   "messageId": "3EB0...",
    //   "phone": "5511999999999",
    //   "status": "SENT" | "RECEIVED" | "READ" | "DELETED" | "FAILED" | "PLAYED",
    //   "momment": 1234567890,
    //   ...
    // }

    const { messageId, phone, status } = body;

    if (!messageId && !phone) {
      console.log('⚠️ Webhook sem messageId ou phone, ignorando...');
      return Response.json({ success: true, message: 'Webhook ignorado' });
    }

    // Mapeia status do ZAPI para os tracinhos do chat
    let novoStatus = null;
    switch (status?.toUpperCase()) {
      case 'SENT':
        novoStatus = 'sent';        // 1 traço
        break;
      case 'RECEIVED':
        novoStatus = 'delivered';   // 2 traços
        break;
      case 'READ':
      case 'PLAYED':
        novoStatus = 'read';        // 2 traços azuis
        break;
      case 'FAILED':
      case 'DELETED':
        novoStatus = 'failed';
        break;
    }

    if (!novoStatus) {
      console.log(`⚠️ Status "${status}" não mapeado, ignorando`);
      return Response.json({ success: true });
    }

    // 1) Atualiza a Message do chat pelo whatsapp_message_id
    if (messageId) {
      const mensagens = await base44.asServiceRole.entities.Message.filter({
        whatsapp_message_id: messageId
      });

      if (mensagens.length > 0) {
        await base44.asServiceRole.entities.Message.update(mensagens[0].id, {
          status: novoStatus
        });
        console.log(`✅ Message ${mensagens[0].id} atualizada para: ${novoStatus}`);
      } else {
        console.log(`⚠️ Nenhuma Message encontrada para messageId ${messageId}`);
      }
    }

    // 2) Mantém compatibilidade: atualiza DisparoWhatsApp pelo telefone
    if (phone) {
      const disparos = await base44.asServiceRole.entities.DisparoWhatsApp.filter({
        telefone: phone
      });

      if (disparos.length > 0) {
        const disparo = disparos[disparos.length - 1];
        let disparoStatus = disparo.status;
        let erroMensagem = disparo.erro_mensagem;

        if (novoStatus === 'failed') {
          disparoStatus = 'Erro';
          erroMensagem = `Status ZAPI: ${status}`;
        } else {
          disparoStatus = 'Enviado';
          erroMensagem = null;
        }

        await base44.asServiceRole.entities.DisparoWhatsApp.update(disparo.id, {
          status: disparoStatus,
          erro_mensagem: erroMensagem,
          data_envio: disparoStatus === 'Enviado' ? new Date().toISOString() : disparo.data_envio
        });
      }
    }

    return Response.json({ success: true, novo_status: novoStatus });

  } catch (error) {
    console.error('❌ Erro no webhook de status:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});