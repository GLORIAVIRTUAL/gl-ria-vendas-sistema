import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FilterSelect from "@/components/prospeccao/FilterSelect";
import { ufs } from "@/lib/kipflowFilterOptions";
import { portesNuvnia } from "@/lib/nuvniaUtils";

const quantidades = [
  { value: "10", label: "10 empresas" },
  { value: "20", label: "20 empresas" },
  { value: "50", label: "50 empresas" },
  { value: "100", label: "100 empresas" }
];

const simNao = [
  { value: "sim", label: "Somente com" },
  { value: "nao", label: "Somente sem" }
];

const initial = {
  cnpj: "", uf: "", cnae: "", porte: "", cidade: "", nome: "", limit: "20",
  bairro: "", capitalMinimo: "", anoAberturaMinimo: "", exigirEmail: "", exigirTelefone: ""
};

export default function NuvniaSearchForm({ onSearch, onCnpjLookup, loading }) {
  const [filters, setFilters] = useState(initial);
  const set = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (filters.cnpj.replace(/\D/g, "").length === 14) return onCnpjLookup(filters.cnpj);
    onSearch(filters);
  };
  return <Card><CardHeader><CardTitle>Filtros Nuvnia Leads</CardTitle></CardHeader><CardContent>
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-3">
        <Input value={filters.cnpj} onChange={(event) => set("cnpj", event.target.value)} placeholder="CNPJ exato (consulta direta)" />
        <Input value={filters.nome} onChange={(event) => set("nome", event.target.value)} placeholder="Razão social (busca parcial)" />
        <Input value={filters.cnae} onChange={(event) => set("cnae", event.target.value)} placeholder="CNAE principal (7 dígitos)" />
        <FilterSelect value={filters.uf} onChange={(value) => set("uf", value)} placeholder="Todos os estados" options={ufs} />
        <Input value={filters.cidade} onChange={(event) => set("cidade", event.target.value)} placeholder="Código do município (Receita, 4 dígitos)" />
        <FilterSelect value={filters.porte} onChange={(value) => set("porte", value)} placeholder="Todos os portes" options={portesNuvnia} />
        <Input value={filters.bairro} onChange={(event) => set("bairro", event.target.value)} placeholder="Bairro" />
        <Input value={filters.capitalMinimo} onChange={(event) => set("capitalMinimo", event.target.value)} placeholder="Capital social mínimo (R$)" />
        <Input value={filters.anoAberturaMinimo} onChange={(event) => set("anoAberturaMinimo", event.target.value)} placeholder="Aberta a partir do ano (ex: 2015)" />
        <FilterSelect value={filters.exigirEmail} onChange={(value) => set("exigirEmail", value)} placeholder="Com ou sem e-mail" options={simNao} />
        <FilterSelect value={filters.exigirTelefone} onChange={(value) => set("exigirTelefone", value)} placeholder="Com ou sem telefone" options={simNao} />
        <FilterSelect value={filters.limit} onChange={(value) => set("limit", value)} placeholder="Quantidade de resultados" options={quantidades} />
      </div>
      <p className="text-xs text-slate-400">
        A Nuvnia filtra na origem por CNPJ, razão social, CNAE, estado, município e porte (cada empresa retornada consome 1 crédito).
        Bairro, capital social, ano de abertura, e-mail e telefone são aplicados sobre o resultado recebido.
      </p>
      <Button type="submit" disabled={loading}>{loading ? "Consultando Nuvnia..." : "Buscar empresas"}</Button>
    </form>
  </CardContent></Card>;
}