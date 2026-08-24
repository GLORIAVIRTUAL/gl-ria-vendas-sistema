import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { TrendingDown } from "lucide-react";
import MotivoPerdaLinha from "@/components/perdas/MotivoPerdaLinha";
import RankingMotivos from "@/components/perdas/RankingMotivos";

export default function AnalisePerdas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: perdidos = [], isLoading } = useQuery({
    queryKey: ["leads-perdidos"],
    queryFn: () => base44.entities.Lead.filter({ estagio: "Desistiu" }, "-updated_date", 200)
  });

  const registrar = useMutation({
    mutationFn: ({ lead, dados }) =>
      base44.entities.Lead.update(lead.id, { ...dados, perdido_em: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads-perdidos"] });
      toast({ title: "Motivo registrado" });
    },
    onError: (e) => toast({ title: "Erro ao registrar", description: e.message, variant: "destructive" })
  });

  const semMotivo = perdidos.filter((l) => !l.motivo_perda);

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Análise de Perdas</h1>
        <p className="text-slate-400">Entenda por que os negócios são perdidos e ataque a causa principal</p>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Carregando perdas...</p>
      ) : perdidos.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 p-8 text-center">
            <TrendingDown className="mx-auto h-8 w-8 text-cyan-300" />
            <p className="text-slate-300">Nenhum lead perdido registrado.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-400">Leads perdidos</p>
                <p className="text-2xl font-bold text-cyan-100">{perdidos.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-400">Sem motivo registrado</p>
                <p className="text-2xl font-bold text-cyan-100">{semMotivo.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-400">Valor perdido</p>
                <p className="text-2xl font-bold text-cyan-100">
                  R$ {perdidos.reduce((s, l) => s + (l.valor_estimado || 0), 0).toLocaleString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          </div>

          <RankingMotivos leadsPerdidos={perdidos} />

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Leads perdidos</h3>
            {perdidos.map((lead) => (
              <MotivoPerdaLinha
                key={lead.id}
                lead={lead}
                salvando={registrar.isPending}
                onSalvar={(l, dados) => registrar.mutate({ lead: l, dados })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}