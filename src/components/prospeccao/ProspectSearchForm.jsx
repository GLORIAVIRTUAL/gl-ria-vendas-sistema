import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FilterSelect from "@/components/prospeccao/FilterSelect";
import MunicipalitySelect from "@/components/prospeccao/MunicipalitySelect";
import { atividades, atividadesEspecificasPorCnae, contatosDisponiveis, faturamentos, funcionarios, matrizes, portes, resultados, segments, situacoes, ufs } from "@/lib/kipflowFilterOptions";
import { atividadesDetalhadasPorAtividade } from "@/lib/kipflowDetailedActivities";

const initial = { cnpj: "", nome: "", cnae: "", cnaeEspecifico: "", cnaeDetalhado: "", municipio: "", uf: "", segmento: "", porte: "", faixaFaturamento: "", faixaFuncionarios: "", situacaoCadastral: "ATIVA", matriz: "", contatoDisponivel: "", resultSize: "20" };

export default function ProspectSearchForm({ onSearch, loading }) {
  const [filters, setFilters] = useState(initial);
  const set = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const specificActivities = atividadesEspecificasPorCnae[filters.cnae.trim().toUpperCase()] || [];
  const detailedActivities = atividadesDetalhadasPorAtividade[filters.cnaeEspecifico] || [];
  const setCnae = (value) => setFilters((current) => ({ ...current, cnae: value, cnaeEspecifico: "", cnaeDetalhado: "" }));
  const setSpecificActivity = (value) => setFilters((current) => ({ ...current, cnaeEspecifico: value, cnaeDetalhado: "" }));
  const submit = (event) => {
    event.preventDefault();
    const [faturamentoMin = "", faturamentoMax = ""] = filters.faixaFaturamento.split(":");
    onSearch({ ...filters, faturamentoMin, faturamentoMax });
  };
  return <Card><CardHeader><CardTitle>Filtros de empresas</CardTitle></CardHeader><CardContent>
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-3">
        <Input value={filters.cnpj} onChange={(event) => set("cnpj", event.target.value)} placeholder="CNPJ" />
        <Input value={filters.nome} onChange={(event) => set("nome", event.target.value)} placeholder="Razão social ou nome" />
        <Input list="atividades-kipflow" value={filters.cnae} onChange={(event) => setCnae(event.target.value)} placeholder="Área geral ou CNAE" />
        <FilterSelect value={filters.cnaeEspecifico} onChange={setSpecificActivity} placeholder={filters.cnae ? (specificActivities.length ? "Atividade específica" : "Sem atividades específicas") : "Selecione primeiro a área geral"} options={specificActivities} />
        <FilterSelect value={filters.cnaeDetalhado} onChange={(value) => set("cnaeDetalhado", value)} placeholder={filters.cnaeEspecifico ? (detailedActivities.length ? "Subsegmento do CNAE" : "Sem subsegmentos") : "Selecione primeiro a atividade"} options={detailedActivities} />
        <FilterSelect value={filters.uf} onChange={(value) => setFilters((current) => ({ ...current, uf: value, municipio: "" }))} placeholder="Todos os estados" options={ufs} />
        <MunicipalitySelect uf={filters.uf} value={filters.municipio} onChange={(value) => set("municipio", value)} />
        <FilterSelect value={filters.segmento} onChange={(value) => set("segmento", value)} placeholder="Todos os segmentos" options={segments} />
        <FilterSelect value={filters.porte} onChange={(value) => set("porte", value)} placeholder="Todos os portes" options={portes} />
        <FilterSelect value={filters.faixaFaturamento} onChange={(value) => set("faixaFaturamento", value)} placeholder="Todas as faixas de faturamento" options={faturamentos} />
        <FilterSelect value={filters.faixaFuncionarios} onChange={(value) => set("faixaFuncionarios", value)} placeholder="Todas as faixas de funcionários" options={funcionarios} />
        <FilterSelect value={filters.situacaoCadastral} onChange={(value) => set("situacaoCadastral", value)} placeholder="Todas as situações" options={situacoes} />
        <FilterSelect value={filters.matriz} onChange={(value) => set("matriz", value)} placeholder="Matrizes e filiais" options={matrizes} />
        <FilterSelect value={filters.contatoDisponivel} onChange={(value) => set("contatoDisponivel", value)} placeholder="Com ou sem contato" options={contatosDisponiveis} />
        <FilterSelect value={filters.resultSize} onChange={(value) => set("resultSize", value)} placeholder="Quantidade de resultados" options={resultados} />
      </div>
      <datalist id="atividades-kipflow">{atividades.map((value) => <option key={value} value={value} />)}</datalist>
      <Button type="submit" disabled={loading}>{loading ? "Consultando Kipflow..." : "Buscar empresas"}</Button>
    </form>
  </CardContent></Card>;
}