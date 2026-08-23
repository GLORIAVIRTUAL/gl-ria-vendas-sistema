import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { searchCompanies } from '../../shared/kipflow.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });

    const { filters = {}, page = 0, size = 20 } = await req.json();
    const apiKey = Deno.env.get('KIPFLOW_API_KEY');

    const result = await searchCompanies({ apiKey, filters, page, size });
    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
});