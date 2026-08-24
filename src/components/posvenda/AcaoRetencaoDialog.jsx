import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Send, Loader2, History } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

function mensagemPadrao(negocio, saude) {
  const nome = (negocio.nome_cliente || "").split(" ")[0];
  if (saude.alertas.includes("Pagamento em atraso")) {
    return `Olá ${nome}! Tudo bem? Identificamos uma pendência no pagamento do seu plano. Posso te ajudar a regularizar hoje para não interromper o serviço?`;
  }
  if (saude.meses < 1) {
    return `Olá ${nome}! Como está sendo sua primeira experiência com a Glória? Quero garantir que a implantação siga redonda — posso agendar 15 minutos com você essa semana?`;
  }
  return `Olá ${nome}! Passando para saber como está a sua operação com a Glória. Tem algo que possamos melhorar ou ajustar para você?`;
}

export default function AcaoRetencaoDialog({ negocio, saude, open, onOpenChange }) {
  const [mensagem, setMensagem] = useState(() => mensagemPadrao(negocio, saude));
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: historico = [] } = useQuery({
    queryKey: ["interacoes-retencao", negocio.id],
    queryFn: () => base44.entities.InteracaoRetencao.filter({ negocio_id: negocio.id }, "-created_date", 5)
  });

  const enviar = async () => {
    setEnviando(true);
    try {
      const res = await base44.functions.invoke("whatsapp/sendMessage", {
        telefone: negocio.telefone_cliente,
        mensagem
      });
      if (res?.data?.success) {
        await base44.entities.InteracaoRetencao.create({
          negocio_id: negocio.id,
          nome_cliente: negocio.nome_cliente,
          nome_empresa: negocio.nome_empresa,
          canal: "WhatsApp",
          destino: negocio.telefone_cliente,
          mensagem,
          motivo: saude.alertas?.join(" | ") || "Contato preventivo",
          saude_score: saude.score
        });
        queryClient.invalidateQueries({ queryKey: ["interacoes-retencao", negocio.id] });
        toast({ title: "Mensagem enviada", description: `WhatsApp enviado para ${negocio.nome_cliente}` });
        onOpenChange(false);
      } else {
        toast({ title: "Não foi possível enviar", description: res?.data?.error || "Erro no envio", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Não foi possível enviar", description: e.message, variant: "destructive" });
    }
    setEnviando(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ação de retenção — {negocio.nome_empresa}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-cyan-100">Mensagem de WhatsApp para {negocio.telefone_cliente}</Label>
          <Textarea rows={6} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <History className="h-4 w-4" />
            Histórico de retenção
          </p>
          {historico.length === 0 ? (
            <p className="text-xs text-slate-400">Nenhum contato de retenção registrado ainda.</p>
          ) : (
            <div className="max-h-32 space-y-2 overflow-auto">
              {historico.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-500/40 bg-slate-950/50 p-2">
                  <p className="text-xs text-cyan-200">
                    {format(new Date(item.created_date), "dd/MM/yyyy HH:mm")} · {item.canal}
                  </p>
                  <p className="text-xs text-slate-300">{item.mensagem}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={enviar} disabled={enviando || !mensagem.trim()}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}