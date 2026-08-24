import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function MetaFormDialog({ open, onOpenChange, mes, meta, onSave, salvando }) {
  const [form, setForm] = useState({ meta_faturamento: "", meta_negocios: "", meta_reunioes: "" });

  useEffect(() => {
    setForm({
      meta_faturamento: meta?.meta_faturamento ?? "",
      meta_negocios: meta?.meta_negocios ?? "",
      meta_reunioes: meta?.meta_reunioes ?? ""
    });
  }, [meta, open]);

  const salvar = () => {
    onSave({
      mes,
      meta_faturamento: Number(form.meta_faturamento) || 0,
      meta_negocios: Number(form.meta_negocios) || 0,
      meta_reunioes: Number(form.meta_reunioes) || 0
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Definir metas de {mes}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-cyan-100">Meta de faturamento (R$)</Label>
            <Input
              type="number"
              value={form.meta_faturamento}
              onChange={(e) => setForm({ ...form, meta_faturamento: e.target.value })}
              placeholder="50000"
            />
          </div>
          <div>
            <Label className="text-cyan-100">Meta de negócios fechados</Label>
            <Input
              type="number"
              value={form.meta_negocios}
              onChange={(e) => setForm({ ...form, meta_negocios: e.target.value })}
              placeholder="10"
            />
          </div>
          <div>
            <Label className="text-cyan-100">Meta de reuniões realizadas</Label>
            <Input
              type="number"
              value={form.meta_reunioes}
              onChange={(e) => setForm({ ...form, meta_reunioes: e.target.value })}
              placeholder="30"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar metas"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}