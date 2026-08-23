// Pipeline comercial único do Glória Vendas (mesma ordem do backend).
export const ESTAGIOS_LABEL = {
  Prospeccao: "Prospecção",
  Contatado: "Contatado",
  Engajado: "Engajado",
  Qualificado: "Qualificado",
  Reuniao_Marcada: "Reunião Marcada",
  Reuniao_Realizada: "Reunião Realizada",
  Em_Avaliacao: "Em Avaliação",
  Proposta: "Proposta",
  Negociacao: "Negociação",
  Negocio_Fechado: "Negócio Fechado",
  Implantacao: "Implantação",
  Inicio_de_Uso: "Início de Uso",
  Estavel: "Estável",
  Desistiu: "Fechado Perdido"
};

export const labelEstagio = (id) => ESTAGIOS_LABEL[id] || id || "—";