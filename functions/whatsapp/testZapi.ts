
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me(); // Valida auth

    const clientToken = Deno.env.get('CLIENT_TOKEN')?.trim();
    const instanceToken = Deno.env.get('TOKEN_DA_INSTANCIA')?.trim();
    const instanceId = Deno.env.get('IA_DA_INSTANCIA')?.trim(); // 🔥 IA em vez de ID

    const urlParaTeste = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;

    console.log('\n=== TESTE ZAPI ===');
    console.log('Client Token:', clientToken);
    console.log('Instance Token:', instanceToken);
    console.log('Instance ID:', instanceId);
    console.log('URL completa:', urlParaTeste);

    const payload = {
      phone: "5587988020504",
      message: "Teste direto da função"
    };

    console.log('Payload:', JSON.stringify(payload));

    const response = await fetch(urlParaTeste, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken  // 🔥 HEADER
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    console.log('Status:', response.status);
    console.log('Response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    return Response.json({
      debug: {
        clientToken: clientToken,
        instanceToken: instanceToken,
        instanceId: instanceId,
        url: urlParaTeste,
        payload: payload
      },
      response: {
        status: response.status,
        data: responseData
      }
    });

  } catch (error) {
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});
