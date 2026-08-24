import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enviarEmail } from '../../shared/envio.ts';

const instanteDaReuniao = (agendamento) => {
  if (!agendamento?.data || !agendamento?.horario) return NaN;
  return Date.parse(`${agendamento.data}T${agendamento.horario}:00-03:00`);
};

const obterContexto = async (db, agendamento) => {
  let lead = null;
  const porAgendamento = await db.entities.Lead.filter({ agendamento_id: agendamento.id }, '-updated_date', 10);
  lead = porAgendamento[0] || null;
  if (!lead && agendamento.email_cliente) {
    const porEmail = await db.entities.Lead.filter({ email_cliente: agendamento.email_cliente }, '-updated_date', 20);
    lead = porEmail[0] || null;
  }

  let prospect = null;
  if (lead?.id) {
    const porLead = await db.entities.Prospect.filter({ crm_lead_id: lead.id }, '-updated_date', 10);
    prospect = porLead[0] || null;
  }
  if (!prospect && agendamento.email_cliente) {
    const porEmail = await db.entities.Prospect.filter({ email: agendamento.email_cliente }, '-updated_date', 10);
    prospect = porEmail[0] || null;
  }

  let emails = [];
  let cadencia = [];
  if (prospect?.id) {
    emails = await db.entities.EmailNotificacao.filter({ prospect_id: prospect.id }, '-created_date', 12);
    cadencia = await db.entities.CadenciaEnvio.filter({ prospect_id: prospect.id }, '-created_date', 12);
  }

  return { lead, prospect, emails, cadencia };
};

const gerarBriefing = async (db, agendamento, contexto) => {
  const { lead, prospect, emails, cadencia } = contexto;
  const dados = {
    reuniao: {
      data: agendamento.data,
      horario: agendamento.horario,
      nome: agendamento.nome_cliente,
      empresa: agendamento.nome_empresa,
      email: agendamento.email_cliente,
      telefone: agendamento.telefone_cliente,
      observacoes: agendamento.observacoes
    },
    lead: lead ? {
      estagio: lead.estagio,
      prioridade: lead.prioridade,
      observacoes: lead.observacoes,
      proximos_passos: lead.proximos_passos,
      produto_interesse: lead.produto_interesse
    } : null,
    prospect: prospect ? {
      empresa: prospect.nome_fantasia || prospect.razao_social,
      decisor_nome: prospect.decisor_nome,
      decisor_cargo: prospect.decisor_cargo,
      segmento: prospect.segmento || prospect.ramo_atividade,
      cidade: prospect.municipio,
      uf: prospect.uf,
      porte: prospect.porte,
      faixa_funcionarios: prospect.faixa_funcionarios,
      score: prospect.score,
      intent_score: prospect.intent_score,
      analise_resumo: prospect.analise_resumo,
      produtos_sugeridos: prospect.produtos_sugeridos,
      abordagem_sugerida: prospect.abordagem_sugerida,
      qualificacao: prospect.qualificacao,
      objecoes: prospect.objecoes,
      interesse_registrado: prospect.interesse_registrado
    } : null,
    respostas_email: emails.map((e) => ({
      subject: e.subject,
      text: String(e.text || '').slice(0, 1600),
      classificacao: e.classificacao_email,
      proxima_acao: e.proxima_acao
    })),
    cadencia: cadencia.map((c) => ({
      canal: c.canal,
      passo: c.passo_ordem,
      status: c.status,
      mensagem: String(c.mensagem || '').slice(0, 800),
      data_envio: c.data_envio
    }))
  };

  const resposta = await db.integrations.Core.InvokeLLM({
    prompt: `Você prepara o briefing de uma reunião comercial da Glória Virtual. Use SOMENTE os dados fornecidos; não invente nada. O objetivo é permitir que Thiago entre na reunião já sabendo o contexto e faça uma demonstração objetiva.\n\nDADOS:\n${JSON.stringify(dados, null, 2)}\n\nCrie um briefing em português, enxuto, com:\n- Empresa / decisor / segmento / localização\n- Fit/intent score quando disponíveis\n- Resumo do contexto\n- Dor ou interesse confirmado\n- Produto Glória mais indicado\n- Objeções já apresentadas\n- Sistema atual, se informado\n- Histórico resumido\n- O que demonstrar na reunião\n- 3 perguntas ainda importantes\n- Próximo objetivo comercial\nSe algum dado não existir, escreva 'não informado' em vez de inventar.`,
    response_json_schema: {
      type: 'object',
      properties: { briefing: { type: 'string' } },
      required: ['briefing']
    }
  });
  const briefing = String(resposta?.briefing || '').trim();
  if (!briefing) throw new Error('IA retornou briefing vazio');
  return briefing;
};

const processarUm = async (db, agendamento, enviarNotificacao = true) => {
  try {
    const contexto = await obterContexto(db, agendamento);
    const briefing = await gerarBriefing(db, agendamento, contexto);
    await db.entities.Agendamento.update(agendamento.id, {
      briefing_ia: briefing,
      briefing_gerado_em: new Date().toISOString(),
      briefing_status: 'gerado',
      briefing_erro: ''
    });

    if (enviarNotificacao) {
      const emailResponsavel = (Deno.env.get('GMAIL_EMAIL') || '').trim();
      if (emailResponsavel) {
        try {
          await enviarEmail({
            email: emailResponsavel,
            assunto: `[Briefing] ${agendamento.nome_empresa || agendamento.nome_cliente} — ${agendamento.horario}`,
            corpo: briefing.replace(/\n/g, '<br>')
          });
        } catch (erroEmail) {
          console.error('Briefing gerado, mas falhou o aviso por e-mail:', erroEmail.message);
        }
      }
    }
    return { agendamento_id: agendamento.id, status: 'gerado' };
  } catch (error) {
    await db.entities.Agendamento.update(agendamento.id, {
      briefing_status: 'erro',
      briefing_erro: error.message
    });
    return { agendamento_id: agendamento.id, status: 'erro', motivo: error.message };
  }
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (user && user.role !== 'admin') return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });

    const db = base44.asServiceRole;
    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }

    if (payload.agendamento_id) {
      const agendamento = await db.entities.Agendamento.get(payload.agendamento_id);
      if (!agendamento) return Response.json({ error: 'Agendamento não encontrado' }, { status: 404 });
      return Response.json({ success: true, resultados: [await processarUm(db, agendamento, payload.enviar_notificacao !== false)] });
    }

    const agora = Date.now();
    const minimo = agora + 5 * 60 * 1000;
    const maximo = agora + 30 * 60 * 1000;
    const agendamentos = await db.entities.Agendamento.list('data', 300);
    const candidatos = agendamentos.filter((ag) => {
      if (!['Agendada', 'Confirmada'].includes(ag.status)) return false;
      if (ag.briefing_status === 'gerado' && ag.briefing_ia) return false;
      const instante = instanteDaReuniao(ag);
      return Number.isFinite(instante) && instante >= minimo && instante <= maximo;
    });

    const resultados = [];
    for (const agendamento of candidatos) resultados.push(await processarUm(db, agendamento, true));
    return Response.json({ success: true, processados: resultados.length, resultados });
  } catch (error) {
    console.error('Erro ao gerar briefings de reunião:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}