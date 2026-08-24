import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function NPSResumo({ respostas }) {
  if (respostas.length === 0) {
    return (
      <Card><CardContent className="p-5">
        <p className="text-sm text-slate-400">NPS da carteira</p>
        <p className="text-sm text-slate-300">Nenhuma pesquisa registrada ainda.</p>
      </CardContent></Card>
    );
  }

  const promotores = respostas.filter((r) => r.classificacao === "Promotor").length;
  const detratores = respostas.filter((r) => r.classificacao === "Detrator").length;
  const neutros = respostas.length - promotores - detratores;
  const nps = Math.round(((promotores - detratores) / respostas.length) * 100);

  return (
    <Card><CardContent className="space-y-2 p-5">
      <p className="text-sm text-slate-400">NPS da carteira ({respostas.length} respostas)</p>
      <p className="text-3xl font-bold text-cyan-100">{nps}</p>
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-emerald-500/15 text-emerald-200">Promotores: {promotores}</Badge>
        <Badge className="bg-amber-500/15 text-amber-200">Neutros: {neutros}</Badge>
        <Badge className="bg-red-500/15 text-red-200">Detratores: {detratores}</Badge>
      </div>
    </CardContent></Card>
  );
}