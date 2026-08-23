// Quando um prospect responde no WhatsApp, a cadência dele é interrompida
// e ele entra no CRM como lead quente.

const canonico = (t: string) => {
  let n = (t || '').replace(/\D/g, '');
  if (n.startsWith('55')) n = n.slice(2);
  if (n.length === 11 && n[2] === '9') n = n.slice(0, 2) + n.slice(3);
  return n;
};

const mesmoTelefone = (a: string, b: string) => {
  const x = canonico(a);
  const y = canonico(b);
  if (!x || !y) return false;
  return x === y || x.endsWith(y) || y.endsWith(x);
};

// Pedido explícito de não receber mais mensagens (lista de supressão).
const PADROES_OPT_OUT = [
  /\b(nao|n\u00e3o)\s+(quero|desejo)\s+(mais\s+)?(receber|mensagens|contato)\b/,
  /\b(pare|para|parem|cancele|cancela)\s+(de\s+)?(me\s+)?(enviar|mandar|mensagens)\b/,
  /\b(me\s+)?(remova|remove|retire|tire|descadastre|descadastra)\s*(me)?\s*(da|do)?\s*(lista|base|cadastro)?\b/,
  /\bsair da lista\b/,
  /\b(nao|n\u00e3o)\s+me\s+(mande|envie|procure)\s+mais\b/,
  /\bdescadastrar\b/
];

const pediuOptOut = (texto: string) => {
  const t = (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return PADROES_OPT_OUT.some((p) => p.test(t));
};

export async function pararCadenciaPorResposta(db: any, phone: string, texto = '') {
  const contatados = await db.entities.Prospect.filter({ status: 'contatado' }, '-updated_date', 500);
  const prospect = contatados.find((p: any) =>
    mesmoTelefone(p.whatsapp || '', phone) || mesmoTelefone(p.telefone || '', phone)
  );
  if (!prospect) return { pausados: 0 };

  // Opt-out vale mesmo depois de o prospect já ter respondido antes.
  if (pediuOptOut(texto) && !prospect.opt_out) {
    const pendentesOptOut = await db.entities.CadenciaEnvio.filter({
      prospect_id: prospect.id,
      status: 'programado'
    });
    for (const envio of pendentesOptOut) {
      await db.entities.CadenciaEnvio.update(envio.id, {
        status: 'cancelado',
        erro_mensagem: 'Opt-out: contato pediu para não receber mensagens'
      });
    }
    await db.entities.Prospect.update(prospect.id, {
      opt_out: true,
      opt_out_motivo: 'Solicitou remoção da lista pelo WhatsApp',
      respondeu_em: prospect.respondeu_em || new Date().toISOString()
    });
    return { pausados: pendentesOptOut.length, prospect_id: prospect.id, opt_out: true };
  }

  if (prospect.respondeu_em) return { pausados: 0 };

  const pendentes = await db.entities.CadenciaEnvio.filter({
    prospect_id: prospect.id,
    status: 'programado'
  });

  for (const envio of pendentes) {
    await db.entities.CadenciaEnvio.update(envio.id, {
      status: 'cancelado',
      erro_mensagem: 'Cadência interrompida: prospect respondeu'
    });
  }

  await db.entities.Prospect.update(prospect.id, {
    respondeu_em: new Date().toISOString()
  });

  let leadId = prospect.crm_lead_id || '';
  if (!leadId) {
    const lead = await db.entities.Lead.create({
      nome_cliente: prospect.nome_fantasia || prospect.razao_social,
      nome_empresa: prospect.razao_social,
      email_cliente: prospect.email || undefined,
      telefone_cliente: prospect.whatsapp || prospect.telefone || phone,
      estagio: 'Prospeccao',
      prioridade: 'Alta',
      observacoes: `Lead quente: respondeu a cadência de prospecção via WhatsApp.`,
      proximos_passos: 'Retornar contato e qualificar'
    });
    leadId = lead.id;
    await db.entities.Prospect.update(prospect.id, { crm_lead_id: leadId });
  }

  return { pausados: pendentes.length, prospect_id: prospect.id, lead_id: leadId };
}