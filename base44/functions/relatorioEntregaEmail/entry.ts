import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { ImapFlow } from 'https://esm.sh/imapflow@1.0.170';

function extrairEmailDestino(texto: string): string | null {
  // Padrão "para [email]" (Gmail PT-BR)
  let m = texto.match(/para\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (m) return m[1].toLowerCase().trim();

  // Padrão "Final-Recipient: rfc822; [email]"
  m = texto.match(/Final-Recipient:\s*rfc822;\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (m) return m[1].toLowerCase().trim();

  // Padrão "Original-Recipient: rfc822; [email]"
  m = texto.match(/Original-Recipient:\s*rfc822;\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (m) return m[1].toLowerCase().trim();

  // Fallback: busca qualquer email no corpo (excluindo remetentes do Google)
  const emails = texto.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (emails) {
    const filtrados = emails.filter(
      (e) =>
        !e.toLowerCase().includes("google.com") &&
        !e.toLowerCase().includes("gmail.com") &&
        !e.toLowerCase().includes("mailer-daemon") &&
        !e.toLowerCase().includes("mail-delivery")
    );
    if (filtrados.length) return filtrados[0].toLowerCase().trim();
  }
  return null;
}

function classificarMotivo(texto: string): { tipo: string; motivo: string } {
  const t = texto.toLowerCase();

  // Falhas permanentes — email inexistente
  if (
    t.includes("não foi encontrado") ||
    t.includes("does not exist") ||
    t.includes("user unknown") ||
    t.includes("no such user") ||
    t.includes("mailbox unavailable") ||
    t.includes("address rejected") ||
    t.includes("invalid mailbox") ||
    t.includes("invalid recipient") ||
    t.includes("550 5.1.1") ||
    t.includes("550 5.2.1") ||
    t.includes("conta não existe") ||
    t.includes("não existe")
  ) {
    return { tipo: "permanente", motivo: "Email inexistente / caixa postal inválida" };
  }

  // Falhas permanentes — conta desativada/bloqueada
  if (
    t.includes("disabled") ||
    t.includes("desativada") ||
    t.includes("suspended") ||
    t.includes("blocked") ||
    t.includes("spam") ||
    t.includes("rejected") ||
    t.includes("policy") ||
    t.includes("abuse") ||
    t.includes("blacklist")
  ) {
    return { tipo: "permanente", motivo: "Conta desativada ou bloqueada por política" };
  }

  // Caixa cheia
  if (
    t.includes("quota") ||
    t.includes("exceeded") ||
    t.includes("cheia") ||
    t.includes("storage") ||
    t.includes("over quota") ||
    t.includes("mailbox full") ||
    t.includes("552 5.2.2")
  ) {
    return { tipo: "temporario", motivo: "Caixa postal cheia (quota excedida)" };
  }

  // Falhas temporárias
  if (
    t.includes("temporarily") ||
    t.includes("temporário") ||
    t.includes("deferred") ||
    t.includes("timeout") ||
    t.includes("try again") ||
    t.includes("problema temporário") ||
    t.includes("421") ||
    t.includes("4.4.2") ||
    t.includes("could not be delivered") ||
    t.includes("tentará novamente")
  ) {
    return { tipo: "temporario", motivo: "Falha temporária (servidor indisponível / timeout)" };
  }

  return { tipo: "desconhecido", motivo: "Motivo não identificado automaticamente" };
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });
    }

    const db = base44.asServiceRole;

    const gmailEmail = (Deno.env.get("GMAIL_EMAIL") || "").trim();
    const gmailPassword = (Deno.env.get("GMAIL_APP_PASSWORD") || "").trim();
    if (!gmailEmail || !gmailPassword) {
      return Response.json({ error: "Gmail não configurado" }, { status: 500 });
    }

    // Buscar campanha de imobiliárias
    const campanhas = await db.entities.Campanha.filter({});
    const imobiliarias = campanhas.find(
      (c: any) => c.nome && c.nome.toLowerCase().includes("imobili")
    );
    if (!imobiliarias) {
      return Response.json({ error: "Campanha de imobiliárias não encontrada" }, { status: 404 });
    }

    // Buscar todos os envios da campanha
    const envios = await db.entities.CadenciaEnvio.filter(
      { campanha_id: imobiliarias.id },
      "-created_date",
      2000
    );

    // Conectar ao Gmail via IMAP
    const client = new ImapFlow({
      host: "imap.gmail.com",
      port: 993,
      secure: true,
      auth: { user: gmailEmail, pass: gmailPassword },
      logger: false,
    });

    await client.connect();

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const bounces: any[] = [];
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uidsSubject = await client.search({ subject: "Entrega incompleta", since });
      const uidsFrom = await client.search({ from: "mailer-daemon", since });
      const uidsDelivery = await client.search({ from: "mail-delivery", since });
      const allUids = [...new Set([...uidsSubject, ...uidsFrom, ...uidsDelivery])];

      console.log(`Encontrados ${allUids.length} emails de bounce no Gmail`);

      for (const uid of allUids) {
        try {
          const msg = await client.fetchOne(uid, { source: true });
          const source = new TextDecoder().decode(msg.source as Uint8Array);

          const email = extrairEmailDestino(source);
          const { tipo, motivo } = classificarMotivo(source);

          const subjectMatch = source.match(/Subject:\s*(.+)/i);
          const originalSubject = subjectMatch ? subjectMatch[1].trim() : "";

          bounces.push({ email, tipo, motivo, originalSubject, uid });
        } catch {
          // ignora mensagens que não conseguimos parsear
        }
      }
    } finally {
      lock.release();
      await client.logout();
    }

    // Filtrar bounces relacionados à campanha de imobiliárias
    const bouncesCampanha = bounces.filter(
      (b) =>
        b.originalSubject &&
        (b.originalSubject.toLowerCase().includes("imobili") ||
          b.originalSubject.toLowerCase().includes("como funciona"))
    );

    // Indexar bounces por email
    const bouncesByEmail: Record<string, any> = {};
    for (const b of bouncesCampanha) {
      if (b.email) {
        bouncesByEmail[b.email.toLowerCase().trim()] = b;
      }
    }

    // Cruzar bounces com os envios da campanha
    const enviosComBounce: any[] = [];
    for (const env of envios) {
      if (env.canal === "Email" && env.destino) {
        const emailKey = env.destino.toLowerCase().trim();
        if (bouncesByEmail[emailKey]) {
          enviosComBounce.push({ envio: env, bounce: bouncesByEmail[emailKey] });
        }
      }
    }

    // Atualizar envios que voltaram como bounce
    let atualizados = 0;
    let optOuts = 0;
    for (const { envio, bounce } of enviosComBounce) {
      if (envio.status !== "erro") {
        await db.entities.CadenciaEnvio.update(envio.id, {
          status: "erro",
          erro_mensagem: `Bounce: ${bounce.motivo}`,
          ultimo_erro_em: new Date().toISOString(),
        });
        atualizados++;
      }

      // Falhas permanentes → marcar prospect como opt_out
      if (bounce.tipo === "permanente" && envio.prospect_id) {
        try {
          await db.entities.Prospect.update(envio.prospect_id, {
            opt_out: true,
            opt_out_motivo: `Email inválido (bounce): ${bounce.motivo}`,
          });
          optOuts++;
        } catch {
          // ignora se não conseguir atualizar
        }
      }
    }

    // Calcular totais
    const enviados = envios.filter(
      (e: any) => e.status === "enviado" || e.status === "erro"
    ).length;
    const totalBounces = enviosComBounce.length;
    const totalEntregues = Math.max(0, enviados - totalBounces);

    // Agrupar bounces por motivo
    const motivosAgrupados: Record<string, string[]> = {};
    for (const { bounce } of enviosComBounce) {
      if (!motivosAgrupados[bounce.motivo]) motivosAgrupados[bounce.motivo] = [];
      if (bounce.email) motivosAgrupados[bounce.motivo].push(bounce.email);
    }

    return Response.json({
      success: true,
      campanha: imobiliarias.nome,
      resumo: {
        total_enviados: enviados,
        total_entregues: totalEntregues,
        total_bounces: totalBounces,
        taxa_entrega:
          enviados > 0 ? `${((totalEntregues / enviados) * 100).toFixed(1)}%` : "0%",
      },
      motivos: Object.entries(motivosAgrupados).map(([motivo, emails]) => ({
        motivo,
        quantidade: emails.length,
        emails: [...new Set(emails)],
      })),
      acoes_realizadas: {
        envios_marcados_erro: atualizados,
        prospects_marcados_optout: optOuts,
      },
      bounces_encontrados_no_gmail: bouncesCampanha.length,
      bounces_sem_email_identificado: bouncesCampanha.filter((b) => !b.email).length,
    });
  } catch (error) {
    console.error("Erro no relatório de entrega:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}