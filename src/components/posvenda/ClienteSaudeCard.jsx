import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle } from "lucide-react";

const CORES = {
  Saudavel: "bg-cyan-400",
  Atencao: "bg-yellow-400",
  Risco: "bg-red-400"
};

const ROTULOS = { Saudavel: "Saudável", Atencao: "Atenção", Risco: "Risco" };

export default function ClienteSaudeCard({ negocio, saude }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-cyan-100">{negocio.nome_empresa}</p>
            <p className="text-sm text-slate-400">{negocio.nome_cliente} · {negocio.produto}</p>
          </div>
          <div className="text-right">
            <Badge variant="outline">{ROTULOS[saude.faixa]} · {saude.score}</Badge>
            <p className="mt-1 text-sm text-slate-300">R$ {(negocio.valor_mensalidade || 0).toLocaleString("pt-BR")}/mês</p>
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-slate-800">
          <div className={`h-2 rounded-full ${CORES[saude.faixa]}`} style={{ width: `${saude.score}%` }} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span>{saude.meses} mês(es) de contrato</span>
          <span>·</span>
          <span>{negocio.status_pagamento}</span>
        </div>

        {saude.alertas.length > 0 && (
          <ul className="space-y-1">
            {saude.alertas.map((a) => (
              <li key={a} className="flex items-center gap-2 text-sm text-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                {a}
              </li>
            ))}
          </ul>
        )}

        {saude.oportunidadeUpsell && (
          <p className="flex items-center gap-2 text-sm text-cyan-200">
            <TrendingUp className="h-4 w-4" />
            Cliente maduro e saudável: oportunidade de expansão
          </p>
        )}
      </CardContent>
    </Card>
  );
}