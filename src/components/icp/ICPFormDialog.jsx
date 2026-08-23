import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const vazio = {
  nome: "",
  descricao: "",
  ativo: true,
  segmento: "",
  subsegmentos: [],
  cnaes_desejados: [],
  cnaes_excluidos: [],
  estados: [],
  cidades: [],
  regioes: [],
  porte_minimo: "",
  porte_maximo: "",
  funcionarios_minimo: "",
  funcionarios_maximo: "",
  faturamento_minimo: "",
  matriz_filial: "Indiferente",
  exigir_telefone: false,
  exigir_email: false,
  exigir_site: false,
  exigir_whatsapp: false,
  palavras_chave: [],
  produtos_recomendados: [],
  peso_comercial: 50,
  limite_diario_empresas: 20,
  intervalo_execucao: "Manual",
  prospeccao_automatica_ativa: false,
  observacoes_ia: "",
};

const paraTexto = (lista) => (Array.isArray(lista) ? lista.join(", ") : "");
const paraLista = (texto) =>
  (texto || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const paraNumero = (valor) =>
  valor === "" || valor === null || valor === undefined ? undefined : Number(valor);

export default function ICPFormDialog({ open, onOpenChange, icp, onSave, isSaving }) {
  const [form, setForm] = useState(vazio);

  useEffect(() => {
    if (open) setForm(icp ? { ...vazio, ...icp } : vazio);
  }, [open, icp]);

  const set = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const listas = [
    ["subsegmentos", "Subsegmentos"],
    ["cnaes_desejados", "CNAEs desejados"],
    ["cnaes_excluidos", "CNAEs excluídos"],
    ["estados", "Estados (UF)"],
    ["cidades", "Cidades"],
    ["regioes", "Regiões"],
    ["palavras_chave", "Palavras-chave"],
    ["produtos_recomendados", "Produtos Glória recomendados"],
  ];

  const exigencias = [
    ["exigir_telefone", "Exigir telefone"],
    ["exigir_email", "Exigir e-mail"],
    ["exigir_site", "Exigir site"],
    ["exigir_whatsapp", "Exigir WhatsApp"],
  ];

  const handleSubmit = () => {
    onSave({
      ...form,
      funcionarios_minimo: paraNumero(form.funcionarios_minimo),
      funcionarios_maximo: paraNumero(form.funcionarios_maximo),
      faturamento_minimo: paraNumero(form.faturamento_minimo),
      peso_comercial: paraNumero(form.peso_comercial),
      limite_diario_empresas: paraNumero(form.limite_diario_empresas),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{icp ? "Editar ICP" : "Novo ICP"}</DialogTitle>
          <DialogDescription>
            Todos os critérios são editáveis e usados pela prospecção.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-2 block">Nome *</Label>
              <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Segmento</Label>
              <Input value={form.segmento} onChange={(e) => set("segmento", e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Descrição</Label>
            <Textarea
              rows={2}
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>

          {listas.map(([campo, label]) => (
            <div key={campo}>
              <Label className="mb-2 block">{label} (separados por vírgula)</Label>
              <Input
                value={paraTexto(form[campo])}
                onChange={(e) => set(campo, paraLista(e.target.value))}
              />
            </div>
          ))}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-2 block">Porte mínimo</Label>
              <Input
                value={form.porte_minimo}
                onChange={(e) => set("porte_minimo", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Porte máximo</Label>
              <Input
                value={form.porte_maximo}
                onChange={(e) => set("porte_maximo", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Funcionários (mínimo)</Label>
              <Input
                type="number"
                value={form.funcionarios_minimo ?? ""}
                onChange={(e) => set("funcionarios_minimo", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Funcionários (máximo)</Label>
              <Input
                type="number"
                value={form.funcionarios_maximo ?? ""}
                onChange={(e) => set("funcionarios_maximo", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Faturamento mínimo</Label>
              <Input
                type="number"
                value={form.faturamento_minimo ?? ""}
                onChange={(e) => set("faturamento_minimo", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Matriz / Filial</Label>
              <Select
                value={form.matriz_filial || "Indiferente"}
                onValueChange={(v) => set("matriz_filial", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indiferente">Indiferente</SelectItem>
                  <SelectItem value="Matriz">Matriz</SelectItem>
                  <SelectItem value="Filial">Filial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Peso comercial (0 a 100)</Label>
              <Input
                type="number"
                value={form.peso_comercial ?? ""}
                onChange={(e) => set("peso_comercial", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Máximo de empresas por dia</Label>
              <Input
                type="number"
                value={form.limite_diario_empresas ?? ""}
                onChange={(e) => set("limite_diario_empresas", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Intervalo de execução</Label>
              <Select
                value={form.intervalo_execucao || "Manual"}
                onValueChange={(v) => set("intervalo_execucao", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Diario">Diário</SelectItem>
                  <SelectItem value="2x_por_semana">2x por semana</SelectItem>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-slate-600/50 p-4 md:grid-cols-2">
            {exigencias.map(([campo, label]) => (
              <div key={campo} className="flex items-center justify-between gap-3">
                <Label className="text-sm">{label}</Label>
                <Switch
                  checked={!!form[campo]}
                  onCheckedChange={(v) => set(campo, v)}
                />
              </div>
            ))}
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm">ICP ativo</Label>
              <Switch checked={!!form.ativo} onCheckedChange={(v) => set("ativo", v)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm">Prospecção automática</Label>
              <Switch
                checked={!!form.prospeccao_automatica_ativa}
                onCheckedChange={(v) => set("prospeccao_automatica_ativa", v)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Observações para a IA</Label>
            <Textarea
              rows={3}
              value={form.observacoes_ia}
              onChange={(e) => set("observacoes_ia", e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!form.nome || isSaving}
            className="w-full"
          >
            {isSaving ? "Salvando..." : "Salvar ICP"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}