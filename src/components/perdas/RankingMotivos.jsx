import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { rotuloMotivo } from "./MotivoPerdaLinha";

export default function RankingMotivos({ leadsPerdidos }) {
  const contagem = {};
  let valorTotal = 0;

  leadsPerdidos.forEach((l) => {
    const chave = l.motivo_perda || "Nao_Informado";
    if (!contagem[chave]) contagem[chave] = { total: 0, valor: 0 };
    contagem[chave].total += 1;
    contagem[chave].valor += l.valor_estimado || 0;
    valorTotal += l.valor_estimado || 0;
  });

  const linhas = Object.entries(contagem).sort((a, b) => b[1].total - a[1].total);
  const maior = linhas[0]?.[1].total || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motivos de perda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {linhas.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum lead perdido no período.</p>
        ) : (
          linhas.map(([chave, dados]) => (
            <div key={chave} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-200">{chave === "Nao_Informado" ? "Não informado" : rotuloMotivo(chave)}</span>
                <span className="text-slate-400">
                  {dados.total} lead(s) · R$ {dados.valor.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${(dados.total / maior) * 100}%` }} />
              </div>
            </div>
          ))
        )}
        {linhas.length > 0 && (
          <p className="border-t border-slate-700/60 pt-3 text-sm text-slate-400">
            Valor total perdido: <span className="font-semibold text-cyan-100">R$ {valorTotal.toLocaleString("pt-BR")}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}