import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enviarWhatsApp } from '../../shared/envio.ts';
import { definirTipoCobranca, montarMensagem, moeda } from '../../shared/cobranca.ts';

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const service = base44.asServiceRole;

  try {
    const hoje = new Date();
    const mesRef = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const negocios = await service.entities.NegocioFechado.list('-created_date', 500);
    const resultado = { avaliados: negocios.length, enviados: 0, ignorados: 0, erros: 0, detalhes: [] };

    for (const negocio of negocios) {
      const cobranca = definirTipoCobranca(negocio, hoje);
      if (!cobranca) {
        resultado.ignorados++;
        continue;
      }

      const referencia = `${negocio.id}-${cobranca.tipo}-${cobranca.dias}-${mesRef}`;
      const jaEnviado = await service.entities.CobrancaEnvio.filter({ referencia });
      if (jaEnviado.length > 0) {
        resultado.ignorados++;
        continue;
      }

      const mensagem = montarMensagem(negocio, cobranca);

      if (!negocio.telefone_cliente) {
        resultado.erros++;
        await service.entities.CobrancaEnvio.create({
          negocio_id: negocio.id,
          nome_cliente: negocio.nome_cliente,
          nome_empresa: negocio.nome_empresa,
          tipo: cobranca.tipo,
          canal: 'WhatsApp',
          mensagem,
          valor: negocio.valor_mensalidade,
          referencia,
          status: 'erro',
          erro_mensagem: 'Cliente sem telefone cadastrado'
        });
        continue;
      }

      try {
        const { destino } = await enviarWhatsApp({ telefone: negocio.telefone_cliente, mensagem });
        await service.entities.CobrancaEnvio.create({
          negocio_id: negocio.id,
          nome_cliente: negocio.nome_cliente,
          nome_empresa: negocio.nome_empresa,
          tipo: cobranca.tipo,
          canal: 'WhatsApp',
          destino,
          mensagem,
          valor: negocio.valor_mensalidade,
          referencia,
          link_pagamento: negocio.stripe_payment_link,
          status: 'enviado'
        });
        resultado.enviados++;
        resultado.detalhes.push(`${negocio.nome_empresa}: ${cobranca.tipo} (${moeda(negocio.valor_mensalidade)})`);
        console.log(`Cobrança ${cobranca.tipo} enviada para ${negocio.nome_empresa}`);
      } catch (erro) {
        resultado.erros++;
        await service.entities.CobrancaEnvio.create({
          negocio_id: negocio.id,
          nome_cliente: negocio.nome_cliente,
          nome_empresa: negocio.nome_empresa,
          tipo: cobranca.tipo,
          canal: 'WhatsApp',
          destino: negocio.telefone_cliente,
          mensagem,
          valor: negocio.valor_mensalidade,
          referencia,
          status: 'erro',
          erro_mensagem: erro.message
        });
        console.error(`Erro ao cobrar ${negocio.nome_empresa}: ${erro.message}`);
      }
    }

    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    console.error('Erro na cobrança automatizada:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}