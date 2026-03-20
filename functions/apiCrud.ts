import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const API_KEY = Deno.env.get("CHATBOT_API_KEY");

// Entidades disponíveis
const ENTIDADES_PERMITIDAS = [
  "Agendamento", "Lead", "NegocioFechado", "Cliente", "Compromisso",
  "Afiliado", "Produto", "Contact", "Message", "AISettings",
  "DisparoWhatsApp", "DisparoEmail", "EmailNotificacao", "OnboardingCliente",
  "WhatsAppGateway", "MetaTemplate", "Keyword", "CustomField", "CustomAPI", "WebhookConfig"
];

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      },
    });
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    // Autenticação via API Key
    const apiKey = req.headers.get("X-API-Key") || req.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!apiKey || apiKey !== API_KEY) {
      return Response.json({ error: "API Key inválida. Envie no header X-API-Key ou Authorization: Bearer <key>" }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const { action, entity, id, data, filters, sort, limit } = body;

    if (!action) {
      return Response.json({
        message: "🚀 API CRUD - Glória Vendas",
        versao: "1.0",
        entidades: ENTIDADES_PERMITIDAS,
        acoes: {
          list: "Listar registros. Params: entity, filters (opcional), sort (opcional), limit (opcional)",
          get: "Buscar por ID. Params: entity, id",
          create: "Criar registro. Params: entity, data",
          update: "Atualizar registro. Params: entity, id, data",
          delete: "Deletar registro. Params: entity, id",
        },
        exemplo: {
          action: "list",
          entity: "Agendamento",
          filters: { status: "Agendada" },
          sort: "-created_date",
          limit: 20
        }
      }, { headers: corsHeaders });
    }

    if (!entity || !ENTIDADES_PERMITIDAS.includes(entity)) {
      return Response.json({ 
        error: `Entidade "${entity}" não encontrada. Disponíveis: ${ENTIDADES_PERMITIDAS.join(", ")}` 
      }, { status: 400, headers: corsHeaders });
    }

    const base44 = createClientFromRequest(req);
    const entityApi = base44.asServiceRole.entities[entity];

    if (!entityApi) {
      return Response.json({ error: `Entidade "${entity}" não disponível` }, { status: 400, headers: corsHeaders });
    }

    switch (action) {
      case "list": {
        let results;
        if (filters && Object.keys(filters).length > 0) {
          results = await entityApi.filter(filters, sort || "-created_date", limit || 50);
        } else {
          results = await entityApi.list(sort || "-created_date", limit || 50);
        }
        return Response.json({ success: true, count: results.length, data: results }, { headers: corsHeaders });
      }

      case "get": {
        if (!id) return Response.json({ error: "Parâmetro 'id' obrigatório" }, { status: 400, headers: corsHeaders });
        const record = await entityApi.get(id);
        return Response.json({ success: true, data: record }, { headers: corsHeaders });
      }

      case "create": {
        if (!data) return Response.json({ error: "Parâmetro 'data' obrigatório" }, { status: 400, headers: corsHeaders });
        const created = await entityApi.create(data);
        return Response.json({ success: true, data: created }, { status: 201, headers: corsHeaders });
      }

      case "update": {
        if (!id) return Response.json({ error: "Parâmetro 'id' obrigatório" }, { status: 400, headers: corsHeaders });
        if (!data) return Response.json({ error: "Parâmetro 'data' obrigatório" }, { status: 400, headers: corsHeaders });
        const updated = await entityApi.update(id, data);
        return Response.json({ success: true, data: updated }, { headers: corsHeaders });
      }

      case "delete": {
        if (!id) return Response.json({ error: "Parâmetro 'id' obrigatório" }, { status: 400, headers: corsHeaders });
        await entityApi.delete(id);
        return Response.json({ success: true, message: "Registro deletado" }, { headers: corsHeaders });
      }

      default:
        return Response.json({ error: `Ação "${action}" inválida. Use: list, get, create, update, delete` }, { status: 400, headers: corsHeaders });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});