import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('\n🔍 === SUBMIT ONBOARDING START ===');
  console.log('📍 Method:', req.method);
  console.log('📍 Origin:', req.headers.get('origin'));
  
  // 🔥 Headers CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // 🔥 Responder OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const base44 = createClientFromRequest(req);

    const bodyText = await req.text();
    console.log('📥 Body recebido (texto):', bodyText);

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      return Response.json({
        success: false,
        error: 'JSON inválido',
        bodyRecebido: bodyText
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    console.log('📥 Dados parseados:', {
      email: data.email,
      nome_empresa: data.nome_empresa,
      lead_id: data.lead_id,
      agendamento_id: data.agendamento_id,
      campos_recebidos: Object.keys(data).length
    });

    // Remove IDs vazios
    if (!data.lead_id) delete data.lead_id;
    if (!data.agendamento_id) delete data.agendamento_id;

    // Cria o registro de onboarding
    console.log('💾 Criando registro de onboarding...');
    const onboarding = await base44.asServiceRole.entities.OnboardingCliente.create(data);

    console.log('✅ Onboarding criado:', onboarding.id);

    // 🔥 Atualiza o lead com as informações do onboarding E MUDA PARA IMPLANTAÇÃO
    if (data.lead_id) {
      try {
        console.log('📝 Atualizando lead para estágio IMPLANTAÇÃO:', data.lead_id);
        await base44.asServiceRole.entities.Lead.update(data.lead_id, {
          estagio: 'Implantacao', // 🔥 MUDA PARA IMPLANTAÇÃO
          status_onboarding: 'Concluido',
          proximos_passos: 'Formulário de onboarding preenchido - iniciar processo de implantação',
          nome_empresa: data.nome_empresa,
          telefone_cliente: data.telefone_whatsapp || data.telefone_cliente,
          observacoes: `Onboarding concluído em ${new Date().toLocaleDateString('pt-BR')}\nEmpresa: ${data.nome_empresa}\n\n${data.observacoes || ''}`
        });
        console.log('✅ Lead movido para IMPLANTAÇÃO no CRM');
      } catch (error) {
        console.error('⚠️ Erro ao atualizar lead:', error.message);
      }
    }

    console.log('✅ === SUBMIT ONBOARDING SUCCESS ===\n');

    return Response.json({
      success: true,
      message: 'Formulário enviado com sucesso',
      onboarding_id: onboarding.id
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ === SUBMIT ONBOARDING ERROR ===');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    console.log('❌ === SUBMIT ONBOARDING END ===\n');
    
    return Response.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
});