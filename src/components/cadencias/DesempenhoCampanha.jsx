import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DesempenhoCampanha({ campanha, envios }) {
  const enviados = envios.filter((e) => e.status === "enviado").length;
  const programados = envios.filter((e) => e.status === "programado").length;
  const erros = envios.filter((e) => e.status === "erro").length;
  const cancelados = envios.filter((e) => e.status === "cancelado").length;
  const prospects = new Set(envios.map((e) => e.prospect_id)).size;
  const taxaResposta = prospects ? Math.round((new Set(envios.filter((e) => e.status === "cancelado").map((e) => e.prospect_id)).size / prospects) * 100) : 0;

  const passos = [...new Set(envios.map((e) => e.passo_ordem))].sort((a, b) => a - b);

  return (
    <Card className="border-cyan-400/25">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base text-white">{campanha?.nome || "Campanha removida"}</CardTitle>
          <Badge variant={campanha?.ativa ? "default" : "outline"}>
            {campanha?.ativa ? "Ativa" : "Pausada"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div><p className="text-xs text-slate-400">Prospects</p><p className="text-lg font-bold text-white">{prospects}</p></div>
          <div><p className="text-xs text-slate-400">Enviados</p><p className="text-lg font-bold text-cyan-200">{enviados}</p></div>
          <div><p className="text-xs text-slate-400">Programados</p><p className="text-lg font-bold text-white">{programados}</p></div>
          <div><p className="text-xs text-slate-400">Respostas</p><p className="text-lg font-bold text-green-300">{cancelados}</p></div>
          <div><p className="text-xs text-slate-400">Erros</p><p className="text-lg font-bold text-red-300">{erros}</p></div>
        </div>

        <p className="text-xs text-cyan-200/80">Taxa de resposta: <span className="font-bold">{taxaResposta}%</span></p>

        <div className="space-y-2">
          {passos.map((ordem) => {
            const doPasso = envios.filter((e) => e.passo_ordem === ordem);
            const enviadosPasso = doPasso.filter((e) => e.status === "enviado").length;
            const canal = doPasso[0]?.canal;
            return (
              <div key={ordem} className="flex items-center justify-between rounded-lg border border-slate-500/30 bg-slate-950/40 px-3 py-2">
                <span className="text-xs text-slate-300">Passo {ordem} · {canal}</span>
                <span className="text-xs text-cyan-200">{enviadosPasso}/{doPasso.length} enviados</span>
              </div>
            );
          })}
          {passos.length === 0 && <p className="text-xs text-slate-500">Nenhum envio registrado ainda.</p>}
        </div>
      </CardContent>
    </Card>
  );
}