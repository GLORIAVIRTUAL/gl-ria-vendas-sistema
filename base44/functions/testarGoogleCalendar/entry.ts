import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    let clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');
    let refreshToken = Deno.env.get('GOOGLE_CALENDAR_REFRESH_TOKEN');

    const result = {
      success: false,
      checks: {
        clientId: {
          configured: !!clientId,
          valor_bruto: clientId || 'NAO CONFIGURADO',
          tem_prefixo: clientId ? clientId.includes('client_id=') : false
        },
        clientSecret: {
          configured: !!clientSecret,
          valor_bruto: clientSecret ? clientSecret.substring(0, 20) + '...' : 'NAO CONFIGURADO',
          tem_prefixo: clientSecret ? clientSecret.includes('client_secret=') : false
        },
        refreshToken: {
          configured: !!refreshToken,
          valor_bruto: refreshToken ? refreshToken.substring(0, 20) + '...' : 'NAO CONFIGURADO',
          tem_prefixo: refreshToken ? refreshToken.includes('refresh_token=') : false
        }
      }
    };

    if (!clientId || !clientSecret || !refreshToken) {
      result.message = 'ERRO: Faltam credenciais! Verifique as Environment Variables no Base44.';
      return Response.json(result, { status: 200 });
    }

    // 🔥 SANITIZAR: Remover prefixos
    clientId = clientId.replace('client_id=', '').trim();
    clientSecret = clientSecret.replace('client_secret=', '').trim();
    refreshToken = refreshToken.replace('refresh_token=', '').trim();

    result.checks.clientId.valor_limpo = clientId.substring(0, 20) + '...';
    result.checks.clientSecret.valor_limpo = clientSecret.substring(0, 10) + '...';
    result.checks.refreshToken.valor_limpo = refreshToken.substring(0, 10) + '...';

    // Testar o Refresh Token
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        result.success = true;
        result.message = 'SUCESSO! As credenciais estao corretas e funcionando.';
        result.accessToken = data.access_token.substring(0, 20) + '...';
      } else {
        result.message = 'ERRO ao trocar refresh token: ' + JSON.stringify(data);
      }
    } catch (error) {
      result.message = 'ERRO ao testar credenciais: ' + error.message;
    }

    return Response.json(result, { status: 200 });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});