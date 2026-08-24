import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, DollarSign, Handshake, CalendarCheck, TrendingUp } from "lucide-react";
import MetaProgressoCard from "@/components/metas/MetaProgressoCard";
import ForecastPorEtapa from "@/components/metas/ForecastPorEtapa";
import MetaFormDialog from "@/components/metas/MetaFormDialog";
import { calcularForecast, calcularRealizado, formatarMoeda } from "@/lib/forecast";

const mesAtual = () => new Date().toISOString().slice(0, 7);

export default function Metas() {
  const queryClient = useQueryClient();
  const [mes, setMes] = useState(mesAtual());
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-updated_date", 500)
  });

  const { data: metas = [] } = useQuery({
    queryKey: ["metas-comerciais"],
    queryFn: () => base44.entities.MetaComercial.list("-mes", 24)
  });

  const meta = metas.find((m) => m.mes === mes);

  const salvarMutation = useMutation({
    mutationFn: (dados) =>
      meta ? base44.entities.MetaComercial.update(meta.id, dados) : base44.entities.MetaComercial.create(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas-comerciais"] });
      setDialogOpen(false);
    }
  });

  const forecast = calcularForecast(leads);
  const realizado = calcularRealizado(leads, mes);
  const projecao = realizado.valor + forecast.forecastPonderado;
  const atingimentoProjetado = meta?.meta_faturamento
    ? Math.round((projecao / meta.meta_faturamento) * 100)
    : 0;

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Metas e Previsão de Vendas</h1>
          <p className="text-slate-400">Acompanhe o atingimento do mês e o forecast ponderado do pipeline</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <Label className="text-cyan-100">Mês</Label>
            <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-40" />
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Target className="mr-2 h-4 w-4" />
            {meta ? "Editar metas" : "Definir metas"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Carregando dados...</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetaProgressoCard
              titulo="Faturamento fechado"
              realizado={realizado.valor}
              meta={meta?.meta_faturamento}
              formatar={formatarMoeda}
              icone={DollarSign}
            />
            <MetaProgressoCard
              titulo="Negócios fechados"
              realizado={realizado.negocios}
              meta={meta?.meta_negocios}
              icone={Handshake}
            />
            <MetaProgressoCard
              titulo="Reuniões realizadas"
              realizado={realizado.reunioes}
              meta={meta?.meta_reunioes}
              icone={CalendarCheck}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="mb-1 text-sm text-slate-400">Pipeline aberto</p>
                <p className="text-2xl font-bold text-cyan-100">{formatarMoeda(forecast.pipelineAberto)}</p>
                <p className="text-xs text-slate-500">{forecast.negociosAbertos} negócios em andamento</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="mb-1 text-sm text-slate-400">Forecast ponderado</p>
                <p className="text-2xl font-bold text-cyan-100">{formatarMoeda(forecast.forecastPonderado)}</p>
                <p className="text-xs text-slate-500">por probabilidade de cada etapa</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="mb-1 text-sm text-slate-400">Projeção do mês</p>
                <p className="text-2xl font-bold text-cyan-100">{formatarMoeda(projecao)}</p>
                <p className="text-xs text-slate-500">{atingimentoProjetado}% da meta</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="mb-1 text-sm text-slate-400">Perdidos no mês</p>
                <p className="text-2xl font-bold text-cyan-100">{realizado.perdidos}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <TrendingUp className="h-3 w-3" /> leads marcados como desistiu
                </p>
              </CardContent>
            </Card>
          </div>

          <ForecastPorEtapa porEtapa={forecast.porEtapa} forecastPonderado={forecast.forecastPonderado} />
        </>
      )}

      <MetaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mes={mes}
        meta={meta}
        onSave={(dados) => salvarMutation.mutate(dados)}
        salvando={salvarMutation.isPending}
      />
    </div>
  );
}