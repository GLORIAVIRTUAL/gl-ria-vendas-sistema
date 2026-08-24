import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";

export default function ConhecimentoCard({ item, onEditar, onExcluir, onToggle }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-cyan-100">{item.titulo}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">{item.categoria}</Badge>
              {item.ativo === false && <Badge variant="destructive">Inativo</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={item.ativo !== false} onCheckedChange={(v) => onToggle(item, v)} />
            <Button size="icon" variant="outline" onClick={() => onEditar(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => onExcluir(item)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm text-slate-300">{item.conteudo}</p>

        {(item.palavras_chave || []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.palavras_chave.map((p) => (
              <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}