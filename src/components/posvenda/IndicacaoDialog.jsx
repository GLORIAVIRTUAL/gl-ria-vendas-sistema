import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function mensagemPadrao(negocio) {
  const nome = (negocio.nome_cliente || "").split(" ")[0];
  return `Olá ${nome}! Fico feliz de ter você com a Glória. Você conhece alguém que também se beneficiaria da nossa solução? Se puder me indicar um contato, eu cuido de tudo com muito cuidado.`;
}

export default function IndicacaoDialog({ negocio, open, onOpenChange }) {
  const [mensagem, setMensagem] = useState(() => mensagemPadrao(negocio));
  const [enviando, setEnviando] = useState(false);
  const [indicado, setIndicado] = useState({ nome: "", empresa: "", telefone: "" });
  const [salvandoIndicado, setSalvandoIndicado] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: indicacoes = [] } = useQuery({
    queryKey: ["indicacoes", negocio.id],
    queryFn: () => base44.entities.Indicacao.filter({ negocio_id: negocio.id }, "-created_date", 5)
  });

  const atualizar = () => {
    queryClient.invalidateQueries({ queryKey: ["indicacoes", negocio.id] });
    queryClient.invalidateQueries({ queryKey: ["indicacoes-carteira"] });
  };

  const base = {
    negocio_id: negocio.id,
    cliente_indicador: negocio.nome_cliente,
    empresa_indicadora: negocio.nome_empresa
  };

  const pedir = async () => {
    setEnviando(true);
    try {
      const res = await base44.functions.invoke("whatsapp/sendMessage", {
        telefone: negocio.telefone_cliente,
        mensagem
      });
      if (res?.data?.success) {
        await base44.entities.Indicacao.create({ ...base, status: "Solicitada", mensagem });
        atualizar();
        toast({ title: "Pedido de indicação enviado", description: negocio.nome_cliente });
        onOpenChange(false);
      } else {
        toast({ title: "Não foi possível enviar", description: res?.data?.error || "Erro no envio", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Não foi possível enviar", description: e.message, variant: "destructive" });
    }
    setEnviando(false);
  };

  const registrarIndicado = async () => {
    setSalvandoIndicado(true);
    try {
      const lead = await base44.entities.Lead.create({
        nome_cliente: indicado.nome,
        nome_empresa: indicado.empresa,
        telefone_cliente: indicado.telefone,
        estagio: "Prospeccao",
        observacoes: `Indicado por ${negocio.nome_cliente} (${negocio.nome_empresa})`
      });
      await base44.entities.Indicacao.create({
        ...base,
        status: "Convertida",
        indicado_nome: indicado.nome,
        indicado_empresa: indicado.empresa,
        indicado_telefone: indicado.telefone,
        lead_id: lead.id
      });
      atualizar();
      setIndicado({ nome: "", empresa: "", telefone: "" });
      toast({ title: "Indicação registrada", description: `${indicado.nome} entrou no CRM em Prospecção` });
    } catch (e) {
      toast({ title: "Não foi possível registrar", description: e.message, variant: "destructive" });
    }
    setSalvandoIndicado(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Indicações — {negocio.nome_empresa}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-cyan-100">Pedido por WhatsApp para {negocio.telefone_cliente}</Label>
          <Textarea rows={5} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        </div>

        <div className="space-y-2 rounded-lg border border-slate-500/40 bg-slate-950/50 p-3">
          <p className="text-sm font-semibold text-cyan-100">Registrar contato indicado</p>
          <Input placeholder="Nome do indicado" value={indicado.nome} onChange={(e) => setIndicado({ ...indicado, nome: e.target.value })} />
          <Input placeholder="Empresa do indicado" value={indicado.empresa} onChange={(e) => setIndicado({ ...indicado, empresa: e.target.value })} />
          <Input placeholder="Telefone (5511999999999)" value={indicado.telefone} onChange={(e) => setIndicado({ ...indicado, telefone: e.target.value })} />
          <Button size="sm" variant="outline" onClick={registrarIndicado} disabled={salvandoIndicado || !indicado.nome.trim() || !indicado.telefone.trim()}>
            {salvandoIndicado ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Criar lead da indicação
          </Button>
        </div>

        {indicacoes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-cyan-100">Histórico</p>
            <div className="max-h-28 space-y-2 overflow-auto">
              {indicacoes.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-500/40 bg-slate-950/50 p-2">
                  <span className="text-xs text-slate-300">{i.indicado_nome || "Pedido enviado"}</span>
                  <Badge variant="outline">{i.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={pedir} disabled={enviando || !mensagem.trim() || !negocio.telefone_cliente}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Pedir indicação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}