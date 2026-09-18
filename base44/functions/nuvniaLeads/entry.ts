import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const BASE_URL = 'https://api.leads.nuvnia.com/api/v2';

const chamarNuvnia = async (caminho, apiKey) => {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    headers: { 'X-API-Key': apiKey, Accept: 'application/json' }
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const detalhe = corpo?.error || corpo?.message || `Erro ${resposta.status} na API Nuvnia`;
    throw Object.assign(new Error(detalhe), { status: resposta.status });
  }
  return corpo;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });

    const apiKey = secrets.get('NUVNIA_API_KEY');
    if (!apiKey) return Response.json({ error: 'NUVNIA_API_KEY não configurada' }, { status: 500 });

    let payload = {};
    try {
      payload = await req.json();
    } catch (_erro) {
      payload = {};
    }

    const acao = payload.acao || 'search';

    if (acao === 'usage') {
      const resultado = await chamarNuvnia('/usage', apiKey);
      return Response.json({ success: true, ...resultado });
    }

    if (acao === 'cnpj') {
      const cnpj = String(payload.cnpj || '').replace(/\D/g, '');
      if (cnpj.length !== 14) return Response.json({ error: 'Informe um CNPJ válido com 14 dígitos' }, { status: 400 });
      const resultado = await chamarNuvnia(`/leads/${cnpj}`, apiKey);
      return Response.json({ success: true, ...resultado });
    }

    const filtros = payload.filtros || {};
    const parametros = new URLSearchParams();
    ['uf', 'cnae', 'porte', 'cidade', 'nome'].forEach((campo) => {
      const valor = String(filtros[campo] || '').trim();
      if (valor) parametros.set(campo, valor);
    });
    const limite = Math.min(Math.max(Number(payload.limit) || 20, 1), 100);
    parametros.set('limit', String(limite));
    parametros.set('offset', String(Math.max(Number(payload.offset) || 0, 0)));

    const resultado = await chamarNuvnia(`/leads/search?${parametros.toString()}`, apiKey);
    return Response.json({ success: true, ...resultado });
  } catch (error) {
    console.error('Erro na integração Nuvnia:', error.message);
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}