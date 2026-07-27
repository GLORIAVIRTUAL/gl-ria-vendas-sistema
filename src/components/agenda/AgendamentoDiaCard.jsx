import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Video } from "lucide-react";

export default function AgendamentoDiaCard({ agendamento }) {
  return (
    <Card className="border-violet-400/30 bg-violet-950/20" style={{ borderLeft: "4px solid rgb(167 139 250)" }}>
      <CardContent className="p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h3 className="text-xl font-bold text-violet-100">{agendamento.nome_cliente}</h3>
            <p className="mt-1 text-sm text-slate-300">{agendamento.email_cliente}</p>
            <div className="mt-3 flex items-center gap-2 text-violet-200">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">{agendamento.horario}</span>
            </div>
          </div>
          <Badge className="border-violet-400/40 bg-violet-400/15 text-violet-100">
            <Video className="mr-1 h-3 w-3" /> Reunião
          </Badge>
        </div>
        {agendamento.produto && <p className="mt-3 text-sm text-slate-300">{agendamento.produto.replace(/_/g, " ")}</p>}
      </CardContent>
    </Card>
  );
}