import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Copy, AlertTriangle, Database, ShieldOff } from "lucide-react";
import GrupoDuplicado from "@/components/higiene/GrupoDuplicado";
import ContatosInvalidos from "@/components/higiene/ContatosInvalidos";
import { encontrarDuplicados, encontrarInvalidos, montarMesclagem } from "@/lib/higieneBase";

export default function HigieneBase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mesclandoId, setMesclandoId] = useState(null);

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["prospects-higiene"],
    queryFn: () => base44.entities.Prospect.list("-created_date", 1000)
  });

  const duplicados = useMemo(() => encontrarDuplicados(prospects), [prospects]);
  const invalidos = useMemo(() => encontrarInvalidos(prospects), [prospects]);
  const optOut = prospects.filter((p) => p.opt_out).length;

  const mesclar = useMutation({
    mutationFn: async (grupo) => {
      const { mestre, remover, atualizacao } = montarMesclagem(grupo.registros);
      if (Object.keys(atualizacao).length > 0) {
        await base44.entities.Prospect.update(mestre.id, atualizacao);
      }
      for (const r of remover) {
        await base44.entities.Prospect.delete(r.id);
      }
      return remover.length;
    },
    onMutate: (grupo) => setMesclandoId(grupo.id),
    onSettled: () => setMesclandoId(null),
    onSuccess: (removidos) => {
      queryClient.invalidateQueries({ queryKey: ["prospects-higiene"] });
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      toast({ title: "Registros mesclados", description: `${removidos} duplicado(s) removido(s).` });
    },
    onError: (e) => toast({ title: "Erro ao mesclar", description: e.message, variant: "destructive" })
  });

  const stats = [
    { titulo: "Prospects na base", valor: prospects.length, icone: Database },
    { titulo: "Grupos duplicados", valor: duplicados.length, icone: Copy },
    { titulo: "Contatos com problema", valor: invalidos.length, icone: AlertTriangle },
    { titulo: "Em opt-out", valor: optOut, icone: ShieldOff }
  ];

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Higiene da Base</h1>
        <p className="text-slate-400">Duplicados, contatos inválidos e mesclagem de registros</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      {isLoading ? (
        <p className="text-slate-400">Analisando a base...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Duplicados ({duplicados.length})</h2>
            {duplicados.length === 0 ? (
              <Card><CardContent className="p-5 text-sm text-slate-400">Nenhum duplicado encontrado.</CardContent></Card>
            ) : (
              duplicados.map((g) => (
                <GrupoDuplicado
                  key={g.id}
                  grupo={g}
                  mesclando={mesclandoId === g.id}
                  onMesclar={(grupo) => mesclar.mutate(grupo)}
                />
              ))
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Qualidade dos contatos</h2>
            <ContatosInvalidos itens={invalidos} />
          </div>
        </div>
      )}
    </div>
  );
}