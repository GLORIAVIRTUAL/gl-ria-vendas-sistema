import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const base = 'http://187.127.14.25:63766/v1';
    const openclawKey = (Deno.env.get('OPENCLAW_API_KEY') || '').trim();

    const out = {};

    // 1) Lista modelos disponíveis
    try {
      const r = await fetch(`${base}/models`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${openclawKey}` },
        signal: AbortSignal.timeout(15000)
      });
      out.models = { status: r.status, body: (await r.text()).slice(0, 1000) };
    } catch (e) {
      out.models = { erro: e.message };
    }

    // 2) Testa chat/completions com Accept json + stream:false + modelos recomendados
    for (const modelo of ['openclaw/default', 'openclaw/main']) {
      try {
        const inicio = Date.now();
        const r = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${openclawKey}`
          },
          body: JSON.stringify({
            model: modelo,
            stream: false,
            messages: [{ role: 'user', content: 'Diga apenas: OK' }]
          }),
          signal: AbortSignal.timeout(50000)
        });
        const txt = await r.text();
        const ehHtml = txt.trim().toLowerCase().startsWith('<!doctype');
        out[`chat_${modelo}`] = {
          status: r.status,
          tempo_segundos: Math.round((Date.now() - inicio) / 1000),
          tipo: ehHtml ? 'HTML (errado)' : 'JSON/Texto (certo!)',
          body: txt.slice(0, 1200)
        };
      } catch (e) {
        out[`chat_${modelo}`] = { erro: e.message };
      }
    }

    return Response.json({ base, key: openclawKey ? `${openclawKey.slice(0,8)}...` : 'VAZIA', resultados: out });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});