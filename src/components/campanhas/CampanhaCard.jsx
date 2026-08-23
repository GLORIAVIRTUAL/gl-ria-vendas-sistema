import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const stat = (label, valor) => <div key={label} className="rounded-lg border border-slate-500/40 bg-slate-950/60 p-3 text-center">
  <p className="text-xl font-bold text-cyan-100">{valor}</p>
  <p className="text-xs text-slate-400">{label}</p>
</div>;

export default function CampanhaCard({ campanha, icpNome, envios, busy, onEdit, onToggle, onProcessar }) {
  const programados = envios.filter((envio) => envio.status === "programado").length;
  const enviados = envios.filter((envio) => envio.status === "enviado").length;
  const erros = envios.filter((envio) => envio.status === "erro").length;
  const prospects = new Set(envios.map((envio) => envio.prospect_id)).size;

  return <Card className="border-slate-500/40 bg-slate-950/55"><CardContent className="space-y-4 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-xl font-bold text-cyan-100">{campanha.nome}</h3>
        <p className="text-sm text-slate-300">{icpNome ? `ICP: ${icpNome}` : "Todos os ICPs"}</p>
        {campanha.descricao && <p className="mt-1 text-sm text-slate-400">{campanha.descricao}</p>}
      </div>
      <Badge className={campanha.ativa ? "border-green-400/40 bg-green-400/10 text-green-200" : "border-slate-400/40 bg-slate-400/10 text-slate-300"}>
        {campanha.ativa ? "Cadência ativa" : "Pausada"}
      </Badge>
    </div>

    <div className="flex flex-wrap gap-2 text-xs">
      <Badge variant="outline">Score mínimo: {campanha.score_minimo ?? 60}</Badge>
      <Badge variant="outline">Passos: {(campanha.passos || []).length}</Badge>
      <Badge variant="outline">Entradas/execução: {campanha.limite_diario_entradas ?? 20}</Badge>
      <Badge variant="outline">Envios/execução: {campanha.limite_diario_envios ?? 30}</Badge>
    </div>

    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {stat("Prospects", prospects)}
      {stat("Programados", programados)}
      {stat("Enviados", enviados)}
      {stat("Erros", erros)}
    </div>

    <p className="text-xs text-slate-400">Última execução: {campanha.ultima_execucao ? new Date(campanha.ultima_execucao).toLocaleString("pt-BR") : "—"}</p>

    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={onEdit}>Editar</Button>
      <Button variant="outline" onClick={onToggle}>{campanha.ativa ? "Pausar" : "Ativar"}</Button>
      <Button disabled={busy} onClick={onProcessar}>{busy ? "Processando..." : "Processar agora"}</Button>
    </div>
  </CardContent></Card>;
}