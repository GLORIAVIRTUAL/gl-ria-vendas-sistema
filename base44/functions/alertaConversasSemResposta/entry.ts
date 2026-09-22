import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { notificarDono } from '../../shared/zapi.ts';

const MIN_MINUTOS = 10; // só alerta depois de 10 min sem resposta
const MAX_MINUTOS = 25; // janela da execução (roda a cada 15 min, evita repetir)

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const agora = Date.now();
  const mensagens = await base44.asServiceRole.entities.Message.list('-created_date', 400);

  // Mantém apenas a mensagem mais recente de cada contato.
  const ultimaPorContato = new Map();
  for (const m of mensagens) {
    if (!ultimaPorContato.has(m.contact_id)) ultimaPorContato.set(m.contact_id, m);
  }

  const pendentes = [];
  for (const msg of ultimaPorContato.values()) {
    if (msg.direction !== 'inbound') continue;
    const minutos = (agora - new Date(msg.created_date).getTime()) / 60000;
    if (minutos < MIN_MINUTOS || minutos > MAX_MINUTOS) continue;

    const contatos = await base44.asServiceRole.entities.Contact.filter({ id: msg.contact_id });
    const contato = contatos[0];
    if (!contato) continue;

    pendentes.push({
      nome: contato.name || contato.phone,
      telefone: contato.phone,
      minutos: Math.round(minutos),
      texto: (msg.content || '').slice(0, 120)
    });
  }

  if (pendentes.length > 0) {
    const linhas = pendentes
      .map((p) => `• ${p.nome} (${p.telefone}) — ${p.minutos} min\n  "${p.texto}"`)
      .join('\n\n');
    await notificarDono(
      `🚨 *Conversas sem resposta*\n\n${pendentes.length} cliente(s) escreveram e ainda não receberam resposta:\n\n${linhas}\n\nResponda pelo sistema.`
    );
  }

  return Response.json({ sem_resposta: pendentes.length, contatos: pendentes });
});