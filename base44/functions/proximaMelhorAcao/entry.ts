import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Estágios em que o lead ainda exige ação comercial ativa.
const ESTAGIOS_ATIVOS = [
  'Prospeccao', 'Contatado', 'Engajado', 'Qualificado',
  'Reuniao_Marcada', 'Reuniao_Realizada', 'Em_Avaliacao', 'Proposta', 'Negociacao'
];

function diasDesde(data) {
  if (!data) return null;
  const ms = Date.now() - new Date(data).getTime();
  return Math.floor(ms / 86400000);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const db = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const limite = body.limite || 25;

    const todos = await db.entities.Lead.list('-updated_date', 500);
    const leads = todos.filter((l) => ESTAGIOS_ATIVOS.includes(l.estagio)).slice(0, limite);

    let atualizados = 0;
    let erros = 0;

    for (const lead of leads) {
      try {
        const diasNoEstagio = diasDesde(lead.estagio_atualizado_em || lead.updated_date);
        const diasSemContato = diasDesde(lead.updated_date);

        const prompt = `Você é o diretor comercial da Glória Vendas (soluções de IA para atendimento, vendas e automação).
Analise este lead do CRM e devolva a temperatura comercial e a PRÓXIMA MELHOR AÇÃO (uma única ação concreta, executável hoje).

Lead:
- Nome: ${lead.nome_cliente || 'não informado'}
- Empresa: ${lead.nome_empresa || 'não informada'}
- Produto de interesse: ${lead.produto_interesse || 'não definido'}
- Estágio atual: ${lead.estagio}
- Dias no estágio atual: ${diasNoEstagio ?? 'desconhecido'}
- Dias desde a última atualização: ${diasSemContato ?? 'desconhecido'}
- Valor estimado: ${lead.valor_estimado ? 'R$ ' + lead.valor_estimado : 'não informado'}
- Data da reunião: ${lead.data_reuniao || 'sem reunião'}
- Prioridade: ${lead.prioridade || 'Media'}
- Próximos passos registrados: ${lead.proximos_passos || 'nenhum'}
- Observações: ${(lead.observacoes || 'nenhuma').slice(0, 900)}
- Canais disponíveis: ${lead.telefone_cliente ? 'WhatsApp/Ligação' : ''} ${lead.email_cliente ? 'Email' : ''}

Regras:
- temperatura_score de 0 a 100 (engajamento recente, avanço no funil e proximidade do fechamento aumentam; inatividade longa reduz).
- Quente acima de 70, Morno entre 40 e 70, Frio abaixo de 40.
- proxima_melhor_acao: frase curta e imperativa, no máximo 140 caracteres.
- prazo_dias: 0 (hoje) a 14.
- Use apenas canais disponíveis.
- Responda em português do Brasil.`;

        const analise = await db.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              temperatura_score: { type: 'number' },
              temperatura: { type: 'string', enum: ['Frio', 'Morno', 'Quente'] },
              proxima_melhor_acao: { type: 'string' },
              motivo: { type: 'string' },
              canal: { type: 'string', enum: ['WhatsApp', 'Email', 'Ligacao', 'Reuniao', 'Interno'] },
              prazo_dias: { type: 'number' }
            },
            required: ['temperatura', 'proxima_melhor_acao']
          }
        });

        const prazo = new Date();
        prazo.setDate(prazo.getDate() + Math.max(0, Math.min(14, analise.prazo_dias || 0)));

        await db.entities.Lead.update(lead.id, {
          temperatura: analise.temperatura,
          temperatura_score: analise.temperatura_score,
          proxima_melhor_acao: analise.proxima_melhor_acao,
          proxima_acao_motivo: analise.motivo,
          proxima_acao_canal: analise.canal,
          proxima_acao_prazo: prazo.toISOString().split('T')[0],
          proxima_acao_atualizada_em: new Date().toISOString(),
          proxima_acao_concluida_em: null
        });
        atualizados++;
      } catch (erroLead) {
        erros++;
        console.error(`Erro no lead ${lead.id}:`, erroLead.message);
      }
    }

    return Response.json({ success: true, analisados: leads.length, atualizados, erros });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}