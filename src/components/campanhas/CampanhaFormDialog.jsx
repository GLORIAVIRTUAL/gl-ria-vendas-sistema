import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PassosEditor from "@/components/campanhas/PassosEditor";

const vazio = { nome: "", descricao: "", icp_id: "", score_minimo: 60, limite_diario_entradas: 20, limite_diario_envios: 30, ativa: false, passos: [] };

export default function CampanhaFormDialog({ open, campanha, icps, saving, onClose, onSave }) {
  const [form, setForm] = useState(vazio);

  useEffect(() => {
    if (open) setForm(campanha ? { ...vazio, ...campanha, passos: campanha.passos || [] } : vazio);
  }, [open, campanha]);

  const set = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  return <Dialog open={open} onOpenChange={(aberto) => !aberto && onClose()}>
    <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>{campanha ? "Editar campanha" : "Nova campanha"}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div>
          <Label className="text-cyan-100">Nome</Label>
          <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-cyan-100">Objetivo</Label>
          <Textarea rows={2} value={form.descricao || ""} onChange={(e) => set("descricao", e.target.value)} className="mt-1" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-cyan-100">ICP alvo</Label>
            <select value={form.icp_id || ""} onChange={(e) => set("icp_id", e.target.value)} className="mt-1 h-9 w-full rounded-md border border-cyan-400/40 bg-slate-950/60 px-3 text-sm text-slate-100">
              <option value="">Todos os ICPs</option>
              {icps.map((icp) => <option key={icp.id} value={icp.id}>{icp.nome}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-cyan-100">Score mínimo</Label>
            <Input type="number" min="0" max="100" value={form.score_minimo} onChange={(e) => set("score_minimo", Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label className="text-cyan-100">Entradas por execução</Label>
            <Input type="number" min="1" value={form.limite_diario_entradas} onChange={(e) => set("limite_diario_entradas", Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label className="text-cyan-100">Envios por execução</Label>
            <Input type="number" min="1" value={form.limite_diario_envios} onChange={(e) => set("limite_diario_envios", Number(e.target.value))} className="mt-1" />
          </div>
        </div>
        <PassosEditor passos={form.passos} onChange={(passos) => set("passos", passos)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button disabled={saving || !form.nome} onClick={() => onSave(form)}>{saving ? "Salvando..." : "Salvar campanha"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}