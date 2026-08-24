import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const normalizar = (t) => (t || '').trim().toLowerCase().replace(/\s+/g, ' ');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const sr = base44.asServiceRole;

    // Coleta objeções registradas nos prospects
    const prospects = await sr.entities.Prospect.list('-created_date', 500);
    const contagem = {};
    prospects.forEach((p) => {
      (p.objecoes || []).forEach((o) => {
        const chave = normalizar(o);
        if (chave.length < 4) return;
        if (!contagem[chave]) contagem[chave] = { frase: o, exemplos: [], total: 0 };
        contagem[chave].total += 1;
        if (contagem[chave].exemplos.length < 5) contagem[chave].exemplos.push(o);
      });
    });

    const objecoes = Object.values(contagem).sort((a, b) => b.total - a.total).slice(0, 25);

    if (objecoes.length === 0) {
      return Response.json({ criados: 0, atualizados: 0, mensagem: 'Nenhuma objeção registrada nos prospects ainda.' });
    }

    const analise = await sr.integrations.Core.InvokeLLM({
      prompt: `Você é o head comercial da Glória Vendas, empresa brasileira que vende soluções de IA para atendimento, vídeos, sites e sistemas de vendas.

Abaixo estão objeções reais registradas em conversas com prospects. Para cada objeção, produza:
- categoria: Preco, Timing, Autoridade, Necessidade, Confianca, Concorrencia, Tecnica ou Outro
- resposta_sugerida: resposta curta (até 3 frases), consultiva, em português do Brasil, pronta para enviar por WhatsApp
- pergunta_de_virada: uma pergunta que retoma o controle da conversa
- prova_recomendada: qual prova, case, número ou demonstração usar

Objeções:
${objecoes.map((o, i) => `${i + 1}. "${o.frase}" (aparece ${o.total}x)`).join('\n')}`,
      response_json_schema: {
        type: 'object',
        properties: {
          itens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                objecao: { type: 'string' },
                categoria: { type: 'string' },
                resposta_sugerida: { type: 'string' },
                pergunta_de_virada: { type: 'string' },
                prova_recomendada: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const categoriasValidas = ['Preco', 'Timing', 'Autoridade', 'Necessidade', 'Confianca', 'Concorrencia', 'Tecnica', 'Outro'];
    const existentes = await sr.entities.ObjecaoPlaybook.list('-created_date', 500);
    const agora = new Date().toISOString();

    let criados = 0;
    let atualizados = 0;

    for (let i = 0; i < objecoes.length; i++) {
      const origem = objecoes[i];
      const gerado = (analise.itens || [])[i] || {};
      const dados = {
        objecao: gerado.objecao || origem.frase,
        categoria: categoriasValidas.includes(gerado.categoria) ? gerado.categoria : 'Outro',
        frequencia: origem.total,
        exemplos: origem.exemplos,
        resposta_sugerida: gerado.resposta_sugerida || '',
        pergunta_de_virada: gerado.pergunta_de_virada || '',
        prova_recomendada: gerado.prova_recomendada || '',
        gerado_em: agora
      };

      const jaExiste = existentes.find((e) => normalizar(e.objecao) === normalizar(dados.objecao));
      if (jaExiste) {
        await sr.entities.ObjecaoPlaybook.update(jaExiste.id, dados);
        atualizados += 1;
      } else {
        await sr.entities.ObjecaoPlaybook.create(dados);
        criados += 1;
      }
    }

    return Response.json({ criados, atualizados, analisadas: objecoes.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}