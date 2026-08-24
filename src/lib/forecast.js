// Probabilidade de fechamento por estágio do funil (usada no forecast ponderado).
export const PROBABILIDADE_ESTAGIO = {
  Prospeccao: 0.05,
  Contatado: 0.1,
  Engajado: 0.15,
  Qualificado: 0.25,
  Reuniao_Marcada: 0.35,
  Reuniao_Realizada: 0.45,
  Em_Avaliacao: 0.55,
  Proposta: 0.65,
  Negociacao: 0.8
};

export const ESTAGIOS_GANHOS = ["Negocio_Fechado", "Implantacao", "Inicio_de_Uso", "Estavel"];
export const ESTAGIOS_PERDIDOS = ["Desistiu"];

export const ESTAGIO_LABEL = {
  Prospeccao: "Prospecção",
  Contatado: "Contatado",
  Engajado: "Engajado",
  Qualificado: "Qualificado",
  Reuniao_Marcada: "Reunião Marcada",
  Reuniao_Realizada: "Reunião Realizada",
  Em_Avaliacao: "Em Avaliação",
  Proposta: "Proposta",
  Negociacao: "Negociação"
};

export const formatarMoeda = (valor) =>
  (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function calcularForecast(leads) {
  const abertos = leads.filter(
    (l) => PROBABILIDADE_ESTAGIO[l.estagio] !== undefined
  );

  const porEtapa = Object.keys(PROBABILIDADE_ESTAGIO).map((estagio) => {
    const doEstagio = abertos.filter((l) => l.estagio === estagio);
    const valor = doEstagio.reduce((s, l) => s + (l.valor_estimado || 0), 0);
    return {
      estagio,
      label: ESTAGIO_LABEL[estagio],
      probabilidade: PROBABILIDADE_ESTAGIO[estagio],
      quantidade: doEstagio.length,
      valor,
      ponderado: valor * PROBABILIDADE_ESTAGIO[estagio]
    };
  });

  return {
    porEtapa,
    pipelineAberto: porEtapa.reduce((s, e) => s + e.valor, 0),
    forecastPonderado: porEtapa.reduce((s, e) => s + e.ponderado, 0),
    negociosAbertos: abertos.length
  };
}

export function calcularRealizado(leads, mes) {
  const doMes = leads.filter(
    (l) => ESTAGIOS_GANHOS.includes(l.estagio) && (l.estagio_atualizado_em || "").startsWith(mes)
  );
  return {
    valor: doMes.reduce((s, l) => s + (l.valor_estimado || 0), 0),
    negocios: doMes.length,
    reunioes: leads.filter(
      (l) => (l.data_reuniao || "").startsWith(mes) &&
        [...ESTAGIOS_GANHOS, "Reuniao_Realizada", "Em_Avaliacao", "Proposta", "Negociacao"].includes(l.estagio)
    ).length,
    perdidos: leads.filter(
      (l) => ESTAGIOS_PERDIDOS.includes(l.estagio) && (l.estagio_atualizado_em || "").startsWith(mes)
    ).length
  };
}