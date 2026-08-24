import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus, BookOpen } from "lucide-react";
import ConhecimentoCard from "@/components/conhecimento/ConhecimentoCard";
import ConhecimentoFormDialog from "@/components/conhecimento/ConhecimentoFormDialog";

const CATEGORIAS = ["Todas", "Produto", "Preco", "Diferencial", "FAQ", "Politica", "Processo"];

export default function BaseConhecimento() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [categoria, setCategoria] = useState("Todas");

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["conhecimento"],
    queryFn: () => base44.entities.ConhecimentoItem.list("ordem", 200)
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["conhecimento"] });

  const salvar = useMutation({
    mutationFn: (dados) =>
      itemEditando
        ? base44.entities.ConhecimentoItem.update(itemEditando.id, dados)
        : base44.entities.ConhecimentoItem.create(dados),
    onSuccess: () => {
      invalidar();
      setDialogAberto(false);
      setItemEditando(null);
      toast({ title: "Conhecimento salvo" });
    },
    onError: (e) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" })
  });

  const excluir = useMutation({
    mutationFn: (item) => base44.entities.ConhecimentoItem.delete(item.id),
    onSuccess: () => {
      invalidar();
      toast({ title: "Item removido" });
    }
  });

  const alternar = useMutation({
    mutationFn: ({ item, ativo }) => base44.entities.ConhecimentoItem.update(item.id, { ativo }),
    onSuccess: invalidar
  });

  const filtrados = categoria === "Todas" ? itens : itens.filter((i) => i.categoria === categoria);

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Base de Conhecimento</h1>
          <p className="text-slate-400">Produtos, preços e diferenciais que a IA usa nas conversas do WhatsApp</p>
        </div>
        <Button onClick={() => { setItemEditando(null); setDialogAberto(true); }}>
          <Plus className="h-4 w-4" />
          Novo conhecimento
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((c) => (
          <Button key={c} size="sm" variant={categoria === c ? "default" : "outline"} onClick={() => setCategoria(c)}>
            {c}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-slate-400">Carregando base...</p>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-cyan-300" />
            <p className="text-slate-300">Nenhum item cadastrado nesta categoria.</p>
            <p className="text-sm text-slate-500">Cadastre produtos, preços e diferenciais para a IA responder com precisão.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtrados.map((item) => (
            <ConhecimentoCard
              key={item.id}
              item={item}
              onEditar={(i) => { setItemEditando(i); setDialogAberto(true); }}
              onExcluir={(i) => excluir.mutate(i)}
              onToggle={(i, ativo) => alternar.mutate({ item: i, ativo })}
            />
          ))}
        </div>
      )}

      <ConhecimentoFormDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        item={itemEditando}
        salvando={salvar.isPending}
        onSalvar={(dados) => salvar.mutate(dados)}
      />
    </div>
  );
}