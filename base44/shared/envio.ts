import nodemailer from 'npm:nodemailer@6.9.16';

export const formatarTelefone = (telefone) => {
  const digitos = String(telefone || '').replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.startsWith('55') ? digitos : `55${digitos}`;
};

export const aplicarVariaveis = (texto, prospect) => String(texto || '')
  .replace(/{{empresa}}/g, prospect.nome_fantasia || prospect.razao_social || '')
  .replace(/{{razao_social}}/g, prospect.razao_social || '')
  .replace(/{{cidade}}/g, prospect.municipio || '')
  .replace(/{{uf}}/g, prospect.uf || '')
  .replace(/{{segmento}}/g, prospect.segmento || '')
  .replace(/{{atividade}}/g, prospect.ramo_atividade || '')
  .replace(/{{produto}}/g, (prospect.produtos_sugeridos || [])[0] || '');

export const enviarWhatsApp = async ({ telefone, mensagem }) => {
  const clientToken = Deno.env.get('CLIENT_TOKEN')?.trim();
  const instanceToken = Deno.env.get('TOKEN_DA_INSTANCIA')?.trim();
  const instanceId = Deno.env.get('IA_DA_INSTANCIA')?.trim();
  if (!clientToken || !instanceToken || !instanceId) throw new Error('WhatsApp (Z-API) não configurado');

  const destino = formatarTelefone(telefone);
  if (!destino) throw new Error('Telefone inválido');

  const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': clientToken },
    body: JSON.stringify({ phone: destino, message: mensagem })
  });
  const texto = await response.text();
  if (!response.ok) throw new Error(`Z-API: ${texto}`);
  return { destino };
};

export const enviarEmail = async ({ email, assunto, corpo }) => {
  const gmailEmail = (Deno.env.get('GMAIL_EMAIL') || '').trim();
  const gmailPassword = (Deno.env.get('GMAIL_APP_PASSWORD') || '').trim();
  if (!gmailEmail || !gmailPassword) throw new Error('Gmail não configurado');
  if (!email) throw new Error('E-mail inválido');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailEmail, pass: gmailPassword }
  });
  await transporter.sendMail({
    from: `Glória Vendas <${gmailEmail}>`,
    to: email,
    subject: assunto,
    html: corpo,
    text: String(corpo || '').replace(/<[^>]*>/g, '')
  });
  return { destino: email };
};