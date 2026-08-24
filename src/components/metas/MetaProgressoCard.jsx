import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function MetaProgressoCard({ titulo, realizado, meta, formatar = (v) => v, icone: Icone }) {
  const percentual = meta > 0 ? Math.min(100, Math.round((realizado / meta) * 100)) : 0;
  const falta = Math.max(0, (meta || 0) - (realizado || 0));

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">{titulo}</p>
          {Icone && <Icone className="h-5 w-5 text-cyan-300" />}
        </div>
        <p className="text-2xl font-bold text-cyan-100">{formatar(realizado)}</p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-cyan-400" style={{ width: `${percentual}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>{percentual}% da meta {meta ? formatar(meta) : "—"}</span>
          <span>faltam {formatar(falta)}</span>
        </div>
      </CardContent>
    </Card>
  );
}