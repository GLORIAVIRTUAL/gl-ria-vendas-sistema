import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Valida autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, message } = await req.json();
    
    if (!phone || !message) {
      return Response.json({ error: 'Phone and message are required' }, { status: 400 });
    }

    const PHONE_NUMBER_ID = Deno.env.get('META_PHONE_NUMBER_ID');
    const ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      console.error('❌ Meta credentials not configured');
      return Response.json({ 
        error: 'WhatsApp not configured' 
      }, { status: 500 });
    }

    // Formata telefone (remove caracteres especiais)
    const phoneFormatted = phone.replace(/\D/g, '');
    
    console.log('📤 Enviando mensagem para:', phoneFormatted);

    // Envia via Meta WhatsApp API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneFormatted,
          type: 'text',
          text: { body: message }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Meta API error:', errorText);
      return Response.json({ 
        error: 'Failed to send message',
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Mensagem enviada:', result);

    return Response.json({ 
      success: true,
      messageId: result.messages?.[0]?.id 
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});