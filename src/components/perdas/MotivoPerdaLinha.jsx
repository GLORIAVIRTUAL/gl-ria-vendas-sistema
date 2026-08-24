import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const MOTIVOS_PERDA = [
  { valor: "Preco", label: "Preço" },
  { valor: "Sem_Budget", label: "Sem budget" },
  { valor: "Timing", label: "Timing" },
  { valor: "Escolheu_Concorrente", label: "Escolheu concorrente" },
  { valor: "Sem_Necessidade", label: "Sem necessidade" },
  { valor: "Sem_Resposta", label: "Sem resposta" },
  { valor: "Nao_Era_Decisor", label: "Não era decisor" },
  { valor: "Fora_do_ICP", label: "Fora do ICP" },
  { valor: "Outro", label: "Outro" }
];

export const rotuloMotivo = (valor) => MOTIVOS_PERDA.find((m) => m.valor === valor)?.label || "Não informado";

export default function MotivoPerdaLinha({ lead, onSalvar, salvando }) {
  const [motivo, setMotivo] = useState(lead.motivo_perda || "");
  const [detalhe, setDetalhe] = useState(lead.motivo_perda_detalhe || "");

  const alterado = motivo !== (lead.motivo_perda || "") || detalhe !== (lead.motivo_perda_detalhe || "");

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-cyan-100">{lead.nome_cliente}</p>
            <p className="text-sm text-slate-400">{lead.nome_empresa || lead.email_cliente || lead.telefone_cliente}</p>
          </div>
          <Badge variant={lead.motivo_perda ? "outline" : "destructive"}>
            {rotuloMotivo(lead.motivo_perda)}
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Select value={motivo} onValueChange={setMotivo}>
            <SelectTrigger><SelectValue placeholder="Motivo da perda" /></SelectTrigger>
            <SelectContent>
              {MOTIVOS_PERDA.map((m) => <SelectItem key={m.valor} value={m.valor}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input
            className="md:col-span-2"
            value={detalhe}
            onChange={(e) => setDetalhe(e.target.value)}
            placeholder="Detalhe da perda (opcional)"
          />
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!motivo || !alterado || salvando}
            onClick={() => onSalvar(lead, { motivo_perda: motivo, motivo_perda_detalhe: detalhe })}
          >
            Registrar motivo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}