import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, MessageSquare, HelpCircle, Award } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ObjecaoCard({ item }) {
  const { toast } = useToast();

  const copiar = () => {
    navigator.clipboard.writeText(item.resposta_sugerida || "");
    toast({ title: "Resposta copiada" });
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-cyan-100">{item.objecao}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">{item.categoria}</Badge>
              <span className="text-xs text-slate-500">{item.frequencia}x na base</span>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={copiar}>
            <Copy className="h-4 w-4" />
            Copiar
          </Button>
        </div>

        {item.resposta_sugerida && (
          <div className="rounded-lg border border-cyan-400/25 bg-slate-950/50 p-3">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-cyan-200">
              <MessageSquare className="h-3 w-3" /> Resposta sugerida
            </p>
            <p className="text-sm text-slate-300">{item.resposta_sugerida}</p>
          </div>
        )}

        {item.pergunta_de_virada && (
          <p className="flex items-start gap-2 text-sm text-slate-300">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            {item.pergunta_de_virada}
          </p>
        )}

        {item.prova_recomendada && (
          <p className="flex items-start gap-2 text-sm text-slate-400">
            <Award className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            {item.prova_recomendada}
          </p>
        )}
      </CardContent>
    </Card>
  );
}