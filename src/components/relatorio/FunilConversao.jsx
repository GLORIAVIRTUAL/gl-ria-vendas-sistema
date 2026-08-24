import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FunilConversao({ etapas, total }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Conversão do funil no período</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {etapas.map((e) => {
          const pct = total > 0 ? Math.round((e.quantidade / total) * 100) : 0;
          return (
            <div key={e.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-200">{e.label}</span>
                <span className="text-slate-300">{e.quantidade} <span className="text-cyan-200">({pct}%)</span></span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-cyan-400/70" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}