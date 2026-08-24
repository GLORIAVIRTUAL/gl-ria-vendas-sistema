// Personalização controlada de mensagens de cadência com IA.
// TEMPLATE BASE + DADOS REAIS DO PROSPECT + PERSONALIZAÇÃO DA IA.
// A IA nunca pode inventar fatos: recebe apenas o que existe no Prospect.
import { montarVariaveis } from './comercialAutomacao.js';

const REGRAS = `REGRAS OBRIGATÓRIAS:
1. Mensagem curta (no máximo 130 palavras no e-mail e 60 no WhatsApp).
2. Linguagem natural, cordial e direta, em português do Brasil.
3. Não use exagero nem tom publicitário.
4. NUNCA afirme que analisamos algo que não analisamos.
5. NUNCA invente número de unidades, funcionários, faturamento, problemas internos ou clientes.
6. NUNCA finja conhecer pessoalmente o decisor.
7. Use somente os dados fornecidos abaixo. Se um dado não existir, simplesmente não fale dele.
8. Mantenha a intenção, a oferta e a chamada para ação do template base.
9. Não use placeholders como {{empresa}} na resposta final: escreva o texto pronto.
10. Se a informação for apenas provável, transforme-a em pergunta; não afirme como fato.`;

export const personalizarMensagem = async ({ db, prospect, campanha, passo, templateAplicado, assuntoAplicado }) => {
  const variaveis = montarVariaveis(prospect || {}, campanha || {});
  const dados = {
    empresa: variaveis.empresa,
    razao_social: variaveis.razao_social,
    primeiro_nome: variaveis.primeiro_nome,
    decisor_nome: variaveis.nome_decisor,
    decisor_cargo: variaveis.cargo_decisor,
    segmento: variaveis.segmento,
    subsegmento: variaveis.subsegmento,
    ramo_atividade: prospect.ramo_atividade || '',
    cidade: variaveis.cidade,
    uf: variaveis.uf,
    porte: prospect.porte || '',
    faixa_funcionarios: prospect.faixa_funcionarios || '',
    site: prospect.site || '',
    dado_publico_relevante: variaveis.dado_publico_relevante,
    produto_recomendado: variaveis.produto_recomendado,
    beneficio_principal: variaveis.beneficio_principal,
    pergunta_qualificacao: variaveis.pergunta_qualificacao,
    resumo_da_analise: prospect.analise_resumo || '',
    abordagem_sugerida: prospect.abordagem_sugerida || ''
  };

  const canal = passo?.canal === 'Email' ? 'e-mail' : 'WhatsApp';
  const prompt = `Você escreve mensagens de prospecção B2B para a Glória Vendas (soluções de IA e automação comercial).

Reescreva o TEMPLATE BASE abaixo personalizando apenas as partes apropriadas para este prospect.

CANAL: ${canal}
CAMPANHA: ${campanha?.nome || ''}
PASSO DA CADÊNCIA: ${passo?.passo_ordem || ''}
OBJETIVO DESTE PASSO: ${passo?.objetivo || 'iniciar uma conversa comercial e conseguir uma reunião'}

DADOS REAIS DISPONÍVEIS (não use nada além destes):
${JSON.stringify(dados, null, 2)}

TEMPLATE BASE:
${templateAplicado}

${assuntoAplicado ? `ASSUNTO BASE DO E-MAIL:\n${assuntoAplicado}\n` : ''}
${REGRAS}`;

  const resposta = await db.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        mensagem: { type: 'string' },
        assunto: { type: 'string' }
      },
      required: ['mensagem']
    }
  });

  const mensagem = String(resposta?.mensagem || '').trim();
  if (!mensagem) throw new Error('IA retornou mensagem vazia');

  return {
    mensagem,
    assunto: String(resposta?.assunto || '').trim() || assuntoAplicado
  };
};