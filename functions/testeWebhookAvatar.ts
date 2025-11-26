// Função para enviar webhook de teste para o chatbot
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    const dadosTeste = {
      agendamento_id: "teste_" + Date.now(),
      nome_cliente: "João Silva Teste",
      telefone_cliente: "5511999999999",
      email_cliente: "joao.teste@email.com",
      data: "2025-11-28",
      horario: "14:00",
      data_formatada: "Sexta-feira, 28 de novembro",
      produto: "Gloria_Vendas",
      link_reuniao: "https://meet.google.com/abc-defg-hij",
      mensagem: "✅ Reunião agendada com sucesso!\n\n📅 Sexta-feira, 28 de novembro às 14:00\n\n🔗 Link da reunião:\nhttps://meet.google.com/abc-defg-hij"
    };

    console.log("Enviando webhook para:", 'https://ra-bcknd.com/v1/api-trigger/cayly9lw2sl4z6jtvs5v');
    console.log("Dados:", JSON.stringify(dadosTeste));

    const response = await fetch('https://ra-bcknd.com/v1/api-trigger/cayly9lw2sl4z6jtvs5v', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dadosTeste)
    });

    console.log("Response status:", response.status);
    const responseText = await response.text();
    console.log("Response body:", responseText);

    return Response.json({
      sucesso: true,
      mensagem: "Webhook de teste enviado!",
      dados_enviados: dadosTeste,
      resposta_webhook: {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      }
    }, { status: 200, headers });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json({
      sucesso: false,
      mensagem: error.message,
      stack: error.stack
    }, { status: 500, headers });
  }
});