import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ResultadoStatCard({ titulo, valor, detalhe, icon: Icon }) {
  return (
    <Card className="border-cyan-400/25">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">{titulo}</p>
          {Icon && <Icon className="h-4 w-4 text-cyan-300" />}
        </div>
        <p className="mt-2 text-2xl font-bold text-white">{valor}</p>
        {detalhe && <p className="mt-1 text-xs text-slate-400">{detalhe}</p>}
      </CardContent>
    </Card>
  );
}