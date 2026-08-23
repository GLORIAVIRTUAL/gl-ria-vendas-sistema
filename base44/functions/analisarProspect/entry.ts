import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const PRODUTOS = [
  'Atendimento IA 24/7',
  'Máquina de Vídeos',
  'Glória Clínica',
  'Glória Vendas',
  'Especialistas Virtuais',
  'Sites em 24 Horas'
];

const SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'number' },
    score_faixa: { type: 'string', enum: ['Frio', 'Morno', 'Quente'] },
    analise_resumo: { type: 'string' },
    pontos_fortes: { type: 'array', items: { type: 'string' } },
    riscos: { type: 'array', items: { type: 'string' } },
    produtos_sugeridos: { type: 'array', items: { type: 'string' } },
    abordagem_sugerida: { type: 'string' }
  },
  required: ['score', 'score_faixa', 'analise_resumo', 'pontos_fortes', 'riscos', 'produtos_sugeridos', 'abordagem_sugerida'],
  additionalProperties: false
};

const resumirProspect = (prospect) => ({
  razao_social: prospect.razao_social,
  nome_fantasia: prospect.nome_fantasia,
  cnpj: prospect.cnpj,
  situacao_cadastral: prospect.situacao_cadastral,
  segmento: prospect.segmento,
  ramo_atividade: prospect.ramo_atividade,
  cnae: prospect.cnae,
  porte: prospect.porte,
  faturamento: prospect.faturamento,
  faixa_funcionarios: prospect.faixa_funcionarios,
  capital_social: prospect.capital_social,
  municipio: prospect.municipio,
  uf: prospect.uf,
  canais: {
    email: Boolean(prospect.email),
    telefone: Boolean(prospect.telefone),
    whatsapp: Boolean(prospect.whatsapp),
    site: Boolean(prospect.site),
    linkedin: Boolean(prospect.linkedin),
    instagram: Boolean(prospect.instagram)
  }
});

const resumirIcp = (icp) => icp && ({
  nome: icp.nome,
  descricao: icp.descricao,
  segmento: icp.segmento,
  subsegmentos: icp.subsegmentos,
  palavras_chave: icp.palavras_chave,
  produtos_recomendados: icp.produtos_recomendados,
  peso_comercial: icp.peso_comercial,
  observacoes_ia: icp.observacoes_ia
});

const analisarComIA = async (prospect, icp) => {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');

  const prompt = [
    'Você é analista comercial da Glória Vendas, empresa que vende soluções de IA e automação para negócios.',
    `Produtos disponíveis: ${PRODUTOS.join(', ')}.`,
    'Analise a empresa abaixo como potencial cliente e atribua um lead score de 0 a 100.',
    'Considere aderência ao ICP, porte, faturamento, número de funcionários, situação cadastral, canais de contato disponíveis e potencial de uso dos produtos.',
    'Faixas: 0-39 Frio, 40-69 Morno, 70-100 Quente.',
    'Em produtos_sugeridos use somente nomes da lista de produtos disponíveis.',
    'Responda em português do Brasil, de forma objetiva e comercial.',
    '',
    `Empresa: ${JSON.stringify(resumirProspect(prospect))}`,
    icp ? `Perfil ideal de cliente (ICP) de origem: ${JSON.stringify(resumirIcp(icp))}` : 'Sem ICP de origem definido.'
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'analise_prospect', schema: SCHEMA, strict: true }
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || 'Falha ao consultar a OpenAI');

  const analise = JSON.parse(payload.choices[0].message.content);
  const score = Math.max(0, Math.min(100, Math.round(Number(analise.score) || 0)));
  return {
    score,
    score_faixa: analise.score_faixa,
    analise_resumo: analise.analise_resumo,
    pontos_fortes: analise.pontos_fortes || [],
    riscos: analise.riscos || [],
    produtos_sugeridos: analise.produtos_sugeridos || [],
    abordagem_sugerida: analise.abordagem_sugerida,
    analisado_em: new Date().toISOString()
  };
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_erroAuth) {
      user = null;
    }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const db = base44.asServiceRole;
    let payload = {};
    try {
      payload = await req.json();
    } catch (_erroPayload) {
      payload = {};
    }

    let prospects = [];
    if (payload.prospect_id) {
      const prospect = await db.entities.Prospect.get(payload.prospect_id);
      if (!prospect) return Response.json({ error: 'Prospect não encontrado' }, { status: 404 });
      prospects = [prospect];
    } else {
      const limite = Math.min(Number(payload.limite) || 10, 25);
      const todos = await db.entities.Prospect.list('-created_date', 200);
      prospects = todos.filter((item) => !item.analisado_em).slice(0, limite);
    }

    if (!prospects.length) {
      return Response.json({ success: true, analisados: 0, resultados: [], mensagem: 'Nenhum prospect pendente de análise' });
    }

    const icpsCache = new Map();
    const resultados = [];

    for (const prospect of prospects) {
      try {
        let icp = null;
        if (prospect.icp_id) {
          if (!icpsCache.has(prospect.icp_id)) {
            icpsCache.set(prospect.icp_id, await db.entities.ICP.get(prospect.icp_id).catch(() => null));
          }
          icp = icpsCache.get(prospect.icp_id);
        }
        const analise = await analisarComIA(prospect, icp);
        await db.entities.Prospect.update(prospect.id, analise);
        resultados.push({ prospect_id: prospect.id, razao_social: prospect.razao_social, status: 'sucesso', ...analise });
      } catch (erroProspect) {
        console.error(`Erro ao analisar prospect ${prospect.id}:`, erroProspect.message);
        resultados.push({ prospect_id: prospect.id, razao_social: prospect.razao_social, status: 'erro', motivo: erroProspect.message });
      }
    }

    return Response.json({ success: true, analisados: resultados.filter((item) => item.status === 'sucesso').length, resultados });
  } catch (error) {
    console.error('Erro geral na análise de prospects:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}