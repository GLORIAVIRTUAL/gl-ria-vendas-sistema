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

    // Monta a URL no MESMO formato que o zapiWebhook usa (OpenAI /v1/chat/completions)
    let chatUrl = openclawUrl;
    if (!chatUrl.includes('/chat/completions')) {
      chatUrl = chatUrl.replace(/\/+$/, '');
      if (chatUrl.endsWith('/v1')) chatUrl += '/chat/completions';
      else chatUrl += '/v1/chat/completions';
    }
    diagnostico.url_chat_completions = chatUrl;

    // Simula EXATAMENTE uma mensagem do Tiago Carvalho (mesmo formato do webhook real)
    const payload = {
      model: 'openclaw/default',
      messages: [
        { role: 'user', content: 'olá gloria estou querendo fazer algumas modificação no meu sistema da embaixada' }
      ]
    };

    console.log('🦅 Chamando OpenClaw em:', chatUrl);

    let status, rawText, parsed = null;
    try {
      const ocResponse = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openclawKey}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000)
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
      ? (parsed.choices?.[0]?.message?.content || parsed.reply || parsed.response || parsed.message || parsed.text || '')
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