import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

const moeda = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function ClientesRecorrentes({ clientes = [] }) {
  const ordenados = [...clientes].sort(
    (a, b) => (a.dia_pagamento || 99) - (b.dia_pagamento || 99)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Clientes recorrentes ({clientes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ordenados.length === 0 ? (
          <p className="text-slate-400">Nenhum cliente recorrente cadastrado.</p>
        ) : (
          <div className="divide-y divide-slate-500/30">
            {ordenados.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-[180px]">
                  <p className="font-semibold text-slate-100">{c.nome_cliente}</p>
                  <p className="text-xs text-slate-400">{c.nome_empresa}</p>
                </div>
                <p className="text-sm text-slate-300">{c.produto || "N/A"}</p>
                <p className="text-sm font-semibold text-slate-100">{moeda(c.valor_mensalidade)}</p>
                <Badge variant="outline">
                  {c.dia_pagamento ? `Paga dia ${c.dia_pagamento}` : "Dia não definido"}
                </Badge>
                <Badge variant="secondary">{c.status_pagamento || "Ativo"}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}