// Regras de higiene e deduplicação da base de prospects.

export const normalizarCnpj = (v) => (v || "").replace(/\D/g, "");
export const normalizarTelefone = (v) => {
  const d = (v || "").replace(/\D/g, "");
  return d.length > 11 ? d.slice(-11) : d;
};
export const normalizarEmail = (v) => (v || "").trim().toLowerCase();

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const emailValido = (v) => EMAIL_VALIDO.test(normalizarEmail(v));
export const telefoneValido = (v) => {
  const d = normalizarTelefone(v);
  return d.length === 10 || d.length === 11;
};

// Agrupa prospects que compartilham a mesma chave (CNPJ, telefone ou e-mail).
export function encontrarDuplicados(prospects) {
  const grupos = [];
  const chaves = [
    { tipo: "CNPJ", fn: (p) => normalizarCnpj(p.cnpj) },
    { tipo: "Telefone", fn: (p) => normalizarTelefone(p.telefone || p.whatsapp) },
    { tipo: "E-mail", fn: (p) => normalizarEmail(p.email) }
  ];

  const jaAgrupados = new Set();

  chaves.forEach(({ tipo, fn }) => {
    const mapa = {};
    prospects.forEach((p) => {
      const chave = fn(p);
      if (!chave || chave.length < 5) return;
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(p);
    });

    Object.entries(mapa).forEach(([chave, itens]) => {
      if (itens.length < 2) return;
      if (itens.every((p) => jaAgrupados.has(p.id))) return;
      itens.forEach((p) => jaAgrupados.add(p.id));
      grupos.push({
        id: `${tipo}-${chave}`,
        tipo,
        chave,
        registros: [...itens].sort((a, b) => (a.created_date || "").localeCompare(b.created_date || ""))
      });
    });
  });

  return grupos;
}

// Problemas de contato que impedem cadência.
export function encontrarInvalidos(prospects) {
  return prospects
    .map((p) => {
      const problemas = [];
      const temEmail = !!normalizarEmail(p.email);
      const temTelefone = !!normalizarTelefone(p.telefone || p.whatsapp);

      if (!temEmail && !temTelefone) problemas.push("Sem e-mail e sem telefone");
      if (temEmail && !emailValido(p.email)) problemas.push("E-mail inválido");
      if (temTelefone && !telefoneValido(p.telefone || p.whatsapp)) problemas.push("Telefone inválido");
      if (!normalizarCnpj(p.cnpj)) problemas.push("Sem CNPJ");

      return problemas.length ? { prospect: p, problemas } : null;
    })
    .filter(Boolean);
}

// Constrói o registro mestre preenchendo campos vazios com dados dos duplicados.
const CAMPOS_MESCLAVEIS = [
  "razao_social", "nome_fantasia", "segmento", "ramo_atividade", "cnae", "porte",
  "faturamento", "faixa_funcionarios", "capital_social", "email", "telefone",
  "whatsapp", "site", "linkedin", "instagram", "endereco", "municipio", "uf",
  "icp_id", "score", "score_faixa", "crm_lead_id"
];

export function montarMesclagem(registros) {
  const [mestre, ...outros] = registros;
  const atualizacao = {};

  CAMPOS_MESCLAVEIS.forEach((campo) => {
    if (mestre[campo] !== undefined && mestre[campo] !== null && mestre[campo] !== "") return;
    const doador = outros.find((o) => o[campo] !== undefined && o[campo] !== null && o[campo] !== "");
    if (doador) atualizacao[campo] = doador[campo];
  });

  if (outros.some((o) => o.opt_out)) atualizacao.opt_out = true;

  return { mestre, remover: outros, atualizacao };
}