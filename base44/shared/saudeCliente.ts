// Regras de saúde da carteira de clientes (espelha src/lib/saudeCliente.js).

export function mesesDeContrato(negocio) {
  const inicio = negocio.data_primeira_cobranca ? new Date(negocio.data_primeira_cobranca) : new Date(negocio.created_date);
  if (isNaN(inicio.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
}

export function calcularSaude(negocio) {
  let score = 100;
  const alertas = [];

  if (negocio.status_pagamento === 'Inadimplente') { score -= 55; alertas.push('Pagamento em atraso'); }
  if (negocio.status_pagamento === 'Suspenso') { score -= 40; alertas.push('Contrato suspenso'); }
  if (negocio.status_pagamento === 'Cancelado') { score -= 90; alertas.push('Contrato cancelado'); }

  const meses = mesesDeContrato(negocio);
  if (meses < 1) { score -= 15; alertas.push('Cliente recém-implantado (onboarding crítico)'); }
  if (!negocio.telefone_cliente) { score -= 10; alertas.push('Sem telefone de contato'); }

  score = Math.max(0, Math.min(100, score));
  const faixa = score >= 75 ? 'Saudavel' : score >= 45 ? 'Atencao' : 'Risco';

  return { score, faixa, alertas, meses, oportunidadeUpsell: faixa === 'Saudavel' && meses >= 3 };
}