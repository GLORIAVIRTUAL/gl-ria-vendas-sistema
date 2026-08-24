import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, Zap, Flame, AlertTriangle, CheckCircle2 } from "lucide-react";
import { proximaMelhorAcao } from "@/functions/proximaMelhorAcao";
import TarefaDiaCard from "@/components/fila/TarefaDiaCard";

const pesoTemperatura = { Quente: 0, Morno: 1, Frio: 2 };
const hojeISO = () => new Date().toISOString().split("T")[0];

export default function FilaDoDia() {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-updated_date", 500)
  });

  const concluirMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.update(id, { proxima_acao_concluida_em: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] })
  });

  const recalcularMutation = useMutation({
    mutationFn: async () => (await proximaMelhorAcao({ limite: 25 })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] })
  });

  const hoje = hojeISO();

  // Fila: ações pendentes com prazo até hoje (atrasadas primeiro, depois por temperatura).
  const pendentes = leads
    .filter((l) => l.proxima_melhor_acao && !l.proxima_acao_concluida_em)
    .sort((a, b) => {
      const prazoA = a.proxima_acao_prazo || "9999-12-31";
      const prazoB = b.proxima_acao_prazo || "9999-12-31";
      if (prazoA !== prazoB) return prazoA < prazoB ? -1 : 1;
      return (pesoTemperatura[a.temperatura] ?? 3) - (pesoTemperatura[b.temperatura] ?? 3);
    });

  const paraHoje = pendentes.filter((l) => !l.proxima_acao_prazo || l.proxima_acao_prazo <= hoje);
  const futuras = pendentes.filter((l) => l.proxima_acao_prazo && l.proxima_acao_prazo > hoje);
  const atrasadas = paraHoje.filter((l) => l.proxima_acao_prazo && l.proxima_acao_prazo < hoje);
  const concluidasHoje = leads.filter((l) => (l.proxima_acao_concluida_em || "").startsWith(hoje));

  const stats = [
    { titulo: "Para hoje", valor: paraHoje.length, icone: ListChecks },
    { titulo: "Atrasadas", valor: atrasadas.length, icone: AlertTriangle },
    { titulo: "Quentes na fila", valor: paraHoje.filter((l) => l.temperatura === "Quente").length, icone: Flame },
    { titulo: "Concluídas hoje", valor: concluidasHoje.length, icone: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Fila de Tarefas do Dia</h1>
          <p className="text-slate-400">Ações priorizadas pela IA para você executar agora</p>
        </div>
        <Button variant="outline" onClick={() => recalcularMutation.mutate()} disabled={recalcularMutation.isPending}>
          <Zap className={`mr-2 h-5 w-5 ${recalcularMutation.isPending ? "animate-pulse" : ""}`} />
          {recalcularMutation.isPending ? "Recalculando..." : "Recalcular ações"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.titulo}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="mb-1 text-sm text-slate-400">{s.titulo}</p>
                <p className="text-3xl font-bold text-cyan-100">{s.valor}</p>
              </div>
              <s.icone className="h-6 w-6 text-cyan-300" />
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <p className="text-slate-400">Carregando fila...</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white">Fazer agora ({paraHoje.length})</h2>
            {paraHoje.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-slate-400">
                  Nenhuma tarefa pendente para hoje. Recalcule as ações para gerar novas.
                </CardContent>
              </Card>
            ) : (
              paraHoje.map((lead) => (
                <TarefaDiaCard
                  key={lead.id}
                  lead={lead}
                  atrasada={!!lead.proxima_acao_prazo && lead.proxima_acao_prazo < hoje}
                  onConcluir={(id) => concluirMutation.mutate(id)}
                  concluindo={concluirMutation.isPending}
                />
              ))
            )}
          </div>

          {futuras.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white">Programadas ({futuras.length})</h2>
              {futuras.map((lead) => (
                <TarefaDiaCard
                  key={lead.id}
                  lead={lead}
                  atrasada={false}
                  onConcluir={(id) => concluirMutation.mutate(id)}
                  concluindo={concluirMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}