import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartPulse } from "lucide-react";
import ClienteSaudeCard from "@/components/posvenda/ClienteSaudeCard";
import { resumirCarteira } from "@/lib/saudeCliente";

const FILTROS = [
  { valor: "Todos", label: "Todos" },
  { valor: "Risco", label: "Em risco" },
  { valor: "Atencao", label: "Atenção" },
  { valor: "Saudavel", label: "Saudáveis" },
  { valor: "Upsell", label: "Oportunidades" }
];

export default function PosVenda() {
  const [filtro, setFiltro] = useState("Todos");

  const { data: negocios = [], isLoading } = useQuery({
    queryKey: ["negocios-posvenda"],
    queryFn: () => base44.entities.NegocioFechado.list("-created_date", 300)
  });

  const resumo = resumirCarteira(negocios);

  const lista = resumo.itens.filter(({ saude }) => {
    if (filtro === "Todos") return true;
    if (filtro === "Upsell") return saude.oportunidadeUpsell;
    return saude.faixa === filtro;
  });

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Pós-venda e Retenção</h1>
        <p className="text-slate-400">Saúde da carteira, risco de cancelamento e oportunidades de expansão</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5">
          <p className="text-sm text-slate-400">Clientes</p>
          <p className="text-2xl font-bold text-cyan-100">{resumo.totalClientes}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-slate-400">MRR ativo</p>
          <p className="text-2xl font-bold text-cyan-100">R$ {resumo.mrr.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-slate-400">Em risco</p>
          <p className="text-2xl font-bold text-cyan-100">{resumo.emRisco}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-slate-400">Oportunidades de expansão</p>
          <p className="text-2xl font-bold text-cyan-100">{resumo.upsell}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Button key={f.valor} size="sm" variant={filtro === f.valor ? "default" : "outline"} onClick={() => setFiltro(f.valor)}>
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-slate-400">Carregando carteira...</p>
      ) : lista.length === 0 ? (
        <Card><CardContent className="space-y-2 p-8 text-center">
          <HeartPulse className="mx-auto h-8 w-8 text-cyan-300" />
          <p className="text-slate-300">Nenhum cliente nesta visão.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {lista.map(({ negocio, saude }) => (
            <ClienteSaudeCard key={negocio.id} negocio={negocio} saude={saude} />
          ))}
        </div>
      )}
    </div>
  );
}