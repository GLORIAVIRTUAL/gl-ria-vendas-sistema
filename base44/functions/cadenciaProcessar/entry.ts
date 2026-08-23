import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { aplicarVariaveis, enviarEmail, enviarWhatsApp } from '../../shared/envio.ts';
import { personalizarMensagem } from '../../shared/personalizacao.ts';

const destinoDoProspect = (prospect, canal) => canal === 'Email'
  ? prospect.email
  : (prospect.whatsapp || prospect.telefone);

const inscreverProspects = async (db, campanha) => {
  const passos = (campanha.passos || []).filter((passo) => passo.canal && passo.mensagem);
  if (!passos.length) return { inscritos: 0, motivo: 'Campanha sem passos configurados' };

  const filtro = campanha.icp_id ? { icp_id: campanha.icp_id } : {};
  const prospects = await db.entities.Prospect.filter(filtro, '-score', 200);
  const scoreMinimo = Number(campanha.score_minimo) || 0;
  const limite = Number(campanha.limite_diario_entradas) || 20;

  const jaNaCampanha = await db.entities.CadenciaEnvio.filter({ campanha_id: campanha.id });
  const inscritosIds = new Set(jaNaCampanha.map((envio) => envio.prospect_id));

  const elegiveis = prospects.filter((prospect) => (
    !inscritosIds.has(prospect.id) &&
    !prospect.opt_out &&
    !prospect.respondeu_em &&
    prospect.analisado_em &&
    (Number(prospect.score) || 0) >= scoreMinimo &&
    passos.some((passo) => destinoDoProspect(prospect, passo.canal))
  )).slice(0, limite);

  let inscritos = 0;
  for (const prospect of elegiveis) {
    const agora = Date.now();
    for (let indice = 0; indice < passos.length; indice += 1) {
      const passo = passos[indice];
      const destino = destinoDoProspect(prospect, passo.canal);
      if (!destino) continue;
      await db.entities.CadenciaEnvio.create({
        campanha_id: campanha.id,
        campanha_nome: campanha.nome,
        prospect_id: prospect.id,
        prospect_nome: prospect.nome_fantasia || prospect.razao_social,
        passo_ordem: indice + 1,
        canal: passo.canal,
        destino,
        assunto: passo.assunto || '',
        mensagem: passo.mensagem,
        objetivo: passo.objetivo || '',
        usar_ia: !!passo.usar_ia,
        template_base: passo.mensagem,
        status: 'programado',
        data_programada: new Date(agora + (Number(passo.dia_offset) || 0) * 86400000).toISOString()
      });
    }
    inscritos += 1;
  }

  return { inscritos };
};

const dispararPendentes = async (db, campanha) => {
  const limite = Number(campanha.limite_diario_envios) || 30;
  const pendentes = await db.entities.CadenciaEnvio.filter(
    { campanha_id: campanha.id, status: 'programado', data_programada: { $lte: new Date().toISOString() } },
    'data_programada',
    limite
  );

  const resultado = { enviados: 0, erros: 0 };

  for (const envio of pendentes) {
    try {
      const prospect = await db.entities.Prospect.get(envio.prospect_id);
      if (!prospect) throw new Error('Prospect não encontrado');
      if (prospect.opt_out) {
        await db.entities.CadenciaEnvio.update(envio.id, { status: 'cancelado', erro_mensagem: 'Contato em lista de supressão (opt-out)' });
        continue;
      }

      let mensagem = aplicarVariaveis(envio.template_base || envio.mensagem, prospect);
      let assunto = aplicarVariaveis(envio.assunto, prospect);
      let personalizadoIA = false;

      if (envio.usar_ia) {
        try {
          const personalizado = await personalizarMensagem({
            db,
            prospect,
            campanha,
            passo: { canal: envio.canal, passo_ordem: envio.passo_ordem, objetivo: envio.objetivo },
            templateAplicado: mensagem,
            assuntoAplicado: assunto
          });
          mensagem = personalizado.mensagem;
          assunto = personalizado.assunto || assunto;
          personalizadoIA = true;
        } catch (erroIA) {
          console.error(`Falha na personalização por IA do envio ${envio.id}, usando template base:`, erroIA.message);
        }
      }

      if (envio.canal === 'Email') {
        await enviarEmail({ email: envio.destino, assunto: assunto || `Olá, ${prospect.nome_fantasia || prospect.razao_social}`, corpo: mensagem.replace(/\n/g, '<br>') });
      } else {
        await enviarWhatsApp({ telefone: envio.destino, mensagem });
      }

      await db.entities.CadenciaEnvio.update(envio.id, {
        status: 'enviado',
        mensagem,
        assunto,
        personalizado_ia: personalizadoIA,
        data_envio: new Date().toISOString()
      });
      if (prospect.status !== 'contatado') {
        await db.entities.Prospect.update(prospect.id, { status: 'contatado' });
      }
      resultado.enviados += 1;
    } catch (erroEnvio) {
      console.error(`Erro no envio ${envio.id}:`, erroEnvio.message);
      await db.entities.CadenciaEnvio.update(envio.id, { status: 'erro', erro_mensagem: erroEnvio.message });
      resultado.erros += 1;
    }
  }

  return resultado;
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

    let campanhas = [];
    if (payload.campanha_id) {
      const campanha = await db.entities.Campanha.get(payload.campanha_id);
      if (!campanha) return Response.json({ error: 'Campanha não encontrada' }, { status: 404 });
      campanhas = [campanha];
    } else {
      campanhas = await db.entities.Campanha.filter({ ativa: true });
    }

    if (!campanhas.length) {
      return Response.json({ success: true, processadas: 0, resultados: [], mensagem: 'Nenhuma campanha ativa nesta execução' });
    }

    const resultados = [];
    for (const campanha of campanhas) {
      try {
        const inscricao = await inscreverProspects(db, campanha);
        const disparo = payload.somente_inscrever ? { enviados: 0, erros: 0 } : await dispararPendentes(db, campanha);
        await db.entities.Campanha.update(campanha.id, { ultima_execucao: new Date().toISOString() });
        resultados.push({ campanha: campanha.nome, status: 'sucesso', ...inscricao, ...disparo });
      } catch (erroCampanha) {
        console.error(`Falha na campanha ${campanha.nome}:`, erroCampanha.message);
        resultados.push({ campanha: campanha.nome, status: 'erro', motivo: erroCampanha.message });
      }
    }

    return Response.json({ success: true, processadas: resultados.length, resultados });
  } catch (error) {
    console.error('Erro geral no processamento de cadências:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}