import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { enviarWhatsApp } from '../../shared/envio.ts';

const TELEFONE_ALERTA = '5587988020504';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    console.log('📡 Webhook de desconexão Z-API:', JSON.stringify(body, null, 2));

    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Recife' });

    const mensagem = [
      '🚨 *ALERTA DE DESCONEXÃO* 🚨',
      '',
      'A instância do WhatsApp (Z-API) foi desconectada!',
      '',
      `🕒 Data/Hora: ${agora}`,
      `📋 Evento: ${body?.event || body?.type || 'disconnected'}`,
      body?.instance?.name ? `📱 Instância: ${body.instance.name}` : '',
      body?.instance?.id ? `🆔 ID: ${body.instance.id}` : '',
      '',
      '⚠️ Acesse o painel da Z-API para reconectar o QR Code.'
    ].filter(Boolean).join('\n');

    try {
      await enviarWhatsApp({ telefone: TELEFONE_ALERTA, mensagem });
      console.log('✅ Alerta de desconexão enviado para', TELEFONE_ALERTA);
    } catch (err) {
      console.error('❌ Falha ao enviar alerta WhatsApp:', err.message);
    }

    return Response.json({ success: true, message: 'Alerta de desconexão processado' });
  } catch (error) {
    console.error('❌ Erro no webhook de desconexão:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});