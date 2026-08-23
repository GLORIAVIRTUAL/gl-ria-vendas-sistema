// ===== PIPELINE COMERCIAL ÚNICO =====
// O Lead do CRM é a fonte de verdade da fase comercial.
// Toda mudança de estágio passa por aqui e gera histórico (LeadEstagioHistorico).

export const ORDEM_ESTAGIOS = [
  'Prospeccao',
  'Contatado',
  'Engajado',
  'Qualificado',
  'Reuniao_Marcada',
  'Reuniao_Realizada',
  'Em_Avaliacao',
  'Proposta',
  'Negociacao',
  'Negocio_Fechado',
  'Implantacao',
  'Inicio_de_Uso',
  'Estavel'
];

const FINAIS = ['Negocio_Fechado', 'Implantacao', 'Inicio_de_Uso', 'Estavel', 'Desistiu'];

export async function registrarHistorico(db, lead, estagioAnterior, estagioNovo, { origem = 'Automatico', motivo = '', prospect_id = '' } = {}) {
  await db.entities.LeadEstagioHistorico.create({
    lead_id: lead.id,
    lead_nome: lead.nome_cliente || '',
    estagio_anterior: estagioAnterior || '',
    estagio_novo: estagioNovo,
    origem,
    motivo,
    prospect_id
  });
}

// Move o lead para frente no funil. Nunca retrocede automaticamente e nunca
// mexe em leads já fechados/perdidos, a menos que forcar = true.
export async function moverEstagio(db, leadOuId, novoEstagio, { origem = 'Automatico', motivo = '', prospect_id = '', forcar = false } = {}) {
  const lead = typeof leadOuId === 'string' ? await db.entities.Lead.get(leadOuId) : leadOuId;
  if (!lead) return { movido: false, motivo: 'Lead não encontrado' };

  const atual = lead.estagio || 'Prospeccao';
  if (atual === novoEstagio) return { movido: false, motivo: 'Já está neste estágio' };

  if (!forcar) {
    if (FINAIS.includes(atual)) return { movido: false, motivo: `Estágio final (${atual}) preservado` };
    const indiceAtual = ORDEM_ESTAGIOS.indexOf(atual);
    const indiceNovo = ORDEM_ESTAGIOS.indexOf(novoEstagio);
    if (indiceAtual > -1 && indiceNovo > -1 && indiceNovo <= indiceAtual) {
      return { movido: false, motivo: 'Movimentação automática não retrocede o funil' };
    }
  }

  await db.entities.Lead.update(lead.id, {
    estagio: novoEstagio,
    estagio_atualizado_em: new Date().toISOString()
  });
  await registrarHistorico(db, lead, atual, novoEstagio, { origem, motivo, prospect_id });

  return { movido: true, de: atual, para: novoEstagio };
}