import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FilterSelect from "@/components/prospeccao/FilterSelect";
import { ufs } from "@/lib/kipflowFilterOptions";

const portesNuvnia = [
  { value: "01", label: "ME - Microempresa" },
  { value: "03", label: "EPP - Empresa de Pequeno Porte" },
  { value: "05", label: "Demais empresas" }
];

const quantidades = [
  { value: "10", label: "10 empresas" },
  { value: "20", label: "20 empresas" },
  { value: "50", label: "50 empresas" },
  { value: "100", label: "100 empresas" }
];

const initial = { uf: "", cnae: "", porte: "", cidade: "", nome: "", limit: "20" };

export default function NuvniaSearchForm({ onSearch, loading }) {
  const [filters, setFilters] = useState(initial);
  const set = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    onSearch(filters);
  };
  return <Card><CardHeader><CardTitle>Filtros Nuvnia Leads</CardTitle></CardHeader><CardContent>
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-3">
        <FilterSelect value={filters.uf} onChange={(value) => set("uf", value)} placeholder="Todos os estados" options={ufs} />
        <Input value={filters.cnae} onChange={(event) => set("cnae", event.target.value)} placeholder="CNAE principal (7 dígitos)" />
        <FilterSelect value={filters.porte} onChange={(value) => set("porte", value)} placeholder="Todos os portes" options={portesNuvnia} />
        <Input value={filters.cidade} onChange={(event) => set("cidade", event.target.value)} placeholder="Código do município (IBGE)" />
        <Input value={filters.nome} onChange={(event) => set("nome", event.target.value)} placeholder="Razão social (busca parcial)" />
        <FilterSelect value={filters.limit} onChange={(value) => set("limit", value)} placeholder="Quantidade de resultados" options={quantidades} />
      </div>
      <p className="text-xs text-slate-400">Cada empresa retornada consome 1 crédito da sua conta Nuvnia.</p>
      <Button type="submit" disabled={loading}>{loading ? "Consultando Nuvnia..." : "Buscar empresas"}</Button>
    </form>
  </CardContent></Card>;
}