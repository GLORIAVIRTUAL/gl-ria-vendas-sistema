export const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((value) => ({ value, label: value }));
export const segments = ["COMERCIO","INDUSTRIA","SERVICOS","AGROPECUARIA","CONSTRUCAO CIVIL"].map((value) => ({ value, label: value.replaceAll("_", " ") }));
export const portes = [{ value: "NAO INFORMADO", label: "Não informado" }, { value: "MICRO EMPRESA", label: "Microempresa" }, { value: "PEQUENO PORTE", label: "Pequeno porte" }, { value: "DEMAIS", label: "Demais" }];
export const situacoes = ["ATIVA","BAIXADA","SUSPENSA","INAPTA","NULA"].map((value) => ({ value, label: value }));
export const matrizes = [{ value: "TRUE", label: "Somente matrizes" }, { value: "FALSE", label: "Somente filiais" }];
export const contatosDisponiveis = [{ value: "SIM", label: "Com telefone ou e-mail" }];
export const sociosDisponiveis = [{ value: "SIM", label: "Somente com sócios informados" }];
export const faturamentos = ["0:81000","81000:360000","360000:1000000","1000000:2000000","2000000:4800000","4800000:7000000","7000000:10000000","10000000:20000000","20000000:30000000","30000000:40000000","40000000:50000000","50000000:100000000","100000000:300000000","300000000:500000000","500000000:700000000","700000000:1000000000","1000000000:"].map((value) => ({ value, label: value.endsWith(":") ? "R$ 1 bi ou superior" : value.split(":").map((number) => Number(number).toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })).join(" a R$ ").replace(/^/, "R$ ") }));
export const funcionarios = ["0","1","02 A 05","06 A 09","10 A 19","20 A 49","50 A 99","100 A 249","250 A 499","500 A 999","1000 A 1999","2000 A 4999","5000 A 9999","10000 A 29999","30000 OU MAIS"].map((value) => ({ value, label: value }));
export const atividades = ["TECNOLOGIA DA INFORMACAO","RESTAURANTES","COMERCIO VAREJISTA","SERVICOS FINANCEIROS","SERVICOS DE SAUDE","EDUCACAO","CONSTRUCAO","TRANSPORTE","IMOBILIARIAS","PUBLICIDADE","CONSULTORIA","INDUSTRIA DE ALIMENTOS","AGROPECUARIA"];
export const atividadesEspecificasPorCnae = {
  "TECNOLOGIA DA INFORMACAO": [
    { value: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA", label: "Desenvolvimento de software" },
    { value: "CONSULTORIA EM TECNOLOGIA DA INFORMACAO", label: "Consultoria em TI" },
    { value: "SUPORTE TECNICO, MANUTENCAO E OUTROS SERVICOS EM TECNOLOGIA DA INFORMACAO", label: "Suporte e manutenção de TI" }
  ],
  "RESTAURANTES": [
    { value: "RESTAURANTES E SIMILARES", label: "Restaurantes" },
    { value: "LANCHONETES, CASAS DE CHA, DE SUCOS E SIMILARES", label: "Lanchonetes e cafeterias" },
    { value: "SERVICOS DE ALIMENTACAO PARA EVENTOS E RECEPCOES - BUFE", label: "Buffets e eventos" }
  ],
  "COMERCIO VAREJISTA": [
    { value: "COMERCIO VAREJISTA DE ARTIGOS DO VESTUARIO E ACESSORIOS", label: "Vestuário e acessórios" },
    { value: "COMERCIO VAREJISTA DE COSMETICOS, PRODUTOS DE PERFUMARIA E DE HIGIENE PESSOAL", label: "Cosméticos e perfumaria" },
    { value: "COMERCIO VAREJISTA DE MATERIAIS DE CONSTRUCAO EM GERAL", label: "Materiais de construção" },
    { value: "COMERCIO VAREJISTA DE MOVEIS", label: "Móveis" },
    { value: "COMERCIO VAREJISTA DE PRODUTOS FARMACEUTICOS", label: "Farmácias" },
    { value: "COMERCIO VAREJISTA DE MERCADORIAS EM GERAL", label: "Mercados e supermercados" }
  ],
  "SERVICOS FINANCEIROS": [
    { value: "ATIVIDADES DE INTERMEDIACAO E AGENCIAMENTO DE SERVICOS E NEGOCIOS EM GERAL", label: "Intermediação de negócios" },
    { value: "CORRESPONDENTES DE INSTITUICOES FINANCEIRAS", label: "Correspondentes financeiros" },
    { value: "ATIVIDADES AUXILIARES DOS SERVICOS FINANCEIROS", label: "Serviços financeiros auxiliares" }
  ],
  "SERVICOS DE SAUDE": [
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
  ],
  "EDUCACAO": [
    { value: "EDUCACAO INFANTIL", label: "Educação infantil" },
    { value: "ENSINO FUNDAMENTAL", label: "Ensino fundamental" },
    { value: "ENSINO MEDIO", label: "Ensino médio" },
    { value: "EDUCACAO PROFISSIONAL DE NIVEL TECNICO", label: "Ensino técnico" },
    { value: "ENSINO DE IDIOMAS", label: "Escolas de idiomas" }
  ],
  "CONSTRUCAO": [
    { value: "CONSTRUCAO DE EDIFICIOS", label: "Construção de edifícios" },
    { value: "SERVICOS DE ENGENHARIA", label: "Serviços de engenharia" },
    { value: "OBRAS DE ACABAMENTO", label: "Obras de acabamento" },
    { value: "INSTALACOES ELETRICAS", label: "Instalações elétricas" }
  ],
  "TRANSPORTE": [
    { value: "TRANSPORTE RODOVIARIO DE CARGA", label: "Transporte de cargas" },
    { value: "TRANSPORTE RODOVIARIO COLETIVO DE PASSAGEIROS", label: "Transporte de passageiros" },
    { value: "SERVICOS DE ENTREGA RAPIDA", label: "Entregas rápidas" },
    { value: "ARMAZENAMENTO", label: "Armazenamento e logística" }
  ],
  "IMOBILIARIAS": [
    { value: "CORRETAGEM NA COMPRA E VENDA E AVALIACAO DE IMOVEIS", label: "Compra, venda e avaliação" },
    { value: "GESTAO E ADMINISTRACAO DA PROPRIEDADE IMOBILIARIA", label: "Administração de imóveis" },
    { value: "ALUGUEL DE IMOVEIS PROPRIOS", label: "Aluguel de imóveis" }
  ],
  "PUBLICIDADE": [
    { value: "AGENCIAS DE PUBLICIDADE", label: "Agências de publicidade" },
    { value: "MARKETING DIRETO", label: "Marketing direto" },
    { value: "PROMOCAO DE VENDAS", label: "Promoção de vendas" },
    { value: "DESIGN", label: "Design e criação" }
  ],
  "CONSULTORIA": [
    { value: "ATIVIDADES DE CONSULTORIA EM GESTAO EMPRESARIAL", label: "Consultoria empresarial" },
    { value: "SERVICOS COMBINADOS DE ESCRITORIO E APOIO ADMINISTRATIVO", label: "Apoio administrativo" },
    { value: "ATIVIDADES DE CONTABILIDADE", label: "Contabilidade" }
  ],
  "INDUSTRIA DE ALIMENTOS": [
    { value: "FABRICACAO DE PRODUTOS DE PADARIA E CONFEITARIA", label: "Padaria e confeitaria" },
    { value: "FABRICACAO DE ALIMENTOS E PRATOS PRONTOS", label: "Alimentos prontos" },
    { value: "FABRICACAO DE LATICINIOS", label: "Laticínios" },
    { value: "PROCESSAMENTO DE CARNES", label: "Processamento de carnes" }
  ],
  "AGROPECUARIA": [
    { value: "CULTIVO DE SOJA", label: "Cultivo de soja" },
    { value: "CULTIVO DE FRUTAS", label: "Fruticultura" },
    { value: "CRIACAO DE BOVINOS", label: "Criação de bovinos" },
    { value: "ATIVIDADES DE APOIO A AGRICULTURA", label: "Apoio à agricultura" }
  ]
};
export const resultados = [5, 10, 20, 30, 50].map((value) => ({ value: String(value), label: `${value} resultados` }));