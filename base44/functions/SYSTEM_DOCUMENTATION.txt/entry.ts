🤖 GLÓRIA VENDAS IA SYSTEM - DOCUMENTAÇÃO COMPLETA
====================================================
Versão: 1.0 | Data: 09/01/2026 | Status: Sistema Completo e em Produção

═══════════════════════════════════════════════════════════════════════════════════════
📦 O QUE ESTÁ INCLUÍDO:
═══════════════════════════════════════════════════════════════════════════════════════

✅ 8 ENTIDADES (Estrutura de Dados):
  • Contact: Armazena dados do contato/lead (nome, telefone, email, pipeline stage)
  • Message: Histórico de todas as mensagens (inbound e outbound)
  • AISettings: Configurações globais da IA (prompt, modelo, keywords, etc)
  • Keyword: Palavras-chave para auto-tagging automático de contatos
  • CustomField: Define campos personalizados que podem ser adicionados dinamicamente
  • WebhookConfig: Configura webhooks que o sistema pode disparar ou receber
  • CustomAPI: Integração com APIs externas (HTTP POST/GET/PUT/DELETE/PATCH)
  • MetaTemplate: Templates pré-aprovados do WhatsApp Business para envio

✅ 4 PÁGINAS (Interface do Usuário):
  • ChatIA.js: Interface principal em 3 painéis (contatos, chat, detalhes)
  • PipelineIA.js: Board Kanban tipo Trello com 6 estágios
  • DashboardIA.js: Análise e métricas em tempo real com 3 gráficos
  • ConfiguracoesIA.js: Painel de configurações em 5 abas

✅ 9+ COMPONENTES REACT (Reutilizáveis):
  Chat Interface: ChatWindow, ContactList, ContactDetails, MessageBubble, TemplateSelector
  CRM/Pipeline: PipelineBoard
  Dashboard: StatsCard, ConversationChart
  Settings: AIPromptEditor, KeywordManager, CustomFieldsManager, WebhookManager, CustomAPIManager

✅ 4 FUNÇÕES BACKEND (JavaScript/Deno):
  • sendTemplateMessage.js [NOVO]: Envia templates Meta aprovados
  • sendWhatsAppMessage.js: Envia mensagens de texto via WhatsApp
  • transcribeAudio.js: Transcreve áudio com OpenAI Whisper
  • whatsapp/webhookMeta.js: Webhook principal que recebe mensagens do Meta

═══════════════════════════════════════════════════════════════════════════════════════
🔄 FLUXO DE DADOS COMPLETO:
═══════════════════════════════════════════════════════════════════════════════════════

CENÁRIO 1: CLIENTE ENVIA MENSAGEM DE TEXTO
Cliente → Meta → webhookMeta.js → Cria Contact → IA (GPT-4o) → Resposta → Meta → Cliente

CENÁRIO 2: CLIENTE ENVIA ÁUDIO
Cliente → Meta → webhookMeta.js → Baixa áudio → transcribeAudio.js (Whisper) 
→ IA (GPT-4o) → Resposta → Meta → Cliente

CENÁRIO 3: ADMIN ENVIA TEMPLATE APROVADO
Admin → TemplateSelector → sendTemplateMessage → Meta Graph API → Cliente

CENÁRIO 4: ADMIN ARRASTA CONTATO NO PIPELINE
Admin → PipelineBoard (drag-and-drop) → UPDATE Contact → Banco de Dados

CENÁRIO 5: ADMIN CONFIGURA IA
Admin → ConfiguracoesIA → AIPromptEditor → UPDATE AISettings → Banco de Dados

═══════════════════════════════════════════════════════════════════════════════════════
⚙️ VARIÁVEIS DE AMBIENTE (Secrets) - OBRIGATÓRIAS
═══════════════════════════════════════════════════════════════════════════════════════

1. META_PHONE_NUMBER_ID
   O quê: ID do número WhatsApp configurado na Meta Business
   Formato: "123456789012345" (15 dígitos)
   Onde obter: Meta Business Manager > WhatsApp > Phone Numbers > ID
   Exemplo: "156789012345678"

2. META_ACCESS_TOKEN
   O quê: Token de acesso para chamar Meta Graph API
   Formato: "EAAx..." (muito longo, começa com EAA)
   Onde obter: Meta Business Manager > Apps > WhatsApp > Token
   Duração: ~60 dias, depois expira (renove!)
   Escopo: whatsapp_business_messaging, whatsapp_business_management

3. META_VERIFY_TOKEN
   O quê: Token para validar webhooks que vêm da Meta
   Formato: Qualquer string que você definir (exemplo: "gloria_webhook_123")
   Onde definir: Meta Business Manager > App Settings > Webhooks
   Sugestão: Use UUID: "550e8400-e29b-41d4-a716-446655440000"

4. OPENAI_API_KEY
   O quê: Chave de API da OpenAI para IA e transcrição
   Formato: "sk-xxx..." (começa com sk-)
   Onde obter: https://platform.openai.com/api-keys
   Custo: Cobrado por uso (gpt-4o ~0.03¢/msg, Whisper ~0.02¢/min)
   Modelos: gpt-4o (padrão), gpt-4o-mini (mais barato)
   Billing: https://platform.openai.com/account/billing/overview

═══════════════════════════════════════════════════════════════════════════════════════
📊 ESTRUTURA DE DADOS (Exemplos):
═══════════════════════════════════════════════════════════════════════════════════════

CONTACT (Contato/Lead):
{
  "id": "contact_507e1f77bcf86cd799439011",
  "name": "João Silva",
  "phone": "+5511987654321",
  "email": "joao@empresa.com.br",
  "profile_picture": "https://...",
  "pipeline_stage": "qualificado",
  "ai_enabled": true,
  "is_active": true,
  "keywords": ["cliente importante", "urgente"],
  "custom_fields": {
    "produto": "Atendimento_IA_24_7",
    "data_reuniao": "2026-01-15",
    "empresa": "Tech Solutions LTDA"
  },
  "notes": "Cliente em estágio final de negociação...",
  "last_message_at": "2026-01-09T14:30:00.000Z"
}

MESSAGE (Mensagem):
{
  "id": "msg_607e1f77bcf86cd799439022",
  "contact_id": "contact_507e1f77bcf86cd799439011",
  "direction": "inbound",
  "sender": "customer",
  "content": "Olá! Gostaria de agendar uma reunião",
  "type": "text",
  "status": "delivered",
  "extracted_data": {
    "intent": "agendamento",
    "sentiment": "positivo"
  },
  "created_date": "2026-01-09T14:25:00.000Z"
}

AI_SETTINGS (Configuração da IA):
{
  "id": "ai_001",
  "name": "GLÓRIA Principal",
  "system_prompt": "Você é GLÓRIA, assistente virtual da Glória Vendas...",
  "greeting_message": "Olá! Como posso ajudá-lo?",
  "ai_model": "gpt-4o",
  "is_active": true,
  "transfer_keywords": ["falar com humano", "atendente"],
  "business_hours_start": "08:00",
  "business_hours_end": "20:00"
}

═══════════════════════════════════════════════════════════════════════════════════════
🚀 PASSO-A-PASSO IMPLEMENTAÇÃO (7 PASSOS):
═══════════════════════════════════════════════════════════════════════════════════════

PASSO 1: CRIAR ENTIDADES
☐ Crie 8 arquivos em entities/: Contact.json, Message.json, AISettings.json, Keyword.json,
  CustomField.json, WebhookConfig.json, CustomAPI.json, MetaTemplate.json
✓ Resultado: 8 entidades registradas e prontas para uso

PASSO 2: COPIAR PÁGINAS
☐ Copie 4 arquivos em pages/: ChatIA.js, PipelineIA.js, DashboardIA.js, ConfiguracoesIA.js
✓ Resultado: 4 páginas aparecerão no sidebar (acesso automático)

PASSO 3: COPIAR COMPONENTES
☐ Copie ~14 componentes em components/:
  - chat/: ChatWindow.jsx, ContactList.jsx, ContactDetails.jsx, MessageBubble.jsx, TemplateSelector.jsx
  - crm/: PipelineBoard.jsx
  - dashboard/: StatsCard.jsx, ConversationChart.jsx
  - settings/: AIPromptEditor.jsx, KeywordManager.jsx, CustomFieldsManager.jsx, WebhookManager.jsx, CustomAPIManager.jsx
✓ Resultado: ~14 componentes prontos para usar

PASSO 4: COPIAR FUNÇÕES BACKEND
☐ Copie 4 funções em functions/:
  - sendTemplateMessage.js [NOVO]
  - sendWhatsAppMessage.js
  - transcribeAudio.js
  - whatsapp/webhookMeta.js
✓ Resultado: Todas integrações funcionando automaticamente

PASSO 5: CONFIGURAR SECRETS
☐ Dashboard > Settings > Environment Variables
☐ Adicione 4 secrets: META_PHONE_NUMBER_ID, META_ACCESS_TOKEN, META_VERIFY_TOKEN, OPENAI_API_KEY
✓ Resultado: Sistema autenticado e pronto

PASSO 6: ATUALIZAR LAYOUT
☐ Abra Layout.js e adicione navegação para as 4 páginas no sidebar
✓ Resultado: Links acessíveis no menu principal

PASSO 7: TESTAR WEBHOOKS
☐ Meta Business Manager > WhatsApp > Phone Numbers
☐ Configure Webhook URL: https://seu-app.com/functions/webhookMeta
☐ Configure Verify Token: o mesmo que você colocou em META_VERIFY_TOKEN
☐ Subscribe aos eventos: messages
☐ Envie uma mensagem de teste
✓ Resultado: Sistema recebendo mensagens em tempo real!

═══════════════════════════════════════════════════════════════════════════════════════
✨ CARACTERÍSTICAS PRINCIPAIS:
═══════════════════════════════════════════════════════════════════════════════════════

🤖 IA INTELIGENTE:
  • Processamento com OpenAI GPT-4o (modelo mais avançado)
  • Fallback para gpt-4o-mini (mais barato)
  • Extração automática de dados (nome, email, telefone, produto, data, hora)
  • Detecção de intenções (agendamento, transferência, recusa)
  • Resposta em Markdown (negrito, links, listas, código)
  • Prompt customizável por empresa
  • Histórico completo de conversas
  • Delay inteligente de 8s para acumular mensagens

📱 WHATSAPP BUSINESS:
  • Suporte a múltiplos tipos de mídia (áudio, vídeo, imagem, documento)
  • Transcrição automática de áudio com Whisper
  • Envio de templates pré-aprovados
  • Download automático de mídia recebida
  • Divisão automática de mensagens longas
  • Webhook em tempo real (não polling)

🎯 PIPELINE DE VENDAS:
  • 6 estágios visuais: novo_lead → qualificado → proposta → negociacao → fechado_ganho → fechado_perdido
  • Drag-and-drop suave para movimentação
  • Atualização em tempo real no banco
  • Histórico de movimentações
  • Filtro e busca de contatos
  • Tags/keywords por contato

📊 DASHBOARD ANALÍTICO:
  • 4 cards com métricas principais
  • 3 gráficos interativos (área, barras, pizza)
  • Contatos recentes com últimas interações
  • Análise de hora de pico
  • Distribuição por estágio
  • Atualização em tempo real

⚙️ CONFIGURAÇÃO FLEXÍVEL:
  • Prompt customizável por IA
  • Palavra-chave com auto-tagging
  • Campos dinâmicos por contato
  • Webhooks customizáveis
  • APIs HTTP integradas
  • Horário comercial configurável

═══════════════════════════════════════════════════════════════════════════════════════
⚠️ NOTAS IMPORTANTES:
═══════════════════════════════════════════════════════════════════════════════════════

✓ ESTE É UM SISTEMA COMPLETO: Todos os componentes trabalham juntos perfeitamente
✓ ÚLTIMA ATUALIZAÇÃO: 09/01/2026 com todas as features incluindo templates Meta
✓ REQUER OPENAI_API_KEY: Para transcrição de áudio e processamento de IA
✓ META BUSINESS MANAGER: Deve estar configurado e webhook ativo
✓ TEMPLATES DEVEM SER APROVADOS: No painel da Meta antes de usar
✓ DELAY DE 8 SEGUNDOS: Recomendado para acumular múltiplas mensagens
✓ DEPENDENCIES: @tanstack/react-query, @hello-pangea/dnd, recharts, framer-motion
✓ NODE 18+: Suportado. Deno para backend functions
✓ PRODUCTION READY: Sistema testado e usado em produção