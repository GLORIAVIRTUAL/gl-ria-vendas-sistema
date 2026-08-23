// ===== AGENTE COMERCIAL GLÓRIA =====
// Camada comercial acoplada ao atendimento de WhatsApp já existente (Z-API + IA atual).
// NÃO substitui o atendimento: apenas enriquece o prompt quando o contato é um
// Prospect/Lead comercial e registra qualificação, objeções e intent score.
import { moverEstagio } from './pipeline.ts';

const canonico = (t) => {
  let n = String(t || '').replace(/\D/g, '');
  if (n.startsWith('55')) n = n.slice(2);
  if (n.length === 11 && n[2] === '9') n = n.slice(0, 2) + n.slice(3);
  return n;
};

export const mesmoTelefone = (a, b) => {
  const x = canonico(a);
  const y = canonico(b);
  if (!x || !y) return false;
  return x === y || x.endsWith(y) || y.endsWith(x);
};

// Localiza o Prospect (e o Lead do CRM, quando existir) do telefone que está conversando.
export async function buscarContextoComercial(db, phone) {
  const prospects = await db.entities.Prospect.list('-updated_date', 500);
  const prospect = prospects.find((p) => mesmoTelefone(p.whatsapp, phone) || mesmoTelefone(p.telefone, phone));
  if (!prospect) return null;

  let lead = null;
  if (prospect.crm_lead_id) {
    try {
      lead = await db.entities.Lead.get(prospect.crm_lead_id);
    } catch {
      lead = null;
    }
  }
  return { prospect, lead };
}

const PERGUNTAS_QUALIFICACAO = [
  ['cargo_pessoa', 'qual o cargo/função da pessoa na empresa'],
  ['quantidade_funcionarios', 'quantas pessoas trabalham na empresa (aproximado)'],
  ['unidades', 'quantas unidades/lojas a empresa possui'],
  ['sistema_atual', 'qual sistema ou processo eles usam hoje'],
  ['principal_problema', 'qual o principal problema/dor atual'],
  ['produto_interesse', 'qual solução da Glória faz mais sentido para ele'],
  ['urgencia', 'qual a urgência para resolver isso'],
  ['decisao_depende_de_outra_pessoa', 'se a decisão depende de outra pessoa']
];

// Bloco de contexto anexado ao prompt do atendimento quando o contato é comercial.
export function montarContextoComercial({ prospect, lead }) {
  const q = prospect.qualificacao || {};
  const faltando = PERGUNTAS_QUALIFICACAO.filter(([campo]) => !q[campo]).map(([, pergunta]) => pergunta);
  const objecoes = (prospect.objecoes || []).join('; ');
  const produtos = (prospect.produtos_sugeridos || []).join(', ');

  return `---
MODO AGENTE COMERCIAL GLÓRIA (este contato é um prospect da nossa prospecção):
- Empresa: ${prospect.nome_fantasia || prospect.razao_social}
- Segmento: ${prospect.segmento || prospect.ramo_atividade || 'não informado'}
- Cidade/UF: ${prospect.municipio || '—'}/${prospect.uf || '—'}
- Porte: ${prospect.porte || 'não informado'} | Funcionários: ${prospect.faixa_funcionarios || 'não informado'}
- Produtos Glória recomendados internamente: ${produtos || 'não definidos'}
- Abordagem sugerida internamente: ${prospect.abordagem_sugerida || 'não definida'}
- Lead score: ${prospect.score ?? '—'} | Intenção atual: ${prospect.intent_score ?? 0}
- Estágio no CRM: ${lead?.estagio || 'ainda não está no CRM'}
${objecoes ? `- Objeções já registradas: ${objecoes}` : ''}
${q.principal_problema ? `- Problema já informado pelo contato: ${q.principal_problema}` : ''}

SEU OBJETIVO: conduzir este contato interessado até uma reunião comercial qualificada.

${faltando.length
    ? `INFORMAÇÕES QUE AINDA FALTAM (colete naturalmente, UMA por vez, sem parecer interrogatório):\n${faltando.map((f) => `- ${f}`).join('\n')}`
    : 'A qualificação já está completa. Foque em avançar para a reunião comercial.'}

PROIBIDO NESTE MODO:
- insistir excessivamente ou mandar várias mensagens seguidas;
- inventar funcionalidades, integrações ou prazos;
- informar preço, dar desconto ou negociar contrato (nesses casos diga que o responsável trata isso na reunião);
- prometer qualquer coisa que não esteja confirmada no sistema.
Use SOMENTE informações reais listadas acima e o que o próprio contato disser.
Quando houver interesse suficiente, ofereça a reunião/demonstração e siga as regras de agendamento já definidas.`;
}

const INCREMENTOS = {
  respondeu: 5,
  demonstrou_interesse: 15,
  pediu_informacao: 10,
  pediu_demonstracao: 20,
  pediu_reuniao: 30,
  reuniao_marcada: 40,
  nao_interessado: -100
};

// Após cada resposta da IA, extrai qualificação/objeções/interesse da conversa e
// atualiza o Prospect e o intent score. Nunca inventa dados: só o que foi dito.
export async function registrarQualificacao(base44, prospect, historico) {
  const db = base44.asServiceRole;
  const atual = prospect.qualificacao || {};

  const analise = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Você analisa uma conversa comercial de WhatsApp e extrai APENAS o que o contato realmente disse.
Nunca invente, deduza ou complete informações. Se algo não foi dito, deixe vazio.

Empresa: ${prospect.nome_fantasia || prospect.razao_social}
Qualificação já registrada: ${JSON.stringify(atual)}

CONVERSA:
${historico}`,
    response_json_schema: {
      type: 'object',
      properties: {
        qualificacao: {
          type: 'object',
          properties: {
            cargo_pessoa: { type: 'string' },
            quantidade_funcionarios: { type: 'string' },
            unidades: { type: 'string' },
            sistema_atual: { type: 'string' },
            principal_problema: { type: 'string' },
            produto_interesse: { type: 'string' },
            urgencia: { type: 'string' },
            decisao_depende_de_outra_pessoa: { type: 'string' },
            orcamento_informado: { type: 'string' },
            observacoes: { type: 'string' }
          }
        },
        objecoes: { type: 'array', items: { type: 'string' } },
        interesse_registrado: { type: 'string' },
        eventos: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.keys(INCREMENTOS)
          },
          description: 'Sinais de intenção identificados na última mensagem do contato'
        }
      }
    }
  });

  const novaQualificacao = { ...atual };
  Object.entries(analise?.qualificacao || {}).forEach(([campo, valor]) => {
    const texto = String(valor || '').trim();
    if (texto) novaQualificacao[campo] = texto;
  });

  const objecoes = Array.from(new Set([...(prospect.objecoes || []), ...((analise?.objecoes) || []).filter(Boolean)]));

  const eventos = analise?.eventos || [];
  const delta = eventos.reduce((soma, evento) => soma + (INCREMENTOS[evento] || 0), 0);
  const intentScore = Math.max(0, Math.min(100, (prospect.intent_score || 0) + delta));

  await db.entities.Prospect.update(prospect.id, {
    qualificacao: novaQualificacao,
    objecoes,
    interesse_registrado: String(analise?.interesse_registrado || '').trim() || prospect.interesse_registrado || '',
    intent_score: intentScore,
    qualificado_em: new Date().toISOString(),
    consentimento_whatsapp: prospect.consentimento_whatsapp?.status === 'concedido'
      ? prospect.consentimento_whatsapp
      : {
        status: 'concedido',
        origem: 'Contato respondeu/conversou pelo WhatsApp',
        data: new Date().toISOString(),
        observacao: 'Consentimento registrado a partir da conversa iniciada no WhatsApp'
      }
  });

  // Mantém o Lead do CRM alinhado com o pipeline único: qualificação concluída → Qualificado.
  if (prospect.crm_lead_id) {
    try {
      const lead = await db.entities.Lead.get(prospect.crm_lead_id);
      if (lead) {
        const qualificacaoCompleta = !!(novaQualificacao.principal_problema && novaQualificacao.produto_interesse);
        if (qualificacaoCompleta || intentScore >= 40) {
          await moverEstagio(db, lead, 'Qualificado', {
            origem: 'WhatsApp',
            motivo: novaQualificacao.principal_problema || 'Qualificação coletada pelo Agente Comercial',
            prospect_id: prospect.id
          });
        }
        await db.entities.Lead.update(lead.id, {
          observacoes: `${lead.observacoes || ''}\n[Agente Comercial] ${novaQualificacao.principal_problema || 'Conversa comercial em andamento'}`.trim()
        });
      }
    } catch (erroLead) {
      console.error('⚠️ Não foi possível atualizar o Lead:', erroLead.message);
    }
  }

  return { intent_score: intentScore, eventos, objecoes };
}