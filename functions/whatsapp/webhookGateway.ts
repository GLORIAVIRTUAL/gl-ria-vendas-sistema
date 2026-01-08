import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Mapeamento: phone_number_id → webhook URL do sistema Base44
const ROUTING_MAP = {
  // Exemplo:
  // '123456789': 'https://agenda-gloria-766ae684.base44.app/api/functions/whatsapp/webhookMeta',
  // '987654321': 'https://outro-sistema.base44.app/api/functions/whatsapp/webhookMeta',
};

// Carrega mapeamento de variável de ambiente (formato JSON)
function loadRoutingMap() {
  const envMap = Deno.env.get('WHATSAPP_ROUTING_MAP');
  if (envMap) {
    try {
      return JSON.parse(envMap);
    } catch (e) {
      console.error('❌ Erro ao parsear WHATSAPP_ROUTING_MAP:', e);
    }
  }
  return ROUTING_MAP;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Webhook verification do Meta (GET request)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const VERIFY_TOKEN = Deno.env.get('GATEWAY_VERIFY_TOKEN') || 'gateway_token_2025';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Gateway webhook verificado pelo Meta');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('❌ Token de verificação inválido');
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Receber mensagens (POST request)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('📩 Gateway recebeu webhook:', JSON.stringify(body, null, 2));

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      // Identifica o número que recebeu a mensagem
      const phoneNumberId = value?.metadata?.phone_number_id;
      
      if (!phoneNumberId) {
        console.log('⚠️ phone_number_id não encontrado no payload');
        return Response.json({ success: true }); // Retorna 200 para não ficar reenviando
      }

      console.log('📱 Número identificado:', phoneNumberId);

      // Carrega mapeamento
      const routingMap = loadRoutingMap();
      const targetUrl = routingMap[phoneNumberId];

      if (!targetUrl) {
        console.error(`❌ Nenhum sistema mapeado para phone_number_id: ${phoneNumberId}`);
        console.log('📋 Mapeamento disponível:', routingMap);
        return Response.json({ 
          error: 'No route configured for this phone number',
          phone_number_id: phoneNumberId 
        }, { status: 404 });
      }

      console.log(`🎯 Roteando para: ${targetUrl}`);

      // Encaminha webhook para sistema correto
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const responseText = await response.text();
      console.log(`✅ Resposta do sistema (${response.status}):`, responseText);

      // Retorna a resposta do sistema de destino
      return new Response(responseText, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ Erro no gateway:', error);
      return Response.json({ 
        error: error.message,
        gateway: 'webhook-gateway' 
      }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
});