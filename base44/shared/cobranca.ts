const primeiroNome = (nome) => String(nome || '').split(' ')[0];

export const moeda = (valor) =>
  `R$ ${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

// Define qual cobrança cabe hoje para este contrato.
// diasParaVencer: 3 = lembrete, 0 = vence hoje, negativo = atraso (3, 7 e 15 dias).
export function definirTipoCobranca(negocio, hoje = new Date()) {
  const dia = Number(negocio.dia_cobranca || 0);
  if (!dia) return null;

  const diaHoje = hoje.getDate();
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diaVencimento = Math.min(dia, ultimoDia);
  const diff = diaVencimento - diaHoje;

  if (negocio.status_pagamento === 'Inadimplente') {
    if ([-3, -7, -15].includes(diff)) return { tipo: 'Atraso', dias: Math.abs(diff) };
    return null;
  }
  if (negocio.status_pagamento !== 'Ativo') return null;
  if (diff === 3) return { tipo: 'Lembrete', dias: 3 };
  if (diff === 0) return { tipo: 'Vencimento', dias: 0 };
  return null;
}

export function montarMensagem(negocio, cobranca) {
  const nome = primeiroNome(negocio.nome_cliente);
  const valor = moeda(negocio.valor_mensalidade);
  const link = negocio.stripe_payment_link ? `\n\nPagamento: ${negocio.stripe_payment_link}` : '';

  if (cobranca.tipo === 'Lembrete') {
    return `Olá ${nome}! Passando para lembrar que a mensalidade da Glória (${valor}) vence em ${cobranca.dias} dias, no dia ${negocio.dia_cobranca}.${link}`;
  }
  if (cobranca.tipo === 'Vencimento') {
    return `Olá ${nome}! Hoje é o vencimento da sua mensalidade da Glória no valor de ${valor}. Qualquer dúvida, me chame por aqui.${link}`;
  }
  return `Olá ${nome}! Identificamos que a mensalidade de ${valor} está com ${cobranca.dias} dias de atraso. Consegue regularizar hoje para não interrompermos o serviço?${link}`;
}