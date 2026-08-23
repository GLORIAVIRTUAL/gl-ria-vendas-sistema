import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import CampanhaCard from "@/components/campanhas/CampanhaCard";
import CampanhaFormDialog from "@/components/campanhas/CampanhaFormDialog";

export default function Campanhas() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  const { data: campanhas = [], isLoading } = useQuery({ queryKey: ["campanhas"], queryFn: () => base44.entities.Campanha.list("-created_date") });
  const { data: icps = [] } = useQuery({ queryKey: ["icps"], queryFn: () => base44.entities.ICP.list("-created_date") });
  const { data: envios = [] } = useQuery({ queryKey: ["cadencia-envios"], queryFn: () => base44.entities.CadenciaEnvio.list("-created_date", 500) });

  const recarregar = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["campanhas"] }),
    queryClient.invalidateQueries({ queryKey: ["cadencia-envios"] })
  ]);

  const salvar = async (form) => {
    setSaving(true);
    try {
      const dados = { ...form };
      delete dados.id;
      if (editando) await base44.entities.Campanha.update(editando.id, dados);
      else await base44.entities.Campanha.create(dados);
      await recarregar();
      setDialogOpen(false);
      setEditando(null);
      toast.success("Campanha salva.");
    } catch (error) { toast.error(error.message); }
    finally { setSaving(false); }
  };

  const alternar = async (campanha) => {
    await base44.entities.Campanha.update(campanha.id, { ativa: !campanha.ativa });
    await recarregar();
    toast.success(campanha.ativa ? "Cadência pausada." : "Cadência ativada.");
  };

  const processar = async (campanha) => {
    setBusyId(campanha.id);
    try {
      const response = await base44.functions.invoke("cadenciaProcessar", { campanha_id: campanha.id });
      const resultado = response.data?.resultados?.[0];
      if (resultado?.status === "erro") throw new Error(resultado.motivo);
      await recarregar();
      toast.success(`${resultado?.inscritos ?? 0} prospects inscritos, ${resultado?.enviados ?? 0} mensagens enviadas.`);
    } catch (error) { toast.error(error.response?.data?.error || error.message); }
    finally { setBusyId(""); }
  };

  return <div className="min-h-screen space-y-6 p-4 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Campanhas e Cadências</h1>
        <p className="text-slate-300">Coloque os prospects analisados em sequências automáticas de WhatsApp e e-mail.</p>
      </div>
      <Button onClick={() => { setEditando(null); setDialogOpen(true); }}>Nova campanha</Button>
    </div>

    {isLoading && <p className="text-slate-300">Carregando campanhas...</p>}

    <div className="grid gap-4 xl:grid-cols-2">
      {campanhas.map((campanha) => <CampanhaCard
        key={campanha.id}
        campanha={campanha}
        icpNome={icps.find((icp) => icp.id === campanha.icp_id)?.nome}
        envios={envios.filter((envio) => envio.campanha_id === campanha.id)}
        busy={busyId === campanha.id}
        onEdit={() => { setEditando(campanha); setDialogOpen(true); }}
        onToggle={() => alternar(campanha)}
        onProcessar={() => processar(campanha)}
      />)}
    </div>

    {!isLoading && campanhas.length === 0 && <div className="rounded-xl border border-slate-500/30 bg-slate-950/40 p-10 text-center text-slate-300">
      Nenhuma campanha criada. Crie a primeira cadência para os prospects com melhor score.
    </div>}

    <CampanhaFormDialog open={dialogOpen} campanha={editando} icps={icps} saving={saving} onClose={() => { setDialogOpen(false); setEditando(null); }} onSave={salvar} />
  </div>;
}