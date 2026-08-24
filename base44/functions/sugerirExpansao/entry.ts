import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { calcularSaude } from '../../shared/saudeCliente.ts';

const MESES_MINIMOS = 3;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { negocio_id } = await req.json();
    if (!negocio_id) return Response.json({ error: 'negocio_id é obrigatório' }, { status: 400 });

    const negocio = await base44.asServiceRole.entities.NegocioFechado.get(negocio_id);
    if (!negocio) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const saude = calcularSaude(negocio);
    if (saude.faixa !== 'Saudavel' || saude.meses < MESES_MINIMOS) {
      return Response.json({
        error: `Cliente ainda não elegível: precisa estar saudável e com ${MESES_MINIMOS}+ meses de contrato.`
      }, { status: 400 });
    }

    const produtos = await base44.asServiceRole.entities.Produto.filter({ ativo: true });
    const catalogo = produtos.length
      ? produtos.map((p) => `- ${p.produto} (a partir de R$ ${p.preco_recomendado}/mês)`).join('\n')
      : '- Atendimento IA 24/7\n- Máquina de Vídeos\n- Glória Clínica\n- Glória Vendas\n- Especialistas Virtuais\n- Sites em 24 Horas';

    const prompt = `Você é o head comercial da Glória, empresa de soluções de IA e automação para empresas.

Cliente atual da carteira:
- Empresa: ${negocio.nome_empresa}
- Contato: ${negocio.nome_cliente}
- Produtos já contratados: ${negocio.produto}
- Mensalidade atual: R$ ${negocio.valor_mensalidade || 0}
- Tempo de contrato: ${saude.meses} meses
- Score de saúde: ${saude.score}/100
- Observações: ${negocio.observacoes || 'nenhuma'}

Catálogo de produtos disponíveis:
${catalogo}

Recomende o PRÓXIMO produto (upsell/cross-sell) mais coerente para este cliente, que ele ainda NÃO possui.
A abordagem deve ser curta, natural para WhatsApp, no português do Brasil, focada no resultado para o cliente — sem parecer venda agressiva.`;

    const resultado = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          produto_sugerido: { type: 'string' },
          valor_sugerido: { type: 'number' },
          justificativa: { type: 'string' },
          abordagem: { type: 'string' }
        },
        required: ['produto_sugerido', 'justificativa', 'abordagem']
      }
    });

    const sugestao = await base44.asServiceRole.entities.SugestaoExpansao.create({
      negocio_id,
      nome_cliente: negocio.nome_cliente,
      nome_empresa: negocio.nome_empresa,
      produto_atual: negocio.produto,
      produto_sugerido: resultado.produto_sugerido,
      valor_sugerido: resultado.valor_sugerido || 0,
      justificativa: resultado.justificativa,
      abordagem: resultado.abordagem,
      status: 'Sugerida',
      gerado_em: new Date().toISOString()
    });

    console.log(`Sugestão de expansão criada para ${negocio.nome_empresa}: ${resultado.produto_sugerido}`);

    return Response.json({ ok: true, sugestao });
  } catch (error) {
    console.error('Erro ao sugerir expansão:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}