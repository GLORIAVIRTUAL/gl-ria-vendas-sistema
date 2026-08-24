import React from "react";
import { Badge } from "@/components/ui/badge";
import { Flame, Thermometer, Snowflake, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const temperaturaConfig = {
  Quente: { cor: "border border-red-400/40 bg-red-400/15 text-red-200", icone: Flame },
  Morno: { cor: "border border-amber-400/40 bg-amber-400/15 text-amber-200", icone: Thermometer },
  Frio: { cor: "border border-sky-400/40 bg-sky-400/15 text-sky-200", icone: Snowflake }
};

export function TemperaturaBadge({ temperatura, score }) {
  const config = temperaturaConfig[temperatura];
  if (!config) return null;
  const Icone = config.icone;
  return (
    <Badge className={`${config.cor} text-xs`}>
      <Icone className="mr-1 h-3 w-3" />
      {temperatura}{typeof score === "number" ? ` ${Math.round(score)}` : ""}
    </Badge>
  );
}

export default function ProximaAcaoLead({ lead }) {
  if (!lead?.proxima_melhor_acao) return null;

  const atrasada = lead.proxima_acao_prazo && parseISO(lead.proxima_acao_prazo) < new Date(new Date().toDateString());

  return (
    <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2">
      <p className="flex items-center gap-1 text-xs font-semibold text-cyan-200">
        <Zap className="h-3 w-3" />
        Próxima melhor ação
      </p>
      <p className="text-sm text-cyan-50">{lead.proxima_melhor_acao}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-cyan-200/80">
        {lead.proxima_acao_canal && <span>{lead.proxima_acao_canal}</span>}
        {lead.proxima_acao_prazo && (
          <span className={atrasada ? "font-semibold text-red-300" : ""}>
            até {format(parseISO(lead.proxima_acao_prazo), "dd/MM", { locale: ptBR })}
            {atrasada ? " (atrasada)" : ""}
          </span>
        )}
      </div>
      {lead.proxima_acao_motivo && (
        <p className="mt-1 text-xs text-slate-400 line-clamp-2">{lead.proxima_acao_motivo}</p>
      )}
    </div>
  );
}