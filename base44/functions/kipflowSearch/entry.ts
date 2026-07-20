import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });

    const { filters = {}, page = 0, size = 20 } = await req.json();
    const apiKey = Deno.env.get('KIPFLOW_API_KEY');
    if (!apiKey) return Response.json({ error: 'Kipflow não configurado' }, { status: 500 });

    const apiBase = 'https://api.kipflow.io';
    const headers = { 'X-API-Key': apiKey, 'Content-Type': 'application/json' };
    const normalizeText = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
    const conditions = [];

    if (filters.cnpj) conditions.push({ cnpj: Number(String(filters.cnpj).replace(/\D/g, '')) });
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

    const filtrosInformados = conditions.filter((item) => !('situacao_cadastral' in item));
    if (filtrosInformados.length === 0 && filters.contatoDisponivel !== 'SIM' && filters.sociosInformados !== 'SIM') {
      return Response.json({ error: 'Informe pelo menos um filtro além da situação cadastral' }, { status: 400 });
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
      const response = await fetch(`${apiBase}/companies/v1/search`, {
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
      if (!response.ok) return Response.json({ error: payload.message || payload.error || 'Erro na consulta Kipflow' }, { status: response.status });
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
        const cnpj = String(company.cnpj || '').padStart(14, '0');
        const phonesResponse = await fetch(`${apiBase}/contacts/v1/phones?cnpj=${cnpj}&phone_limit=3&exclude_contador=true`, { headers });
        const phonesPayload = phonesResponse.ok ? await phonesResponse.json() : {};
        const phoneData = phonesPayload?.data;
        const phones = Array.isArray(phoneData) ? phoneData : Array.isArray(phoneData?.phones) ? phoneData.phones : [];
        if (phones.length) return { ...company, telefones: phones };

        const emailsResponse = await fetch(`${apiBase}/contacts/v1/emails?cnpj=${cnpj}&email_limit=3`, { headers });
        const emailsPayload = emailsResponse.ok ? await emailsResponse.json() : {};
        const emailData = emailsPayload?.data;
        const emails = Array.isArray(emailData) ? emailData : Array.isArray(emailData?.emails) ? emailData.emails : [];
        return emails.length ? { ...company, emails } : null;
      };

      const withContacts = [];
      for (let index = 0; index < matched.length && withContacts.length < requestedSize; index += 5) {
        const batch = await Promise.all(matched.slice(index, index + 5).map(findContact));
        withContacts.push(...batch.filter(Boolean));
        if (index + 5 < matched.length && withContacts.length < requestedSize) await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      matched = withContacts;
    }

    matched = matched.slice(0, requestedSize);

    if (filters.sociosInformados === 'SIM' && matched.length) {
      const enrichCompanyPartners = async (company) => {
        const cnpj = String(company.cnpj || '').padStart(14, '0');
        const emailResponse = await fetch(`${apiBase}/contacts/v1/emails?cnpj=${cnpj}&email_limit=50`, { headers });
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

    return Response.json({
      success: true,
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});