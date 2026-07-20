export const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((value) => ({ value, label: value }));
export const segments = ["COMERCIO","INDUSTRIA","SERVICOS","AGROPECUARIA","CONSTRUCAO CIVIL"].map((value) => ({ value, label: value.replaceAll("_", " ") }));
export const portes = [{ value: "NAO INFORMADO", label: "Não informado" }, { value: "MICRO EMPRESA", label: "Microempresa" }, { value: "PEQUENO PORTE", label: "Pequeno porte" }, { value: "DEMAIS", label: "Demais" }];
export const situacoes = ["ATIVA","BAIXADA","SUSPENSA","INAPTA","NULA"].map((value) => ({ value, label: value }));
export const matrizes = [{ value: "TRUE", label: "Somente matrizes" }, { value: "FALSE", label: "Somente filiais" }];
export const contatosDisponiveis = [{ value: "SIM", label: "Com telefone ou e-mail" }];
export const faturamentos = ["0:81000","81000:360000","360000:1000000","1000000:2000000","2000000:4800000","4800000:7000000","7000000:10000000","10000000:20000000","20000000:30000000","30000000:40000000","40000000:50000000","50000000:100000000","100000000:300000000","300000000:500000000","500000000:700000000","700000000:1000000000","1000000000:"].map((value) => ({ value, label: value.endsWith(":") ? "R$ 1 bi ou superior" : value.split(":").map((number) => Number(number).toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })).join(" a R$ ").replace(/^/, "R$ ") }));
export const funcionarios = ["0","1","02 A 05","06 A 09","10 A 19","20 A 49","50 A 99","100 A 249","250 A 499","500 A 999","1000 A 1999","2000 A 4999","5000 A 9999","10000 A 29999","30000 OU MAIS"].map((value) => ({ value, label: value }));
export const atividades = ["TECNOLOGIA DA INFORMACAO","RESTAURANTES","COMERCIO VAREJISTA","SERVICOS FINANCEIROS","SERVICOS DE SAUDE","EDUCACAO","CONSTRUCAO","TRANSPORTE","IMOBILIARIAS","PUBLICIDADE","CONSULTORIA","INDUSTRIA DE ALIMENTOS","AGROPECUARIA"];
export const atividadesEspecificas = [
  { value: "ATIVIDADE MEDICA AMBULATORIAL RESTRITA A CONSULTAS", label: "Clínicas médicas" },
  { value: "ATIVIDADE ODONTOLOGICA", label: "Clínicas odontológicas" },
  { value: "LABORATORIOS CLINICOS", label: "Laboratórios clínicos" },
  { value: "ATIVIDADES DE FISIOTERAPIA", label: "Clínicas de fisioterapia" },
  { value: "ATIVIDADES DE PSICOLOGIA E PSICANALISE", label: "Clínicas de psicologia" },
  { value: "ATIVIDADES DE PROFISSIONAIS DA NUTRICAO", label: "Clínicas de nutrição" },
  { value: "ATIVIDADES DE FONOAUDIOLOGIA", label: "Clínicas de fonoaudiologia" },
  { value: "ATIVIDADES DE TERAPIA OCUPACIONAL", label: "Clínicas de terapia ocupacional" },
  { value: "SERVICOS DE DIAGNOSTICO POR IMAGEM", label: "Diagnóstico por imagem" },
  { value: "ATIVIDADES DE ATENDIMENTO HOSPITALAR", label: "Hospitais" },
  { value: "ATIVIDADES VETERINARIAS", label: "Clínicas veterinárias" }
];
export const resultados = [5, 10, 20, 30, 50].map((value) => ({ value: String(value), label: `${value} resultados` }));