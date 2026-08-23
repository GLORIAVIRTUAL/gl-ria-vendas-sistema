import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function MotorStatCard({ label, valor, detalhe }) {
  return <Card className="border-slate-500/40 bg-slate-950/55"><CardContent className="p-5">
    <p className="text-sm text-slate-300">{label}</p>
    <p className="mt-1 text-3xl font-bold text-cyan-100">{valor}</p>
    {detalhe && <p className="mt-1 text-xs text-slate-400">{detalhe}</p>}
  </CardContent></Card>;
}