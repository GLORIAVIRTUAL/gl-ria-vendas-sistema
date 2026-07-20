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
    const cnaeQuery = filters.cnaeEspecifico || filters.cnae;
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
    if (filters.contatoDisponivel === 'SIM') conditions.push({ $or: [
      { 'telefones.telefone_completo': { $exists: true } },
      { 'emails.email': { $exists: true } }
    ] });
    if (filters.situacaoCadastral) conditions.push({ situacao_cadastral: filters.situacaoCadastral });

    const filtrosInformados = conditions.filter((item) => !('situacao_cadastral' in item));
    if (filtrosInformados.length === 0) {
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
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});