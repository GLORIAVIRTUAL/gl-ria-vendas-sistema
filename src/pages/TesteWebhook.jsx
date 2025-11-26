import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function TesteWebhook() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  const enviarWebhook = async () => {
    setLoading(true);
    setResultado(null);
    setErro(null);

    try {
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

      const response = await fetch('https://ra-bcknd.com/v1/api-trigger/cayly9lw2sl4z6jtvs5v', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosTeste)
      });

      const responseText = await response.text();

      setResultado({
        status: response.status,
        statusText: response.statusText,
        body: responseText,
        dadosEnviados: dadosTeste
      });

    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-600" />
            Teste de Webhook - Avatar Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2"><strong>URL do Webhook:</strong></p>
            <code className="text-xs bg-white p-2 rounded border block break-all">
              https://ra-bcknd.com/v1/api-trigger/cayly9lw2sl4z6jtvs5v
            </code>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 mb-2"><strong>Dados que serão enviados:</strong></p>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto">
{`{
  "agendamento_id": "teste_...",
  "nome_cliente": "João Silva Teste",
  "telefone_cliente": "5511999999999",
  "email_cliente": "joao.teste@email.com",
  "data": "2025-11-28",
  "horario": "14:00",
  "data_formatada": "Sexta-feira, 28 de novembro",
  "produto": "Gloria_Vendas",
  "link_reuniao": "https://meet.google.com/abc-defg-hij",
  "mensagem": "✅ Reunião agendada..."
}`}
            </pre>
          </div>

          <Button 
            onClick={enviarWebhook} 
            disabled={loading}
            className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-blue-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Enviar Webhook de Teste AGORA
              </>
            )}
          </Button>

          {resultado && (
            <Alert className={resultado.status >= 200 && resultado.status < 300 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <AlertDescription>
                <p className="font-bold mb-2">Webhook enviado!</p>
                <p><strong>Status:</strong> {resultado.status} {resultado.statusText}</p>
                <p className="mt-2"><strong>Resposta:</strong></p>
                <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-40">
                  {resultado.body || "(vazio)"}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          {erro && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="w-5 h-5 text-red-600" />
              <AlertDescription>
                <p className="font-bold text-red-800">Erro ao enviar:</p>
                <p className="text-red-700">{erro}</p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}