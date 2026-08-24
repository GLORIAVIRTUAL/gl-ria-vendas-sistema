import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const moeda = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

export default function EvolucaoMRRChart({ dados }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="mb-4 font-bold text-white">Evolução da receita recorrente (12 meses)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados}>
              <defs>
                <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={moeda} width={80} />
              <Tooltip
                formatter={(v, n) => (n === "mrr" ? [moeda(v), "MRR"] : [v, n])}
                contentStyle={{
                  background: "rgb(2 6 23 / 0.92)",
                  border: "1px solid rgba(34,211,238,0.35)",
                  borderRadius: 12,
                  color: "#e0f2fe"
                }}
              />
              <Area type="monotone" dataKey="mrr" stroke="#67e8f9" strokeWidth={2} fill="url(#mrrFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}