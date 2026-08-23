import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const formatarData = (valor) =>
  valor
    ? new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : "—";

export default function ProspeccaoResumo({ logs = [] }) {
  const hoje = new Date().toDateString();
  const logsHoje = logs.filter(
    (log) => new Date(log.iniciado_em || log.created_date).toDateString() === hoje
  );

  const somar = (campo) => logsHoje.reduce((total, log) => total + (Number(log[campo]) || 0), 0);
  const ultimo = logs[0];

  const itens = [
    { label: "Empresas encontradas hoje", valor: somar("encontradas") },
    { label: "Empresas novas", valor: somar("novas") },
    { label: "Já existentes", valor: somar("existentes") },
    { label: "Erros", valor: somar("erros") },
  ];

  return (
    <Card className="border border-slate-500/40 bg-slate-950/60">
      <CardContent className="space-y-4 p-5">
        <h3 className="text-lg font-bold text-white">Prospecção automática</h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {itens.map((item) => (
            <div key={item.label} className="rounded-lg border border-cyan-400/30 bg-slate-950/60 p-3">
              <p className="text-2xl font-bold text-cyan-100">{item.valor}</p>
              <p className="text-xs font-semibold text-cyan-200/80">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <p>
            Último processamento:{" "}
            <span className="font-semibold text-cyan-100">
              {formatarData(ultimo?.finalizado_em || ultimo?.iniciado_em)}
            </span>
            {ultimo?.icp_nome ? ` — ${ultimo.icp_nome}` : ""}
          </p>
          <p>
            Status da última execução:{" "}
            <span className="font-semibold text-cyan-100">{ultimo?.status || "—"}</span>
          </p>
        </div>

        {ultimo?.erro_mensagem && (
          <p className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
            Último erro: {ultimo.erro_mensagem}
          </p>
        )}
      </CardContent>
    </Card>
  );
}