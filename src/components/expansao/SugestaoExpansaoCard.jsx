import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_COR = {
  Sugerida: "bg-cyan-500/15 text-cyan-200",
  Apresentada: "bg-blue-500/15 text-blue-200",
  Aceita: "bg-green-500/15 text-green-200",
  Recusada: "bg-red-500/15 text-red-200"
};

export default function SugestaoExpansaoCard({ sugestao, telefone }) {
  const [mensagem, setMensagem] = useState(sugestao.abordagem || "");
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const atualizar = async (dados) => {
    await base44.entities.SugestaoExpansao.update(sugestao.id, dados);
    queryClient.invalidateQueries({ queryKey: ["sugestoes-expansao"] });
  };

  const enviar = async () => {
    if (!telefone) {
      toast({ title: "Cliente sem telefone cadastrado", variant: "destructive" });
      return;
    }
    setEnviando(true);
    try {
      const res = await base44.functions.invoke("whatsapp/sendMessage", { telefone, mensagem });
      if (res?.data?.success) {
        await atualizar({ status: "Apresentada", apresentada_em: new Date().toISOString(), abordagem: mensagem });
        toast({ title: "Oferta enviada", description: `WhatsApp enviado para ${sugestao.nome_cliente}` });
      } else {
        toast({ title: "Não foi possível enviar", description: res?.data?.error || "Erro no envio", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Não foi possível enviar", description: e.message, variant: "destructive" });
    }
    setEnviando(false);
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-white">{sugestao.nome_empresa}</h3>
            <p className="text-xs text-slate-400">Hoje usa: {sugestao.produto_atual || "—"}</p>
          </div>
          <Badge className={STATUS_COR[sugestao.status] || STATUS_COR.Sugerida}>{sugestao.status}</Badge>
        </div>

        <div className="rounded-lg border border-cyan-400/30 bg-slate-950/60 p-3">
          <p className="text-sm font-semibold text-cyan-100">
            {sugestao.produto_sugerido}
            {sugestao.valor_sugerido ? ` · R$ ${sugestao.valor_sugerido.toLocaleString("pt-BR")}/mês` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-300">{sugestao.justificativa}</p>
        </div>

        <Textarea rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={enviar} disabled={enviando || !mensagem.trim()}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar oferta
          </Button>
          <Button size="sm" variant="outline" onClick={() => atualizar({ status: "Aceita" })}>
            <ThumbsUp className="h-4 w-4" />
            Aceita
          </Button>
          <Button size="sm" variant="outline" onClick={() => atualizar({ status: "Recusada" })}>
            <ThumbsDown className="h-4 w-4" />
            Recusada
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}