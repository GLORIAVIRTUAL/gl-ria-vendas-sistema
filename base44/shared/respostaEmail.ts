// Etapa 6 — classificação comercial das respostas de e-mail com IA
// e execução das regras de cadência (parar, suprimir, reagendar, escalar).

const CATEGORIAS = [
  'interessado', 'pediu_demonstracao', 'pediu_preco', 'pediu_informacoes',
  'pediu_contato_whatsapp', 'pediu_reuniao', 'nao_interessado', 'pessoa_errada',
  'indicou_outro_responsavel', 'fora_do_escritorio', 'mensagem_automatica',
  'email_invalido', 'remover_da_lista', 'duvida_comercial', 'outro'
];

const PARAR_CADENCIA = ['nao_interessado', 'remover_da_lista', 'email_invalido', 'pessoa_errada'];
const INTERESSE = ['interessado', 'pediu_demonstracao', 'pediu_reuniao', 'pediu_informacoes', 'pediu_preco', 'pediu_contato_whatsapp'];

const extrairEmail = (remetente: string) => {
  const match = String(remetente || '').match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return match ? match[0].toLowerCase() : '';
};

const encontrarProspect = async (db: any, email: string) => {
  if (!email) return null;
  const porEmail = await db.entities.Prospect.filter({ email });
  if (porEmail.length) return porEmail[0];
  const dominio = email.split('@')[1];
  if (!dominio) return null;
  const recentes = await db.entities.Prospect.filter({ status: 'contatado' }, '-updated_date', 500);
  return recentes.find((p: any) => String(p.email || '').toLowerCase().endsWith(`@${dominio}`)) || null;
};

const classificar = async (db: any, email: any, prospect: any) => {
  const prompt = `Você é um analista comercial da Glória Vendas. Classifique a resposta de e-mail abaixo, recebida em uma campanha de prospecção B2B.

REMETENTE: ${email.from}
ASSUNTO: ${email.subject || ''}
CORPO:
${String(email.text || '').slice(0, 4000)}

${prospect ? `EMPRESA RELACIONADA: ${prospect.razao_social || ''} (${prospect.municipio || ''}/${prospect.uf || ''})` : 'Nenhum prospect relacionado identificado.'}

Categorias possíveis: ${CATEGORIAS.join(', ')}.

Regras:
- Não invente informações que não estão no e-mail.
- "remover_da_lista" só quando a pessoa pede explicitamente para não receber mais mensagens.
- "fora_do_escritorio" para respostas automáticas de ausência; se houver data de retorno, informe em retomar_em (ISO 8601).
- Marque necessita_humano = true quando envolver negociação, desconto, contrato, condição fora do padrão, informação que você não tem ou baixa confiança, explicando em motivo_necessita_humano.
- Em proxima_acao escreva uma frase curta e objetiva.`;

  return await db.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        classificacao_email: { type: 'string', enum: CATEGORIAS },
        sentimento_comercial: { type: 'string', enum: ['positivo', 'neutro', 'negativo'] },
        proxima_acao: { type: 'string' },
        necessita_humano: { type: 'boolean' },
        motivo_necessita_humano: { type: 'string' },
        decisor_indicado: { type: 'string' },
        retomar_em: { type: 'string' }
      },
      required: ['classificacao_email', 'sentimento_comercial', 'proxima_acao', 'necessita_humano']
    }
  });
};

const cancelarPendentes = async (db: any, prospectId: string, motivo: string) => {
  const pendentes = await db.entities.CadenciaEnvio.filter({ prospect_id: prospectId, status: 'programado' });
  for (const envio of pendentes) {
    await db.entities.CadenciaEnvio.update(envio.id, { status: 'cancelado', erro_mensagem: motivo });
  }
  return pendentes.length;
};

const reagendarPendentes = async (db: any, prospectId: string, retomarEm: string) => {
  const pendentes = await db.entities.CadenciaEnvio.filter({ prospect_id: prospectId, status: 'programado' });
  for (const envio of pendentes) {
    if (new Date(envio.data_programada) < new Date(retomarEm)) {
      await db.entities.CadenciaEnvio.update(envio.id, { data_programada: retomarEm });
    }
  }
  return pendentes.length;
};

const garantirLead = async (db: any, prospect: any, classificacao: string, proximaAcao: string) => {
  if (prospect.crm_lead_id) return prospect.crm_lead_id;
  const lead = await db.entities.Lead.create({
    nome_cliente: prospect.nome_fantasia || prospect.razao_social,
    nome_empresa: prospect.razao_social,
    email_cliente: prospect.email || undefined,
    telefone_cliente: prospect.whatsapp || prospect.telefone || undefined,
    estagio: 'Prospeccao',
    prioridade: 'Alta',
    observacoes: `Respondeu a campanha de prospecção por e-mail (${classificacao}).`,
    proximos_passos: proximaAcao || 'Retornar contato e qualificar'
  });
  await db.entities.Prospect.update(prospect.id, { crm_lead_id: lead.id });
  return lead.id;
};

export async function processarRespostaEmail(db: any, emailRegistro: any) {
  const endereco = extrairEmail(emailRegistro.from);
  const prospect = await encontrarProspect(db, endereco);
  const analise = await classificar(db, emailRegistro, prospect);

  const atualizacao: any = {
    classificacao_email: analise.classificacao_email,
    sentimento_comercial: analise.sentimento_comercial,
    proxima_acao: analise.proxima_acao || '',
    necessita_humano: !!analise.necessita_humano,
    motivo_necessita_humano: analise.motivo_necessita_humano || '',
    decisor_indicado: analise.decisor_indicado || '',
    analisado_em: new Date().toISOString()
  };
  if (analise.retomar_em && !Number.isNaN(Date.parse(analise.retomar_em))) {
    atualizacao.retomar_em = new Date(analise.retomar_em).toISOString();
  }
  if (prospect) atualizacao.prospect_id = prospect.id;

  let acao = 'nenhuma';
  if (prospect) {
    if (analise.classificacao_email === 'remover_da_lista') {
      await cancelarPendentes(db, prospect.id, 'Opt-out: contato pediu para não receber mensagens');
      await db.entities.Prospect.update(prospect.id, { opt_out: true, opt_out_motivo: 'Solicitou remoção da lista por e-mail', respondeu_em: new Date().toISOString() });
      acao = 'opt_out';
    } else if (PARAR_CADENCIA.includes(analise.classificacao_email)) {
      await cancelarPendentes(db, prospect.id, `Cadência interrompida: ${analise.classificacao_email}`);
      await db.entities.Prospect.update(prospect.id, { respondeu_em: new Date().toISOString() });
      acao = 'cadencia_interrompida';
    } else if (analise.classificacao_email === 'fora_do_escritorio' && atualizacao.retomar_em) {
      await reagendarPendentes(db, prospect.id, atualizacao.retomar_em);
      acao = 'reagendado';
    } else if (INTERESSE.includes(analise.classificacao_email)) {
      await cancelarPendentes(db, prospect.id, 'Cadência interrompida: prospect respondeu com interesse');
      await db.entities.Prospect.update(prospect.id, { respondeu_em: new Date().toISOString() });
      atualizacao.lead_id = await garantirLead(db, prospect, analise.classificacao_email, analise.proxima_acao);
      acao = 'lead_qualificado';
    }
  }

  await db.entities.EmailNotificacao.update(emailRegistro.id, atualizacao);
  return { classificacao: analise.classificacao_email, acao, prospect_id: prospect?.id || null };
}