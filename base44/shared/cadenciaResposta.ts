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

export async function pararCadenciaPorResposta(db: any, phone: string) {
  const contatados = await db.entities.Prospect.filter({ status: 'contatado' }, '-updated_date', 500);
  const prospect = contatados.find((p: any) =>
    mesmoTelefone(p.whatsapp || '', phone) || mesmoTelefone(p.telefone || '', phone)
  );
  if (!prospect || prospect.respondeu_em) return { pausados: 0 };

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