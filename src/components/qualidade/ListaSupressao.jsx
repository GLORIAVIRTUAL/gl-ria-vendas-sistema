import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ListaSupressao({ prospects = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Lista de supressão (opt-out)</CardTitle>
        <p className="text-sm text-slate-400">
          {prospects.length} contato(s) pediram para não receber mais mensagens.
        </p>
      </CardHeader>
      <CardContent className="space-y-2 max-h-80 overflow-auto">
        {prospects.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum contato na lista de supressão.</p>
        ) : (
          prospects.map((p) => (
            <div key={p.id} className="rounded-lg border border-slate-500/30 bg-slate-950/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-cyan-100">{p.nome_fantasia || p.razao_social}</p>
                <Badge variant="outline" className="text-xs">Opt-out</Badge>
              </div>
              <p className="text-xs text-slate-400">
                {[p.municipio, p.uf].filter(Boolean).join(" / ")}
              </p>
              {p.opt_out_motivo && (
                <p className="text-xs text-slate-500">{p.opt_out_motivo}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}