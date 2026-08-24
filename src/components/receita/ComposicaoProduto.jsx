import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const moeda = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

export default function ComposicaoProduto({ itens, total }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="font-bold text-white">Composição do MRR por produto</h3>
        {itens.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum contrato ativo para calcular.</p>
        ) : (
          itens.map((item) => {
            const pct = total ? Math.round((item.mrr / total) * 100) : 0;
            return (
              <div key={item.produto} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-cyan-100">{item.produto}</span>
                  <span className="whitespace-nowrap text-slate-300">
                    {moeda(item.mrr)} · {pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-slate-400">{item.clientes} cliente(s)</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}