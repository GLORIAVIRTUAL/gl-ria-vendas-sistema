import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial = { cnpj: "", nome: "", cnae: "", segmento: "", porte: "", uf: "", municipio: "", faturamentoMin: "", faturamentoMax: "", somenteMatriz: false, somenteAtivas: true };
const textFields = [
  ["cnpj", "CNPJ"], ["nome", "Razão social ou nome"], ["cnae", "Atividade ou CNAE"],
  ["municipio", "Município"], ["uf", "UF"], ["faturamentoMin", "Faturamento mínimo"], ["faturamentoMax", "Faturamento máximo"]
];

export default function ProspectSearchForm({ onSearch, loading }) {
  const [filters, setFilters] = useState(initial);
  const set = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  return <Card>
    <CardHeader><CardTitle>Filtros de empresas</CardTitle></CardHeader>
    <CardContent>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSearch(filters); }}>
        <div className="grid gap-3 md:grid-cols-3">
          {textFields.map(([field, label]) => <Input key={field} value={filters[field]} onChange={(event) => set(field, event.target.value)} placeholder={label} />)}
          <select className="h-9 rounded-md border border-input bg-slate-950/35 px-3 text-sm text-slate-100" value={filters.segmento} onChange={(event) => set("segmento", event.target.value)}>
            <option value="">Todos os segmentos</option><option value="COMERCIO">Comércio</option><option value="INDUSTRIA">Indústria</option><option value="SERVICOS">Serviços</option><option value="AGROPECUARIA">Agropecuária</option><option value="CONSTRUCAO CIVIL">Construção civil</option>
          </select>
          <select className="h-9 rounded-md border border-input bg-slate-950/35 px-3 text-sm text-slate-100" value={filters.porte} onChange={(event) => set("porte", event.target.value)}>
            <option value="">Todos os portes</option><option value="MICRO EMPRESA">Microempresa</option><option value="PEQUENO PORTE">Pequeno porte</option><option value="DEMAIS">Demais</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-slate-300">
          <label><input type="checkbox" checked={filters.somenteAtivas} onChange={(event) => set("somenteAtivas", event.target.checked)} className="mr-2" />Somente ativas</label>
          <label><input type="checkbox" checked={filters.somenteMatriz} onChange={(event) => set("somenteMatriz", event.target.checked)} className="mr-2" />Somente matrizes</label>
        </div>
        <Button type="submit" disabled={loading}>{loading ? "Consultando Kipflow..." : "Buscar empresas"}</Button>
      </form>
    </CardContent>
  </Card>;
}