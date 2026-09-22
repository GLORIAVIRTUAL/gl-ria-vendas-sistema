// Envio de mensagens de texto via Z-API, compartilhado pelas funções do sistema.

export const NUMERO_DONO = '5587988020504';

export function normalizarTelefone(phone: string) {
  let numero = (phone || '').replace(/\D/g, '');
  if (numero && !numero.startsWith('55')) numero = '55' + numero;
  return numero;
}

export async function enviarMensagemZapi(phone: string, message: string) {
  try {
    const clientToken = (Deno.env.get('CLIENT_TOKEN') || '').trim();
    const instanceToken = (Deno.env.get('TOKEN_DA_INSTANCIA') || '').trim();
    const instanceId = (Deno.env.get('IA_DA_INSTANCIA') || '').trim();

    if (!clientToken || !instanceToken || !instanceId) {
      console.error('❌ Credenciais Z-API incompletas para envio');
      return { ok: false, messageId: null, erro: 'Credenciais Z-API incompletas' };
    }

    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Token': clientToken },
        body: JSON.stringify({ phone: normalizarTelefone(phone), message }),
        signal: AbortSignal.timeout(20000)
      }
    );

    const texto = await res.text();
    if (res.ok) {
      console.log('✅ Mensagem enviada via Z-API!');
      let data: any = null;
      try { data = JSON.parse(texto); } catch { data = null; }
      return { ok: true, messageId: data?.messageId || data?.id || data?.zaapId || null, erro: null };
    }
    console.error('❌ Erro ao enviar via Z-API:', texto);
    return { ok: false, messageId: null, erro: `HTTP ${res.status}: ${texto.slice(0, 200)}` };
  } catch (error) {
    console.error('⚠️ Erro ao enviar mensagem Z-API:', error.message);
    return { ok: false, messageId: null, erro: error.message };
  }
}

export async function notificarDono(mensagem: string) {
  const envio = await enviarMensagemZapi(NUMERO_DONO, mensagem);
  if (!envio.ok) console.error('⚠️ Não foi possível notificar o dono:', envio.erro);
  return envio.ok;
}