import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { gerarPlaybookObjecoes } from "@/functions/gerarPlaybookObjecoes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Loader2, ShieldQuestion } from "lucide-react";
import ObjecaoCard from "@/components/playbook/ObjecaoCard";

const CATEGORIAS = ["Todas", "Preco", "Timing", "Autoridade", "Necessidade", "Confianca", "Concorrencia", "Tecnica", "Outro"];

export default function PlaybookObjecoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categoria, setCategoria] = useState("Todas");

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["objecoes-playbook"],
    queryFn: () => base44.entities.ObjecaoPlaybook.list("-frequencia", 200)
  });

  const gerar = useMutation({
    mutationFn: async () => (await gerarPlaybookObjecoes({})).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["objecoes-playbook"] });
      toast({
        title: "Playbook atualizado",
        description: data.mensagem || `${data.criados} nova(s) e ${data.atualizados} atualizada(s).`
      });
    },
    onError: (e) => toast({ title: "Erro ao gerar playbook", description: e.message, variant: "destructive" })
  });

  const filtrados = categoria === "Todas" ? itens : itens.filter((i) => i.categoria === categoria);

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Playbook de Objeções</h1>
          <p className="text-slate-400">Respostas prontas para as objeções mais frequentes da base</p>
        </div>
        <Button onClick={() => gerar.mutate()} disabled={gerar.isPending}>
          {gerar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Gerar com IA
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={categoria === c ? "default" : "outline"}
            onClick={() => setCategoria(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-slate-400">Carregando playbook...</p>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 p-8 text-center">
            <ShieldQuestion className="mx-auto h-8 w-8 text-cyan-300" />
            <p className="text-slate-300">Nenhuma objeção no playbook ainda.</p>
            <p className="text-sm text-slate-500">
              Clique em "Gerar com IA" para transformar as objeções registradas nas conversas em respostas prontas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtrados.map((item) => (
            <ObjecaoCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}