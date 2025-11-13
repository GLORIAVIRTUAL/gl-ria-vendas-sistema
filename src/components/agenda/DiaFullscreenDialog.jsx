import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Check, Pencil, Trash2, Bell, Plus, Calendar } from "lucide-react";

const prioridadeCor = {
  Baixa: "bg-blue-100 text-blue-700 border-blue-200",
  Media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Alta: "bg-red-100 text-red-700 border-red-200"
};

export default function DiaFullscreenDialog({ open, onOpenChange, data, compromissos, onMarcarConcluido, onEditar, onExcluir, onAdicionarCompromisso }) {
  if (!data) return null;

  const diaSemana = format(parseISO(data), 'EEEE', { locale: ptBR });
  const diaFormatado = format(parseISO(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl font-bold text-slate-900 uppercase mb-1">
                {diaSemana}
              </DialogTitle>
              <p className="text-lg text-slate-600 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {diaFormatado}
              </p>
            </div>
            <Badge className="text-lg px-4 py-2">
              {compromissos.length} {compromissos.length === 1 ? 'compromisso' : 'compromissos'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {compromissos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-xl text-slate-400 mb-4">Nenhum compromisso neste dia</p>
              <Button
                onClick={() => {
                  onAdicionarCompromisso(data);
                  onOpenChange(false);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Compromisso
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => {
                    onAdicionarCompromisso(data);
                    onOpenChange(false);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Compromisso
                </Button>
              </div>

              <div className="grid gap-4">
                {compromissos.map(compromisso => {
                  const isConcluido = compromisso.status === 'Concluido';
                  
                  return (
                    <Card
                      key={compromisso.id}
                      className={`transition-all duration-200 hover:shadow-lg ${isConcluido ? 'opacity-60' : ''}`}
                      style={{ borderLeft: `4px solid ${compromisso.cor || '#3b82f6'}` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className={`text-2xl font-bold text-slate-900 mb-2 ${isConcluido ? 'line-through' : ''}`}>
                              {compromisso.titulo}
                            </h3>
                            <div className="flex items-center gap-3 text-slate-600 mb-3">
                              <Clock className="w-5 h-5" />
                              <span className="text-lg font-semibold">{compromisso.horario}</span>
                            </div>
                            {compromisso.descricao && (
                              <p className="text-slate-600 mt-2">{compromisso.descricao}</p>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onMarcarConcluido(compromisso)}
                            className={`h-10 w-10 ${
                              isConcluido 
                                ? 'text-green-600 hover:text-green-700' 
                                : 'text-slate-400 hover:text-green-600'
                            }`}
                          >
                            <Check className="w-6 h-6" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge className={`${prioridadeCor[compromisso.prioridade]}`}>
                            {compromisso.prioridade}
                          </Badge>
                          
                          {compromisso.recorrente && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                              🔄 {compromisso.tipo_recorrencia}
                            </Badge>
                          )}
                          
                          {compromisso.notificar_whatsapp && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <Bell className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Badge>
                          )}

                          {isConcluido && (
                            <Badge className="bg-green-100 text-green-700">
                              ✓ Concluído
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => {
                              onEditar(compromisso);
                              onOpenChange(false);
                            }}
                            className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              onExcluir(compromisso.id);
                              onOpenChange(false);
                            }}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}