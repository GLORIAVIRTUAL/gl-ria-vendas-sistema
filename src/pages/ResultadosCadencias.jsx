import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Send, Clock, MessageCircle, AlertTriangle } from "lucide-react";
import ResultadoStatCard from "@/components/cadencias/ResultadoStatCard";
import DesempenhoCampanha from "@/components/cadencias/DesempenhoCampanha";

export default function ResultadosCadencias() {
  const { data: envios = [], isLoading } = useQuery({
    queryKey: ["cadencia-envios"],
    queryFn: () => base44.entities.CadenciaEnvio.list("-created_date", 1000),
  });

  const { data: campanhas = [] } = useQuery({
    queryKey: ["campanhas"],
    queryFn: () => base44.entities.Campanha.list("-created_date"),
  });

  const total = envios.length;
  const enviados = envios.filter((e) => e.status === "enviado").length;
  const programados = envios.filter((e) => e.status === "programado").length;
  const respostas = envios.filter((e) => e.status === "cancelado").length;
  const erros = envios.filter((e) => e.status === "erro").length;

  const campanhaIds = [...new Set(envios.map((e) => e.campanha_id))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-cyan-300" />
        <div>
          <h1 className="text-2xl font-bold">Resultados das Cadências</h1>
          <p className="text-sm text-slate-400">Desempenho dos envios automáticos por campanha e por passo</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <ResultadoStatCard titulo="Total de envios" valor={total} icon={BarChart3} />
        <ResultadoStatCard titulo="Enviados" valor={enviados} icon={Send} />
        <ResultadoStatCard titulo="Programados" valor={programados} icon={Clock} />
        <ResultadoStatCard titulo="Respostas" valor={respostas} detalhe="Cadências interrompidas" icon={MessageCircle} />
        <ResultadoStatCard titulo="Erros" valor={erros} icon={AlertTriangle} />
      </div>

      {isLoading && <p className="text-sm text-slate-400">Carregando envios...</p>}

      {!isLoading && campanhaIds.length === 0 && (
        <p className="text-sm text-slate-400">Nenhum envio de cadência registrado até agora.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {campanhaIds.map((id) => (
          <DesempenhoCampanha
            key={id}
            campanha={campanhas.find((c) => c.id === id)}
            envios={envios.filter((e) => e.campanha_id === id)}
          />
        ))}
      </div>
    </div>
  );
}