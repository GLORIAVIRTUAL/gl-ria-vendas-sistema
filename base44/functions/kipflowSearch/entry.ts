import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });

    const { filters = {}, page = 0, size = 20 } = await req.json();
    const conditions = [];
    if (filters.cnpj) conditions.push({ cnpj: Number(String(filters.cnpj).replace(/\D/g, '')) });
    if (filters.nome) conditions.push({ razao_social: { $fuzzy: filters.nome.trim().toUpperCase() } });
    const cnaeQuery = filters.cnaeDetalhado || filters.cnaeEspecifico || filters.cnae;
    if (cnaeQuery) conditions.push({ cnae_principal_desc_subclasse: { $fuzzy: cnaeQuery.trim().toUpperCase() } });
    if (filters.segmento) conditions.push({ segmento: filters.segmento });
    if (filters.porte) conditions.push({ porte: filters.porte });
    if (filters.uf) conditions.push({ sigla_uf: filters.uf });
    if (filters.municipio) conditions.push({ municipio: filters.municipio.trim().toUpperCase() });
    if (filters.faixaFuncionarios) conditions.push({ faixa_funcionarios_grupo: filters.faixaFuncionarios });
    if (filters.faturamentoMin) conditions.push({ faturamento: { $gte: Number(filters.faturamentoMin) } });
    if (filters.faturamentoMax) conditions.push({ faturamento: { $lte: Number(filters.faturamentoMax) } });
    if (filters.matriz === 'TRUE') conditions.push({ matriz: true });
    if (filters.matriz === 'FALSE') conditions.push({ matriz: false });
    if (filters.situacaoCadastral) conditions.push({ situacao_cadastral: filters.situacaoCadastral });

    const filtrosInformados = conditions.filter((item) => !('situacao_cadastral' in item));
    if (filtrosInformados.length === 0 && filters.contatoDisponivel !== 'SIM') {
      return Response.json({ error: 'Informe pelo menos um filtro além da situação cadastral' }, { status: 400 });
    }

    const apiKey = Deno.env.get('KIPFLOW_API_KEY');
    if (!apiKey) return Response.json({ error: 'Kipflow não configurado' }, { status: 500 });

    const response = await fetch('https://api.kipflow.io/companies/v1/search', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        $filter: { $and: conditions },
        $page: Math.max(0, Number(page) || 0),
        $size: Math.min(50, Math.max(1, Number(size) || 20)),
        datasets: ['basic', 'complete', 'address']
      })
    });

    const data = await response.json();
    if (!response.ok) return Response.json({ error: data.message || data.error || 'Erro na consulta Kipflow' }, { status: response.status });

    if (filters.contatoDisponivel === 'SIM') {
      const companies = Array.isArray(data.data) ? data.data : [];
      const headers = { 'X-API-Key': apiKey };
      const findContact = async (company) => {
        const cnpj = String(company.cnpj || '').padStart(14, '0');
        const phonesResponse = await fetch(`https://api.kipflow.io/contacts/v1/phones?cnpj=${cnpj}&phone_limit=1&exclude_contador=true`, { headers });
        const phonesPayload = await phonesResponse.json();
        const phones = phonesPayload?.data?.phones || [];
        if (phones.length) return { telefones: phones, emails: [], ...company };

        const emailsResponse = await fetch(`https://api.kipflow.io/contacts/v1/emails?cnpj=${cnpj}&email_limit=1`, { headers });
        const emailsPayload = await emailsResponse.json();
        const emails = Array.isArray(emailsPayload?.data) ? emailsPayload.data : [];
        return emails.length ? { telefones: [], emails, ...company } : null;
      };

      const matched = [];
      for (let index = 0; index < companies.length; index += 4) {
        const batch = await Promise.all(companies.slice(index, index + 4).map(findContact));
        matched.push(...batch.filter(Boolean));
        if (index + 4 < companies.length) await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      data.data = matched;
      data.pagination = { ...(data.pagination || {}), total: matched.length };
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});