import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ContatosInvalidos({ itens }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Contatos com problema ({itens.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {itens.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum problema de contato encontrado.</p>
        ) : (
          itens.slice(0, 60).map(({ prospect, problemas }) => (
            <div key={prospect.id} className="rounded-lg border border-slate-500/25 bg-slate-950/40 p-3">
              <p className="text-sm font-semibold text-cyan-100">{prospect.razao_social || prospect.nome_fantasia}</p>
              <p className="mt-1 text-xs text-slate-400">
                {prospect.email || "sem e-mail"} · {prospect.telefone || prospect.whatsapp || "sem telefone"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {problemas.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}