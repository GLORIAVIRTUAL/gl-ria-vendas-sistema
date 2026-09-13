import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

function extrairEmailDestino(texto: string): string | null {
  let m = texto.match(/para\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (m) return m[1].toLowerCase().trim();

  m = texto.match(/Final-Recipient:\s*rfc822;\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (m) return m[1].toLowerCase().trim();

  m = texto.match(/Original-Recipient:\s*rfc822;\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (m) return m[1].toLowerCase().trim();

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

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  try {
    const bytes = atob(padded);
    return bytes
      .split("")
      .map((c) => String.fromCharCode(c.charCodeAt(0)))
      .join("");
  } catch {
    return "";
  }
}

function extrairCorpoMensagem(payload: any): string {
  if (!payload) return "";

  // Se o corpo está direto no payload (mensagem simples)
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Se há partes, percorre recursivamente buscando text/plain e text/html
  if (payload.parts) {
    let textoPlano = "";
    let textoHtml = "";
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        textoPlano += decodeBase64Url(part.body.data);
      } else if (part.mimeType === "text/html" && part.body?.data) {
        textoHtml += decodeBase64Url(part.body.data);
      } else if (part.parts) {
        const aninhado = extrairCorpoMensagem(part);
        if (aninhado && !textoPlano) textoPlano = aninhado;
      }
    }
    return textoPlano || textoHtml;
  }

  return "";
}

function extrairHeader(headers: any[], nome: string): string {
  if (!headers) return "";
  const h = headers.find((h: any) => h.name?.toLowerCase() === nome.toLowerCase());
  return h ? h.value : "";
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

    // Obter token OAuth do Gmail via conector
    const { accessToken } = await db.connectors.getConnection("gmail");
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Buscar emails de bounce no Gmail (últimos 30 dias) com paginação
    const query = '(subject:"Entrega incompleta" OR from:mailer-daemon OR from:mail-delivery) newer_than:30d';
    const messageIds: string[] = [];
    let pageToken: string | null = null;
    let pages = 0;
    do {
      let searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`;
      if (pageToken) searchUrl += `&pageToken=${pageToken}`;
      const searchRes = await fetch(searchUrl, { headers: authHeader });
      if (!searchRes.ok) {
        const errBody = await searchRes.text();
        console.error("Erro ao buscar mensagens no Gmail:", errBody);
        return Response.json({ error: "Erro ao consultar Gmail API" }, { status: 500 });
      }
      const searchData = await searchRes.json();
      const pageIds: string[] = (searchData.messages || []).map((m: any) => m.id);
      messageIds.push(...pageIds);
      pageToken = searchData.nextPageToken || null;
      pages++;
    } while (pageToken && pages < 5); // limite de 500 mensagens

    console.log(`Encontrados ${messageIds.length} emails de bounce no Gmail (${pages} páginas)`);

    const bounces: any[] = [];
    for (const msgId of messageIds) {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
          { headers: authHeader }
        );
        if (!msgRes.ok) continue;
        const msg = await msgRes.json();

        const headers = msg.payload?.headers || [];
        const subject = extrairHeader(headers, "Subject");
        const from = extrairHeader(headers, "From");

        const corpo = extrairCorpoMensagem(msg.payload);
        const textoCompleto = `${subject}\n${from}\n${corpo}`;

        const email = extrairEmailDestino(textoCompleto);
        const { tipo, motivo } = classificarMotivo(textoCompleto);

        bounces.push({ email, tipo, motivo, originalSubject: subject, msgId });
      } catch (e) {
        console.error("Erro ao processar mensagem", msgId, e.message);
      }
    }

    // Indexar TODOS os bounces por email de destino — o cruzamento com os
    // envios da campanha já garante que só contemos bounces relacionados a ela,
    // sem depender do Subject (que nas notificações de bounce é "Entrega incompleta")
    const bouncesByEmail: Record<string, any> = {};
    let bouncesComEmail = 0;
    for (const b of bounces) {
      if (b.email) {
        bouncesByEmail[b.email.toLowerCase().trim()] = b;
        bouncesComEmail++;
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
      bounces_encontrados_no_gmail: bounces.length,
      bounces_com_email_identificado: bouncesComEmail,
      bounces_sem_email_identificado: bounces.filter((b) => !b.email).length,
    });
  } catch (error) {
    console.error("Erro no relatório de entrega:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}