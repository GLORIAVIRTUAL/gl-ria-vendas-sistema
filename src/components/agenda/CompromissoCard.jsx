import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Check, Pencil, Trash2, Bell } from "lucide-react";

const prioridadeCor = {
  Baixa: "bg-blue-100 text-blue-700 border-blue-200",
  Media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Alta: "bg-red-100 text-red-700 border-red-200"
};

export default function CompromissoCard({ compromisso, isDragging, onMarcarConcluido, onEditar, onExcluir }) {
  const isConcluido = compromisso.status === 'Concluido';

  return (
    <Card
      className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? 'shadow-2xl rotate-2 opacity-90 ring-2 ring-blue-500' : 'hover:shadow-lg'
      } ${isConcluido ? 'opacity-60' : ''}`}
      style={{ borderLeft: `4px solid ${compromisso.cor || '#3b82f6'}` }}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={`line-clamp-2 font-heading text-sm font-bold tracking-tight text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.16)] ${isConcluido ? 'line-through' : ''}`}>
              {compromisso.titulo}
            </h3>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMarcarConcluido(compromisso);
            }}
            className={`h-6 w-6 flex-shrink-0 ${
              isConcluido 
                ? 'text-green-600 hover:text-green-700' 
                : 'text-slate-400 hover:text-green-600'
            }`}
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <Clock className="w-3 h-3" />
          <span>{compromisso.horario}</span>
        </div>

        {compromisso.descricao && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-300/80">
            {compromisso.descricao}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`${prioridadeCor[compromisso.prioridade]} text-xs`}>
            {compromisso.prioridade}
          </Badge>
          
          {compromisso.recorrente && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
              🔄 {compromisso.tipo_recorrencia}
            </Badge>
          )}
          
          {compromisso.notificar_whatsapp && (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              <Bell className="w-3 h-3 mr-1" />
              WhatsApp
            </Badge>
          )}

          {isConcluido && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              ✓ Concluído
            </Badge>
          )}
        </div>

        <div className="flex gap-1 pt-2 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEditar(compromisso);
            }}
            className="flex-1 h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 min-w-0"
          >
            <Pencil className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">Editar</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onExcluir(compromisso.id);
            }}
            className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 min-w-0"
          >
            <Trash2 className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">Excluir</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}