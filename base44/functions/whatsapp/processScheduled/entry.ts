
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Esta função deve ser chamada periodicamente (a cada 5 minutos via cron job)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Busca disparos programados que já passaram da hora
    const agora = new Date().toISOString();
    const disparos = await base44.asServiceRole.entities.DisparoWhatsApp.filter({
      status: 'Programado'
    });

    console.log(`📋 Total de disparos programados: ${disparos.length}`);

    const disparosParaEnviar = disparos.filter(d => {
      // Ensure d.data_programada exists and is a valid date string
      return d.data_programada && new Date(d.data_programada) <= new Date(agora);
    });

    console.log(`📤 Disparos para enviar agora: ${disparosParaEnviar.length}`);

    let enviados = 0;
    let erros = 0;

    const clientToken = Deno.env.get('TOKEN_DA_INSTANCIA')?.trim();
    const instanceId = Deno.env.get('ID_DA_INSTANCIA')?.trim();

    if (!clientToken || !instanceId) {
      console.error('❌ Erro: TOKEN_DA_INSTANCIA ou ID_DA_INSTANCIA não configurados.');
      return Response.json({
        error: 'WhatsApp não configurado. Verifique as variáveis de ambiente TOKEN_DA_INSTANCIA e ID_DA_INSTANCIA.'
      }, { status: 500 });
    }

    for (const disparo of disparosParaEnviar) {
      try {
        console.log(`📱 Enviando para ${disparo.telefone}...`);

        const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${clientToken}/send-text`;
        
        const response = await fetch(zapiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: disparo.telefone,
            message: disparo.mensagem
          })
        });

        const result = await response.json();

        if (response.ok) {
          await base44.asServiceRole.entities.DisparoWhatsApp.update(disparo.id, {
            status: 'Enviado',
            data_envio: new Date().toISOString()
          });
          enviados++;
          console.log(`✅ Disparo ${disparo.id} enviado com sucesso`);
        } else {
          console.error(`❌ Erro ao enviar disparo ${disparo.id}:`, result);
          await base44.asServiceRole.entities.DisparoWhatsApp.update(disparo.id, {
            status: 'Erro',
            erro_mensagem: JSON.stringify(result)
          });
          erros++;
        }

      } catch (error) {
        console.error(`❌ Erro inesperado no disparo ${disparo.id}:`, error.message);
        await base44.asServiceRole.entities.DisparoWhatsApp.update(disparo.id, {
          status: 'Erro',
          erro_mensagem: error.message
        });
        erros++;
      }

      // Delay entre mensagens para evitar sobrecarga na API do WhatsApp
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay
    }

    return Response.json({
      success: true,
      processados: disparosParaEnviar.length,
      enviados,
      erros
    });

  } catch (error) {
    console.error('❌ Erro interno no serviço de disparo:', error);
    return Response.json({
      error: 'Erro interno no serviço de disparo',
      message: error.message
    }, { status: 500 });
  }
});
