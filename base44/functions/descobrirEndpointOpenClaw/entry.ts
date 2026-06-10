import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let bodyIn = {};
    try { bodyIn = await req.json(); } catch { /* sem body */ }

    const base = (bodyIn.base || 'http://187.127.14.25:63766').replace(/\/+$/, '');
    const openclawKey = (Deno.env.get('OPENCLAW_API_KEY') || '').trim();

    // Caminhos candidatos comuns em gateways estilo OpenAI / chat
    const caminhos = [
      '/v1/chat/completions',
      '/v1/messages',
      '/v1/completions',
      '/api/chat',
      '/api/v1/chat',
      '/api/message',
      '/api/send',
      '/chat',
      '/message',
      '/v1/responses'
    ];

    // Payload estilo OpenAI (mais comum em gateways /v1)
    const payloadOpenAI = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'teste de conexão' }]
    };

    const resultados = [];

    for (const caminho of caminhos) {
      const url = base + caminho;
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openclawKey}`
          },
          body: JSON.stringify(payloadOpenAI),
          signal: AbortSignal.timeout(15000)
        });
        const txt = await r.text();
        const ehHtml = txt.trim().toLowerCase().startsWith('<!doctype') || txt.trim().toLowerCase().startsWith('<html');
        resultados.push({
          url,
          status: r.status,
          tipo: ehHtml ? 'HTML (interface web)' : 'JSON/Texto (possível API!)',
          amostra: txt.slice(0, 300)
        });
      } catch (e) {
        resultados.push({ url, status: 'erro', tipo: 'falha', amostra: e.message });
      }
    }

    return Response.json({
      base_testada: base,
      key: openclawKey ? `${openclawKey.slice(0, 8)}...` : 'VAZIA',
      dica: 'Procure os resultados com tipo "JSON/Texto" e status 200/400/401 - esse é provavelmente o endpoint de API correto.',
      resultados
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});