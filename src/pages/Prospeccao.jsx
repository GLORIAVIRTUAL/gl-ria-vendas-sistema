import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import ProspectSearchForm from "@/components/prospeccao/ProspectSearchForm";
import ProspectCard from "@/components/prospeccao/ProspectCard";
import useProspeccao from "@/hooks/useProspeccao";

export default function Prospeccao() {
  const [view, setView] = useState("buscar");
  const flow = useProspeccao();
  const list = view === "buscar" ? flow.results : flow.prospects;
  return <div className="min-h-screen space-y-6 p-4 md:p-8">
    <div><h1 className="text-3xl font-bold">Prospecção de Empresas</h1><p className="text-slate-300">Encontre empresas no Kipflow, salve prospects e conduza-os ao CRM.</p></div>
    <div className="flex gap-2"><Button variant={view === "buscar" ? "default" : "outline"} onClick={() => setView("buscar")}>Buscar empresas</Button><Button variant={view === "salvos" ? "default" : "outline"} onClick={() => setView("salvos")}>Prospects salvos ({flow.prospects.length})</Button></div>
    {view === "buscar" && <ProspectSearchForm onSearch={flow.search} loading={flow.searching} />}
    {view === "buscar" && flow.pagination && <p className="text-sm text-slate-300">{flow.pagination.total || flow.results.length} empresas encontradas</p>}
    {view === "salvos" && flow.isLoading && <p className="text-slate-300">Carregando prospects...</p>}
    <div className="grid gap-4 xl:grid-cols-2">
      {list.map((prospect) => <ProspectCard key={prospect.id || prospect.cnpj} prospect={prospect} saved={view === "salvos"} busy={flow.busyId === (prospect.id || prospect.cnpj)} onSave={() => flow.save(prospect)} onAddCRM={(stage) => flow.addCRM(prospect, stage)} onWhatsApp={(message) => flow.sendWhatsApp(prospect, message)} onEmail={(subject, body) => flow.sendEmail(prospect, subject, body)} />)}
    </div>
    {!flow.searching && !flow.isLoading && list.length === 0 && <div className="rounded-xl border border-slate-500/30 bg-slate-950/40 p-10 text-center text-slate-300">{view === "buscar" ? (flow.hasSearched ? "Nenhuma empresa corresponde a todos os filtros. Tente remover a faixa de faturamento ou de funcionários e buscar novamente." : "Use os filtros acima para localizar novas empresas.") : "Nenhum prospect salvo ainda."}</div>}
  </div>;
}