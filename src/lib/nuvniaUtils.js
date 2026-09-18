// Converte um lead da API Nuvnia no formato da entidade Prospect do sistema.
export const normalizeNuvniaLead = (lead = {}) => {
  const telefone = lead.telefone1 || lead.telefone2 || lead.telefone || "";
  const endereco = [lead.endereco, lead.bairro, lead.cidade, lead.uf, lead.cep ? `CEP ${lead.cep}` : ""]
    .filter(Boolean)
    .join(", ");
  return {
    cnpj: String(lead.cnpj || "").replace(/\D/g, "").padStart(14, "0"),
    razao_social: lead.razao_social || "Empresa sem razão social",
    nome_fantasia: lead.nome_fantasia || "",
    situacao_cadastral: lead.situacao_cadastral || "",
    segmento: "",
    ramo_atividade: lead.cnae_descricao || "",
    cnae: lead.cnae_principal || "",
    porte: portesNuvnia.find((item) => item.value === String(lead.porte_empresa))?.label || String(lead.porte_empresa || ""),
    faturamento: 0,
    faixa_funcionarios: "",
    capital_social: Number(lead.capital_social) || 0,
    email: String(lead.email || "").toLowerCase().trim(),
    telefone,
    whatsapp: "",
    site: "",
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

export const portesNuvnia = [
  { value: "01", label: "ME - Microempresa" },
  { value: "03", label: "EPP - Empresa de Pequeno Porte" },
  { value: "05", label: "Demais empresas" }
];

// A API Nuvnia só filtra por UF, CNAE, porte, cidade e nome.
// Os demais critérios são aplicados aqui, sobre os dados já retornados.
export const filtrarLeads = (leads, filters = {}) => {
  const bairro = String(filters.bairro || "").trim().toLowerCase();
  const capitalMinimo = Number(filters.capitalMinimo) || 0;
  const anoMinimo = Number(filters.anoAberturaMinimo) || 0;
  return leads.filter((prospect) => {
    const bruto = prospect.dados_kipflow || {};
    if (filters.exigirEmail === "sim" && !prospect.email) return false;
    if (filters.exigirEmail === "nao" && prospect.email) return false;
    if (filters.exigirTelefone === "sim" && !prospect.telefone) return false;
    if (filters.exigirTelefone === "nao" && prospect.telefone) return false;
    const socios = Array.isArray(bruto.socios) ? bruto.socios : [];
    if (filters.exigirSocios === "sim" && !socios.length) return false;
    if (filters.exigirSocios === "nao" && socios.length) return false;
    if (bairro && !String(bruto.bairro || "").toLowerCase().includes(bairro)) return false;
    if (capitalMinimo && (Number(prospect.capital_social) || 0) < capitalMinimo) return false;
    if (anoMinimo && Number(String(bruto.data_abertura || "").slice(0, 4)) < anoMinimo) return false;
    return true;
  });
};