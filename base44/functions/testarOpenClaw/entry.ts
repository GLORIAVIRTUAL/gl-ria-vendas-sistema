import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Permite testar uma URL específica via payload (override) ou usa a secret
    let bodyIn = {};
    try { bodyIn = await req.json(); } catch { /* sem body */ }

    const openclawUrl = (bodyIn.url || Deno.env.get('OPENCLAW_API_URL') || '').trim();
    const openclawKey = (Deno.env.get('OPENCLAW_API_KEY') || '').trim();

    const diagnostico = {
      url_testada: openclawUrl || 'VAZIA',
      key_configurada: openclawKey ? `${openclawKey.slice(0, 8)}...` : 'VAZIA',
    };

    if (!openclawUrl || !openclawKey) {
      return Response.json({
        ok: false,
        motivo: 'Credenciais OpenClaw faltando (OPENCLAW_API_URL ou OPENCLAW_API_KEY)',
        diagnostico
      });
    }

    const payload = {
      phone: '5587988020504',
      name: 'Teste Diagnóstico',
      message: 'Olá, isso é um teste de conexão do sistema.',
      history: [
        { role: 'user', content: 'Olá, isso é um teste de conexão do sistema.' }
      ]
    };

    console.log('🦅 Chamando OpenClaw em:', openclawUrl);

    let status, rawText, parsed = null;
    try {
      const ocResponse = await fetch(openclawUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openclawKey}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000)
      });

      status = ocResponse.status;
      rawText = await ocResponse.text();
      try { parsed = JSON.parse(rawText); } catch { /* não é JSON */ }

      console.log('🦅 Status OpenClaw:', status);
      console.log('🦅 Resposta OpenClaw:', rawText);
    } catch (fetchErr) {
      return Response.json({
        ok: false,
        motivo: 'Falha de rede ao chamar a URL do OpenClaw',
        erro: fetchErr.message,
        diagnostico
      });
    }

    const reply = parsed
      ? (parsed.reply || parsed.response || parsed.message || parsed.text || '')
      : '';

    return Response.json({
      ok: status >= 200 && status < 300,
      diagnostico,
      http_status: status,
      resposta_bruta: rawText?.slice(0, 1500),
      texto_extraido: reply || '(nenhum campo reply/response/message/text encontrado)',
      payload_enviado: payload
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});