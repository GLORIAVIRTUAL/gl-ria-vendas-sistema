import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ICPStats from "./ICPStats";

export default function ICPCard({ icp, stats, onEdit, onDuplicate, onToggle, onSearch, isBusy, isSearching }) {
  return (
    <Card className="border border-slate-500/40 bg-slate-950/60">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-white">{icp.nome}</h3>
            <p className="mt-1 text-sm text-slate-400">{icp.segmento || "Segmento não definido"}</p>
          </div>
          <Badge
            className={
              icp.ativo
                ? "border border-cyan-400/40 bg-cyan-400/15 text-cyan-100"
                : "border border-slate-500/40 bg-slate-800/70 text-slate-300"
            }
          >
            {icp.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {icp.descricao && <p className="text-sm text-slate-400">{icp.descricao}</p>}

        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-md border border-slate-600/60 px-2 py-1">
            Peso comercial: {icp.peso_comercial ?? 0}
          </span>
          <span className="rounded-md border border-slate-600/60 px-2 py-1">
            Limite diário: {icp.limite_diario_empresas ?? 0}
          </span>
          <span className="rounded-md border border-slate-600/60 px-2 py-1">
            Execução: {icp.intervalo_execucao || "Manual"}
          </span>
          <span className="rounded-md border border-slate-600/60 px-2 py-1">
            Automática: {icp.prospeccao_automatica_ativa ? "Ativa" : "Inativa"}
          </span>
        </div>

        <ICPStats stats={stats} />

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(icp)}>
            Editar
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDuplicate(icp)} disabled={isBusy}>
            Duplicar
          </Button>
          <Button size="sm" variant="outline" onClick={() => onToggle(icp)} disabled={isBusy}>
            {icp.ativo ? "Desativar" : "Ativar"}
          </Button>
          <Button size="sm" onClick={() => onSearch(icp)} disabled={!icp.ativo || isSearching}>
            {isSearching ? "Buscando..." : "Buscar agora"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}