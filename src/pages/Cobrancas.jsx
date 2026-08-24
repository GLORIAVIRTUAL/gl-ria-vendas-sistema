import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Receipt } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import CobrancaLinha from "@/components/cobranca/CobrancaLinha";

export default function Cobrancas() {
  const [executando, setExecutando] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: envios = [], isLoading } = useQuery({
    queryKey: ["cobranca-envios"],
    queryFn: () => base44.entities.CobrancaEnvio.list("-created_date", 100)
  });

  const { data: negocios = [] } = useQuery({
    queryKey: ["negocios-cobranca"],
    queryFn: () => base44.entities.NegocioFechado.list("-created_date", 500)
  });

  const inadimplentes = negocios.filter((n) => n.status_pagamento === "Inadimplente");
  const valorAtrasado = inadimplentes.reduce((t, n) => t + (n.valor_mensalidade || 0), 0);
  const enviadosMes = envios.filter(
    (e) => new Date(e.created_date).getMonth() === new Date().getMonth() && e.status === "enviado"
  ).length;

  const executar = async () => {
    setExecutando(true);
    try {
      const res = await base44.functions.invoke("cobrancaAutomatica", {});
      if (res?.data?.ok) {
        queryClient.invalidateQueries({ queryKey: ["cobranca-envios"] });
        toast({
          title: "Régua de cobrança executada",
          description: `${res.data.enviados} enviada(s), ${res.data.ignorados} sem cobrança hoje, ${res.data.erros} erro(s).`
        });
      } else {
        toast({ title: "Falha na execução", description: res?.data?.error || "Erro", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Falha na execução", description: e.message, variant: "destructive" });
    }
    setExecutando(false);
  };

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Cobrança Automatizada</h1>
          <p className="text-slate-400">
            Lembrete 3 dias antes, aviso no vencimento e régua de atraso (3, 7 e 15 dias) por WhatsApp
          </p>
        </div>
        <Button onClick={executar} disabled={executando}>
          {executando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Executar agora
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5">
          <p className="text-sm text-slate-400">Clientes inadimplentes</p>
          <p className="text-2xl font-bold text-cyan-100">{inadimplentes.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-slate-400">Valor em atraso</p>
          <p className="text-2xl font-bold text-cyan-100">R$ {valorAtrasado.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-slate-400">Cobranças enviadas no mês</p>
          <p className="text-2xl font-bold text-cyan-100">{enviadosMes}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h3 className="font-bold text-white">Histórico de cobranças</h3>
          {isLoading ? (
            <p className="text-slate-400">Carregando histórico...</p>
          ) : envios.length === 0 ? (
            <div className="space-y-2 py-6 text-center">
              <Receipt className="mx-auto h-8 w-8 text-cyan-300" />
              <p className="text-slate-300">Nenhuma cobrança enviada ainda.</p>
            </div>
          ) : (
            envios.map((envio) => <CobrancaLinha key={envio.id} envio={envio} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}