
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Code, Calendar, List, AlertCircle, Webhook, Settings } from "lucide-react";

export default function APIDocumentacao() {
  const [copiado, setCopiado] = useState(null);

  const copiar = (texto, id) => {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  };

  const baseUrl = window.location.origin;
  const webhookUrl = `${baseUrl}/api/functions/stripe/webhook`;
  const webhookWhatsAppUrl = `${baseUrl}/api/functions/whatsapp/webhookStatus`;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            📚 Documentação da API
          </h1>
          <p className="text-slate-600">
            Integre seu chatbot, configure webhooks do Stripe e WhatsApp
          </p>
        </div>

        {/* API Key do Chatbot */}
        <Alert className="bg-purple-50 border-purple-200 border-2">
          <AlertCircle className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <strong>🔑 CHATBOT_API_KEY</strong>
            <div className="mt-3 space-y-2">
              <p className="text-sm">Configure esta variável no Base44 para autenticar as requisições da API:</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-purple-100 px-3 py-2 rounded text-sm font-mono">
                  apiflskcjfjhsydkifms
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copiar('apiflskcjfjhsydkifms', 'apikey')}
                >
                  {copiado === 'apikey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs mt-2">
                Vá em: <strong>Dashboard → Code → Environment Variables</strong> → Adicione:
                <br />
                <code className="bg-purple-100 px-2 py-1 rounded">CHATBOT_API_KEY = apiflskcjfjhsydkifms</code>
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Webhook do WhatsApp/ZAPI */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-6 h-6 text-green-600" />
              Webhook do WhatsApp (ZAPI)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Settings className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Configure este webhook no painel do ZAPI</strong> para receber atualizações sobre o status das mensagens enviadas.
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">🔗 URL do Webhook WhatsApp</h3>
              <div className="flex gap-2">
                <code className="flex-1 bg-slate-100 px-4 py-3 rounded-lg text-sm font-mono text-slate-800 overflow-x-auto">
                  {webhookWhatsAppUrl}
                </code>
                <button
                  onClick={() => copiar(webhookWhatsAppUrl, 'webhook-whatsapp')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  {copiado === 'webhook-whatsapp' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copiar
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">⚙️ Como configurar no ZAPI</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>Acesse o painel do ZAPI: <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.z-api.io</a></li>
                <li>Vá em: <strong>Instância</strong> → <strong>Webhooks</strong></li>
                <li>Em <strong>"Receber status da mensagem"</strong>, cole a URL acima</li>
                <li>Clique em <strong>Salvar</strong></li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">📋 O que o webhook recebe</h3>
              <div className="bg-slate-100 rounded-lg p-4">
                <pre className="text-xs font-mono text-slate-800 overflow-x-auto">{`{
  "messageId": "3EB0C0D71C80E00C48D8",
  "phone": "5511999999999",
  "status": "SENT",  // ou: RECEIVED, READ, FAILED
  "momment": 1234567890
}`}</pre>
              </div>
            </div>

            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>✅ Pronto!</strong> Agora você receberá atualizações automáticas sobre o status de cada mensagem enviada.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Webhook do Stripe */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-6 h-6 text-purple-600" />
              Webhook do Stripe
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Settings className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Configure este webhook no Stripe Dashboard</strong> para que as assinaturas criadas no seu site apareçam automaticamente aqui.
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">1️⃣ URL do Webhook</h3>
              <div className="flex gap-2">
                <code className="flex-1 bg-slate-100 px-4 py-3 rounded-lg text-sm font-mono text-slate-800 overflow-x-auto">
                  {webhookUrl}
                </code>
                <button
                  onClick={() => copiar(webhookUrl, 'webhook')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  {copiado === 'webhook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copiar
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">2️⃣ Eventos para ouvir</h3>
              <div className="bg-slate-100 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <code className="text-sm font-mono">checkout.session.completed</code>
                  <span className="text-xs text-slate-600">- Quando cliente conclui compra</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <code className="text-sm font-mono">customer.subscription.created</code>
                  <span className="text-xs text-slate-600">- Assinatura criada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <code className="text-sm font-mono">invoice.payment_succeeded</code>
                  <span className="text-xs text-slate-600">- Pagamento aprovado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <code className="text-sm font-mono">invoice.payment_failed</code>
                  <span className="text-xs text-slate-600">- Pagamento falhou</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <code className="text-sm font-mono">customer.subscription.deleted</code>
                  <span className="text-xs text-slate-600">- Assinatura cancelada</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">3️⃣ Como configurar no Stripe</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>Acesse: <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">dashboard.stripe.com/webhooks</a></li>
                <li>Clique em "Add endpoint"</li>
                <li>Cole a URL do webhook acima</li>
                <li>Selecione os eventos listados acima</li>
                <li>Clique em "Add endpoint"</li>
                <li>Copie o <strong>Signing Secret</strong> (começa com <code>whsec_</code>)</li>
                <li>Cole em: Dashboard → Code → Environment Variables → <code>STRIPE_WEBHOOK_SECRET</code></li>
              </ol>
            </div>

            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Pronto!</strong> Agora toda assinatura criada no seu site aparecerá automaticamente em "Negócios Fechados" e no CRM.
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">📋 Nomes dos Produtos no Stripe</h3>
              <p className="text-sm text-slate-600 mb-3">
                Para o sistema identificar corretamente qual produto foi vendido, os nomes no Stripe devem ser <strong>exatamente</strong>:
              </p>
              <div className="bg-slate-100 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  <code className="text-sm font-mono font-bold">Glória Atendente</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏥</span>
                  <code className="text-sm font-mono font-bold">Glória Clínica</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎬</span>
                  <code className="text-sm font-mono font-bold">Máquina de Vídeos</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <code className="text-sm font-mono font-bold">Glória Finanças</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎭</span>
                  <code className="text-sm font-mono font-bold">Avatar ao Vivo</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint 1: Verificar Disponibilidade */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5" />
                1. Verificar Horários Disponíveis
              </CardTitle>
              <Badge className="bg-blue-600">POST</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Endpoint:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-100 p-3 rounded-lg font-mono text-sm">
                  {baseUrl}/api/functions/verificardisponibilidade
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copiar(`${baseUrl}/api/functions/verificardisponibilidade`, 'url1')}
                >
                  {copiado === 'url1' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Body (JSON):</p>
              <div className="relative">
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "data": "2025-01-20",
  "api_key": "sua-chave-api-aqui"
}`}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copiar(`{
  "data": "2025-01-20",
  "api_key": "sua-chave-api-aqui"
}`, 'body1')}
                >
                  {copiado === 'body1' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Resposta de Sucesso (200):</p>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "success": true,
  "data": "2025-01-20",
  "total_horarios": 13,
  "horarios_disponiveis": 10,
  "horarios": [
    "08:00", "09:00", "10:00", "11:00", 
    "13:00", "14:00", "15:00", "16:00", 
    "17:00", "19:00"
  ],
  "horarios_ocupados": ["12:00", "18:00", "20:00"]
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint 2: Criar Agendamento */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                2. Criar Agendamento
              </CardTitle>
              <Badge className="bg-green-600">POST</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Endpoint:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-100 p-3 rounded-lg font-mono text-sm">
                  {baseUrl}/api/functions/agendarviachatbot
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copiar(`${baseUrl}/api/functions/agendarviachatbot`, 'url2')}
                >
                  {copiado === 'url2' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Body (JSON):</p>
              <div className="relative">
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "nome_cliente": "João Silva",
  "email_cliente": "joao@email.com",
  "telefone_cliente": "(11) 99999-9999",
  "produto": "gloria_atendente",
  "data": "2025-01-20",
  "horario": "14:00",
  "observacoes": "Cliente interessado em automação",
  "api_key": "sua-chave-api-aqui"
}`}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copiar(`{
  "nome_cliente": "João Silva",
  "email_cliente": "joao@email.com",
  "telefone_cliente": "(11) 99999-9999",
  "produto": "gloria_atendente",
  "data": "2025-01-20",
  "horario": "14:00",
  "observacoes": "Cliente interessado em automação",
  "api_key": "sua-chave-api-aqui"
}`, 'body2')}
                >
                  {copiado === 'body2' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Produtos Disponíveis:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { id: 'gloria_atendente', nome: 'Glória Atendente' },
                  { id: 'gloria_clinica', nome: 'Glória Clínica' },
                  { id: 'maquina_de_videos', nome: 'Máquina de Vídeos' },
                  { id: 'gloria_financas', nome: 'Glória Finanças' },
                  { id: 'avatar_ao_vivo', nome: 'Avatar ao Vivo' }
                ].map(p => (
                  <Badge key={p.id} variant="outline" className="justify-between">
                    {p.nome}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 ml-2"
                      onClick={() => copiar(p.id, `prod-${p.id}`)}
                    >
                      {copiado === `prod-${p.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Resposta de Sucesso (201):</p>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "success": true,
  "message": "Reunião agendada com sucesso!",
  "agendamento": {
    "id": "abc123",
    "nome_cliente": "João Silva",
    "email_cliente": "joao@email.com",
    "produto": "Glória Atendente",
    "data": "2025-01-20",
    "horario": "14:00",
    "link_reuniao": "https://meet.google.com/xxx-yyyy-zzz",
    "status": "Agendada"
  }
}`}
              </pre>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Possíveis Erros:</p>
              <div className="space-y-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-700">❌ 401 - API Key Inválida</p>
                  <pre className="text-xs text-red-600 mt-1">{"{ \"error\": \"Unauthorized\" }"}</pre>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-700">❌ 409 - Horário Ocupado</p>
                  <pre className="text-xs text-red-600 mt-1">{"{ \"error\": \"Horário não disponível\" }"}</pre>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-700">❌ 400 - Campos Faltando</p>
                  <pre className="text-xs text-red-600 mt-1">{"{ \"error\": \"Campos obrigatórios faltando\" }"}</pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exemplo de Integração */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Exemplo de Integração (JavaScript)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative">
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`// 1. Verificar horários disponíveis
const verificarHorarios = async (data) => {
  const response = await fetch('${baseUrl}/api/functions/verificardisponibilidade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: data,
      api_key: 'SUA_API_KEY_AQUI'
    })
  });
  return await response.json();
};

// 2. Criar agendamento
const criarAgendamento = async (dados) => {
  const response = await fetch('${baseUrl}/api/functions/agendarviachatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome_cliente: dados.nome,
      email_cliente: dados.email,
      telefone_cliente: dados.telefone,
      produto: dados.produto,
      data: dados.data,
      horario: dados.horario,
      observacoes: dados.observacoes,
      api_key: 'SUA_API_KEY_AQUI'
    })
  });
  return await response.json();
};

// Uso:
const horarios = await verificarHorarios('2025-01-20');
console.log('Horários disponíveis:', horarios.horarios);

const agendamento = await criarAgendamento({
  nome: 'João Silva',
  email: 'joao@email.com',
  telefone: '(11) 99999-9999',
  produto: 'gloria_atendente',
  data: '2025-01-20',
  horario: '14:00',
  observacoes: 'Cliente interessado'
});
console.log('Agendamento criado:', agendamento);`}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copiar(`// 1. Verificar horários disponíveis
const verificarHorarios = async (data) => {
  const response = await fetch('${baseUrl}/api/functions/verificardisponibilidade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: data,
      api_key: 'SUA_API_KEY_AQUI'
    })
  });
  return await response.json();
};

// 2. Criar agendamento
const criarAgendamento = async (dados) => {
  const response = await fetch('${baseUrl}/api/functions/agendarviachatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome_cliente: dados.nome,
      email_cliente: dados.email,
      telefone_cliente: dados.telefone,
      produto: dados.produto,
      data: dados.data,
      horario: dados.horario,
      observacoes: dados.observacoes,
      api_key: 'SUA_API_KEY_AQUI'
    })
  });
  return await response.json();
};

// Uso:
const horarios = await verificarHorarios('2025-01-20');
console.log('Horários disponíveis:', horarios.horarios);

const agendamento = await criarAgendamento({
  nome: 'João Silva',
  email: 'joao@email.com',
  telefone: '(11) 99999-9999',
  produto: 'gloria_atendente',
  data: '2025-01-20',
  horario: '14:00',
  observacoes: 'Cliente interessado'
});
console.log('Agendamento criado:', agendamento);`, 'exemplo')}
              >
                {copiado === 'exemplo' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
