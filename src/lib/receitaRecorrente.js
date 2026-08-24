import { format, startOfMonth, subMonths, isAfter } from "date-fns";

const inicioContrato = (negocio) =>
  startOfMonth(new Date(negocio.data_primeira_cobranca || negocio.created_date));

export function resumirReceita(negocios) {
  const ativos = negocios.filter((n) => n.status_pagamento === "Ativo");
  const inadimplentes = negocios.filter((n) => n.status_pagamento === "Inadimplente");
  const suspensos = negocios.filter((n) => n.status_pagamento === "Suspenso");
  const cancelados = negocios.filter((n) => n.status_pagamento === "Cancelado");

  const soma = (lista) => lista.reduce((t, n) => t + (n.valor_mensalidade || 0), 0);

  const mrr = soma(ativos);
  const mrrRisco = soma(inadimplentes) + soma(suspensos);
  const mrrPerdido = soma(cancelados);

  // Evolução dos últimos 12 meses (MRR acumulado dos contratos ativos iniciados até o mês)
  const hoje = startOfMonth(new Date());
  const evolucao = [];
  for (let i = 11; i >= 0; i--) {
    const mes = subMonths(hoje, i);
    const valor = negocios
      .filter((n) => n.status_pagamento !== "Cancelado" && !isAfter(inicioContrato(n), mes))
      .reduce((t, n) => t + (n.valor_mensalidade || 0), 0);
    const novos = negocios.filter(
      (n) => format(inicioContrato(n), "yyyy-MM") === format(mes, "yyyy-MM")
    );
    evolucao.push({
      mes: format(mes, "MM/yy"),
      mrr: valor,
      novos: novos.length,
      novo_mrr: soma(novos)
    });
  }

  // Composição por produto
  const porProdutoMap = {};
  ativos.forEach((n) => {
    (n.produto || "Não informado").split("+").forEach((parte) => {
      const nome = parte.trim() || "Não informado";
      const fatia = (n.valor_mensalidade || 0) / (n.produto || "x").split("+").length;
      porProdutoMap[nome] = porProdutoMap[nome] || { produto: nome, mrr: 0, clientes: 0 };
      porProdutoMap[nome].mrr += fatia;
      porProdutoMap[nome].clientes += 1;
    });
  });
  const porProduto = Object.values(porProdutoMap).sort((a, b) => b.mrr - a.mrr);

  const ticketMedio = ativos.length ? mrr / ativos.length : 0;

  return {
    mrr,
    arr: mrr * 12,
    mrrRisco,
    mrrPerdido,
    ticketMedio,
    clientesAtivos: ativos.length,
    inadimplentes: inadimplentes.length,
    cancelados: cancelados.length,
    evolucao,
    porProduto
  };
}