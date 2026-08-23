import React from "react";

export default function ICPStats({ stats }) {
  const itens = [
    { label: "Prospects", valor: stats.prospects },
    { label: "Leads", valor: stats.leads },
    { label: "Reuniões", valor: stats.reunioes },
    { label: "Ganhos", valor: stats.ganhos },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {itens.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-cyan-400/30 bg-slate-950/60 px-2 py-2 text-center"
        >
          <p className="text-lg font-bold text-cyan-100">{item.valor}</p>
          <p className="text-[11px] font-semibold text-cyan-200/80">{item.label}</p>
        </div>
      ))}
    </div>
  );
}