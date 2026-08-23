import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { searchCompanies, normalizeCompany, icpToFilters, prospectAtendeIcp, normalizeCnpj } from '../../shared/kipflow.ts';

const DIAS_POR_INTERVALO = {
  Diario: 1,
  '2x_por_semana': 3,
  Semanal: 7,
  Quinzenal: 15
};

const CAMPOS_ENRIQUECIVEIS = [
  'nome_fantasia', 'situacao_cadastral', 'segmento', 'ramo_atividade', 'cnae', 'porte',
  'faixa_funcionarios', 'email', 'telefone', 'whatsapp', 'site', 'linkedin', 'instagram',
  'endereco', 'municipio', 'uf'
];

const inicioDoDia = () => {
  const data = new Date();
  data.setUTCHours(0, 0, 0, 0);
  return data.toISOString();
};

const estaNoIntervalo = (icp) => {
  const dias = DIAS_POR_INTERVALO[icp.intervalo_execucao];
  if (!dias) return false;
  if (!icp.ultima_execucao) return true;
  const passados = (Date.now() - new Date(icp.ultima_execucao).getTime()) / 86400000;
  return passados >= dias;
};

const executarIcp = async (db, icp, origem) => {
  const iniciadoEm = new Date();

  const emAndamento = await db.entities.ProspeccaoLog.filter({ icp_id: icp.id, status: 'em_andamento' });
  const travado = emAndamento.some((log) => (Date.now() - new Date(log.iniciado_em || log.created_date).getTime()) < 900000);
  if (travado) {
    return { icp: icp.nome, status: 'ignorado', motivo: 'Já existe uma execução em andamento para este ICP' };
  }

  const limiteDiario = Number(icp.limite_diario_empresas) || 20;
  const criadosHoje = await db.entities.Prospect.filter({
    icp_id: icp.id,
    origem_prospeccao: 'Prospecção Automática',
    created_date: { $gte: inicioDoDia() }
  });
  const restante = limiteDiario - criadosHoje.length;
  if (restante <= 0) {
    return { icp: icp.nome, status: 'ignorado', motivo: 'Limite diário do ICP já foi atingido' };
  }

  const pagina = Number(icp.proxima_pagina) || 0;
  const log = await db.entities.ProspeccaoLog.create({
    icp_id: icp.id,
    icp_nome: icp.nome,
    origem,
    status: 'em_andamento',
    iniciado_em: iniciadoEm.toISOString(),
    pagina
  });

  const resultado = { encontradas: 0, novas: 0, existentes: 0, enriquecidas: 0, ignoradas: 0, erros: 0 };

  try {
    const busca = await searchCompanies({
      apiKey: Deno.env.get('KIPFLOW_API_KEY'),
      filters: icpToFilters(icp),
      page: pagina,
      size: Math.min(50, restante)
    });

    const empresas = (busca.data || []).map(normalizeCompany).filter((item) => item.cnpj);
    resultado.encontradas = empresas.length;

    for (const empresa of empresas) {
      try {
        if (!prospectAtendeIcp(empresa, icp)) {
          resultado.ignoradas += 1;
          continue;
        }

        const cnpj = normalizeCnpj(empresa.cnpj);
        const existentes = await db.entities.Prospect.filter({ cnpj });

        if (existentes.length) {
          resultado.existentes += 1;
          const atual = existentes[0];
          const faltantes = {};
          CAMPOS_ENRIQUECIVEIS.forEach((campo) => {
            if (!atual[campo] && empresa[campo]) faltantes[campo] = empresa[campo];
          });
          if (!atual.icp_id) faltantes.icp_id = icp.id;
          if (Object.keys(faltantes).length) {
            await db.entities.Prospect.update(atual.id, faltantes);
            resultado.enriquecidas += 1;
          }
          continue;
        }

        await db.entities.Prospect.create({
          ...empresa,
          cnpj,
          icp_id: icp.id,
          origem_prospeccao: 'Prospecção Automática'
        });
        resultado.novas += 1;
      } catch (erroEmpresa) {
        resultado.erros += 1;
        console.error(`Erro ao processar empresa do ICP ${icp.nome}:`, erroEmpresa.message);
      }
    }

    const finalizadoEm = new Date();
    await db.entities.ICP.update(icp.id, {
      proxima_pagina: pagina + 1,
      ultima_execucao: finalizadoEm.toISOString()
    });
    await db.entities.ProspeccaoLog.update(log.id, {
      ...resultado,
      status: 'sucesso',
      finalizado_em: finalizadoEm.toISOString(),
      duracao_ms: finalizadoEm.getTime() - iniciadoEm.getTime(),
      detalhes: `${resultado.encontradas} encontradas, ${resultado.novas} novas, ${resultado.existentes} já existentes, ${resultado.ignoradas} fora do ICP`
    });

    return { icp: icp.nome, status: 'sucesso', ...resultado };
  } catch (error) {
    const finalizadoEm = new Date();
    console.error(`Falha na prospecção do ICP ${icp.nome}:`, error.message);
    await db.entities.ProspeccaoLog.update(log.id, {
      ...resultado,
      status: 'erro',
      erros: resultado.erros + 1,
      erro_mensagem: error.message,
      finalizado_em: finalizadoEm.toISOString(),
      duracao_ms: finalizadoEm.getTime() - iniciadoEm.getTime()
    });
    return { icp: icp.nome, status: 'erro', motivo: error.message };
  }
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_erroAuth) {
      user = null;
    }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const db = base44.asServiceRole;
    let payload = {};
    try {
      payload = await req.json();
    } catch (_erroPayload) {
      payload = {};
    }

    const origem = payload.icp_id ? 'Manual' : 'Automatico';
    let icps = [];

    if (payload.icp_id) {
      const icp = await db.entities.ICP.get(payload.icp_id);
      if (!icp) return Response.json({ error: 'ICP não encontrado' }, { status: 404 });
      if (!icp.ativo) return Response.json({ error: 'Este ICP está inativo' }, { status: 400 });
      icps = [icp];
    } else {
      const todos = await db.entities.ICP.filter({ ativo: true, prospeccao_automatica_ativa: true });
      icps = todos.filter(estaNoIntervalo);
    }

    if (!icps.length) {
      return Response.json({ success: true, executados: 0, resultados: [], mensagem: 'Nenhum ICP elegível nesta execução' });
    }

    const resultados = [];
    for (const icp of icps) {
      resultados.push(await executarIcp(db, icp, origem));
    }

    return Response.json({ success: true, executados: resultados.length, resultados });
  } catch (error) {
    console.error('Erro geral na prospecção automática:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}