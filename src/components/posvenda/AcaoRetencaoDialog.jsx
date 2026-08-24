import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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

  const enviar = async () => {
    setEnviando(true);
    try {
      const res = await base44.functions.invoke("whatsapp/sendMessage", {
        telefone: negocio.telefone_cliente,
        mensagem
      });
      if (res?.data?.success) {
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