import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function WhatsAppProspectAction({ prospect, onSend, loading }) {
  const [message, setMessage] = useState(`Olá! Sou da Glória Virtual. Gostaria de apresentar como nossas soluções de inteligência artificial podem apoiar a ${prospect.nome_fantasia || prospect.razao_social}. Podemos conversar?`);
  const phone = prospect.whatsapp || prospect.telefone;
  return <details className="rounded-lg border border-green-400/30 bg-green-400/5 p-3">
    <summary className="cursor-pointer font-semibold text-green-200">Enviar WhatsApp</summary>
    <div className="mt-3 space-y-3">
      <p className="text-xs text-slate-400">Destino: {phone || "Sem telefone"}</p>
      <Textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} />
      <Button size="sm" disabled={!phone || !message.trim() || loading} onClick={() => onSend(message)}>
        {loading ? "Enviando..." : "Enviar WhatsApp"}
      </Button>
    </div>
  </details>;
}