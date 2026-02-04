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
    const phoneNumberId = (Deno.env.get('META_PHONE_NUMBER_ID') || '').trim();

    if (!accessToken || !phoneNumberId) {
      return Response.json({ 
        error: 'META_ACCESS_TOKEN ou META_PHONE_NUMBER_ID não configurados',
        templates: []
      }, { status: 500 });
    }

    // Primeiro, obtém o WABA ID a partir do Phone Number ID
    console.log('🔍 Buscando WABA ID para Phone Number ID:', phoneNumberId);
    
    const phoneResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=display_phone_number,verified_name,id`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!phoneResponse.ok) {
      const errorText = await phoneResponse.text();
      console.error('❌ Erro ao buscar info do telefone:', errorText);
    }

    // Busca o WABA ID usando o business_management
    const businessResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=waba_id`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    let wabaId = null;
    if (businessResponse.ok) {
      const businessData = await businessResponse.json();
      wabaId = businessData.waba_id;
      console.log('✅ WABA ID encontrado:', wabaId);
    }

    // Se não encontrou via waba_id, tenta buscar via owner_business_info
    if (!wabaId) {
      const ownerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=owner_business_info`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (ownerResponse.ok) {
        const ownerData = await ownerResponse.json();
        console.log('📊 Owner business info:', ownerData);
      }
    }

    // Tenta buscar templates diretamente usando o endpoint de message_templates
    // com diferentes métodos de descoberta do WABA ID

    // Método 1: Tenta com phone_number_id como parte da URL
    let templates = [];
    
    // Busca nas contas WABA associadas
    const wabaSearchResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/whatsapp_business_account`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (wabaSearchResponse.ok) {
      const wabaData = await wabaSearchResponse.json();
      wabaId = wabaData.id;
      console.log('✅ WABA ID via whatsapp_business_account:', wabaId);
    }

    // Se temos o WABA ID, busca os templates
    if (wabaId) {
      console.log('📋 Buscando templates do WABA:', wabaId);
      
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
      }
    } else {
      // Tenta método alternativo - buscar o WABA a partir de me/whatsapp_business_accounts
      console.log('🔄 Tentando método alternativo para encontrar WABA...');
      
      const meWabaResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/whatsapp_business_accounts`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (meWabaResponse.ok) {
        const meWabaData = await meWabaResponse.json();
        console.log('📊 Minhas contas WABA:', meWabaData);
        
        if (meWabaData.data && meWabaData.data.length > 0) {
          wabaId = meWabaData.data[0].id;
          console.log('✅ WABA ID encontrado via me/whatsapp_business_accounts:', wabaId);
          
          // Busca templates
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
          }
        }
      }
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