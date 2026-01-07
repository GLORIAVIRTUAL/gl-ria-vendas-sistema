import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, contact_id, icon, data } = await req.json();

    if (!title || !body) {
      return Response.json({ error: 'title e body são obrigatórios' }, { status: 400 });
    }

    const FIREBASE_SERVICE_ACCOUNT_JSON = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');

    if (!FIREBASE_SERVICE_ACCOUNT_JSON || !FIREBASE_PROJECT_ID) {
      return Response.json({ error: 'Firebase não configurado' }, { status: 500 });
    }

    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);

    // Gera JWT para autenticação Firebase
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const signatureInput = `${headerB64}.${payloadB64}`;

    // Importa chave privada
    const privateKeyPem = serviceAccount.private_key
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(signatureInput)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const jwt = `${signatureInput}.${signatureB64}`;

    // Troca JWT por access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('Erro ao obter access token:', tokenData);
      return Response.json({ error: 'Erro na autenticação Firebase' }, { status: 500 });
    }

    // Busca tokens dos usuários (salvos em custom_fields do User)
    const users = await base44.asServiceRole.entities.User.list();
    const tokensToSend = [];

    for (const usr of users) {
      if (usr.custom_fields?.fcm_token) {
        tokensToSend.push(usr.custom_fields.fcm_token);
      }
    }

    if (tokensToSend.length === 0) {
      return Response.json({ success: true, message: 'Nenhum dispositivo registrado' });
    }

    // Envia notificação para todos os dispositivos
    const results = await Promise.all(
      tokensToSend.map(async (token) => {
        try {
          const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: {
                  token,
                  notification: { title, body, icon: icon || '/logo.png' },
                  data: data || {},
                  webpush: {
                    fcm_options: {
                      link: contact_id ? `https://app.base44.com/ChatIA?contact=${contact_id}` : undefined
                    }
                  }
                }
              })
            }
          );

          const result = await response.json();
          return { success: response.ok, result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })
    );

    return Response.json({ 
      success: true, 
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error('Erro ao enviar push notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});