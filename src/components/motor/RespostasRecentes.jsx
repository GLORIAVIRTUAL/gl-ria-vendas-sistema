import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function RespostasRecentes({ prospects }) {
  const respondidos = prospects
    .filter((p) => p.respondeu_em)
    .sort((a, b) => new Date(b.respondeu_em) - new Date(a.respondeu_em))
    .slice(0, 15);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prospects que responderam ({respondidos.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-auto">
        {respondidos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma resposta registrada ainda. Cadências seguem rodando.</p>
        ) : (
          respondidos.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-600/40 bg-slate-950/40 p-3">
              <div>
                <p className="text-sm font-semibold text-cyan-100">{p.razao_social}</p>
                <p className="text-xs text-slate-400">{p.municipio || "—"}/{p.uf || "—"} · score {p.score ?? "—"}</p>
              </div>
              <p className="text-xs text-slate-400 whitespace-nowrap">
                {format(new Date(p.respondeu_em), "dd/MM HH:mm")}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}