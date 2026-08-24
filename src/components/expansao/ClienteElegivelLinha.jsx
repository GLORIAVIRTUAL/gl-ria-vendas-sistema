import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ClienteElegivelLinha({ negocio, saude, jaTemSugestao }) {
  const [gerando, setGerando] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const gerar = async () => {
    setGerando(true);
    try {
      const res = await base44.functions.invoke("sugerirExpansao", { negocio_id: negocio.id });
      if (res?.data?.ok) {
        queryClient.invalidateQueries({ queryKey: ["sugestoes-expansao"] });
        toast({ title: "Sugestão gerada", description: res.data.sugestao.produto_sugerido });
      } else {
        toast({ title: "Não foi possível gerar", description: res?.data?.error || "Erro", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Não foi possível gerar", description: e.message, variant: "destructive" });
    }
    setGerando(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-500/40 bg-slate-950/50 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-cyan-100">{negocio.nome_empresa}</p>
        <p className="truncate text-xs text-slate-400">
          {saude.meses} meses · R$ {(negocio.valor_mensalidade || 0).toLocaleString("pt-BR")}/mês · {negocio.produto}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={gerar} disabled={gerando}>
        {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {jaTemSugestao ? "Nova sugestão" : "Gerar sugestão"}
      </Button>
    </div>
  );
}