import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, AlertTriangle, Users, Ban, Calculator } from "lucide-react";
import { resumirReceita } from "@/lib/receitaRecorrente";
import ReceitaStatCard from "@/components/receita/ReceitaStatCard";
import EvolucaoMRRChart from "@/components/receita/EvolucaoMRRChart";
import ComposicaoProduto from "@/components/receita/ComposicaoProduto";
import ClientesRecorrentes from "@/components/receita/ClientesRecorrentes";

const moeda = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

export default function ReceitaRecorrente() {
  const { data: negocios = [], isLoading } = useQuery({
    queryKey: ["negocios-receita"],
    queryFn: () => base44.entities.NegocioFechado.list("-created_date", 500)
  });

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes-receita"],
    queryFn: () => base44.entities.Cliente.list("-created_date", 500)
  });

  // Clientes recorrentes entram no cálculo; negócios já convertidos em cliente não são contados duas vezes.
  const negociosVinculados = new Set(clientes.map((c) => c.negocio_id).filter(Boolean));
  const contratos = [
    ...negocios.filter((n) => !negociosVinculados.has(n.id)),
    ...clientes.map((c) => ({
      ...c,
      status_pagamento: c.status_pagamento || "Ativo",
      data_primeira_cobranca: c.data_inicio_contrato || c.created_date
    }))
  ];

  const r = resumirReceita(contratos);
  const ultimo = r.evolucao[r.evolucao.length - 1] || {};

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Receita Recorrente</h1>
        <p className="text-slate-400">MRR, ARR, evolução mensal e composição da carteira</p>
      </div>

      {isLoading || loadingClientes ? (
        <p className="text-slate-400">Carregando receita...</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <ReceitaStatCard titulo="MRR ativo" valor={moeda(r.mrr)} detalhe={`${r.clientesAtivos} contratos ativos`} icon={DollarSign} />
            <ReceitaStatCard titulo="ARR projetado" valor={moeda(r.arr)} detalhe="MRR × 12 meses" icon={TrendingUp} />
            <ReceitaStatCard titulo="Ticket médio" valor={moeda(r.ticketMedio)} detalhe="por cliente ativo" icon={Calculator} />
            <ReceitaStatCard titulo="MRR em risco" valor={moeda(r.mrrRisco)} detalhe={`${r.inadimplentes} inadimplente(s) + suspensos`} icon={AlertTriangle} />
            <ReceitaStatCard titulo="MRR perdido" valor={moeda(r.mrrPerdido)} detalhe={`${r.cancelados} contrato(s) cancelado(s)`} icon={Ban} />
            <ReceitaStatCard titulo="Novo MRR no mês" valor={moeda(ultimo.novo_mrr)} detalhe={`${ultimo.novos || 0} novo(s) contrato(s)`} icon={Users} />
          </div>

          <ClientesRecorrentes clientes={clientes} />
          <EvolucaoMRRChart dados={r.evolucao} />
          <ComposicaoProduto itens={r.porProduto} total={r.mrr} />
        </>
      )}
    </div>
  );
}