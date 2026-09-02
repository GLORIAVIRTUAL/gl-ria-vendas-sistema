const API_BASE = 'https://api.kipflow.io';

export const normalizeText = (value) =>
  String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();

export const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

export const normalizeCnpj = (value) => {
  const digits = onlyDigits(value);
  return digits ? digits.padStart(14, '0') : '';
};

const buildError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const buildConditions = (filters) => {
  const conditions = [];

  if (filters.cnpj) {
    // O Kipflow valida o CNPJ com os 14 dígitos: converter para número
    // quebra CNPJs que começam com zero.
    conditions.push({ cnpj: normalizeCnpj(filters.cnpj) });
  }
  if (filters.nome) {
    const name = normalizeText(filters.nome);
    conditions.push({ $or: [
      { razao_social: { $fuzzy: name } },
      { nome_fantasia: { $fuzzy: name } }
    ] });
  }

  const cnaeQuery = filters.cnaeDetalhado || filters.cnaeEspecifico || filters.cnae;
  if (cnaeQuery) {
    const cnaeText = normalizeText(cnaeQuery);
    const cnaeCode = cnaeText.match(/^\d{5,7}/)?.[0];
    if (cnaeCode) {
      const code = Number(cnaeCode);
      const isSubclasse = cnaeCode.length >= 7;
      conditions.push({ $or: [
        { [isSubclasse ? 'cnae_principal_subclasse' : 'cnae_principal_classe']: code },
        { [`atividades_secundarias.${isSubclasse ? 'subclasse' : 'classe'}`]: code }
      ] });
    } else {
      conditions.push({ $or: [
        { cnae_principal_desc_subclasse: { $fuzzy: cnaeText } },
        { cnae_principal_desc_classe: { $fuzzy: cnaeText } },
        { 'atividades_secundarias.desc_subclasse': { $fuzzy: cnaeText } },
        { 'atividades_secundarias.ramo_de_atividade': { $fuzzy: cnaeText } }
      ] });
    }
  }

  if (filters.segmento) conditions.push({ segmento: filters.segmento });
  if (filters.porte) conditions.push({ porte: filters.porte });
  if (filters.uf) conditions.push({ sigla_uf: filters.uf });
  if (filters.municipio) conditions.push({ municipio: normalizeText(filters.municipio) });
  if (filters.faixaFuncionarios) conditions.push({ faixa_funcionarios_grupo: filters.faixaFuncionarios });
  if (filters.faturamentoMin) conditions.push({ faturamento: { $gte: Number(filters.faturamentoMin) } });
  if (filters.faturamentoMax) conditions.push({ faturamento: { $lte: Number(filters.faturamentoMax) } });
  if (filters.matriz === 'TRUE' || filters.matriz === 'FALSE') conditions.push({ matriz: filters.matriz });
  if (filters.situacaoCadastral) conditions.push({ situacao_cadastral: filters.situacaoCadastral });

  return conditions;
};

export const searchCompanies = async ({ apiKey, filters = {}, page = 0, size = 20 }) => {
  if (!apiKey) throw buildError('Kipflow não configurado', 500);

  const headers = { 'X-API-Key': apiKey, 'Content-Type': 'application/json' };
  const conditions = buildConditions(filters);
  const filtrosInformados = conditions.filter((item) => !('situacao_cadastral' in item));

  if (filtrosInformados.length === 0 && filters.contatoDisponivel !== 'SIM' && filters.sociosInformados !== 'SIM') {
    throw buildError('Informe pelo menos um filtro além da situação cadastral', 400);
  }

  const requestedSize = Math.min(50, Math.max(1, Number(size) || 20));
  const needsPostFilter = filters.contatoDisponivel === 'SIM' || filters.sociosInformados === 'SIM';
  const sourcePageSize = needsPostFilter ? 50 : requestedSize;
  const sourcePages = needsPostFilter ? 3 : 1;
  const datasets = filters.sociosInformados === 'SIM'
    ? ['basic', 'complete', 'address', 'partners']
    : ['basic', 'complete', 'address'];

  const candidates = [];
  let sourcePagination = {};
  let totalCost = 0;
  let costFormatted = '';

  for (let offset = 0; offset < sourcePages; offset += 1) {
    const response = await fetch(`${API_BASE}/companies/v1/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        $filter: { $and: conditions },
        $page: Math.max(0, Number(page) || 0) * sourcePages + offset,
        $size: sourcePageSize,
        datasets
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      const detalhe = payload.message || payload.error;
      const mensagem = typeof detalhe === 'string' ? detalhe : detalhe ? JSON.stringify(detalhe) : 'Erro na consulta Kipflow';
      throw buildError(mensagem, response.status);
    }
    const rows = Array.isArray(payload.data) ? payload.data : [];
    candidates.push(...rows);
    sourcePagination = payload.pagination || sourcePagination;
    totalCost += Number(payload.cost) || 0;
    costFormatted = payload.costFormatted || costFormatted;
    if (rows.length < sourcePageSize) break;
  }

  let matched = candidates;
  const hasPartnerName = (partner) => Boolean(String(partner?.nome_socio || partner?.nome || '').trim());

  if (filters.sociosInformados === 'SIM') {
    matched = matched.filter((company) => Array.isArray(company.socios) && company.socios.some(hasPartnerName));
  }

  if (filters.contatoDisponivel === 'SIM') {
    const findContact = async (company) => {
      const cnpj = normalizeCnpj(company.cnpj);
      const phonesResponse = await fetch(`${API_BASE}/contacts/v1/phones?cnpj=${cnpj}&phone_limit=3&exclude_contador=true`, { headers });
      const phonesPayload = phonesResponse.ok ? await phonesResponse.json() : {};
      const phoneData = phonesPayload?.data;
      const phones = Array.isArray(phoneData) ? phoneData : Array.isArray(phoneData?.phones) ? phoneData.phones : [];
      if (phones.length) return { ...company, telefones: phones };

      const emailsResponse = await fetch(`${API_BASE}/contacts/v1/emails?cnpj=${cnpj}&email_limit=3`, { headers });
      const emailsPayload = emailsResponse.ok ? await emailsResponse.json() : {};
      const emailData = emailsPayload?.data;
      const emails = Array.isArray(emailData) ? emailData : Array.isArray(emailData?.emails) ? emailData.emails : [];
      return emails.length ? { ...company, emails } : null;
    };

    const withContacts = [];
    for (let index = 0; index < matched.length && withContacts.length < requestedSize; index += 5) {
      const batch = await Promise.all(matched.slice(index, index + 5).map(findContact));
      withContacts.push(...batch.filter(Boolean));
      if (index + 5 < matched.length && withContacts.length < requestedSize) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    matched = withContacts;
  }

  matched = matched.slice(0, requestedSize);

  if (filters.sociosInformados === 'SIM' && matched.length) {
    const enrichCompanyPartners = async (company) => {
      const cnpj = normalizeCnpj(company.cnpj);
      const emailResponse = await fetch(`${API_BASE}/contacts/v1/emails?cnpj=${cnpj}&email_limit=50`, { headers });
      const emailPayload = emailResponse.ok ? await emailResponse.json() : {};
      const companyEmails = Array.isArray(emailPayload?.data) ? emailPayload.data : [];
      const partners = company.socios.filter(hasPartnerName).map((partner) => {
        const partnerName = normalizeText(partner.nome_socio || partner.nome);
        const emails = companyEmails.filter((item) => {
          const ownerName = normalizeText(item.full_name || item.nome_completo || item.nome);
          return ownerName && (ownerName === partnerName || ownerName.includes(partnerName) || partnerName.includes(ownerName));
        }).map((item) => item.email).filter(Boolean);
        return emails.length ? { ...partner, emails_socio: [...new Set(emails)] } : partner;
      });
      return { ...company, socios: partners };
    };

    const enriched = [];
    for (let index = 0; index < matched.length; index += 5) {
      enriched.push(...await Promise.all(matched.slice(index, index + 5).map(enrichCompanyPartners)));
      if (index + 5 < matched.length) await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    matched = enriched;
  }

  return {
    data: matched,
    datasets,
    pagination: {
      ...sourcePagination,
      page: Math.max(0, Number(page) || 0),
      size: requestedSize,
      returned: matched.length,
      total: needsPostFilter ? matched.length : sourcePagination.total
    },
    cost: totalCost,
    costFormatted
  };
};

export const normalizeCompany = (company) => {
  const emails = Array.isArray(company.emails) ? company.emails : [];
  const phones = Array.isArray(company.telefones) ? company.telefones : [];
  const socios = Array.isArray(company.socios) ? company.socios : [];
  const decisor = socios.find((socio) => Array.isArray(socio?.emails_socio) && socio.emails_socio.length) || socios[0] || null;
  const emailDecisor = Array.isArray(decisor?.emails_socio) ? decisor.emails_socio[0] : '';
  const email = emailDecisor || emails.find((item) => !item?.pertence_contador)?.email || emails[0]?.email || '';
  const whatsapp = phones.find((item) => item?.whatsapp && !item?.pertence_contador)?.telefone_completo || '';
  const phone = phones.find((item) => !item?.pertence_contador)?.telefone_completo || phones[0]?.telefone_completo || '';
  const address = company.endereco && typeof company.endereco === 'object' ? company.endereco : {};
  const endereco = [
    address.logradouro || company.logradouro,
    address.numero || company.numero,
    address.complemento || company.complemento,
    address.bairro || company.bairro,
    address.municipio || company.municipio,
    address.sigla_uf || address.uf || company.sigla_uf || company.uf,
    (address.cep || company.cep) ? `CEP ${address.cep || company.cep}` : ''
  ].filter(Boolean).join(', ') || (typeof company.endereco === 'string' ? company.endereco : '');

  return {
    cnpj: normalizeCnpj(company.cnpj),
    razao_social: company.razao_social || 'Empresa sem razão social',
    nome_fantasia: company.nome_fantasia || '',
    situacao_cadastral: company.situacao_cadastral || '',
    segmento: company.segmento || '',
    ramo_atividade: company.ramo_de_atividade || '',
    cnae: company.cnae_principal_desc_subclasse || company.cnae_principal_desc_classe || '',
    porte: company.porte || '',
    faturamento: company.faturamento || 0,
    faixa_funcionarios: company.faixa_funcionarios_grupo || '',
    capital_social: company.capital_social || 0,
    email,
    telefone: phone,
    whatsapp,
    site: company.sites?.[0]?.site || '',
    linkedin: company.linkedin_url || '',
    instagram: company.instagram?.[0]?.url || '',
    decisor_nome: decisor?.nome_socio || decisor?.nome || '',
    decisor_cargo: decisor?.qualificacao_socio || decisor?.cargo || decisor?.funcao || '',
    endereco,
    municipio: company.municipio || address.municipio || '',
    uf: company.uf || company.sigla_uf || address.uf || address.sigla_uf || '',
    status: 'salvo',
    dados_kipflow: company
  };
};

const primeiro = (lista) => (Array.isArray(lista) && lista.length ? lista[0] : '');

// O Kipflow só aceita estes valores no campo "segmento". Qualquer outro
// (ex: "Saúde", "Imobiliário") deve virar busca por atividade/CNAE.
const SEGMENTOS_KIPFLOW = ['COMERCIO', 'INDUSTRIA', 'SERVICOS', 'AGROPECUARIA', 'CONSTRUCAO CIVIL'];

export const icpToFilters = (icp) => {
  const exigeContato = Boolean(icp.exigir_telefone || icp.exigir_email || icp.exigir_whatsapp);
  const filters = { situacaoCadastral: 'ATIVA' };

  const segmento = normalizeText(icp.segmento);
  if (segmento && SEGMENTOS_KIPFLOW.includes(segmento)) filters.segmento = segmento;
  if (icp.porte_minimo) filters.porte = icp.porte_minimo;
  if (primeiro(icp.estados)) filters.uf = primeiro(icp.estados);
  if (primeiro(icp.cidades)) filters.municipio = primeiro(icp.cidades);
  // Sem CNAE configurado, usa o segmento/palavra-chave do ICP como busca por atividade.
  const cnaeAlvo = primeiro(icp.cnaes_desejados)
    || (segmento && !filters.segmento ? segmento : '')
    || primeiro(icp.palavras_chave);
  if (cnaeAlvo) filters.cnae = cnaeAlvo;
  if (icp.faturamento_minimo) filters.faturamentoMin = icp.faturamento_minimo;
  if (icp.matriz_filial === 'Matriz') filters.matriz = 'TRUE';
  if (icp.matriz_filial === 'Filial') filters.matriz = 'FALSE';
  if (exigeContato) filters.contatoDisponivel = 'SIM';

  return filters;
};

const SITUACOES_VALIDAS = ['ATIVA', 'ATIVO'];

export const prospectAtendeIcp = (prospect, icp) => {
  const situacao = normalizeText(prospect.situacao_cadastral);
  if (situacao && !SITUACOES_VALIDAS.includes(situacao)) return false;

  const cnaeTexto = normalizeText(`${prospect.cnae} ${prospect.ramo_atividade}`);
  const excluidos = Array.isArray(icp.cnaes_excluidos) ? icp.cnaes_excluidos : [];
  if (excluidos.some((item) => item && cnaeTexto.includes(normalizeText(item)))) return false;

  if (icp.exigir_telefone && !prospect.telefone) return false;
  if (icp.exigir_email && !prospect.email) return false;
  if (icp.exigir_site && !prospect.site) return false;
  if (icp.exigir_whatsapp && !prospect.whatsapp) return false;

  return true;
};