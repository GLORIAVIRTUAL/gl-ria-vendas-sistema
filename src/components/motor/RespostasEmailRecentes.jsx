import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClassificacaoEmail from "@/components/emails/ClassificacaoEmail";

export default function RespostasEmailRecentes({ emails = [] }) {
  const classificados = emails.filter((email) => email.classificacao_email).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Respostas de e-mail classificadas pela IA</CardTitle>
        <p className="text-sm text-slate-400">Últimas respostas comerciais recebidas e a ação recomendada.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {classificados.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma resposta de e-mail classificada ainda.</p>
        ) : (
          classificados.map((email) => (
            <div key={email.id} className="rounded-lg border border-slate-500/30 bg-slate-950/40 p-3 space-y-2">
              <p className="text-sm font-semibold text-cyan-100">{email.subject}</p>
              <p className="text-xs text-slate-400">{email.from}</p>
              <ClassificacaoEmail email={email} mostrarAcao />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}