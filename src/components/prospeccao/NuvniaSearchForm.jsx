import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FilterSelect from "@/components/prospeccao/FilterSelect";
import { ufs } from "@/lib/kipflowFilterOptions";
import { portesNuvnia } from "@/lib/nuvniaUtils";
import { anosAbertura, capitaisSociais, cnaesNuvnia, disponibilidadeContato, quantidadesNuvnia } from "@/lib/nuvniaFilterOptions";

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
        <FilterSelect value={filters.cnae} onChange={(value) => set("cnae", value)} placeholder="Todas as atividades (CNAE)" options={cnaesNuvnia} />
        <FilterSelect value={filters.uf} onChange={(value) => set("uf", value)} placeholder="Todos os estados" options={ufs} />
        <Input value={filters.cidade} onChange={(event) => set("cidade", event.target.value)} placeholder="Código do município (Receita, 4 dígitos)" />
        <FilterSelect value={filters.porte} onChange={(value) => set("porte", value)} placeholder="Todos os portes" options={portesNuvnia} />
        <Input value={filters.bairro} onChange={(event) => set("bairro", event.target.value)} placeholder="Bairro" />
        <FilterSelect value={filters.capitalMinimo} onChange={(value) => set("capitalMinimo", value)} placeholder="Qualquer capital social" options={capitaisSociais} />
        <FilterSelect value={filters.anoAberturaMinimo} onChange={(value) => set("anoAberturaMinimo", value)} placeholder="Qualquer ano de abertura" options={anosAbertura} />
        <FilterSelect value={filters.exigirEmail} onChange={(value) => set("exigirEmail", value)} placeholder="Com ou sem e-mail" options={disponibilidadeContato} />
        <FilterSelect value={filters.exigirTelefone} onChange={(value) => set("exigirTelefone", value)} placeholder="Com ou sem telefone" options={disponibilidadeContato} />
        <FilterSelect value={filters.limit} onChange={(value) => set("limit", value)} placeholder="Quantidade de resultados" options={quantidadesNuvnia} />
      </div>
      <p className="text-xs text-slate-400">
        A Nuvnia filtra na origem por CNPJ, razão social, CNAE, estado, município e porte (cada empresa retornada consome 1 crédito).
        Bairro, capital social, ano de abertura, e-mail e telefone são aplicados sobre o resultado recebido.
      </p>
      <Button type="submit" disabled={loading}>{loading ? "Consultando Nuvnia..." : "Buscar empresas"}</Button>
    </form>
  </CardContent></Card>;
}