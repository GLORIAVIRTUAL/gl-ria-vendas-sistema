import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Processa lembretes de compromissos da Agenda e envia via Z-API.
// Deve ser chamada periodicamente (a cada 5 minutos via automação/cron).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const clientToken = Deno.env.get('CLIENT_TOKEN')?.trim();
    const instanceToken = Deno.env.get('TOKEN_DA_INSTANCIA')?.trim();
    const instanceId = Deno.env.get('IA_DA_INSTANCIA')?.trim();

    if (!clientToken || !instanceToken || !instanceId) {
      return Response.json({
        error: 'WhatsApp não configurado. Verifique CLIENT_TOKEN, TOKEN_DA_INSTANCIA e IA_DA_INSTANCIA.'
      }, { status: 500 });
    }

    // Busca compromissos pendentes que querem notificação e ainda não foram notificados
    const compromissos = await base44.asServiceRole.entities.Compromisso.filter({
      status: 'Pendente',
      notificar_whatsapp: true,
      notificacao_enviada: false
    });

    console.log(`📋 Compromissos candidatos: ${compromissos.length}`);

    const agora = new Date();
    let enviados = 0;
    let erros = 0;

    for (const comp of compromissos) {
      try {
        if (!comp.telefone_notificacao || !comp.data || !comp.horario) continue;

        // Horário do compromisso (timezone Brasil GMT-3)
        const dataHora = new Date(`${comp.data}T${comp.horario}:00-03:00`);
        const minutosAntes = comp.minutos_antes_notificar || 30;
        const horaDisparo = new Date(dataHora.getTime() - minutosAntes * 60 * 1000);

        // Só envia quando já passou da hora de disparo e o compromisso ainda não aconteceu
        if (agora < horaDisparo || agora > dataHora) continue;

        // Formata telefone
        let telefone = comp.telefone_notificacao.replace(/\D/g, '');
        if (!telefone.startsWith('55')) telefone = '55' + telefone;

        const horaFormatadaBR = dataHora.toLocaleTimeString('pt-BR', {
          timeZone: 'America/Recife',
          hour: '2-digit',
          minute: '2-digit'
        });
        const dataFormatadaBR = dataHora.toLocaleDateString('pt-BR', {
          timeZone: 'America/Recife'
        });

        const mensagem = `🔔 *Lembrete de Compromisso*

📌 *${comp.titulo}*
📅 ${dataFormatadaBR}
⏰ ${horaFormatadaBR}${comp.descricao ? `\n\n📝 ${comp.descricao}` : ''}

_Enviado automaticamente pelo sistema Glória Vendas_`;

        const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;

        const response = await fetch(zapiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': clientToken
          },
          body: JSON.stringify({ phone: telefone, message: mensagem })
        });

        const result = await response.json();

        if (response.ok) {
          await base44.asServiceRole.entities.Compromisso.update(comp.id, {
            notificacao_enviada: true
          });
          enviados++;
          console.log(`✅ Lembrete enviado: ${comp.titulo} → ${telefone}`);
        } else {
          erros++;
          console.error(`❌ Erro ao enviar lembrete ${comp.id}:`, result);
        }

        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        erros++;
        console.error(`❌ Erro inesperado no compromisso ${comp.id}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      candidatos: compromissos.length,
      enviados,
      erros
    });

  } catch (error) {
    console.error('❌ Erro no processCompromissos:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});