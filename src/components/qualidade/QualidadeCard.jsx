import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function QualidadeCard({ titulo, valor, total, descricao }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-slate-400">{titulo}</p>
        <p className="text-3xl font-bold text-white">{pct}%</p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700/60">
          <div className="h-1.5 rounded-full bg-cyan-400" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">{valor} de {total} · {descricao}</p>
      </CardContent>
    </Card>
  );
}