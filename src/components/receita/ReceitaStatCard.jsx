import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReceitaStatCard({ titulo, valor, detalhe, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-400">{titulo}</p>
          {Icon && <Icon className="h-5 w-5 text-cyan-300" />}
        </div>
        <p className="mt-1 text-2xl font-bold text-cyan-100">{valor}</p>
        {detalhe && <p className="mt-1 text-xs text-slate-400">{detalhe}</p>}
      </CardContent>
    </Card>
  );
}