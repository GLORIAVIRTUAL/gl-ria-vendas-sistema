import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, MessageSquare, Mail, Phone, CalendarClock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TemperaturaBadge } from "@/components/crm/ProximaAcaoLead";

const canalIcone = { WhatsApp: MessageSquare, Email: Mail, Ligacao: Phone, Reuniao: CalendarClock, Interno: Check };

export default function TarefaDiaCard({ lead, atrasada, onConcluir, concluindo }) {
  const CanalIcone = canalIcone[lead.proxima_acao_canal] || Check;
  const telefone = (lead.telefone_cliente || "").replace(/\D/g, "");

  return (
    <Card className={atrasada ? "border-red-400/40" : ""}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-cyan-100">{lead.nome_cliente}</h3>
            {lead.nome_empresa && (
              <p className="flex items-center gap-1 text-sm text-slate-300">
                <Building2 className="h-3 w-3" />
                {lead.nome_empresa}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TemperaturaBadge temperatura={lead.temperatura} score={lead.temperatura_score} />
            <Badge className="border border-slate-500/40 bg-slate-950/40 text-xs text-slate-200">
              {lead.estagio?.replace(/_/g, " ")}
            </Badge>
            {lead.proxima_acao_prazo && (
              <Badge className={`text-xs ${atrasada ? "border border-red-400/40 bg-red-400/15 text-red-200" : "border border-slate-500/40 bg-slate-950/40 text-slate-200"}`}>
                {atrasada ? "Atrasada • " : ""}
                {format(parseISO(lead.proxima_acao_prazo), "dd/MM", { locale: ptBR })}
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-cyan-200">
            <CanalIcone className="h-3 w-3" />
            {lead.proxima_acao_canal || "Ação"}
          </p>
          <p className="text-sm text-cyan-50">{lead.proxima_melhor_acao}</p>
          {lead.proxima_acao_motivo && (
            <p className="mt-1 text-xs text-slate-400">{lead.proxima_acao_motivo}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {telefone && (
            <a href={`https://wa.me/${telefone}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </a>
          )}
          {lead.email_cliente && (
            <a href={`mailto:${lead.email_cliente}`}>
              <Button size="sm" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                E-mail
              </Button>
            </a>
          )}
          <Button size="sm" onClick={() => onConcluir(lead.id)} disabled={concluindo}>
            <Check className="mr-2 h-4 w-4" />
            Concluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}