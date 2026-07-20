import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FilterSelect from "@/components/prospeccao/FilterSelect";
import { atividades, faturamentos, funcionarios, matrizes, municipios, portes, segments, situacoes, ufs } from "@/lib/kipflowFilterOptions";

const initial = { cnpj: "", nome: "", cnae: "", municipio: "", uf: "", segmento: "", porte: "", faixaFaturamento: "", faixaFuncionarios: "", situacaoCadastral: "ATIVA", matriz: "" };

export default function ProspectSearchForm({ onSearch, loading }) {
  const [filters, setFilters] = useState(initial);
  const set = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
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
        <Input list="atividades-kipflow" value={filters.cnae} onChange={(event) => set("cnae", event.target.value)} placeholder="Atividade ou CNAE" />
        <Input list="municipios-kipflow" value={filters.municipio} onChange={(event) => set("municipio", event.target.value)} placeholder="Município" />
        <FilterSelect value={filters.uf} onChange={(value) => set("uf", value)} placeholder="Todos os estados" options={ufs} />
        <FilterSelect value={filters.segmento} onChange={(value) => set("segmento", value)} placeholder="Todos os segmentos" options={segments} />
        <FilterSelect value={filters.porte} onChange={(value) => set("porte", value)} placeholder="Todos os portes" options={portes} />
        <FilterSelect value={filters.faixaFaturamento} onChange={(value) => set("faixaFaturamento", value)} placeholder="Todas as faixas de faturamento" options={faturamentos} />
        <FilterSelect value={filters.faixaFuncionarios} onChange={(value) => set("faixaFuncionarios", value)} placeholder="Todas as faixas de funcionários" options={funcionarios} />
        <FilterSelect value={filters.situacaoCadastral} onChange={(value) => set("situacaoCadastral", value)} placeholder="Todas as situações" options={situacoes} />
        <FilterSelect value={filters.matriz} onChange={(value) => set("matriz", value)} placeholder="Matrizes e filiais" options={matrizes} />
      </div>
      <datalist id="atividades-kipflow">{atividades.map((value) => <option key={value} value={value} />)}</datalist>
      <datalist id="municipios-kipflow">{municipios.map((value) => <option key={value} value={value} />)}</datalist>
      <Button type="submit" disabled={loading}>{loading ? "Consultando Kipflow..." : "Buscar empresas"}</Button>
    </form>
  </CardContent></Card>;
}