// Função para enviar webhook de teste para o chatbot

Deno.serve(async (req) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    const dadosTeste = {
      agendamento_id: "teste_123456",
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

    const response = await fetch('https://ra-bcknd.com/v1/api-trigger/cayly9lw2sl4z6jtvs5v', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosTeste)
    });

    const responseText = await response.text();

    return Response.json({
      sucesso: true,
      mensagem: "Webhook de teste enviado com sucesso!",
      dados_enviados: dadosTeste,
      resposta_webhook: {
        status: response.status,
        body: responseText
      }
    }, { status: 200, headers });

  } catch (error) {
    return Response.json({
      sucesso: false,
      mensagem: error.message
    }, { status: 500, headers });
  }
});