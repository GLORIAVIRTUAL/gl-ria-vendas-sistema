import React from "react";
import { Badge } from "@/components/ui/badge";

const cores = {
  Quente: "border-red-400/40 bg-red-400/10 text-red-200",
  Morno: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  Frio: "border-sky-400/40 bg-sky-400/10 text-sky-200"
};

function Lista({ titulo, itens }) {
  if (!itens?.length) return null;
  return <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">{titulo}</p>
    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-slate-300">
      {itens.map((item) => <li key={item}>{item}</li>)}
    </ul>
  </div>;
}

export default function ProspectScore({ prospect }) {
  if (!prospect.analisado_em) return null;
  return <div className="space-y-3 rounded-lg border border-cyan-400/25 bg-slate-950/60 p-4">
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-2xl font-bold text-cyan-100">{prospect.score ?? 0}<span className="text-sm text-slate-400">/100</span></span>
      <Badge className={cores[prospect.score_faixa] || cores.Frio}>{prospect.score_faixa || "Frio"}</Badge>
    </div>
    {prospect.analise_resumo && <p className="text-sm text-slate-300">{prospect.analise_resumo}</p>}
    <Lista titulo="Pontos fortes" itens={prospect.pontos_fortes} />
    <Lista titulo="Riscos" itens={prospect.riscos} />
    <Lista titulo="Produtos sugeridos" itens={prospect.produtos_sugeridos} />
    {prospect.abordagem_sugerida && <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Abordagem sugerida</p>
      <p className="mt-1 text-sm text-slate-300">{prospect.abordagem_sugerida}</p>
    </div>}
  </div>;
}