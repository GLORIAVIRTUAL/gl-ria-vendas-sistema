import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: exportIASystem
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 * Esta função gera uma documentação completa e estruturada para exportar e
 * reproduzir o sistema IA completo em outro aplicativo Base44. Inclui todas
 * as entidades, páginas, componentes, funções backend e configurações necessárias.
 * 
 * VERSÃO: 1.0 - 09/01/2026
 * AUTOR: Sistema Glória Vendas
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * O QUE ESTÁ INCLUÍDO:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 📦 ENTIDADES (8 total):
 *    ├─ Contact: Estrutura base de contatos/leads com pipeline
 *    ├─ Message: Histórico de mensagens (inbound/outbound)
 *    ├─ AISettings: Configurações globais da IA
 *    ├─ Keyword: Sistema de palavras-chave para auto-tagging
 *    ├─ CustomField: Campos personalizados por cliente
 *    ├─ WebhookConfig: Configuração de webhooks externos
 *    ├─ CustomAPI: Integração com APIs HTTP
 *    └─ MetaTemplate: Templates aprovados do WhatsApp Business
 * 
 * 📄 PÁGINAS (4 total):
 *    ├─ ChatIA.js: Interface principal de chat (left panel com contatos, 
 *    │            right panel com chat, detalhes do contato)
 *    ├─ PipelineIA.js: Kanban board com drag-and-drop para pipeline
 *    ├─ DashboardIA.js: Análise em tempo real com gráficos e métricas
 *    └─ ConfiguracoesIA.js: Painel central de configurações em abas
 * 
 * 🧩 COMPONENTES (9 total):
 *    ├─ Chat Interface:
 *    │  ├─ ChatWindow.jsx: Janela principal de chat com envio de mensagens
 *    │  ├─ ContactList.jsx: Lista lateral de contatos com últimas mensagens
 *    │  ├─ ContactDetails.jsx: Painel lateral direito com dados do contato
 *    │  ├─ MessageBubble.jsx: Componente individual de mensagem/buble
 *    │  └─ TemplateSelector.jsx: Seletor de templates Meta aprovados
 *    │
 *    ├─ Pipeline:
 *    │  └─ PipelineBoard.jsx: Board Kanban com 6 estágios de vendas
 *    │
 *    └─ Dashboard:
 *       ├─ StatsCard.jsx: Card de estatísticas com tendências
 *       └─ ConversationChart.jsx: 3 gráficos (área diária, barras horárias, pizza)
 * 
 * ⚙️ FUNÇÕES BACKEND (4 total):
 *    ├─ sendTemplateMessage.js: Envia templates Meta aprovados via API Graph
 *    ├─ sendWhatsAppMessage.js: Envia mensagens de texto normais
 *    ├─ transcribeAudio.js: Transcreve áudio usando OpenAI Whisper
 *    └─ whatsapp/webhookMeta.js: Webhook principal de entrada da Meta
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * FLUXO DE DADOS:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ENTRADA DE MENSAGENS:
 *   Meta Webhook → webhookMeta.js → Contact + Message (BD)
 *   → Delay 8s → IA processa → LLM (OpenAI) → Divide em blocos → 
 *   sendWhatsAppMessage.js → Meta Graph API → Cliente recebe
 * 
 * TEMPLATES META:
 *   Admin cria template na Meta Business → Aprova → Adiciona entidade MetaTemplate
 *   → ChatIA mostra TemplateSelector → Envia via sendTemplateMessage.js
 * 
 * ANÁLISE PIPELINE:
 *   Contatos arrastados no PipelineBoard → Atualiza pipeline_stage →
 *   ContactDetails reflete mudança → Metrics atualizam em tempo real
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURAÇÃO NECESSÁRIA:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ✅ SECRETS OBRIGATÓRIOS (5):
 *    1. META_PHONE_NUMBER_ID: ID do número WhatsApp na Meta Business
 *    2. META_ACCESS_TOKEN: Token de acesso da Meta Graph API
 *    3. META_VERIFY_TOKEN: Token para verificação de webhook
 *    4. OPENAI_API_KEY: Chave da API OpenAI para IA e transcrição
 *    5. (Opcional) GOOGLE_CALENDAR_*: Para integração com Google Calendar
 * 
 * ✅ DEPENDÊNCIAS NPM (principais):
 *    - @tanstack/react-query: Cache e sincronização de dados
 *    - @hello-pangea/dnd: Drag-and-drop (pipeline board)
 *    - recharts: Gráficos (dashboard)
 *    - framer-motion: Animações suaves
 *    - date-fns: Manipulação de datas
 *    - sonner: Toast notifications
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CARACTERÍSTICAS PRINCIPAIS:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 🤖 IA INTELIGENTE:
 *    • Processamento natural de linguagem com OpenAI GPT-4o
 *    • Extração automática de dados (nome, email, telefone, produto)
 *    • Detecção de intenções (agendamento, transferência para humano)
 *    • Suporte a múltiplos idiomas (padrão pt-BR)
 * 
 * 📱 INTEGRAÇÃO WHATSAPP:
 *    • Recebe mensagens em tempo real via webhook Meta
 *    • Suporta múltiplos tipos de mídia (áudio, vídeo, imagem, documento)
 *    • Transcrição automática de áudios com Whisper
 *    • Envio de templates aprovados (marketing, notificação, autenticação)
 * 
 * 🎯 PIPELINE DE VENDAS:
 *    • 6 estágios: novo_lead → qualificado → proposta → negociação → 
 *                  fechado_ganho / fechado_perdido
 *    • Arraste visual (drag-and-drop) entre estágios
 *    • Visualização em tempo real de movimentações
 *    • Histórico completo de interações por contato
 * 
 * 📊 DASHBOARD ANALÍTICO:
 *    • Gráfico de área: Mensagens por dia (últimos 7 dias)
 *    • Gráfico de barras: Distribuição por hora (24h)
 *    • Gráfico pizza: Contatos por estágio do pipeline
 *    • Cards: Conversas ativas, total mensagens, % atendimento IA
 *    • Contatos recentes com palavras-chave e timestamp
 * 
 * ⚙️ CONFIGURAÇÃO FLEXÍVEL:
 *    • System prompt customizável por IA Settings
 *    • Palavras-chave com ações automáticas
 *    • Campos personalizados por contato
 *    • Webhooks customizáveis (entrada/saída)
 *    • APIs HTTP integradas para processos externos
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PASSO A PASSO IMPLEMENTAÇÃO:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PASSO 1 - CRIAR ENTIDADES:
 *    □ Crie arquivo entities/Contact.json
 *    □ Crie arquivo entities/Message.json
 *    □ Crie arquivo entities/AISettings.json
 *    □ Crie arquivo entities/Keyword.json
 *    □ Crie arquivo entities/CustomField.json
 *    □ Crie arquivo entities/WebhookConfig.json
 *    □ Crie arquivo entities/CustomAPI.json
 *    □ Crie arquivo entities/MetaTemplate.json
 *    → Resultado: 8 entidades registradas no banco
 * 
 * PASSO 2 - COPIAR PÁGINAS:
 *    □ pages/ChatIA.js
 *    □ pages/PipelineIA.js
 *    □ pages/DashboardIA.js
 *    □ pages/ConfiguracoesIA.js
 *    → Resultado: 4 páginas acessíveis no sidebar
 * 
 * PASSO 3 - COPIAR COMPONENTES:
 *    □ components/chat/ (5 arquivos)
 *    □ components/crm/ (1 arquivo)
 *    □ components/dashboard/ (2 arquivos)
 *    □ components/settings/ (5 arquivos não listados aqui, existem no sistema)
 *    → Resultado: Todos os componentes reutilizáveis prontos
 * 
 * PASSO 4 - COPIAR FUNÇÕES BACKEND:
 *    □ functions/sendTemplateMessage.js
 *    □ functions/sendWhatsAppMessage.js
 *    □ functions/transcribeAudio.js
 *    □ functions/whatsapp/webhookMeta.js
 *    → Resultado: Todas as integrações funcionando
 * 
 * PASSO 5 - CONFIGURAR SECRETS:
 *    □ META_PHONE_NUMBER_ID = seu_id_aqui
 *    □ META_ACCESS_TOKEN = seu_token_aqui
 *    □ META_VERIFY_TOKEN = seu_verify_token_aqui
 *    □ OPENAI_API_KEY = sua_chave_aqui
 *    → Resultado: Sistema autenticado com Meta e OpenAI
 * 
 * PASSO 6 - ATUALIZAR LAYOUT:
 *    □ Adicione navegação para /ChatIA
 *    □ Adicione navegação para /PipelineIA
 *    □ Adicione navegação para /DashboardIA
 *    □ Adicione navegação para /ConfiguracoesIA
 *    → Resultado: Links acessíveis no sidebar/menu principal
 * 
 * PASSO 7 - TESTAR WEBHOOKS:
 *    □ Configure URL webhook na Meta: https://seu-app.com/functions/webhookMeta
 *    □ Adicione META_VERIFY_TOKEN na configuração Meta
 *    □ Teste enviando mensagem de número de teste
 *    □ Verifique logs em console do navegador
 *    → Resultado: Primeira mensagem recebida com sucesso
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * VARIÁVEIS DE AMBIENTE (Secrets):
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * OBRIGATÓRIAS:
 *    META_PHONE_NUMBER_ID (string)
 *       └─ Formato: "123456789012345"
 *       └─ Onde obter: Meta Business Manager → WhatsApp → Phone Numbers
 * 
 *    META_ACCESS_TOKEN (string)
 *       └─ Formato: "EAAx...muito_longo"
 *       └─ Onde obter: Meta Business Manager → Apps → WhatsApp → Token
 *       └─ Duração: Geralmente 2 meses, renove antes de expirar
 * 
 *    META_VERIFY_TOKEN (string)
 *       └─ Formato: "qualquer_string_aleatória"
 *       └─ Onde obter: Você define (sugestão: use UUID)
 *       └─ Uso: Meta envia junto com webhook, você valida
 * 
 *    OPENAI_API_KEY (string)
 *       └─ Formato: "sk-xxx...muito_longo"
 *       └─ Onde obter: https://platform.openai.com/api-keys
 *       └─ Custo: Cobrado por uso (gpt-4o, transcrição Whisper)
 * 
 * OPCIONAIS:
 *    GOOGLE_CALENDAR_CLIENT_ID (string)
 *       └─ Para integração com Google Calendar (agendamentos)
 * 
 *    GOOGLE_CALENDAR_CLIENT_SECRET (string)
 *       └─ Acompanha CLIENT_ID
 * 
 *    GOOGLE_CALENDAR_REFRESH_TOKEN (string)
 *       └─ Token de refresh para acesso permanente
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * ESTRUTURA DE DADOS ESPERADA:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CONTACT (Exemplo):
 *    {
 *      id: "contact_123",
 *      name: "João Silva",
 *      phone: "+5511999999999",
 *      email: "joao@example.com",
 *      pipeline_stage: "qualificado",
 *      ai_enabled: true,
 *      is_active: true,
 *      keywords: ["vendas", "urgente"],
 *      custom_fields: {
 *        produto: "Atendimento_IA_24_7",
 *        data_reuniao: "2026-01-15",
 *        horario_preferido: "14:00"
 *      },
 *      notes: "Cliente em negociação...",
 *      last_message_at: "2026-01-09T14:30:00Z"
 *    }
 * 
 * MESSAGE (Exemplo):
 *    {
 *      id: "msg_456",
 *      contact_id: "contact_123",
 *      direction: "inbound",
 *      sender: "customer",
 *      content: "Olá, gostaria de agendar uma reunião",
 *      type: "text",
 *      status: "delivered",
 *      created_date: "2026-01-09T14:25:00Z"
 *    }
 * 
 * AI_SETTINGS (Exemplo):
 *    {
 *      id: "ai_001",
 *      name: "GLÓRIA Principal",
 *      system_prompt: "Você é GLÓRIA, assistente IA da Glória Vendas...",
 *      ai_model: "gpt-4o",
 *      is_active: true,
 *      transfer_keywords: ["falar com humano", "atendente", "supervisor"],
 *      business_hours_start: "08:00",
 *      business_hours_end: "20:00"
 *    }
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * MELHORIAS FUTURAS:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 🔮 ROADMAP:
 *    • Análise de sentimento em mensagens
 *    • Previsão de churn de cliente
 *    • Integração com Stripe para pagamentos
 *    • Multi-idioma (detecção automática)
 *    • Análise de padrões de conversa
 *    • Segmentação automática de leads
 *    • A/B testing de prompts
 *    • Relatórios PDF automáticos
 *    • Voice notes com IA
 *    • Inteligência competitiva em tempo real
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

Deno.serve(async (req) => {
  // Inicializa cliente Base44 com contexto da requisição (autenticação)
  const base44 = createClientFromRequest(req);

  // Valida método HTTP - apenas POST é aceito
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Autentica usuário - verifica se está logado
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Constrói objeto com toda documentação e estrutura para export
    // Este objeto é devolvido como JSON completo para referência
    const exportData = {
      // Metadados do export
      system: 'Glória Vendas IA System',
      version: '1.0',
      exportDate: new Date().toISOString(),
      generatedBy: user.email,
      
      // Documentação principal
      documentation: {
        title: 'EXPORT SISTEMA IA - GLÓRIA VENDAS',
        description: 'Sistema completo de IA para WhatsApp com pipeline, dashboard e configurações',
        
        // Lista de 8 entidades necessárias
        entities: [
          'Contact',              // Contatos/leads com dados pessoais
          'Message',              // Histórico de mensagens
          'AISettings',           // Configurações da IA (prompts, modelos, etc)
          'Keyword',              // Palavras-chave para auto-tagging de contatos
          'CustomField',          // Campos personalizados dinâmicos
          'WebhookConfig',        // Webhooks de entrada/saída
          'CustomAPI',            // Integrações com APIs externas
          'MetaTemplate'          // Templates aprovados do WhatsApp Business
        ],
        
        // Lista de 4 páginas principais
        pages: [
          'ChatIA.js',            // Chat principal (conversas em tempo real)
          'PipelineIA.js',        // Pipeline de vendas (kanban board)
          'DashboardIA.js',       // Dashboard analítico (métricas e gráficos)
          'ConfiguracoesIA.js'    // Painel de configurações (5 abas)
        ],
        
        // Componentes React reutilizáveis (9 no total)
        components: {
          chat: [
            'ChatWindow.jsx',         // Janela de chat com área de input
            'ContactList.jsx',        // Sidebar esquerda com lista de contatos
            'ContactDetails.jsx',     // Sidebar direita com detalhes do contato
            'MessageBubble.jsx',      // Componente visual individual de mensagem
            'TemplateSelector.jsx'    // Seletor de templates Meta aprovados
          ],
          crm: [
            'PipelineBoard.jsx'       // Kanban com 6 estágios de pipeline
          ],
          dashboard: [
            'StatsCard.jsx',          // Card de estatística com ícone e tendência
            'ConversationChart.jsx'   // 3 gráficos (área, barras, pizza)
          ],
          settings: [
            'AIPromptEditor',         // Editor de prompt de sistema da IA
            'KeywordManager',         // Gerenciador de palavras-chave
            'CustomFieldsManager',    // Gerenciador de campos personalizados
            'WebhookManager',         // Gerenciador de webhooks
            'CustomAPIManager'        // Gerenciador de APIs customizadas
          ]
        },
        
        // Funções backend (4 no total)
        functions: [
          'sendTemplateMessage.js',     // Envia templates Meta via Graph API
          'sendWhatsAppMessage.js',     // Envia mensagens de texto normais
          'transcribeAudio.js',         // Transcreve áudio com OpenAI Whisper
          'whatsapp/webhookMeta.js'     // Webhook principal de entrada Meta
        ],
        
        // Secrets/variáveis de ambiente obrigatórias
        requiredSecrets: [
          'META_PHONE_NUMBER_ID',       // ID do número WhatsApp na Meta
          'META_ACCESS_TOKEN',          // Token de acesso Meta Graph API
          'META_VERIFY_TOKEN',          // Token para validar webhook
          'OPENAI_API_KEY'              // Chave OpenAI para IA e Whisper
        ]
      },
      
      // Instruções passo a passo para implementação
      setupInstructions: {
        step1: 'Criar Entidades - Copie todos os arquivos JSON para entities/',
        step2: 'Instalar Páginas - Copie as 4 páginas para pages/',
        step3: 'Copiar Componentes - Mantenha estrutura de pastas em components/',
        step4: 'Copiar Funções - Mantenha estrutura de pastas em functions/',
        step5: 'Configurar Secrets - Defina todas as variáveis de ambiente',
        step6: 'Atualizar Layout - Adicione navegação até as novas páginas',
        step7: 'Testar Webhooks - Valide configuração de webhooks da Meta'
      },
      
      // Funcionalidades principais do sistema
      features: [
        'Chat IA com processamento em tempo real',
        'Suporte a templates aprovados do WhatsApp Business',
        'Processamento inteligente com delay de 8 segundos',
        'Transcrição automática de mensagens de áudio',
        'Pipeline de vendas visual com drag-and-drop',
        'Dashboard analítico com métricas em tempo real',
        'Sistema inteligente de palavras-chave e auto-tagging',
        'Campos personalizados por contato/cliente',
        'Webhooks customizáveis para processos externos',
        'Integração com Google Calendar para agendamentos'
      ],
      
      // Estrutura de arquivos e descrição de cada um
      fileStructure: {
        entities: {
          'Contact.json': 'Define estrutura base de contatos com pipeline stages',
          'Message.json': 'Define estrutura de mensagens (inbound/outbound)',
          'AISettings.json': 'Define configurações globais da IA (prompt, modelo, etc)',
          'Keyword.json': 'Define palavras-chave para auto-tagging de contatos',
          'CustomField.json': 'Define campos personalizados que podem ser adicionados',
          'WebhookConfig.json': 'Define webhooks que o sistema pode dispara/receber',
          'CustomAPI.json': 'Define APIs externas que o sistema pode chamar',
          'MetaTemplate.json': 'Define templates aprovados do WhatsApp Business'
        },
        
        pages: {
          'ChatIA.js': 'Página principal com interface de chat em 3 painéis',
          'PipelineIA.js': 'Página com kanban board para arrastar contatos',
          'DashboardIA.js': 'Página com análise de dados e métricas',
          'ConfiguracoesIA.js': 'Página com 5 abas de configurações'
        },
        
        components: {
          'components/chat/ChatWindow.jsx': 'Componente da janela de chat (centro)',
          'components/chat/ContactList.jsx': 'Componente lista de contatos (esquerda)',
          'components/chat/ContactDetails.jsx': 'Componente detalhes (direita)',
          'components/chat/MessageBubble.jsx': 'Componente visual de buble de msg',
          'components/chat/TemplateSelector.jsx': 'Componente seletor de templates',
          'components/crm/PipelineBoard.jsx': 'Componente kanban do pipeline',
          'components/dashboard/StatsCard.jsx': 'Componente card de estatísticas',
          'components/dashboard/ConversationChart.jsx': 'Componente com 3 gráficos'
        },
        
        functions: {
          'functions/sendTemplateMessage.js': 'Envia mensagem de template via Meta Graph API',
          'functions/sendWhatsAppMessage.js': 'Envia mensagem de texto simples',
          'functions/transcribeAudio.js': 'Transcreve áudio usando OpenAI Whisper',
          'functions/whatsapp/webhookMeta.js': 'Recebe e processa webhooks da Meta'
        }
      },
      
      // Notas importantes para implementação
      importantNotes: [
        'Este é um sistema COMPLETO e INTEGRADO - todos os componentes trabalham juntos',
        'Todas as alterações até 09/01/2026 foram incluídas (incluindo templates Meta)',
        'OBRIGATÓRIO: Chave OPENAI_API_KEY para transcrição de áudio e processamento IA',
        'Meta Business Manager deve estar configurado corretamente com webhook',
        'Templates DEVEM estar APROVADOS na Meta Business antes de usar',
        'Delay de 8 segundos é importante para acumular mensagens antes de processar',
        'Sistema usa @tanstack/react-query para sincronização de dados',
        'Drag-and-drop do pipeline usa @hello-pangea/dnd',
        'Gráficos do dashboard usam recharts library',
        'Requer Node 18+ e deno para funções backend'
      ],
      
      exportMessage: 'Sistema exportado com sucesso! Use esta documentação como guia completo para implementação em outro sistema Base44.'
    };

    // Retorna resposta com sucesso
    return Response.json({
      success: true,
      data: exportData,
      exportFormat: 'JSON documentado completo',
      generatedAt: new Date().toISOString(),
      nextStep: 'Use a estrutura acima como referência para copiar arquivos no novo sistema'
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});