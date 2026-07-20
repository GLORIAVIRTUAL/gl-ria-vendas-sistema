export const normalizeCompany = (company) => {
  const emails = Array.isArray(company.emails) ? company.emails : [];
  const phones = Array.isArray(company.telefones) ? company.telefones : [];
  const email = emails.find((item) => !item?.pertence_contador)?.email || emails[0]?.email || "";
  const whatsapp = phones.find((item) => item?.whatsapp && !item?.pertence_contador)?.telefone_completo || "";
  const phone = phones.find((item) => !item?.pertence_contador)?.telefone_completo || phones[0]?.telefone_completo || "";
  return {
    cnpj: String(company.cnpj || "").padStart(14, "0"), razao_social: company.razao_social || "Empresa sem razão social",
    nome_fantasia: company.nome_fantasia || "", situacao_cadastral: company.situacao_cadastral || "",
    segmento: company.segmento || "", ramo_atividade: company.ramo_de_atividade || "",
    cnae: company.cnae_principal_desc_subclasse || company.cnae_principal_desc_classe || "", porte: company.porte || "",
    faturamento: company.faturamento || 0, faixa_funcionarios: company.faixa_funcionarios_grupo || "", capital_social: company.capital_social || 0,
    email, telefone: phone, whatsapp, site: company.sites?.[0]?.site || "", linkedin: company.linkedin_url || "",
    instagram: company.instagram?.[0]?.url || "", endereco: company.endereco || "", municipio: company.municipio || "", uf: company.uf || company.sigla_uf || "",
    status: "salvo", dados_kipflow: company
  };
};

export const formatCnpj = (value) => String(value || "").replace(/\D/g, "").replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
export const formatMoney = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });