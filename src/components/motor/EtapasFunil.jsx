import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EtapasFunil({ titulo, etapas }) {
  const maior = Math.max(1, ...etapas.map((etapa) => etapa.valor));
  return <Card className="border-slate-500/40 bg-slate-950/55">
    <CardHeader><CardTitle className="text-lg">{titulo}</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {etapas.map((etapa) => <div key={etapa.label}>
        <div className="flex justify-between text-sm">
          <span className="text-slate-200">{etapa.label}</span>
          <span className="font-semibold text-cyan-100">{etapa.valor}</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-slate-800">
          <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${(etapa.valor / maior) * 100}%` }} />
        </div>
      </div>)}
    </CardContent>
  </Card>;
}