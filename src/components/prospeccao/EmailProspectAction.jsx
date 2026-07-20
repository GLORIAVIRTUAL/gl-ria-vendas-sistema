import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function EmailProspectAction({ prospect, onSend, loading }) {
  const company = prospect.nome_fantasia || prospect.razao_social;
  const [subject, setSubject] = useState(`Inteligência artificial para a ${company}`);
  const [body, setBody] = useState(`Olá, tudo bem?\n\nGostaria de apresentar como as soluções da Glória Virtual podem automatizar atendimento, vendas e processos da ${company}. Podemos marcar uma conversa?`);
  return <details className="rounded-lg border border-blue-400/30 bg-blue-400/5 p-3">
    <summary className="cursor-pointer font-semibold text-blue-200">Enviar e-mail</summary>
    <div className="mt-3 space-y-3">
      <p className="text-xs text-slate-400">Destino: {prospect.email || "Sem e-mail"}</p>
      <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Assunto" />
      <Textarea rows={5} value={body} onChange={(event) => setBody(event.target.value)} />
      <Button size="sm" disabled={!prospect.email || !subject.trim() || !body.trim() || loading} onClick={() => onSend(subject, body)}>
        {loading ? "Enviando..." : "Enviar e-mail"}
      </Button>
    </div>
  </details>;
}