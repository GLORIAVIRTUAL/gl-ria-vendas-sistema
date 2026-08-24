import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Merge, Loader2 } from "lucide-react";

export default function GrupoDuplicado({ grupo, onMesclar, mesclando }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{grupo.tipo}</Badge>
            <span className="text-sm text-slate-300">{grupo.chave}</span>
            <span className="text-xs text-slate-500">{grupo.registros.length} registros</span>
          </div>
          <Button size="sm" onClick={() => onMesclar(grupo)} disabled={mesclando}>
            {mesclando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Merge className="h-4 w-4" />}
            Mesclar
          </Button>
        </div>

        <div className="space-y-2">
          {grupo.registros.map((p, i) => (
            <div key={p.id} className="rounded-lg border border-slate-500/25 bg-slate-950/40 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-cyan-100">{p.razao_social || p.nome_fantasia}</span>
                {i === 0 ? (
                  <Badge className="bg-cyan-400/20 text-cyan-100">Mestre (mais antigo)</Badge>
                ) : (
                  <Badge variant="destructive">Será removido</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                CNPJ {p.cnpj || "—"} · {p.email || "sem e-mail"} · {p.telefone || p.whatsapp || "sem telefone"} · {p.municipio || "—"}/{p.uf || "—"}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}