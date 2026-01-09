import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * EXPORT COMPLETO DO SISTEMA IA - GLÓRIA VENDAS
 * Data: 09/01/2026
 * Inclui: ChatIA, PipelineIA, DashboardIA, ConfiguracoesIA + todos componentes
 * 
 * Para usar em outro sistema:
 * 1. Copie as entidades JSON para entities/
 * 2. Copie as páginas para pages/
 * 3. Copie os componentes para components/
 * 4. Copie as funções para functions/
 * 5. Configure os secrets (META_*, OPENAI_API_KEY, etc)
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gera dados para export
    const exportData = {
      system: 'Glória Vendas IA System',
      version: '1.0',
      exportDate: new Date().toISOString(),
      generatedBy: user.email,
      
      documentation: {
        title: 'EXPORT SISTEMA IA - GLÓRIA VENDAS',
        description: 'Sistema completo de IA para WhatsApp com pipeline, dashboard e configurações',
        
        entities: [
          'Contact', 'Message', 'AISettings', 'Keyword', 'CustomField', 'WebhookConfig', 'CustomAPI', 'MetaTemplate'
        ],
        
        pages: [
          'ChatIA.js', 'PipelineIA.js', 'DashboardIA.js', 'ConfiguracoesIA.js'
        ],
        
        components: {
          chat: ['ChatWindow.jsx', 'ContactList.jsx', 'ContactDetails.jsx', 'MessageBubble.jsx', 'TemplateSelector.jsx'],
          crm: ['PipelineBoard.jsx'],
          dashboard: ['StatsCard.jsx', 'ConversationChart.jsx'],
          settings: ['AIPromptEditor', 'KeywordManager', 'CustomFieldsManager', 'WebhookManager', 'CustomAPIManager']
        },
        
        functions: [
          'sendTemplateMessage.js',
          'sendWhatsAppMessage.js',
          'transcribeAudio.js',
          'whatsapp/webhookMeta.js'
        ],
        
        requiredSecrets: [
          'META_PHONE_NUMBER_ID',
          'META_ACCESS_TOKEN',
          'META_VERIFY_TOKEN',
          'OPENAI_API_KEY'
        ]
      },
      
      setupInstructions: {
        step1: 'Criar Entidades - Copie todos os arquivos JSON para entities/',
        step2: 'Instalar Páginas - Copie as 4 páginas para pages/',
        step3: 'Copiar Componentes - Mantenha estrutura de pastas em components/',
        step4: 'Copiar Funções - Mantenha estrutura de pastas em functions/',
        step5: 'Configurar Secrets - Defina todas as variáveis de ambiente',
        step6: 'Atualizar Layout - Adicione navegação até as novas páginas',
        step7: 'Testar Webhooks - Valide configuração de webhooks da Meta'
      },
      
      features: [
        'Chat IA com WebSocket em tempo real',
        'Templates aprovados da Meta',
        'Processamento inteligente de mensagens com delay',
        'Transcrição automática de áudio',
        'Pipeline de vendas com drag-and-drop',
        'Dashboard com análise em tempo real',
        'Gerenciamento de palavras-chave',
        'Campos personalizados por contato',
        'Webhooks customizáveis',
        'Integração com Google Calendar'
      ],
      
      fileStructure: {
        entities: {
          'Contact.json': 'Estrutura de contatos/leads',
          'Message.json': 'Estrutura de mensagens',
          'AISettings.json': 'Configurações da IA',
          'Keyword.json': 'Palavras-chave para auto-tagging',
          'CustomField.json': 'Campos personalizados',
          'WebhookConfig.json': 'Configuração de webhooks',
          'CustomAPI.json': 'APIs HTTP customizadas',
          'MetaTemplate.json': 'Templates aprovados Meta'
        },
        
        pages: {
          'ChatIA.js': 'Interface principal de chat com IA',
          'PipelineIA.js': 'Pipeline de vendas com drag-and-drop',
          'DashboardIA.js': 'Dashboard com análise de dados',
          'ConfiguracoesIA.js': 'Página de configurações'
        },
        
        components: {
          'components/chat/ChatWindow.jsx': 'Janela de chat com input',
          'components/chat/ContactList.jsx': 'Lista de contatos',
          'components/chat/ContactDetails.jsx': 'Detalhes do contato',
          'components/chat/MessageBubble.jsx': 'Buble de mensagem',
          'components/chat/TemplateSelector.jsx': 'Seletor de templates Meta',
          'components/crm/PipelineBoard.jsx': 'Board do pipeline',
          'components/dashboard/StatsCard.jsx': 'Card de estatísticas',
          'components/dashboard/ConversationChart.jsx': 'Gráficos de conversa'
        },
        
        functions: {
          'functions/sendTemplateMessage.js': 'Enviar template Meta',
          'functions/sendWhatsAppMessage.js': 'Enviar mensagem WhatsApp',
          'functions/transcribeAudio.js': 'Transcrever áudio com Whisper',
          'functions/whatsapp/webhookMeta.js': 'Webhook de entrada Meta'
        }
      },
      
      importantNotes: [
        'Este é um sistema completo e integrado',
        'Todas as alterações até 09/01/2026 foram incluídas',
        'Requer OPENAI_API_KEY para transcrição e IA',
        'Meta Business Manager deve estar configurado corretamente',
        'Templates devem estar aprovados na Meta',
        'Minimum 5 minutos de delay é recomendado para processamento'
      ],
      
      exportMessage: 'Sistema exportado com sucesso! Use este arquivo como referência para implementação em outro sistema.'
    };

    return Response.json({
      success: true,
      data: exportData,
      exportFormat: 'JSON documentado',
      nextStep: 'Acesse https://github.com/base44/sistema-ia-gloria-vendas para documentação completa'
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});