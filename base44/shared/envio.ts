import nodemailer from 'npm:nodemailer@6.9.16';
import { montarVariaveis, aplicarVariaveisSeguras } from './comercialAutomacao.js';

export const formatarTelefone = (telefone) => {
  const digitos = String(telefone || '').replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.startsWith('55') ? digitos : `55${digitos}`;
};

// Mantém compatibilidade com as chamadas atuais, mas agora resolve toda a
// biblioteca comercial e remove placeholders sem valor antes do envio.
export const aplicarVariaveis = (texto, prospect, campanha = {}) => {
  const variaveis = montarVariaveis(prospect || {}, campanha || {});
  return aplicarVariaveisSeguras(texto, variaveis);
};

export const enviarWhatsApp = async ({ telefone, mensagem }) => {
  const clientToken = Deno.env.get('CLIENT_TOKEN')?.trim();
  const instanceToken = Deno.env.get('TOKEN_DA_INSTANCIA')?.trim();
  const instanceId = Deno.env.get('IA_DA_INSTANCIA')?.trim();
  if (!clientToken || !instanceToken || !instanceId) throw new Error('WhatsApp (Z-API) não configurado');

  const destino = formatarTelefone(telefone);
  if (!destino) throw new Error('Telefone inválido');
  if (!String(mensagem || '').trim()) throw new Error('Mensagem de WhatsApp vazia');

  const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': clientToken },
    body: JSON.stringify({ phone: destino, message: mensagem })
  });
  const texto = await response.text();
  if (!response.ok) throw new Error(`Z-API: ${texto}`);
  let payload = null;
  try { payload = JSON.parse(texto); } catch { payload = null; }
  return { destino, provider_message_id: payload?.messageId || payload?.id || '' };
};

export const enviarEmail = async ({ email, assunto, corpo }) => {
  const gmailEmail = (Deno.env.get('GMAIL_EMAIL') || '').trim();
  const gmailPassword = (Deno.env.get('GMAIL_APP_PASSWORD') || '').trim();
  if (!gmailEmail || !gmailPassword) throw new Error('Gmail não configurado');
  if (!email) throw new Error('E-mail inválido');
  if (!String(corpo || '').trim()) throw new Error('Corpo do e-mail vazio');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailEmail, pass: gmailPassword }
  });
  const info = await transporter.sendMail({
    from: `Glória Vendas <${gmailEmail}>`,
    to: email,
    subject: assunto || 'Glória Virtual',
    html: corpo,
    text: String(corpo || '').replace(/<[^>]*>/g, '')
  });
  return { destino: email, provider_message_id: info?.messageId || '' };
};