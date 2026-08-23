import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ICPCard from "@/components/icp/ICPCard";
import ICPFormDialog from "@/components/icp/ICPFormDialog";

const ESTAGIOS_GANHOS = ["Negocio_Fechado", "Implantacao", "Inicio_de_Uso", "Estavel"];

export default function ICPs() {
  const queryClient = useQueryClient();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [icpSelecionado, setIcpSelecionado] = useState(null);

  const { data: icps = [], isLoading } = useQuery({
    queryKey: ["icps"],
    queryFn: () => base44.entities.ICP.list("-created_date"),
    initialData: [],
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ["prospects"],
    queryFn: () => base44.entities.Prospect.list(),
    initialData: [],
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list(),
    initialData: [],
  });

  const estatisticas = useMemo(() => {
    const leadsPorId = new Map(leads.map((lead) => [lead.id, lead]));
    const mapa = {};

    icps.forEach((icp) => {
      const doIcp = prospects.filter((p) => p.icp_id === icp.id);
      const leadsDoIcp = doIcp
        .map((p) => leadsPorId.get(p.crm_lead_id))
        .filter(Boolean);

      mapa[icp.id] = {
        prospects: doIcp.length,
        leads: leadsDoIcp.length,
        reunioes: leadsDoIcp.filter((lead) => lead.estagio === "Reuniao_Marcada" || lead.data_reuniao).length,
        ganhos: leadsDoIcp.filter((lead) => ESTAGIOS_GANHOS.includes(lead.estagio)).length,
      };
    });

    return mapa;
  }, [icps, prospects, leads]);

  const salvarMutation = useMutation({
    mutationFn: async (dados) => {
      if (icpSelecionado) {
        return base44.entities.ICP.update(icpSelecionado.id, dados);
      }
      return base44.entities.ICP.create(dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icps"] });
      setDialogAberto(false);
      setIcpSelecionado(null);
    },
  });

  const duplicarMutation = useMutation({
    mutationFn: async (icp) => {
      const { id, created_date, updated_date, created_by_id, ultima_execucao, ...resto } = icp;
      return base44.entities.ICP.create({
        ...resto,
        nome: `${icp.nome} (cópia)`,
        ativo: false,
        prospeccao_automatica_ativa: false,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["icps"] }),
  });

  const alternarMutation = useMutation({
    mutationFn: (icp) => base44.entities.ICP.update(icp.id, { ativo: !icp.ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["icps"] }),
  });

  const abrirNovo = () => {
    setIcpSelecionado(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (icp) => {
    setIcpSelecionado(icp);
    setDialogAberto(true);
  };

  const ativos = icps.filter((icp) => icp.ativo).length;
  const isBusy = duplicarMutation.isPending || alternarMutation.isPending;

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">Perfis Ideais de Cliente (ICP)</h1>
            <p className="text-slate-400">
              Defina quais empresas devem ser prospectadas e acompanhe o resultado de cada perfil
            </p>
          </div>
          <Button onClick={abrirNovo}>Novo ICP</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border border-slate-500/40 bg-slate-950/60">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-cyan-200/80">ICPs cadastrados</p>
              <p className="mt-1 text-3xl font-bold text-cyan-100">{icps.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-500/40 bg-slate-950/60">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-cyan-200/80">ICPs ativos</p>
              <p className="mt-1 text-3xl font-bold text-cyan-100">{ativos}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-500/40 bg-slate-950/60">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-cyan-200/80">Prospects vinculados</p>
              <p className="mt-1 text-3xl font-bold text-cyan-100">
                {prospects.filter((p) => p.icp_id).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-slate-400">Carregando ICPs...</p>
        ) : icps.length === 0 ? (
          <Card className="border border-slate-500/40 bg-slate-950/60">
            <CardContent className="p-10 text-center text-slate-400">
              Nenhum ICP cadastrado ainda. Crie o primeiro perfil para orientar a prospecção.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {icps.map((icp) => (
              <ICPCard
                key={icp.id}
                icp={icp}
                stats={estatisticas[icp.id] || { prospects: 0, leads: 0, reunioes: 0, ganhos: 0 }}
                onEdit={abrirEdicao}
                onDuplicate={(item) => duplicarMutation.mutate(item)}
                onToggle={(item) => alternarMutation.mutate(item)}
                isBusy={isBusy}
              />
            ))}
          </div>
        )}

        <ICPFormDialog
          open={dialogAberto}
          onOpenChange={(aberto) => {
            setDialogAberto(aberto);
            if (!aberto) setIcpSelecionado(null);
          }}
          icp={icpSelecionado}
          onSave={(dados) => salvarMutation.mutate(dados)}
          isSaving={salvarMutation.isPending}
        />
      </div>
    </div>
  );
}