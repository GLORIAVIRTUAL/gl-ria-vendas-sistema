import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/forecast";

export default function ForecastPorEtapa({ porEtapa, forecastPonderado }) {
  const maior = Math.max(1, ...porEtapa.map((e) => e.valor));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Previsão por etapa do funil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {porEtapa.map((e) => (
          <div key={e.estagio} className="space-y-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="text-slate-200">
                {e.label} <span className="text-xs text-slate-500">({e.quantidade} • {Math.round(e.probabilidade * 100)}%)</span>
              </span>
              <span className="text-slate-300">
                {formatarMoeda(e.valor)} <span className="text-cyan-200">→ {formatarMoeda(e.ponderado)}</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-cyan-400/70" style={{ width: `${(e.valor / maior) * 100}%` }} />
            </div>
          </div>
        ))}
        <div className="border-t border-slate-500/30 pt-3 text-sm text-slate-300">
          Forecast ponderado total: <span className="font-bold text-cyan-100">{formatarMoeda(forecastPonderado)}</span>
        </div>
      </CardContent>
    </Card>
  );
}