import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import MotorStatCard from "@/components/motor/MotorStatCard";
import EtapasFunil from "@/components/motor/EtapasFunil";
import ConverterQuentesButton from "@/components/motor/ConverterQuentesButton";

const ESTAGIOS = [
  ["Prospeccao", "Prospecção"],
  ["Reuniao_Marcada", "Reunião marcada"],
  ["Em_Avaliacao", "Em avaliação"],
  ["Negocio_Fechado", "Negócio fechado"],
  ["Desistiu", "Desistiu"]
];

export default function MotorComercial() {
  const { data: prospects = [], isLoading } = useQuery({ queryKey: ["prospects"], queryFn: () => base44.entities.Prospect.list("-created_date", 500) });
  const { data: envios = [] } = useQuery({ queryKey: ["cadencia-envios"], queryFn: () => base44.entities.CadenciaEnvio.list("-created_date", 500) });
  const { data: leads = [] } = useQuery({ queryKey: ["leads-motor"], queryFn: () => base44.entities.Lead.list("-created_date", 500) });
  const { data: icps = [] } = useQuery({ queryKey: ["icps"], queryFn: () => base44.entities.ICP.list() });
  const { data: campanhas = [] } = useQuery({ queryKey: ["campanhas"], queryFn: () => base44.entities.Campanha.list() });

  const analisados = prospects.filter((prospect) => prospect.analisado_em);
  const quentes = analisados.filter((prospect) => (prospect.score || 0) >= 70);
  const enviados = envios.filter((envio) => envio.status === "enviado");
  const programados = envios.filter((envio) => envio.status === "programado");
  const errosEnvio = envios.filter((envio) => envio.status === "erro");
  const icpsAtivos = icps.filter((icp) => icp.prospeccao_automatica_ativa);
  const campanhasAtivas = campanhas.filter((campanha) => campanha.ativa);

  return <div className="min-h-screen space-y-6 p-4 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Motor Comercial</h1>
        <p className="text-slate-300">Visão única do fluxo: prospecção automática, qualificação por IA, cadências e CRM.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link to="/ICPs">ICPs</Link></Button>
        <Button variant="outline" asChild><Link to="/Prospeccao">Prospecção</Link></Button>
        <Button variant="outline" asChild><Link to="/Campanhas">Campanhas</Link></Button>
        <Button variant="outline" asChild><Link to="/ResultadosCadencias">Resultados</Link></Button>
        <ConverterQuentesButton />
      </div>
    </div>

    {isLoading && <p className="text-slate-300">Carregando indicadores...</p>}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MotorStatCard label="Prospects na base" valor={prospects.length} detalhe={`${analisados.length} já qualificados pela IA`} />
      <MotorStatCard label="Prospects quentes" valor={quentes.length} detalhe="Score 70 ou mais" />
      <MotorStatCard label="Mensagens enviadas" valor={enviados.length} detalhe={`${programados.length} programadas · ${errosEnvio.length} com erro`} />
      <MotorStatCard label="Automação ligada" valor={`${icpsAtivos.length} ICPs · ${campanhasAtivas.length} campanhas`} detalhe="Prospecção e cadências ativas" />
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <EtapasFunil titulo="Fluxo de prospecção" etapas={[
        { label: "Salvos", valor: prospects.filter((prospect) => prospect.status === "salvo").length },
        { label: "Qualificados pela IA", valor: analisados.length },
        { label: "Em cadência", valor: new Set(envios.map((envio) => envio.prospect_id)).size },
        { label: "Contatados", valor: prospects.filter((prospect) => prospect.status === "contatado").length },
        { label: "No CRM", valor: prospects.filter((prospect) => prospect.status === "no_crm").length }
      ]} />
      <EtapasFunil titulo="Funil de vendas (CRM)" etapas={ESTAGIOS.map(([chave, label]) => ({ label, valor: leads.filter((lead) => lead.estagio === chave).length }))} />
    </div>
  </div>;
}