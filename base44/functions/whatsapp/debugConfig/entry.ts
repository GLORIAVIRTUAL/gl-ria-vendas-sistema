
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Tenta autenticar, mas não falha se não conseguir (para debug)
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      console.log('Sem autenticação, mas continuando para debug');
    }

    const clientToken = Deno.env.get('CLIENT_TOKEN');
    const tokenDaInstancia = Deno.env.get('TOKEN_DA_INSTANCIA');
    const iaDaInstancia = Deno.env.get('IA_DA_INSTANCIA');  // 🔥 IA em vez de ID
    const apiDaInstancia = Deno.env.get('API_DA_INSTANCIA');

    const config = {
      CLIENT_TOKEN: {
        configurado: !!clientToken,
        valor_parcial: clientToken ? `${clientToken.substring(0, 8)}...` : 'NÃO CONFIGURADO',
        tamanho: clientToken ? clientToken.length : 0,
        nota: '✅ Este é usado no código (header)'
      },
      TOKEN_DA_INSTANCIA: {
        configurado: !!tokenDaInstancia,
        valor_parcial: tokenDaInstancia ? `${tokenDaInstancia.substring(0, 8)}...` : 'NÃO CONFIGURADO',
        tamanho: tokenDaInstancia ? tokenDaInstancia.length : 0,
        nota: '✅ Este é usado no código (na URL)'
      },
      IA_DA_INSTANCIA: {
        configurado: !!iaDaInstancia,
        valor_parcial: iaDaInstancia ? `${iaDaInstancia.substring(0, 8)}...` : 'NÃO CONFIGURADO',
        tamanho: iaDaInstancia ? iaDaInstancia.length : 0,
        nota: '✅ Este é usado no código (Instance ID)'
      },
      API_DA_INSTANCIA: {
        configurado: !!apiDaInstancia,
        valor_parcial: apiDaInstancia ? `${apiDaInstancia.substring(0, 30)}...` : 'NÃO CONFIGURADO',
        tamanho: apiDaInstancia ? apiDaInstancia.length : 0,
        nota: 'Este NÃO é usado no código'
      },
      url_que_sera_montada: iaDaInstancia && tokenDaInstancia 
        ? `https://api.z-api.io/instances/${iaDaInstancia}/token/${tokenDaInstancia}/send-text`
        : 'IMPOSSÍVEL MONTAR - FALTAM VARIÁVEIS'
    };

    return Response.json({
      success: true,
      user_autenticado: !!user,
      timestamp: new Date().toISOString(),
      config
    });

  } catch (error) {
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});
