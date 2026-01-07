import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Code, Database, FileCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ExportarChatbot() {
  const [copiado, setCopiado] = useState(null);

  const copiar = (texto, id) => {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  };

  const entities = {
    Contact: `{
  "name": "Contact",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nome do contato"
    },
    "phone": {
      "type": "string",
      "description": "Número de telefone (com código do país)"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Email do contato"
    },
    "profile_picture": {
      "type": "string",
      "description": "URL da foto de perfil"
    },
    "pipeline_stage": {
      "type": "string",
      "enum": [
        "novo_lead",
        "qualificado",
        "proposta",
        "negociacao",
        "fechado_ganho",
        "fechado_perdido"
      ],
      "default": "novo_lead",
      "description": "Estágio no pipeline de vendas"
    },
    "keywords": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Tags/palavras-chave aplicadas ao contato"
    },
    "custom_fields": {
      "type": "object",
      "description": "Campos personalizados capturados"
    },
    "notes": {
      "type": "string",
      "description": "Observações sobre o contato"
    },
    "ai_enabled": {
      "type": "boolean",
      "default": true,
      "description": "Se a IA está ativa para este contato"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Se a conversa está ativa"
    },
    "last_message_at": {
      "type": "string",
      "format": "date-time",
      "description": "Data/hora da última mensagem"
    }
  },
  "required": [
    "phone"
  ]
}`,
    Message: `{
  "name": "Message",
  "type": "object",
  "properties": {
    "contact_id": {
      "type": "string",
      "description": "ID do contato relacionado"
    },
    "direction": {
      "type": "string",
      "enum": [
        "inbound",
        "outbound"
      ],
      "description": "Direção da mensagem (recebida ou enviada)"
    },
    "sender": {
      "type": "string",
      "enum": [
        "ai",
        "human",
        "customer"
      ],
      "description": "Quem enviou a mensagem"
    },
    "content": {
      "type": "string",
      "description": "Conteúdo da mensagem"
    },
    "type": {
      "type": "string",
      "enum": [
        "text",
        "image",
        "video",
        "audio",
        "document"
      ],
      "default": "text",
      "description": "Tipo de mensagem"
    },
    "media_url": {
      "type": "string",
      "description": "URL do arquivo de mídia"
    },
    "media_mime_type": {
      "type": "string",
      "description": "Tipo MIME do arquivo"
    },
    "status": {
      "type": "string",
      "enum": [
        "pending",
        "sent",
        "delivered",
        "read",
        "failed"
      ],
      "default": "sent",
      "description": "Status da mensagem"
    },
    "extracted_data": {
      "type": "object",
      "description": "Dados extraídos pela IA"
    },
    "error_message": {
      "type": "string",
      "description": "Mensagem de erro (se houver)"
    }
  },
  "required": [
    "contact_id",
    "direction",
    "sender",
    "content"
  ]
}`,
    AISettings: `{
  "name": "AISettings",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nome da configuração"
    },
    "system_prompt": {
      "type": "string",
      "description": "Prompt de sistema que define a personalidade da IA"
    },
    "greeting_message": {
      "type": "string",
      "description": "Mensagem de saudação inicial"
    },
    "business_hours_start": {
      "type": "string",
      "description": "Horário de início do expediente (HH:MM)"
    },
    "business_hours_end": {
      "type": "string",
      "description": "Horário de fim do expediente (HH:MM)"
    },
    "out_of_hours_message": {
      "type": "string",
      "description": "Mensagem para fora do horário comercial"
    },
    "transfer_keywords": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Palavras que acionam transferência para humano"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Se a IA está ativa"
    },
    "ai_model": {
      "type": "string",
      "enum": [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-3.5-turbo"
      ],
      "default": "gpt-4o",
      "description": "Modelo GPT a ser usado pela IA"
    }
  },
  "required": [
    "name"
  ]
}`
  };

  const secrets = [
    { name: "META_ACCESS_TOKEN", desc: "Token de acesso da API do WhatsApp Business" },
    { name: "META_PHONE_NUMBER_ID", desc: "ID do número de telefone no WhatsApp Business" },
    { name: "META_VERIFY_TOKEN", desc: "Token para verificação do webhook (ex: meu_token_secreto_2025)" },
    { name: "OPENAI_API_KEY", desc: "Chave da API da OpenAI (para IA e transcrição de áudio)" }
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            📦 Exportar Chatbot IA
          </h1>
          <p className="text-slate-600">
            Todos os códigos necessários para implementar em outro app Base44
          </p>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Passo a Passo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-slate-700">
              <li><strong>Crie as Entities</strong> - Copie e cole cada JSON na aba "Entities"</li>
              <li><strong>Configure os Secrets</strong> - Adicione as variáveis de ambiente necessárias</li>
              <li><strong>Crie as Functions</strong> - Copie os códigos das functions backend</li>
              <li><strong>Crie as Pages</strong> - Copie as páginas do sistema</li>
              <li><strong>Crie os Components</strong> - Copie os componentes auxiliares</li>
              <li><strong>Configure o Webhook</strong> - No Meta Business, adicione a URL do webhook</li>
            </ol>
          </CardContent>
        </Card>

        <Tabs defaultValue="entities" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="entities">
              <Database className="w-4 h-4 mr-2" />
              Entities
            </TabsTrigger>
            <TabsTrigger value="secrets">
              <Code className="w-4 h-4 mr-2" />
              Secrets
            </TabsTrigger>
            <TabsTrigger value="functions">
              <FileCode className="w-4 h-4 mr-2" />
              Functions
            </TabsTrigger>
            <TabsTrigger value="pages">
              <FileCode className="w-4 h-4 mr-2" />
              Pages/Components
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entities" className="space-y-4">
            {Object.entries(entities).map(([name, code]) => (
              <Card key={name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">entities/{name}.json</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => copiar(code, name)}
                    >
                      {copiado === name ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs max-h-96">
                    {code}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="secrets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Variáveis de Ambiente (Secrets)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Configure estas variáveis em: <strong>Dashboard → Code → Environment Variables</strong>
                </p>
                {secrets.map(secret => (
                  <div key={secret.name} className="bg-slate-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <code className="font-mono font-bold text-sm">{secret.name}</code>
                      <Badge variant="outline">Obrigatório</Badge>
                    </div>
                    <p className="text-sm text-slate-600">{secret.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Functions Backend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>📁 Arquivos necessários:</strong>
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline">functions/whatsapp/webhookMeta.js</Badge>
                      <span className="text-xs text-slate-600">- Recebe mensagens do WhatsApp</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline">functions/sendWhatsAppMessage.js</Badge>
                      <span className="text-xs text-slate-600">- Envia mensagens</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline">functions/transcribeAudio.js</Badge>
                      <span className="text-xs text-slate-600">- Transcreve áudios</span>
                    </li>
                  </ul>
                  <p className="text-xs text-slate-500 mt-4">
                    💡 Os códigos completos estão disponíveis neste app. Acesse <strong>Dashboard → Code → Functions</strong> para copiar.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pages e Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-bold mb-2">📄 Pages:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• pages/ChatIA.js</li>
                    <li>• pages/ConfiguracoesIA.js</li>
                    <li>• pages/PipelineIA.js</li>
                    <li>• pages/DashboardIA.js</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2">🧩 Components:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• components/chat/ContactList.jsx</li>
                    <li>• components/chat/ChatWindow.jsx</li>
                    <li>• components/chat/ContactDetails.jsx</li>
                    <li>• components/chat/MessageBubble.jsx</li>
                    <li>• components/settings/AIPromptEditor.jsx</li>
                    <li>• components/crm/PipelineBoard.jsx</li>
                    <li>• components/NovasMensagensAlert.jsx</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  💡 Acesse <strong>Dashboard → Code</strong> para copiar os códigos completos de cada arquivo.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <CardHeader>
            <CardTitle>✅ Depois de copiar tudo</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-slate-700">
              <li>Configure o webhook no Meta Business apontando para: <code className="bg-green-100 px-2 py-1 rounded text-xs">https://seu-app.base44.com/api/functions/whatsapp/webhookMeta</code></li>
              <li>Use o <code className="bg-green-100 px-2 py-1 rounded text-xs">META_VERIFY_TOKEN</code> que você definiu nos secrets</li>
              <li>Teste enviando uma mensagem para o número do WhatsApp Business</li>
              <li>Verifique se aparece no ChatIA</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}