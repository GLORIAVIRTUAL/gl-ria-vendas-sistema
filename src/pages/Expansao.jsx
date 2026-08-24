import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { resumirCarteira } from "@/lib/saudeCliente";
import ClienteElegivelLinha from "@/components/expansao/ClienteElegivelLinha";
import SugestaoExpansaoCard from "@/components/expansao/SugestaoExpansaoCard";

export default function Expansao() {
  const { data: negocios = [], isLoading } = useQuery({
    queryKey: ["negocios-expansao"],
    queryFn: () => base44.entities.NegocioFechado.list("-created_date", 300)
  });

  const { data: sugestoes = [] } = useQuery({
    queryKey: ["sugestoes-expansao"],
    queryFn: () => base44.entities.SugestaoExpansao.list("-created_date", 200)
  });

  const resumo = resumirCarteira(negocios);
  const elegiveis = resumo.itens.filter(({ saude }) => saude.oportunidadeUpsell);
  const comSugestao = new Set(sugestoes.map((s) => s.negocio_id));
  const telefonePor = Object.fromEntries(negocios.map((n) => [n.id, n.telefone_cliente]));

  const aceitas = sugestoes.filter((s) => s.status === "Aceita");
  const mrrPotencial = sugestoes
    .filter((s) => s.status === "Sugerida" || s.status === "Apresentada")
    .reduce((soma, s) => soma + (s.valor_sugerido || 0), 0);

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Playbook de Expansão</h1>
        <p className="text-slate-400">Próximo produto recomendado para clientes saudáveis com mais de 3 meses</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5">
          <p className="text-sm text-slate-400">Clientes elegíveis</p>
          <p className="text-2xl font-bold text-cyan-100">{elegiveis.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-slate-400">MRR potencial em aberto</p>
          <p className="text-2xl font-bold text-cyan-100">R$ {mrrPotencial.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-slate-400">Expansões aceitas</p>
          <p className="text-2xl font-bold text-cyan-100">{aceitas.length}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h3 className="font-bold text-white">Clientes elegíveis para expansão</h3>
          {isLoading ? (
            <p className="text-slate-400">Carregando carteira...</p>
          ) : elegiveis.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nenhum cliente saudável com 3+ meses de contrato no momento.
            </p>
          ) : (
            elegiveis.map(({ negocio, saude }) => (
              <ClienteElegivelLinha
                key={negocio.id}
                negocio={negocio}
                saude={saude}
                jaTemSugestao={comSugestao.has(negocio.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 font-bold text-white">Oportunidades geradas</h3>
        {sugestoes.length === 0 ? (
          <Card><CardContent className="space-y-2 p-8 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-cyan-300" />
            <p className="text-slate-300">Nenhuma sugestão gerada ainda.</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {sugestoes.map((s) => (
              <SugestaoExpansaoCard key={s.id} sugestao={s} telefone={telefonePor[s.negocio_id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}