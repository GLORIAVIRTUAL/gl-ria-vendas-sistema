import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('📋 === GET WABA TEMPLATES START ===');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const accessToken = (Deno.env.get('META_ACCESS_TOKEN') || '').trim();
    const wabaId = (Deno.env.get('META_WABA_ID') || '').trim();

    if (!accessToken) {
      return Response.json({ 
        error: 'META_ACCESS_TOKEN não configurado',
        templates: []
      }, { status: 500 });
    }

    if (!wabaId) {
      return Response.json({ 
        error: 'META_WABA_ID não configurado. Configure o ID da sua conta WhatsApp Business.',
        templates: []
      }, { status: 500 });
    }

    console.log('📋 Buscando templates do WABA:', wabaId);
    
    let templates = [];
    
    const templatesResponse = await fetch(
      `https://graph.facebook.com/v18.0/${wabaId}/message_templates?limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      templates = templatesData.data || [];
      console.log('✅ Templates encontrados:', templates.length);
    } else {
      const errorText = await templatesResponse.text();
      console.error('❌ Erro ao buscar templates:', errorText);
      return Response.json({ 
        error: 'Erro ao buscar templates: ' + errorText,
        templates: []
      }, { status: 500 });
    }

    // Filtra apenas templates aprovados
    const approvedTemplates = templates.filter(t => t.status === 'APPROVED');
    
    console.log('📋 Templates aprovados:', approvedTemplates.length);
    console.log('🎉 === GET WABA TEMPLATES END ===\n');

    return Response.json({
      success: true,
      wabaId,
      templates: approvedTemplates.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        category: t.category,
        language: t.language,
        components: t.components
      }))
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message,
      templates: []
    }, { status: 500 });
  }
});