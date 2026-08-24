import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIAS = ["Produto", "Preco", "Diferencial", "FAQ", "Politica", "Processo"];

const VAZIO = { titulo: "", categoria: "Produto", conteudo: "", palavras_chave: "", ordem: 0, ativo: true };

export default function ConhecimentoFormDialog({ open, onOpenChange, item, onSalvar, salvando }) {
  const [form, setForm] = useState(VAZIO);

  useEffect(() => {
    if (item) {
      setForm({
        titulo: item.titulo || "",
        categoria: item.categoria || "Produto",
        conteudo: item.conteudo || "",
        palavras_chave: (item.palavras_chave || []).join(", "),
        ordem: item.ordem || 0,
        ativo: item.ativo !== false
      });
    } else {
      setForm(VAZIO);
    }
  }, [item, open]);

  const submit = () => {
    onSalvar({
      titulo: form.titulo,
      categoria: form.categoria,
      conteudo: form.conteudo,
      palavras_chave: form.palavras_chave.split(",").map((p) => p.trim()).filter(Boolean),
      ordem: Number(form.ordem) || 0,
      ativo: form.ativo
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar conhecimento" : "Novo conhecimento"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-cyan-100">Título</Label>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Atendimento IA 24/7 - o que é" />
          </div>

          <div>
            <Label className="text-cyan-100">Categoria</Label>
            <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-cyan-100">Conteúdo</Label>
            <Textarea
              rows={8}
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              placeholder="Informação que a IA pode usar nas respostas"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-cyan-100">Palavras-chave</Label>
              <Input value={form.palavras_chave} onChange={(e) => setForm({ ...form, palavras_chave: e.target.value })} placeholder="preço, plano" />
            </div>
            <div>
              <Label className="text-cyan-100">Ordem</Label>
              <Input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: e.target.value })} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={salvando || !form.titulo || !form.conteudo}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}