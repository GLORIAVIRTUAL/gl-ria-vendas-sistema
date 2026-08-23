import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SemContatoLista({ prospects }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sem nenhum contato ({prospects.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-auto">
        {prospects.length === 0 ? (
          <p className="text-sm text-slate-400">Todos os prospects têm telefone, WhatsApp ou e-mail.</p>
        ) : (
          prospects.map((p) => (
            <div key={p.id} className="rounded-lg border border-slate-600/40 bg-slate-950/40 p-3">
              <p className="text-sm font-semibold text-cyan-100">{p.razao_social}</p>
              <p className="text-xs text-slate-400">
                {p.cnpj} · {p.municipio || "—"}/{p.uf || "—"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}