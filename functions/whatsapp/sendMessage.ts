
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('\n🔍 === SEND MESSAGE START ===');
  
  try {
    const base44 = createClientFromRequest(req);
    
    let user = null;
    try {
      user = await base44.auth.me();
      console.log('✅ Usuário:', user?.email);
    } catch (error) {
      console.log('⚠️ Sem usuário autenticado');
    }

    const body = await req.json();
    const { telefone, mensagem, agendamento_id } = body;

    if (!telefone || !mensagem) {
      return Response.json({ 
        error: 'Campos obrigatórios faltando'
      }, { status: 400 });
    }

    // 🔥 Agora usa CLIENT_TOKEN, TOKEN_DA_INSTANCIA e IA_DA_INSTANCIA
    const clientToken = Deno.env.get('CLIENT_TOKEN')?.trim();
    const instanceToken = Deno.env.get('TOKEN_DA_INSTANCIA')?.trim();
    const instanceId = Deno.env.get('IA_DA_INSTANCIA')?.trim();

    console.log('🔑 Client Token length:', clientToken?.length);
    console.log('🔑 Instance Token length:', instanceToken?.length);
    console.log('🔑 Instance ID length:', instanceId?.length);

    if (!clientToken || !instanceToken || !instanceId) {
      return Response.json({ 
        error: 'WhatsApp não configurado',
        debug: {
          hasClientToken: !!clientToken,
          hasInstanceToken: !!instanceToken,
          hasInstanceId: !!instanceId
        }
      }, { status: 500 });
    }

    // Formatar telefone
    let telefoneFormatado = telefone.replace(/\D/g, '');
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }
    
    console.log('📱 Telefone:', telefoneFormatado);

    // 🔥 URL com token na URL + Client-Token no header
    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;
    
    console.log('🌐 URL:', zapiUrl);

    // Body exato do ZAPI
    const zapiPayload = {
      phone: telefoneFormatado,
      message: mensagem
    };
    
    console.log('📤 Payload:', JSON.stringify(zapiPayload));

    // Fetch com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(zapiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': clientToken  // 🔥 HEADER CLIENT-TOKEN
        },
        body: JSON.stringify(zapiPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📥 Status:', response.status);
      
      const responseText = await response.text();
      console.log('📥 Response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Parse error:', e.message);
        return Response.json({ 
          error: 'Resposta inválida do ZAPI',
          responseText
        }, { status: 500 });
      }

      if (!response.ok) {
        console.error('❌ ZAPI error:', result);
        return Response.json({ 
          error: 'Erro ao enviar mensagem',
          details: result,
          zapiStatus: response.status
        }, { status: 500 });
      }

      console.log('✅ Sucesso!');

      // Registrar disparo
      if (agendamento_id) {
        try {
          await base44.asServiceRole.entities.DisparoWhatsApp.create({
            agendamento_id,
            telefone: telefoneFormatado,
            mensagem,
            status: 'Enviado',
            data_envio: new Date().toISOString()
          });
        } catch (error) {
          console.error('⚠️ Erro ao registrar:', error.message);
        }
      }

      return Response.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        messageId: result.messageId,
        phone: telefoneFormatado
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ Timeout');
        return Response.json({ 
          error: 'Timeout ao enviar mensagem'
        }, { status: 504 });
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    
    return Response.json({ 
      error: 'Erro interno',
      message: error.message
    }, { status: 500 });
  }
});
