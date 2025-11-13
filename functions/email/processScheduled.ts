import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Esta função deve ser chamada periodicamente (a cada 5 minutos via cron job)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Busca disparos programados que já passaram da hora
    const agora = new Date().toISOString();
    const disparos = await base44.asServiceRole.entities.DisparoEmail.filter({
      status: 'Programado'
    });

    console.log(`📋 Total de emails programados: ${disparos.length}`);

    const disparosParaEnviar = disparos.filter(d => {
      return d.data_programada && new Date(d.data_programada) <= new Date(agora);
    });

    console.log(`📤 Emails para enviar agora: ${disparosParaEnviar.length}`);

    let enviados = 0;
    let erros = 0;

    for (const disparo of disparosParaEnviar) {
      try {
        console.log(`📧 Enviando para ${disparo.email_destinatario}...`);

        // Envia o email usando a integração Core.SendEmail
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Glória Vendas',
          to: disparo.email_destinatario,
          subject: disparo.assunto,
          body: disparo.corpo
        });

        await base44.asServiceRole.entities.DisparoEmail.update(disparo.id, {
          status: 'Enviado',
          data_envio: new Date().toISOString()
        });
        
        enviados++;
        console.log(`✅ Email ${disparo.id} enviado com sucesso`);

      } catch (error) {
        console.error(`❌ Erro ao enviar email ${disparo.id}:`, error.message);
        await base44.asServiceRole.entities.DisparoEmail.update(disparo.id, {
          status: 'Erro',
          erro_mensagem: error.message
        });
        erros++;
      }

      // Delay entre emails para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay
    }

    return Response.json({
      success: true,
      processados: disparosParaEnviar.length,
      enviados,
      erros
    });

  } catch (error) {
    console.error('❌ Erro interno no serviço de disparo de emails:', error);
    return Response.json({
      error: 'Erro interno no serviço de disparo',
      message: error.message
    }, { status: 500 });
  }
});