import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const empty = {
  nome_cliente: '',
  telefone_cliente: '',
  empresa: '',
  cargo: '',
  observacoes: '',
  ativo: true,
};

export default function ClienteOpenClawDialog({ open, onOpenChange, onSave, cliente }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(cliente ? { ...empty, ...cliente } : empty);
  }, [cliente, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome_cliente || !form.telefone_cliente) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            {cliente ? 'Editar Cliente OpenClaw' : 'Novo Cliente OpenClaw'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome do cliente *</Label>
            <Input
              value={form.nome_cliente}
              onChange={(e) => setForm({ ...form, nome_cliente: e.target.value })}
              placeholder="Ex: João Silva"
            />
          </div>
          <div>
            <Label>Telefone do cliente *</Label>
            <Input
              value={form.telefone_cliente}
              onChange={(e) => setForm({ ...form, telefone_cliente: e.target.value })}
              placeholder="Ex: 5587999999999"
            />
            <p className="text-xs text-slate-400 mt-1">Com DDD e código do país (55)</p>
          </div>
          <div>
            <Label>Empresa</Label>
            <Input
              value={form.empresa}
              onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              placeholder="Ex: Acme Ltda"
            />
          </div>
          <div>
            <Label>Cargo</Label>
            <Input
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              placeholder="Ex: Diretor Comercial"
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Notas adicionais..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              {cliente ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}