import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import QualidadeCard from "@/components/qualidade/QualidadeCard";
import QualidadePorICP from "@/components/qualidade/QualidadePorICP";
import SemContatoLista from "@/components/qualidade/SemContatoLista";

export default function QualidadeProspeccao() {
  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["prospects-qualidade"],
    queryFn: () => base44.entities.Prospect.list("-created_date", 1000),
  });
  const { data: icps = [] } = useQuery({
    queryKey: ["icps-qualidade"],
    queryFn: () => base44.entities.ICP.list(),
  });

  const total = prospects.length;
  const temTelefone = prospects.filter((p) => p.telefone || p.whatsapp).length;
  const temEmail = prospects.filter((p) => p.email).length;
  const temSite = prospects.filter((p) => p.site).length;
  const analisados = prospects.filter((p) => p.score != null).length;
  const semContato = prospects.filter((p) => !p.telefone && !p.whatsapp && !p.email);

  const nomeICP = (id) => icps.find((i) => i.id === id)?.nome || "Sem ICP";
  const grupos = {};
  prospects.forEach((p) => {
    const nome = nomeICP(p.icp_id);
    grupos[nome] = grupos[nome] || { nome, total: 0, comContato: 0, quentes: 0, somaScore: 0, comScore: 0 };
    const g = grupos[nome];
    g.total += 1;
    if (p.telefone || p.whatsapp || p.email) g.comContato += 1;
    if ((p.score || 0) >= 70) g.quentes += 1;
    if (p.score != null) { g.somaScore += p.score; g.comScore += 1; }
  });
  const linhas = Object.values(grupos)
    .map((g) => ({ ...g, scoreMedio: g.comScore ? Math.round(g.somaScore / g.comScore) : 0 }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Qualidade da Prospecção</h1>
        <p className="text-slate-400">Quanto dos dados capturados é realmente acionável pelo time comercial.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link to="/MotorComercial">Motor Comercial</Link></Button>
        <Button variant="outline" asChild><Link to="/Prospeccao">Prospecção</Link></Button>
        <Button variant="outline" asChild><Link to="/ICPs">ICPs</Link></Button>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Carregando dados...</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <QualidadeCard titulo="Com telefone ou WhatsApp" valor={temTelefone} total={total} descricao="prontos para cadência" />
            <QualidadeCard titulo="Com e-mail" valor={temEmail} total={total} descricao="prontos para e-mail" />
            <QualidadeCard titulo="Com site" valor={temSite} total={total} descricao="permitem pesquisa prévia" />
            <QualidadeCard titulo="Qualificados pela IA" valor={analisados} total={total} descricao="com lead score calculado" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <QualidadePorICP linhas={linhas} />
            <SemContatoLista prospects={semContato} />
          </div>
        </>
      )}
    </div>
  );
}