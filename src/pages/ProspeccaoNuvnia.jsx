import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import NuvniaSearchForm from "@/components/prospeccao/NuvniaSearchForm";
import ProspectCard from "@/components/prospeccao/ProspectCard";
import useProspeccao from "@/hooks/useProspeccao";
import { normalizeNuvniaLead } from "@/lib/nuvniaUtils";

export default function ProspeccaoNuvnia() {
  const flow = useProspeccao();
  const [results, setResults] = useState([]);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const buscar = async (filters) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await base44.functions.invoke("nuvniaLeads", { acao: "search", filtros: filters, limit: Number(filters.limit) || 20 });
      const payload = response.data;
      if (payload?.error) throw new Error(payload.error);
      setResults((payload?.data || []).map(normalizeNuvniaLead));
      setCredits(payload?.credits || null);
      if (payload?.meta?.capped) toast.info("O retorno foi limitado pelos créditos restantes da sua conta Nuvnia.");
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const verCreditos = async () => {
    try {
      const response = await base44.functions.invoke("nuvniaLeads", { acao: "usage" });
      const dados = response.data?.data;
      setCredits({ used: dados?.used, limit: dados?.limit, remaining: dados?.remaining });
      toast.success(`Plano ${dados?.plan || "-"}: ${dados?.remaining ?? "-"} créditos restantes.`);
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    }
  };

  return <div className="min-h-screen space-y-6 p-4 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Prospecção Nuvnia</h1>
        <p className="text-slate-300">Busque empresas na base Nuvnia Leads e salve como prospects do sistema.</p>
      </div>
      <Button variant="outline" onClick={verCreditos}>Ver créditos</Button>
    </div>

    {credits && <p className="text-sm text-slate-300">Créditos: {credits.remaining ?? "-"} restantes de {credits.limit ?? "-"} (usados: {credits.used ?? "-"})</p>}

    <NuvniaSearchForm onSearch={buscar} loading={loading} />

    {results.length > 0 && <p className="text-sm text-slate-300">{results.length} empresas retornadas</p>}

    <div className="grid gap-4 xl:grid-cols-2">
      {results.map((prospect) => <ProspectCard
        key={prospect.cnpj}
        prospect={prospect}
        saved={false}
        busy={flow.busyId === prospect.cnpj}
        onSave={() => flow.save(prospect)}
      />)}
    </div>

    {!loading && results.length === 0 && <div className="rounded-xl border border-slate-500/30 bg-slate-950/40 p-10 text-center text-slate-300">
      {hasSearched ? "Nenhuma empresa encontrada para estes filtros." : "Use os filtros acima para buscar empresas na Nuvnia."}
    </div>}
  </div>;
}