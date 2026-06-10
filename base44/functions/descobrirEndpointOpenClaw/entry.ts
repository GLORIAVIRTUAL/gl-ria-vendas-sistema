import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const base = 'http://187.127.14.25:18089/v1';
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

    // 2) Testa chat/completions com diferentes formas de autenticação
    const payload = JSON.stringify({
      model: 'openclaw/default',
      messages: [{ role: 'user', content: 'Diga apenas OK' }]
    });

    const tentativas = [
      { nome: 'Bearer', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openclawKey}` } },
      { nome: 'Sem_Bearer', headers: { 'Content-Type': 'application/json', 'Authorization': openclawKey } },
      { nome: 'api-key', headers: { 'Content-Type': 'application/json', 'api-key': openclawKey } },
      { nome: 'x-api-key', headers: { 'Content-Type': 'application/json', 'x-api-key': openclawKey } }
    ];

    for (const t of tentativas) {
      try {
        const inicio = Date.now();
        const r = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers: t.headers,
          body: payload,
          signal: AbortSignal.timeout(60000)
        });
        const txt = await r.text();
        out[t.nome] = {
          status: r.status,
          tempo_segundos: Math.round((Date.now() - inicio) / 1000),
          body: txt.slice(0, 800)
        };
      } catch (e) {
        out[t.nome] = { erro: e.message };
      }
    }

    // Mostra detalhes da chave para diagnóstico (tamanho e se tem espaços)
    const rawKey = Deno.env.get('OPENCLAW_API_KEY') || '';
    out._diagnostico_chave = {
      tamanho: rawKey.length,
      tamanho_apos_trim: openclawKey.length,
      tem_espaco_ou_quebra: rawKey !== openclawKey,
      primeiros_6: openclawKey.slice(0, 6),
      ultimos_4: openclawKey.slice(-4)
    };

    return Response.json({ base, resultados: out });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});