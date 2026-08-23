import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PassosEditor({ passos, onChange }) {
  const atualizar = (indice, campo, valor) => onChange(passos.map((passo, i) => i === indice ? { ...passo, [campo]: valor } : passo));
  const adicionar = () => onChange([...passos, { canal: "WhatsApp", dia_offset: passos.length === 0 ? 0 : passos.length * 2, assunto: "", mensagem: "", objetivo: "", usar_ia: false }]);
  const remover = (indice) => onChange(passos.filter((_, i) => i !== indice));

  return <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Label>Passos da cadência</Label>
      <Button type="button" variant="outline" size="sm" onClick={adicionar}>Adicionar passo</Button>
    </div>
    {passos.length === 0 && <p className="text-sm text-slate-400">Nenhum passo ainda. Adicione o primeiro contato da cadência.</p>}
    {passos.map((passo, indice) => <div key={indice} className="space-y-3 rounded-lg border border-slate-500/40 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs text-cyan-100">Canal</Label>
          <select value={passo.canal} onChange={(e) => atualizar(indice, "canal", e.target.value)} className="mt-1 h-9 rounded-md border border-cyan-400/40 bg-slate-950/60 px-3 text-sm text-slate-100">
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">E-mail</option>
          </select>
        </div>
        <div>
          <Label className="text-xs text-cyan-100">Dias após entrada</Label>
          <Input type="number" min="0" value={passo.dia_offset ?? 0} onChange={(e) => atualizar(indice, "dia_offset", Number(e.target.value))} className="mt-1 w-28" />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => remover(indice)}>Remover</Button>
      </div>
      {passo.canal === "Email" && <div>
        <Label className="text-xs text-cyan-100">Assunto</Label>
        <Input value={passo.assunto || ""} onChange={(e) => atualizar(indice, "assunto", e.target.value)} className="mt-1" />
      </div>}
      <div>
        <Label className="text-xs text-cyan-100">Mensagem</Label>
        <Textarea rows={4} value={passo.mensagem || ""} onChange={(e) => atualizar(indice, "mensagem", e.target.value)} className="mt-1" placeholder="Olá! Vi que a {{empresa}} atua em {{cidade}}..." />
        <p className="mt-1 text-xs text-slate-400">Variáveis: {"{{empresa}} {{cidade}} {{uf}} {{segmento}} {{atividade}} {{produto}}"}</p>
      </div>
      <div>
        <Label className="text-xs text-cyan-100">Objetivo deste passo (orienta a IA)</Label>
        <Input value={passo.objetivo || ""} onChange={(e) => atualizar(indice, "objetivo", e.target.value)} className="mt-1" placeholder="Ex: apresentar a Glória e propor uma conversa de 15 min" />
      </div>
      <label className="flex items-center gap-2 text-xs text-cyan-100">
        <input type="checkbox" checked={!!passo.usar_ia} onChange={(e) => atualizar(indice, "usar_ia", e.target.checked)} className="h-4 w-4 accent-cyan-400" />
        Personalizar com IA no momento do envio (usa o template como base)
      </label>
    </div>)}
  </div>;
}