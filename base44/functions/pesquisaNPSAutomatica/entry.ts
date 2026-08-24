import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { calcularSaude } from '../../shared/saudeCliente.ts';
import { enviarWhatsApp } from '../../shared/envio.ts';

const DIAS_MINIMOS = 90;
const MOTIVO = 'Pesquisa NPS automática';
const LIMITE_ENVIOS = 20;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limite = Date.now() - DIAS_MINIMOS * 24 * 60 * 60 * 1000;

    const [negocios, respostas, interacoes] = await Promise.all([
      base44.asServiceRole.entities.NegocioFechado.list('-created_date', 500),
      base44.asServiceRole.entities.NPSResposta.list('-created_date', 500),
      base44.asServiceRole.entities.InteracaoRetencao.list('-created_date', 500)
    ]);

    const recente = (lista) => new Set(
      lista.filter((i) => new Date(i.created_date).getTime() > limite).map((i) => i.negocio_id)
    );
    const jaResponderam = recente(respostas);
    const jaPerguntados = recente(interacoes.filter((i) => i.motivo === MOTIVO));

    const elegiveis = negocios
      .map((n) => ({ negocio: n, saude: calcularSaude(n) }))
      .filter(({ negocio, saude }) =>
        negocio.telefone_cliente &&
        negocio.status_pagamento !== 'Cancelado' &&
        saude.meses >= 1 &&
        !jaResponderam.has(negocio.id) &&
        !jaPerguntados.has(negocio.id)
      )
      .slice(0, LIMITE_ENVIOS);

    console.log(`Clientes: ${negocios.length} | elegíveis para pesquisa NPS: ${elegiveis.length}`);

    let enviados = 0;
    const erros = [];

    for (const { negocio, saude } of elegiveis) {
      const primeiroNome = String(negocio.nome_cliente || '').split(' ')[0];
      const mensagem = `Olá ${primeiroNome}! Aqui é da Glória. Em uma escala de 0 a 10, quanto você recomendaria a Glória para outra empresa? Pode responder só com o número — sua resposta nos ajuda muito!`;
      try {
        await enviarWhatsApp({ telefone: negocio.telefone_cliente, mensagem });
        await base44.asServiceRole.entities.InteracaoRetencao.create({
          negocio_id: negocio.id,
          nome_cliente: negocio.nome_cliente,
          nome_empresa: negocio.nome_empresa,
          canal: 'WhatsApp',
          destino: negocio.telefone_cliente,
          mensagem,
          motivo: MOTIVO,
          saude_score: saude.score
        });
        enviados++;
      } catch (e) {
        console.error(`Falha ao enviar NPS para ${negocio.nome_empresa}: ${e.message}`);
        erros.push({ negocio_id: negocio.id, erro: e.message });
      }
    }

    return Response.json({ ok: true, analisados: negocios.length, elegiveis: elegiveis.length, enviados, erros });
  } catch (error) {
    console.error('Erro na pesquisa NPS automática:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}