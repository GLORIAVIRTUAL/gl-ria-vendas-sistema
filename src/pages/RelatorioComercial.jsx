import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, CalendarCheck, Trophy, XCircle } from "lucide-react";
import RankingTabela from "@/components/relatorio/RankingTabela";
import FunilConversao from "@/components/relatorio/FunilConversao";
import { ESTAGIOS_GANHOS, ESTAGIOS_PERDIDOS, formatarMoeda } from "@/lib/forecast";

const PERIODOS = [
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
  { label: "90 dias", dias: 90 },
  { label: "12 meses", dias: 365 }
];

const PRODUTO_LABEL = {
  Atendimento_IA_24_7: "Atendimento IA 24/7",
  Maquina_de_Videos: "Máquina de Vídeos",
  Gloria_Clinica: "Glória Clínica",
  Gloria_Vendas: "Glória Vendas",
  Especialistas_Virtuais: "Especialistas Virtuais",
  Sites_em_24_Horas: "Sites em 24 Horas"
};

const agrupar = (leads, chave) => {
  const mapa = {};
  leads.forEach((l) => {
    const nome = chave(l) || "Não informado";
    if (!mapa[nome]) mapa[nome] = { nome, leads: 0, ganhos: 0, valor: 0 };
    mapa[nome].leads += 1;
    if (ESTAGIOS_GANHOS.includes(l.estagio)) {
      mapa[nome].ganhos += 1;
      mapa[nome].valor += l.valor_estimado || 0;
    }
  });
  return Object.values(mapa)
    .map((l) => ({ ...l, conversao: l.leads ? Math.round((l.ganhos / l.leads) * 100) : 0 }))
    .sort((a, b) => b.ganhos - a.ganhos || b.leads - a.leads);
};

export default function RelatorioComercial() {
  const [dias, setDias] = useState(30);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 500)
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ["prospects-relatorio"],
    queryFn: () => base44.entities.Prospect.list("-created_date", 500)
  });

  const { data: icps = [] } = useQuery({
    queryKey: ["icps"],
    queryFn: () => base44.entities.ICP.list("-created_date", 100)
  });

  const desde = new Date(Date.now() - dias * 86400000).toISOString();
  const doPeriodo = leads.filter((l) => (l.created_date || "") >= desde);
  const prospectsPeriodo = prospects.filter((p) => (p.created_date || "") >= desde);

  const ganhos = doPeriodo.filter((l) => ESTAGIOS_GANHOS.includes(l.estagio));
  const perdidos = doPeriodo.filter((l) => ESTAGIOS_PERDIDOS.includes(l.estagio));
  const reunioes = doPeriodo.filter((l) =>
    [...ESTAGIOS_GANHOS, "Reuniao_Realizada", "Em_Avaliacao", "Proposta", "Negociacao"].includes(l.estagio)
  );
  const faturamento = ganhos.reduce((s, l) => s + (l.valor_estimado || 0), 0);

  const stats = [
    { titulo: "Leads no período", valor: doPeriodo.length, icone: Users },
    { titulo: "Reuniões realizadas", valor: reunioes.length, icone: CalendarCheck },
    { titulo: "Negócios ganhos", valor: ganhos.length, icone: Trophy },
    { titulo: "Perdidos", valor: perdidos.length, icone: XCircle },
    { titulo: "Faturamento", valor: formatarMoeda(faturamento), icone: BarChart3 }
  ];

  const etapasFunil = [
    { label: "Leads criados", quantidade: doPeriodo.length },
    { label: "Qualificados", quantidade: doPeriodo.filter((l) => !["Prospeccao", "Contatado", "Engajado"].includes(l.estagio)).length },
    { label: "Reuniões", quantidade: reunioes.length },
    { label: "Propostas", quantidade: doPeriodo.filter((l) => ["Proposta", "Negociacao", ...ESTAGIOS_GANHOS].includes(l.estagio)).length },
    { label: "Ganhos", quantidade: ganhos.length }
  ];

  const icpNome = (id) => icps.find((i) => i.id === id)?.nome || "Sem ICP";
  const rankingProduto = agrupar(doPeriodo, (l) => PRODUTO_LABEL[l.produto_interesse] || l.produto_interesse);

  // Ranking de prospecção: prospects gerados por ICP e quantos foram para o CRM.
  const rankingICP = Object.values(
    prospectsPeriodo.reduce((acc, p) => {
      const nome = icpNome(p.icp_id);
      if (!acc[nome]) acc[nome] = { nome, leads: 0, ganhos: 0, valor: 0 };
      acc[nome].leads += 1;
      if (p.crm_lead_id) acc[nome].ganhos += 1;
      return acc;
    }, {})
  )
    .map((l) => ({ ...l, conversao: l.leads ? Math.round((l.ganhos / l.leads) * 100) : 0 }))
    .sort((a, b) => b.ganhos - a.ganhos || b.leads - a.leads);

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Relatório Comercial</h1>
          <p className="text-slate-400">Desempenho por período, produto e origem da prospecção</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <Button
              key={p.dias}
              size="sm"
              variant={dias === p.dias ? "default" : "outline"}
              onClick={() => setDias(p.dias)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Carregando relatório...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {stats.map((s) => (
              <Card key={s.titulo}>
                <CardContent className="p-5">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm text-slate-400">{s.titulo}</p>
                    <s.icone className="h-4 w-4 text-cyan-300" />
                  </div>
                  <p className="text-2xl font-bold text-cyan-100">{s.valor}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <FunilConversao etapas={etapasFunil} total={doPeriodo.length} />

          <RankingTabela titulo="Ranking por produto" colunaLabel="Produto" linhas={rankingProduto} />
          <RankingTabela titulo="Ranking por ICP (prospecção)" colunaLabel="ICP" linhas={rankingICP} />
        </>
      )}
    </div>
  );
}