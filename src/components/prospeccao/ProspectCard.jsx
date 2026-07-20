import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import WhatsAppProspectAction from "@/components/prospeccao/WhatsAppProspectAction";
import EmailProspectAction from "@/components/prospeccao/EmailProspectAction";
import ProspectDetails from "@/components/prospeccao/ProspectDetails";
import { formatCnpj } from "@/lib/prospectUtils";

const stages = [["Prospeccao", "Prospecção"], ["Reuniao_Marcada", "Reunião marcada"], ["Em_Avaliacao", "Em avaliação"], ["Negocio_Fechado", "Negócio fechado"], ["Implantacao", "Implantação"], ["Inicio_de_Uso", "Início de uso"], ["Estavel", "Estável"]];
export default function ProspectCard({ prospect, saved, onSave, onAddCRM, onWhatsApp, onEmail, busy }) {
  const [stage, setStage] = useState("Prospeccao");
  return <Card className="border-slate-500/40 bg-slate-950/55"><CardContent className="space-y-4 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div>
      <h3 className="text-xl font-bold text-cyan-100">{prospect.nome_fantasia || prospect.razao_social}</h3>
      <p className="text-sm text-slate-300">{prospect.razao_social}</p><p className="text-xs text-slate-400">CNPJ {formatCnpj(prospect.cnpj)}</p>
    </div><Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200">{prospect.situacao_cadastral || prospect.status}</Badge></div>
    <ProspectDetails prospect={prospect} />
    {prospect.site && <a href={prospect.site.startsWith("http") ? prospect.site : `https://${prospect.site}`} target="_blank" rel="noreferrer" className="text-sm text-cyan-300">Abrir site da empresa</a>}
    {!saved && <Button disabled={busy} onClick={onSave}>{busy ? "Salvando..." : "Salvar como prospect"}</Button>}
    {saved && !prospect.crm_lead_id && <div className="flex flex-wrap gap-2"><select value={stage} onChange={(event) => setStage(event.target.value)} className="h-9 rounded-md border border-input bg-slate-950/60 px-3 text-sm text-slate-100">{stages.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><Button disabled={busy || !(prospect.email || prospect.whatsapp || prospect.telefone)} onClick={() => onAddCRM(stage)}>Adicionar ao CRM</Button></div>}
    {saved && prospect.crm_lead_id && <Badge className="border-green-400/30 bg-green-400/10 text-green-200">Adicionado ao CRM</Badge>}
    {saved && <div className="grid gap-3 lg:grid-cols-2"><WhatsAppProspectAction prospect={prospect} onSend={onWhatsApp} loading={busy} /><EmailProspectAction prospect={prospect} onSend={onEmail} loading={busy} /></div>}
  </CardContent></Card>;
}