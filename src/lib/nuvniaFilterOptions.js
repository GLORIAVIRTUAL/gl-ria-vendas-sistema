// Opções fixas usadas nos filtros da prospecção Nuvnia.
export const cnaesNuvnia = [
  { value: "6821801", label: "6821801 - Imobiliárias (compra e venda)" },
  { value: "6822600", label: "6822600 - Administração de imóveis" },
  { value: "8630503", label: "8630503 - Clínicas e consultórios médicos" },
  { value: "8630504", label: "8630504 - Clínicas odontológicas" },
  { value: "8650004", label: "8650004 - Fisioterapia" },
  { value: "8712300", label: "8712300 - Clínicas de idosos / cuidados" },
  { value: "6920601", label: "6920601 - Contabilidade" },
  { value: "6911701", label: "6911701 - Advocacia" },
  { value: "7020400", label: "7020400 - Consultoria em gestão empresarial" },
  { value: "6201501", label: "6201501 - Desenvolvimento de software" },
  { value: "6209100", label: "6209100 - Suporte e TI" },
  { value: "7311400", label: "7311400 - Agências de publicidade" },
  { value: "8599604", label: "8599604 - Treinamento e cursos" },
  { value: "8630501", label: "8630501 - Atividade médica ambulatorial" },
  { value: "4711302", label: "4711302 - Supermercados" },
  { value: "4781400", label: "4781400 - Comércio de vestuário" },
  { value: "5611201", label: "5611201 - Restaurantes" },
  { value: "9602501", label: "9602501 - Salões de beleza" },
  { value: "4520001", label: "4520001 - Oficinas mecânicas" },
  { value: "8011102", label: "8011102 - Serviços de vigilância" },
  { value: "4120400", label: "4120400 - Construção de edifícios" },
  { value: "4930202", label: "4930202 - Transporte de cargas" }
];

export const capitaisSociais = [
  { value: "10000", label: "A partir de R$ 10 mil" },
  { value: "50000", label: "A partir de R$ 50 mil" },
  { value: "100000", label: "A partir de R$ 100 mil" },
  { value: "500000", label: "A partir de R$ 500 mil" },
  { value: "1000000", label: "A partir de R$ 1 milhão" }
];

const anoAtual = new Date().getFullYear();
export const anosAbertura = [anoAtual, anoAtual - 1, anoAtual - 3, anoAtual - 5, anoAtual - 10, anoAtual - 20]
  .map((ano) => ({ value: String(ano), label: `Aberta a partir de ${ano}` }));

export const quantidadesNuvnia = [
  { value: "10", label: "10 empresas" },
  { value: "20", label: "20 empresas" },
  { value: "50", label: "50 empresas" },
  { value: "100", label: "100 empresas" }
];

export const disponibilidadeContato = [
  { value: "sim", label: "Somente com" },
  { value: "nao", label: "Somente sem" }
];