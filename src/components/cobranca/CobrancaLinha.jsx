import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const TIPO_COR = {
  Lembrete: "bg-cyan-500/15 text-cyan-200",
  Vencimento: "bg-blue-500/15 text-blue-200",
  Atraso: "bg-red-500/15 text-red-200"
};

export default function CobrancaLinha({ envio }) {
  return (
    <div className="rounded-lg border border-slate-500/40 bg-slate-950/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-cyan-100">{envio.nome_empresa}</p>
          <p className="text-xs text-slate-400">
            {format(new Date(envio.created_date), "dd/MM/yyyy HH:mm")} · {envio.canal} ·{" "}
            R$ {(envio.valor || 0).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={TIPO_COR[envio.tipo]}>{envio.tipo}</Badge>
          {envio.status === "erro" && (
            <Badge className="bg-red-500/15 text-red-200">erro</Badge>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-300">{envio.mensagem}</p>
      {envio.erro_mensagem && <p className="mt-1 text-xs text-red-300">{envio.erro_mensagem}</p>}
    </div>
  );
}