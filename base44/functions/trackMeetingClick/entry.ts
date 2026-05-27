import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  console.log('🔍 === TRACK MEETING CLICK START ===');
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Pega o ID do agendamento da URL
    const url = new URL(req.url);
    const agendamentoId = url.searchParams.get('id');
    console.log('📋 Agendamento ID:', agendamentoId);

    if (!agendamentoId) {
      console.log('❌ ID não fornecido, redirecionando para Google Meet');
      return Response.redirect('https://meet.google.com/', 302);
    }

    // Busca o agendamento usando service role
    console.log('🔎 Buscando agendamento...');
    const agendamentos = await base44.asServiceRole.entities.Agendamento.filter({ id: agendamentoId });
    
    if (agendamentos.length === 0) {
      console.log('❌ Agendamento não encontrado, redirecionando para Google Meet');
      return Response.redirect('https://meet.google.com/', 302);
    }

    const agendamento = agendamentos[0];
    console.log('✅ Agendamento encontrado:', {
      id: agendamento.id,
      nome_cliente: agendamento.nome_cliente,
      link_reuniao: agendamento.link_reuniao,
      link_reuniao_length: agendamento.link_reuniao?.length,
      link_reuniao_type: typeof agendamento.link_reuniao
    });

    // Busca o lead relacionado e atualiza para "Em_Avaliacao"
    console.log('🔎 Buscando lead relacionado...');
    const leads = await base44.asServiceRole.entities.Lead.filter({ 
      agendamento_id: agendamentoId 
    });

    if (leads.length > 0) {
      const lead = leads[0];
      console.log('👤 Lead encontrado:', {
        id: lead.id,
        nome: lead.nome_cliente,
        estagio: lead.estagio
      });
      
      // Só atualiza se ainda não estiver em estágio mais avançado
      if (lead.estagio === 'Reuniao_Marcada') {
        await base44.asServiceRole.entities.Lead.update(lead.id, {
          estagio: 'Em_Avaliacao'
        });
        console.log(`✅ Lead ${lead.id} movido para Em_Avaliacao`);
      } else {
        console.log(`ℹ️ Lead já está em estágio: ${lead.estagio}`);
      }
    } else {
      console.log('⚠️ Nenhum lead encontrado para este agendamento');
    }

    // Valida e limpa o link da reunião
    let linkReuniao = agendamento.link_reuniao;
    
    // Remove espaços e verifica se existe
    if (linkReuniao) {
      linkReuniao = linkReuniao.trim();
      console.log('🔗 Link após trim:', linkReuniao);
    }
    
    // Se não tiver link ou estiver vazio, vai para o Google Meet genérico
    if (!linkReuniao || linkReuniao === '' || linkReuniao === 'null' || linkReuniao === 'undefined') {
      console.log('⚠️ Link vazio ou inválido, redirecionando para Google Meet genérico');
      linkReuniao = 'https://meet.google.com/';
    }
    
    // Garante que o link começa com http:// ou https://
    if (!linkReuniao.startsWith('http://') && !linkReuniao.startsWith('https://')) {
      linkReuniao = 'https://' + linkReuniao;
      console.log('🔧 Link corrigido com https://', linkReuniao);
    }
    
    console.log('🎥 Redirecionando para:', linkReuniao);
    console.log('🎥 Link length:', linkReuniao.length);
    console.log('🎥 Link type:', typeof linkReuniao);
    
    // Usa 307 (Temporary Redirect) que preserva o método e corpo da requisição
    return new Response(null, {
      status: 307,
      headers: {
        'Location': linkReuniao,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('❌ ERRO ao rastrear clique:', error);
    console.error('Stack:', error.stack);
    return Response.redirect('https://meet.google.com/', 302);
  } finally {
    console.log('🔍 === TRACK MEETING CLICK END ===\n');
  }
});