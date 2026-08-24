// Captura automática da nota de NPS respondida pelo cliente no WhatsApp.

const MOTIVO_PESQUISA = 'Pesquisa NPS automática';
const JANELA_DIAS = 7;

const canonico = (t) => {
  let n = String(t || '').replace(/\D/g, '');
  if (n.startsWith('55')) n = n.slice(2);
  if (n.length === 11 && n[2] === '9') n = n.slice(0, 2) + n.slice(3);
  return n;
};

const mesmoTelefone = (a, b) => {
  const x = canonico(a);
  const y = canonico(b);
  if (!x || !y) return false;
  return x === y || x.endsWith(y) || y.endsWith(x);
};

export function extrairNota(texto) {
  const limpo = String(texto || '').replace(/[^\d\s,.]/g, ' ').trim();
  const match = limpo.match(/\b(10|[0-9])\b/);
  if (!match) return null;
  return Number(match[1]);
}

export function classificarNota(nota) {
  if (nota >= 9) return 'Promotor';
  if (nota >= 7) return 'Neutro';
  return 'Detrator';
}

// Registra a nota quando existe uma pesquisa NPS enviada recentemente para este telefone.
// Retorna { registrada: boolean, nota?, classificacao? }.
export async function capturarNotaNPS(sdk, phone, texto) {
  const nota = extrairNota(texto);
  if (nota === null) return { registrada: false };

  const limite = Date.now() - JANELA_DIAS * 24 * 60 * 60 * 1000;

  const interacoes = await sdk.entities.InteracaoRetencao.list('-created_date', 200);
  const pesquisas = interacoes.filter((i) =>
    i.motivo === MOTIVO_PESQUISA &&
    new Date(i.created_date).getTime() > limite &&
    mesmoTelefone(i.destino, phone)
  );
  if (pesquisas.length === 0) return { registrada: false };

  const pesquisa = pesquisas[0];

  // Idempotência: se já registramos uma nota depois do envio da pesquisa, não duplica.
  const respostas = await sdk.entities.NPSResposta.filter({ negocio_id: pesquisa.negocio_id }, '-created_date', 5);
  const jaRespondeu = respostas.some((r) => new Date(r.created_date).getTime() > new Date(pesquisa.created_date).getTime());
  if (jaRespondeu) return { registrada: false, duplicada: true };

  const classificacao = classificarNota(nota);

  await sdk.entities.NPSResposta.create({
    negocio_id: pesquisa.negocio_id,
    nome_cliente: pesquisa.nome_cliente,
    nome_empresa: pesquisa.nome_empresa,
    nota,
    classificacao,
    comentario: `Respondido por WhatsApp: "${String(texto || '').trim()}"`
  });

  return { registrada: true, nota, classificacao, negocio_id: pesquisa.negocio_id };
}

export function mensagemAgradecimento(nota) {
  if (nota >= 9) return 'Muito obrigado pela nota! 🙌 Fico feliz que a Glória esteja te ajudando. Se puder indicar a gente para alguém, seria incrível!';
  if (nota >= 7) return 'Obrigado pela nota! Se quiser, me conta rapidinho o que podemos melhorar para chegar no 10. 🙏';
  return 'Obrigado pela sinceridade. Vou levar isso para o nosso time e alguém vai te chamar para entender melhor e resolver. 🙏';
}