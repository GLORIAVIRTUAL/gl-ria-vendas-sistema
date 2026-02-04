import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, template_name, language = 'pt_BR', parameters = [] } = await req.json();

    if (!phone || !template_name) {
      return Response.json({ 
        error: 'Missing required fields: phone, template_name' 
      }, { status: 400 });
    }

    const PHONE_NUMBER_ID = (Deno.env.get('META_PHONE_NUMBER_ID') || '').trim();
    const ACCESS_TOKEN = (Deno.env.get('META_ACCESS_TOKEN') || '').trim();

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return Response.json({ 
        error: 'Meta credentials not configured' 
      }, { status: 500 });
    }

    // Monta payload para API Meta
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: template_name,
        language: {
          code: language
        }
      }
    };

    // Adiciona parâmetros apenas se existirem
    if (parameters && parameters.length > 0) {
      payload.template.components = [
        {
          type: 'body',
          parameters: parameters.map(p => ({
            type: 'text',
            text: String(p)
          }))
        }
      ];
    }

    console.log('📤 Enviando template:', template_name, 'para', phone);

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro Meta:', error);
      return Response.json({ 
        error: 'Failed to send template message',
        details: error
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Template enviado. Message ID:', result.messages[0].id);

    // Salva no banco
    await base44.entities.Message.create({
      contact_id: null,
      direction: 'outbound',
      sender: 'human',
      content: `Template enviado: ${template_name}`,
      type: 'text',
      status: 'sent',
      extracted_data: { 
        template_name,
        message_id: result.messages[0].id
      }
    }).catch(() => {});

    return Response.json({
      success: true,
      message_id: result.messages[0].id
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});