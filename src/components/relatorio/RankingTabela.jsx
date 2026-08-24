import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/forecast";

export default function RankingTabela({ titulo, colunaLabel, linhas }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {linhas.length === 0 ? (
          <p className="text-sm text-slate-400">Sem dados no período selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-500/30 text-left">
                  <th className="py-2">{colunaLabel}</th>
                  <th className="py-2 text-right">Leads</th>
                  <th className="py-2 text-right">Ganhos</th>
                  <th className="py-2 text-right">Conversão</th>
                  <th className="py-2 text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.nome} className="border-b border-slate-500/15">
                    <td className="py-2 text-slate-200">{l.nome}</td>
                    <td className="py-2 text-right text-slate-300">{l.leads}</td>
                    <td className="py-2 text-right text-slate-300">{l.ganhos}</td>
                    <td className="py-2 text-right text-cyan-200">{l.conversao}%</td>
                    <td className="py-2 text-right text-slate-300">{formatarMoeda(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}