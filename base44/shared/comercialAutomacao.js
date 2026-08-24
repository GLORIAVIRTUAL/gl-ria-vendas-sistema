const LIMPAR = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const SEGMENTOS = {
  clinicas: {
    aliases: ['clinica', 'medica', 'medico', 'odontologica', 'odontologia', 'dentista'],
    beneficio_principal: 'automatizar atendimento, agendamento, confirmações e relacionamento com pacientes',
    lista_curta_processos: 'atendimento • agendamento • confirmações • retornos • CRM • cobranças',
    pergunta_qualificacao: 'Hoje quem responde e agenda os pacientes que chegam pelo WhatsApp?'
  },
  imobiliarias: {
    aliases: ['imobiliaria', 'imoveis', 'corretor', 'corretores'],
    beneficio_principal: 'responder e qualificar leads rapidamente e aumentar oportunidades para os corretores',
    lista_curta_processos: 'atendimento de leads • busca de imóveis • qualificação • visitas • CRM • follow-up',
    pergunta_qualificacao: 'Quando um lead pergunta sobre um imóvel pelo WhatsApp, quem faz a primeira qualificação antes de chegar ao corretor?'
  },
  condominios: {
    aliases: ['condominio', 'administradora de condominio', 'sindico', 'sindicos'],
    beneficio_principal: 'automatizar atendimento e processos recorrentes dos moradores e da administração',
    lista_curta_processos: 'moradores • reservas • visitantes • cobranças • encomendas • chamados',
    pergunta_qualificacao: 'Hoje as solicitações dos moradores chegam mais pelo WhatsApp, telefone ou aplicativo?'
  },
  pilates: {
    aliases: ['pilates', 'studio pilates', 'estudio pilates'],
    beneficio_principal: 'automatizar atendimento, aulas experimentais, agenda e relacionamento com alunos',
    lista_curta_processos: 'leads • aula experimental • agenda • alunos • cobranças • relacionamento',
    pergunta_qualificacao: 'Quando alguém pede uma aula experimental pelo WhatsApp, a própria equipe faz todo o processo de atendimento e agendamento?'
  },
  lavanderias: {
    aliases: ['lavanderia', 'lavanderias'],
    beneficio_principal: 'integrar pedidos, coletas, acompanhamento, pagamentos e entregas',
    lista_curta_processos: 'pedidos • coleta • acompanhamento • pagamentos • entrega',
    pergunta_qualificacao: 'Hoje coleta, acompanhamento do pedido e entrega são controlados por qual sistema?'
  },
  lojas: {
    aliases: ['loja', 'varejo', 'comercio', 'retail'],
    beneficio_principal: 'permitir que atendimento e vendas também aconteçam pelo WhatsApp e online',
    lista_curta_processos: 'catálogo • atendimento • vendas • pagamento • pedidos • pós-venda',
    pergunta_qualificacao: 'Hoje alguém que pergunta por um produto no WhatsApp consegue concluir a compra por ali ou depende de um vendedor?'
  }
};

const FALLBACK = {
  beneficio_principal: 'automatizar processos repetitivos de atendimento, vendas e gestão',
  lista_curta_processos: 'atendimento • vendas • CRM • tarefas operacionais • follow-up',
  pergunta_qualificacao: 'Hoje qual processo comercial ou operacional mais depende de trabalho manual da equipe?'
};

export function argumentosDoSegmento(segmento = '') {
  const texto = LIMPAR(segmento);
  for (const item of Object.values(SEGMENTOS)) {
    if (item.aliases.some((alias) => texto.includes(LIMPAR(alias)))) {
      return {
        beneficio_principal: item.beneficio_principal,
        lista_curta_processos: item.lista_curta_processos,
        pergunta_qualificacao: item.pergunta_qualificacao
      };
    }
  }
  return { ...FALLBACK };
}

const primeiroNome = (nome) => String(nome || '').trim().split(/\s+/).filter(Boolean)[0] || '';

export function montarVariaveis(prospect = {}, campanha = {}) {
  const segmento = prospect.segmento || prospect.ramo_atividade || '';
  const argumentos = argumentosDoSegmento(segmento);
  const decisorNome = prospect.decisor_nome || prospect.qualificacao?.nome_pessoa || '';
  const produto = (prospect.produtos_sugeridos || [])[0] || prospect.qualificacao?.produto_interesse || '';
  return {
    primeiro_nome: primeiroNome(decisorNome),
    nome_decisor: decisorNome,
    cargo_decisor: prospect.decisor_cargo || prospect.qualificacao?.cargo_pessoa || '',
    empresa: prospect.nome_fantasia || prospect.razao_social || '',
    razao_social: prospect.razao_social || '',
    cidade: prospect.municipio || '',
    estado: prospect.uf || '',
    uf: prospect.uf || '',
    segmento,
    subsegmento: prospect.subsegmento || '',
    atividade: prospect.ramo_atividade || '',
    dado_publico_relevante: prospect.dado_publico_relevante || '',
    dor_provavel: prospect.qualificacao?.principal_problema || '',
    produto_recomendado: produto,
    produto,
    beneficio_principal: argumentos.beneficio_principal,
    lista_curta_processos: argumentos.lista_curta_processos,
    pergunta_qualificacao: argumentos.pergunta_qualificacao,
    video_url: campanha.video_url || '',
    agenda_url: campanha.agenda_url || '',
    nome_remetente: campanha.nome_remetente || 'Thiago',
    site_gloria: campanha.site_gloria || 'gloriavirtual.com'
  };
}

export function aplicarVariaveisSeguras(texto, variaveis = {}) {
  let resultado = String(texto || '').replace(/{{\s*([\w_]+)\s*}}/g, (_match, chave) => {
    const valor = variaveis[chave];
    return valor === null || valor === undefined ? '' : String(valor).trim();
  });
  // Evita pontuação/linhas quebradas causadas por placeholders vazios.
  resultado = resultado
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return resultado;
}

export function podeEnviarWhatsApp(prospect = {}) {
  return prospect.consentimento_whatsapp?.status === 'concedido' && !prospect.opt_out;
}


export function janelaComercialAtiva(referencia = new Date(), horaInicio = 8, horaFim = 18, somenteDiasUteis = true) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Recife', weekday: 'short', hour: '2-digit', hour12: false
  }).formatToParts(referencia).reduce((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  const dia = String(partes.weekday || '');
  const hora = Number(partes.hour || 0);
  if (somenteDiasUteis && ['Sat', 'Sun'].includes(dia)) return false;
  return hora >= Number(horaInicio) && hora < Number(horaFim);
}

export function inicioFimDiaRecife(referencia = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Recife', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(referencia).reduce((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  // Recife usa UTC-03:00. Meia-noite local = 03:00 UTC.
  const inicioMs = Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day), 3, 0, 0, 0);
  return {
    inicio: new Date(inicioMs).toISOString(),
    fim: new Date(inicioMs + 86400000 - 1).toISOString()
  };
}

const DELTAS_INTENT = {
  respondeu: 8,
  interessado: 15,
  pediu_informacoes: 10,
  pediu_demonstracao: 20,
  pediu_preco: 15,
  pediu_contato_whatsapp: 20,
  pediu_reuniao: 30,
  ja_tem_sistema: 8,
  reuniao_marcada: 40,
  nao_interessado: -100,
  remover_da_lista: -100
};

export function incrementoIntent(atual = 0, evento = '') {
  const novo = Number(atual || 0) + (DELTAS_INTENT[evento] || 0);
  return Math.max(0, Math.min(100, novo));
}

const saudacao = (vars) => vars.primeiro_nome ? `Olá, ${vars.primeiro_nome}.` : 'Olá, tudo bem?';
const linkLinha = (rotulo, url) => url ? `\n\n${rotulo}:\n${url}` : '';

export function montarRespostaAutomaticaEmail({ classificacao, prospect = {}, campanha = {} }) {
  const vars = montarVariaveis(prospect, campanha || {});
  const ola = saudacao(vars);
  const agenda = linkLinha('Agendar demonstração', vars.agenda_url);
  const video = linkLinha('Demonstração rápida', vars.video_url);
  const empresa = vars.empresa ? ` na ${vars.empresa}` : '';
  const segmento = vars.segmento || 'seu segmento';

  const respostas = {
    interessado: `${ola}\n\nÓtimo. Acho mais útil te mostrar funcionando do que tentar explicar tudo por mensagem.${video}${agenda}\n\nNa demonstração eu foco nas aplicações que fizerem sentido${empresa}.\n\nThiago\nGlória Virtual`,
    pediu_demonstracao: `${ola}\n\nClaro. Separei uma demonstração rápida da solução para ${segmento}.${video}${agenda}\n\nSe fizer sentido${empresa}, eu te mostro ao vivo como adaptaríamos o sistema aos processos de vocês.\n\nThiago\nGlória Virtual`,
    pediu_preco: `${ola}\n\nO investimento varia porque partimos de uma base já desenvolvida para ${segmento}, mas configuramos módulos e automações conforme a operação de cada empresa.\n\nAntes de te passar um valor sem relação com o que vocês precisam, prefiro entender quais processos fazem sentido automatizar${empresa}.${agenda}\n\nThiago\nGlória Virtual`,
    pediu_informacoes: `${ola}\n\nA Glória integra IA e automações a processos de atendimento, vendas, CRM e operação. Para ${segmento}, o foco costuma ser ${vars.beneficio_principal}.${video}${agenda}\n\nThiago\nGlória Virtual`,
    pediu_reuniao: `${ola}\n\nPerfeito. Podemos fazer uma demonstração online de aproximadamente 20 minutos e focar no cenário da empresa.${agenda}\n\nThiago\nGlória Virtual`,
    ja_tem_sistema: `${ola}\n\nPerfeito — isso não necessariamente é um problema. A proposta da Glória não é obrigatoriamente substituir o sistema atual; dependendo da estrutura, podemos integrar IA e automações ao que vocês já usam.\n\nQual sistema vocês utilizam atualmente?\n\nThiago\nGlória Virtual`,
    nao_interessado: `${ola}\n\nSem problema. Obrigado pelo retorno e não vou insistir.\n\nThiago\nGlória Virtual`,
    remover_da_lista: `Tudo bem. Seu contato foi removido das mensagens de prospecção da Glória.\n\nObrigado.`
  };

  if (!Object.prototype.hasOwnProperty.call(respostas, classificacao)) {
    return { automatico: false, corpo: '', assuntoPrefixo: 'Re:' };
  }
  return {
    automatico: true,
    corpo: respostas[classificacao],
    assuntoPrefixo: 'Re:'
  };
}