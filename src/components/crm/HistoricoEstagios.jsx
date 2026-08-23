import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { labelEstagio } from "@/lib/pipelineEstagios";

export default function HistoricoEstagios({ leadId }) {
  const { data: historico = [] } = useQuery({
    queryKey: ["historico-estagios", leadId],
    queryFn: () => base44.entities.LeadEstagioHistorico.filter({ lead_id: leadId }, "-created_date", 30),
    enabled: !!leadId,
    initialData: []
  });

  return <div className="rounded-lg border border-slate-500/30 bg-slate-950/40 p-3 text-sm">
    <strong className="text-cyan-100">Histórico de estágios</strong>
    {historico.length ? <ul className="mt-2 space-y-1 text-slate-300">
      {historico.map((item) => <li key={item.id}>
        <span className="text-cyan-200">{format(new Date(item.created_date), "dd/MM/yyyy HH:mm")}</span>
        {" — "}
        {labelEstagio(item.estagio_anterior)} → <strong>{labelEstagio(item.estagio_novo)}</strong>
        {" "}<span className="text-xs text-slate-400">({item.origem})</span>
        {item.motivo ? <span className="block text-xs text-slate-400">{item.motivo}</span> : null}
      </li>)}
    </ul> : <p className="mt-2 text-slate-400">Nenhuma mudança registrada ainda.</p>}
  </div>;
}