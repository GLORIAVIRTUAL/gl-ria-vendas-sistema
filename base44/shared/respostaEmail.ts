// Classificação comercial + resposta automática segura para e-mails recebidos.
import { enviarEmail, enviarWhatsApp } from './envio.ts';
import { moverEstagio, registrarHistorico } from './pipeline.ts';
import { montarRespostaAutomaticaEmail, incrementoIntent } from './comercialAutomacao.js';

const CATEGORIAS = [
  'interessado', 'pediu_demonstracao', 'pediu_preco', 'pediu_informacoes',
  'pediu_contato_whatsapp', 'pediu_reuniao', 'ja_tem_sistema', 'nao_interessado',
  'pessoa_errada', 'indicou_outro_responsavel', 'fora_do_escritorio', 'mensagem_automatica',
  'email_invalido', 'remover_da_lista', 'duvida_comercial', 'outro'
];

const PARAR_CADENCIA = ['nao_interessado', 'remover_da_lista', 'email_invalido', 'pessoa_errada'];
const INTERESSE = ['interessado', 'pediu_demonstracao', 'pediu_reuniao', 'pediu_informacoes', 'pediu_preco', 'pediu_contato_whatsapp', 'ja_tem_sistema'];

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
  const recentes = await db.entities.Prospect.filter({ status: 'contatado' }, '-updated_date', 1000);
  return recentes.find((p: any) => String(p.email || '').toLowerCase().endsWith(`@${dominio}`)) || null;
};

const encontrarCampanha = async (db: any, prospectId: string) => {
  if (!prospectId) return null;
  const envios = await db.entities.CadenciaEnvio.filter({ prospect_id: prospectId }, '-created_date', 20);
  const campanhaId = envios.find((e: any) => e.campanha_id)?.campanha_id;
  if (!campanhaId) return null;
  try { return await db.entities.Campanha.get(campanhaId); } catch { return null; }
};

const classificar = async (db: any, email: any, prospect: any) => {
  const prompt = `Você é um analista comercial da Glória Vendas. Classifique a resposta de e-mail abaixo, recebida em uma campanha de prospecção B2B.

REMETENTE: ${email.from}
ASSUNTO: ${email.subject || ''}
CORPO:
${String(email.text || '').slice(0, 5000)}

${prospect ? `EMPRESA RELACIONADA: ${prospect.razao_social || ''} (${prospect.municipio || ''}/${prospect.uf || ''})` : 'Nenhum prospect relacionado identificado.'}

Categorias possíveis: ${CATEGORIAS.join(', ')}.

Regras:
- Não invente informações que não estão no e-mail.
- Use ja_tem_sistema quando a pessoa disser que já utiliza CRM, ERP, agenda ou outro sistema e isso for a objeção central.
- remover_da_lista só quando a pessoa pede explicitamente para não receber mais mensagens.
- fora_do_escritorio para respostas automáticas de ausência; se houver data de retorno, informe em retomar_em (ISO 8601).
- Marque necessita_humano = true quando envolver desconto, negociação específica, contrato, condição fora do padrão, promessa técnica não confirmada ou baixa confiança.
- confiança_classificacao deve ser de 0 a 1.
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
        retomar_em: { type: 'string' },
        confianca_classificacao: { type: 'number' }
      },
      required: ['classificacao_email', 'sentimento_comercial', 'proxima_acao', 'necessita_humano', 'confianca_classificacao']
    }
  });
};

const cancelarPendentes = async (db: any, prospectId: string, motivo: string) => {
  const itens = [
    ...(await db.entities.CadenciaEnvio.filter({ prospect_id: prospectId, status: 'programado' })),
    ...(await db.entities.CadenciaEnvio.filter({ prospect_id: prospectId, status: 'processando' }))
  ];
  const vistos = new Set();
  for (const envio of itens) {
    if (vistos.has(envio.id)) continue;
    vistos.add(envio.id);
    await db.entities.CadenciaEnvio.update(envio.id, {
      status: 'cancelado', claim_token: '', processando_em: null, erro_mensagem: motivo
    });
  }
  return vistos.size;
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

const redirecionarParaDecisor = async (db: any, prospect: any, decisor: string) => {
  const novoEmail = extrairEmail(decisor);
  if (!novoEmail || novoEmail === String(prospect.email || '').toLowerCase()) return null;

  await db.entities.Prospect.update(prospect.id, { email: novoEmail });
  const pendentes = await db.entities.CadenciaEnvio.filter({ prospect_id: prospect.id, status: 'programado' });
  let redirecionados = 0;
  for (const envio of pendentes) {
    if (envio.canal !== 'Email') continue;
    await db.entities.CadenciaEnvio.update(envio.id, { destino: novoEmail });
    redirecionados += 1;
  }
  return { novoEmail, redirecionados };
};

const garantirLead = async (db: any, prospect: any, classificacao: string, proximaAcao: string) => {
  if (prospect.crm_lead_id) return prospect.crm_lead_id;
  const lead = await db.entities.Lead.create({
    nome_cliente: prospect.decisor_nome || prospect.nome_fantasia || prospect.razao_social,
    nome_empresa: prospect.razao_social,
    email_cliente: prospect.email || undefined,
    telefone_cliente: prospect.whatsapp || prospect.telefone || undefined,
    estagio: 'Prospeccao',
    estagio_atualizado_em: new Date().toISOString(),
    prioridade: 'Alta',
    observacoes: `Respondeu a campanha de prospecção por e-mail (${classificacao}).`,
    proximos_passos: proximaAcao || 'Qualificar e conduzir para demonstração'
  });
  await db.entities.Prospect.update(prospect.id, { crm_lead_id: lead.id });
  await registrarHistorico(db, lead, '', 'Prospeccao', {
    origem: 'Email', motivo: `Lead criado após resposta (${classificacao})`, prospect_id: prospect.id
  });
  return lead.id;
};

const atualizarIntent = async (db: any, prospect: any, classificacao: string) => {
  const novo = incrementoIntent(prospect.intent_score || 0, classificacao);
  if (novo !== Number(prospect.intent_score || 0)) await db.entities.Prospect.update(prospect.id, { intent_score: novo });
  return novo;
};

const assuntoResposta = (subject = '') => /^\s*re:/i.test(subject) ? subject : `Re: ${subject || 'Glória Virtual'}`;

const responderAutomaticamente = async (db: any, emailRegistro: any, prospect: any, campanha: any, classificacao: string) => {
  const resposta = montarRespostaAutomaticaEmail({ classificacao, prospect, campanha });
  if (!resposta.automatico) return { enviado: false };
  const destino = extrairEmail(emailRegistro.from);
  if (!destino) return { enviado: false };
  await enviarEmail({
    email: destino,
    assunto: assuntoResposta(emailRegistro.subject),
    corpo: resposta.corpo.replace(/\n/g, '<br>')
  });
  return { enviado: true, texto: resposta.corpo };
};

const responderDuvidaComBase = async (db: any, emailRegistro: any, prospect: any, campanha: any) => {
  const itens = await db.entities.ConhecimentoItem.filter({ ativo: true }, 'ordem', 50);
  if (!itens.length) return null;
  const base = itens.map((i: any) => `[${i.categoria}] ${i.titulo}\n${i.conteudo}`).join('\n\n').slice(0, 9000);
  const resposta = await db.integrations.Core.InvokeLLM({
    prompt: `Responda ao e-mail comercial abaixo usando SOMENTE a base de conhecimento fornecida. Seja curto e direto. Não informe preço, desconto, prazo especial, contrato ou integração não confirmada. Se a base não for suficiente, retorne pode_responder=false.\n\nE-MAIL:\n${String(emailRegistro.text || '').slice(0, 4000)}\n\nBASE DE CONHECIMENTO:\n${base}`,
    response_json_schema: {
      type: 'object',
      properties: {
        pode_responder: { type: 'boolean' },
        confianca: { type: 'number' },
        resposta: { type: 'string' }
      },
      required: ['pode_responder', 'confianca', 'resposta']
    }
  });
  if (!resposta?.pode_responder || Number(resposta.confianca || 0) < 0.8 || !String(resposta.resposta || '').trim()) return null;
  const destino = extrairEmail(emailRegistro.from);
  if (!destino) return null;
  const agenda = campanha?.agenda_url ? `\n\nSe fizer sentido, você pode marcar uma demonstração aqui:\n${campanha.agenda_url}` : '';
  const corpo = `${String(resposta.resposta).trim()}${agenda}\n\nThiago\nGlória Virtual`;
  await enviarEmail({ email: destino, assunto: assuntoResposta(emailRegistro.subject), corpo: corpo.replace(/\n/g, '<br>') });
  return corpo;
};

const iniciarWhatsAppSolicitado = async (db: any, prospect: any) => {
  const telefone = prospect.whatsapp || prospect.telefone;
  if (!telefone) return { enviado: false, motivo: 'Prospect não possui telefone/WhatsApp' };
  const agora = new Date().toISOString();
  await db.entities.Prospect.update(prospect.id, {
    consentimento_whatsapp: {
      status: 'concedido', origem: 'Solicitado explicitamente por e-mail', data: agora,
      observacao: 'O contato pediu continuidade pelo WhatsApp na resposta ao e-mail.'
    }
  });
  await enviarWhatsApp({
    telefone,
    mensagem: `Olá${prospect.decisor_nome ? `, ${prospect.decisor_nome.split(/\s+/)[0]}` : ''}! Sou Thiago, da Glória Virtual. Conforme você pediu por e-mail, podemos continuar por aqui. Se quiser, eu já posso te mostrar a demonstração e os horários disponíveis para uma conversa rápida.`
  });
  return { enviado: true };
};

const alertarTime = async (emailRegistro: any, analise: any, prospect: any) => {
  const destinoEmail = (Deno.env.get('GMAIL_EMAIL') || '').trim();
  if (!destinoEmail) return;
  const empresa = prospect ? (prospect.nome_fantasia || prospect.razao_social) : 'Contato sem prospect vinculado';
  try {
    await enviarEmail({
      email: destinoEmail,
      assunto: `[Ação humana] Resposta de ${empresa}`,
      corpo: `<h3>Resposta de e-mail exige atendimento humano</h3><p>Empresa: ${empresa}<br>Remetente: ${emailRegistro.from}<br>Assunto: ${emailRegistro.subject || '(sem assunto)'}<br>Classificação: ${analise.classificacao_email}<br>Motivo: ${analise.motivo_necessita_humano || 'Não informado'}<br>Próxima ação: ${analise.proxima_acao || 'Não informada'}</p>`
    });
  } catch (erroAlerta) {
    console.error('Falha ao enviar alerta por e-mail:', erroAlerta.message);
  }
};

export async function processarRespostaEmail(db: any, emailRegistro: any) {
  const endereco = extrairEmail(emailRegistro.from);
  const prospect = await encontrarProspect(db, endereco);
  const analise = await classificar(db, emailRegistro, prospect);
  const confianca = Number(analise.confianca_classificacao || 0);
  if (confianca < 0.65) {
    analise.necessita_humano = true;
    analise.motivo_necessita_humano = `Baixa confiança na classificação (${confianca.toFixed(2)})`;
  }

  const campanha = prospect ? await encontrarCampanha(db, prospect.id) : null;
  const atualizacao: any = {
    classificacao_email: analise.classificacao_email,
    sentimento_comercial: analise.sentimento_comercial,
    proxima_acao: analise.proxima_acao || '',
    necessita_humano: !!analise.necessita_humano,
    motivo_necessita_humano: analise.motivo_necessita_humano || '',
    decisor_indicado: analise.decisor_indicado || '',
    analisado_em: new Date().toISOString(),
    ...(campanha?.id ? { campanha_id: campanha.id } : {})
  };
  if (analise.retomar_em && !Number.isNaN(Date.parse(analise.retomar_em))) atualizacao.retomar_em = new Date(analise.retomar_em).toISOString();
  if (prospect) atualizacao.prospect_id = prospect.id;

  let acao = 'nenhuma';
  let autoResposta: any = null;

  if (prospect) {
    await atualizarIntent(db, prospect, analise.classificacao_email);

    if (analise.classificacao_email === 'remover_da_lista') {
      await cancelarPendentes(db, prospect.id, 'Opt-out: contato pediu para não receber mensagens');
      await db.entities.Prospect.update(prospect.id, { opt_out: true, opt_out_motivo: 'Solicitou remoção da lista por e-mail', respondeu_em: new Date().toISOString() });
      acao = 'opt_out';
    } else if (['indicou_outro_responsavel', 'pessoa_errada'].includes(analise.classificacao_email) && extrairEmail(analise.decisor_indicado || '')) {
      const redirecionamento = await redirecionarParaDecisor(db, prospect, analise.decisor_indicado);
      if (redirecionamento) {
        atualizacao.proxima_acao = `Cadência redirecionada para ${redirecionamento.novoEmail}. ${analise.proxima_acao || ''}`.trim();
        acao = 'redirecionado_decisor';
      } else {
        await cancelarPendentes(db, prospect.id, `Cadência interrompida: ${analise.classificacao_email}`);
        await db.entities.Prospect.update(prospect.id, { respondeu_em: new Date().toISOString() });
        acao = 'cadencia_interrompida';
      }
    } else if (PARAR_CADENCIA.includes(analise.classificacao_email)) {
      await cancelarPendentes(db, prospect.id, `Cadência interrompida: ${analise.classificacao_email}`);
      await db.entities.Prospect.update(prospect.id, { respondeu_em: new Date().toISOString() });
      acao = 'cadencia_interrompida';
    } else if (analise.classificacao_email === 'fora_do_escritorio' && atualizacao.retomar_em) {
      await reagendarPendentes(db, prospect.id, atualizacao.retomar_em);
      acao = 'reagendado';
    } else if (INTERESSE.includes(analise.classificacao_email)) {
      await cancelarPendentes(db, prospect.id, 'Cadência interrompida: prospect respondeu');
      await db.entities.Prospect.update(prospect.id, { respondeu_em: new Date().toISOString() });
      atualizacao.lead_id = await garantirLead(db, prospect, analise.classificacao_email, analise.proxima_acao);
      await moverEstagio(db, atualizacao.lead_id, 'Engajado', {
        origem: 'Email', motivo: `Resposta comercial: ${analise.classificacao_email}`, prospect_id: prospect.id
      });
      acao = 'lead_engajado';
    }

    if (analise.classificacao_email === 'pediu_contato_whatsapp' && !analise.necessita_humano) {
      try {
        const wpp = await iniciarWhatsAppSolicitado(db, prospect);
        acao = wpp.enviado ? 'whatsapp_iniciado' : acao;
      } catch (erroWpp) {
        analise.necessita_humano = true;
        atualizacao.necessita_humano = true;
        atualizacao.motivo_necessita_humano = `Falha ao iniciar WhatsApp solicitado: ${erroWpp.message}`;
      }
    }

    if (!analise.necessita_humano && analise.classificacao_email !== 'pediu_contato_whatsapp') {
      try {
        if (analise.classificacao_email === 'duvida_comercial') {
          const texto = await responderDuvidaComBase(db, emailRegistro, prospect, campanha);
          if (texto) autoResposta = { enviado: true, texto };
          else {
            atualizacao.necessita_humano = true;
            atualizacao.motivo_necessita_humano = 'A base de conhecimento não foi suficiente para responder com segurança';
          }
        } else if (!['fora_do_escritorio', 'mensagem_automatica', 'email_invalido', 'pessoa_errada', 'indicou_outro_responsavel'].includes(analise.classificacao_email)) {
          autoResposta = await responderAutomaticamente(db, emailRegistro, prospect, campanha, analise.classificacao_email);
        }
      } catch (erroResposta) {
        atualizacao.necessita_humano = true;
        atualizacao.motivo_necessita_humano = `Falha na resposta automática: ${erroResposta.message}`;
      }
    }
  }

  if (autoResposta?.enviado) {
    atualizacao.resposta_automatica_enviada = true;
    atualizacao.resposta_automatica_em = new Date().toISOString();
    atualizacao.resposta_automatica_texto = autoResposta.texto || '';
  }

  await db.entities.EmailNotificacao.update(emailRegistro.id, atualizacao);
  if (atualizacao.necessita_humano) await alertarTime(emailRegistro, { ...analise, ...atualizacao }, prospect);

  return {
    classificacao: analise.classificacao_email,
    acao,
    resposta_automatica: !!autoResposta?.enviado,
    prospect_id: prospect?.id || null
  };
}