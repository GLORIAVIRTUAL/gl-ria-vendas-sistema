// Converte um lead da API Nuvnia no formato da entidade Prospect do sistema.
export const normalizeNuvniaLead = (lead = {}) => {
  const telefone = lead.telefone1 || lead.telefone2 || lead.telefone || "";
  const endereco = [lead.logradouro, lead.numero, lead.complemento, lead.bairro, lead.cidade, lead.uf, lead.cep ? `CEP ${lead.cep}` : ""]
    .filter(Boolean)
    .join(", ");
  return {
    cnpj: String(lead.cnpj || "").replace(/\D/g, "").padStart(14, "0"),
    razao_social: lead.razao_social || "Empresa sem razão social",
    nome_fantasia: lead.nome_fantasia || "",
    situacao_cadastral: lead.situacao_cadastral || "",
    segmento: lead.segmento || "",
    ramo_atividade: lead.cnae_principal_descricao || lead.atividade_principal || "",
    cnae: lead.cnae_principal || "",
    porte: lead.porte_descricao || lead.porte || "",
    faturamento: Number(lead.faturamento) || 0,
    faixa_funcionarios: lead.faixa_funcionarios || "",
    capital_social: Number(lead.capital_social) || 0,
    email: String(lead.email || "").toLowerCase().trim(),
    telefone,
    whatsapp: "",
    site: lead.site || "",
    linkedin: "",
    instagram: "",
    endereco,
    municipio: lead.cidade || "",
    uf: lead.uf || "",
    status: "salvo",
    origem_prospeccao: "Nuvnia Leads",
    dados_kipflow: lead
  };
};