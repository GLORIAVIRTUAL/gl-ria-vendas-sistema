import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function classificarNPS(nota) {
  if (nota >= 9) return "Promotor";
  if (nota >= 7) return "Neutro";
  return "Detrator";
}

const NOTAS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function NPSDialog({ negocio, open, onOpenChange }) {
  const [nota, setNota] = useState(null);
  const [comentario, setComentario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const salvar = async () => {
    setSalvando(true);
    try {
      await base44.entities.NPSResposta.create({
        negocio_id: negocio.id,
        nome_cliente: negocio.nome_cliente,
        nome_empresa: negocio.nome_empresa,
        nota,
        classificacao: classificarNPS(nota),
        comentario
      });
      queryClient.invalidateQueries({ queryKey: ["nps-respostas"] });
      toast({ title: "NPS registrado", description: `Nota ${nota} · ${classificarNPS(nota)}` });
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Não foi possível salvar", description: e.message, variant: "destructive" });
    }
    setSalvando(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>NPS — {negocio.nome_empresa}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-cyan-100">Nota de 0 a 10</Label>
            <div className="flex flex-wrap gap-2">
              {NOTAS.map((n) => (
                <Button key={n} size="sm" variant={nota === n ? "default" : "outline"} onClick={() => setNota(n)}>
                  {n}
                </Button>
              ))}
            </div>
            {nota !== null && <p className="text-xs text-cyan-200">Classificação: {classificarNPS(nota)}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-cyan-100">Comentário do cliente</Label>
            <Textarea rows={4} value={comentario} onChange={(e) => setComentario(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando || nota === null}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar NPS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}