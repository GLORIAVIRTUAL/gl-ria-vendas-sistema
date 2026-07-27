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
import { Clock, Pencil, Trash2, Bell, Plus, Calendar } from "lucide-react";
import AgendamentoDiaCard from "@/components/agenda/AgendamentoDiaCard";

const prioridadeCor = {
  Baixa: "border-cyan-400/40 bg-cyan-400/15 text-cyan-200",
  Media: "border-amber-400/40 bg-amber-400/15 text-amber-200",
  Alta: "border-red-400/40 bg-red-400/15 text-red-200"
};

export default function DiaFullscreenDialog({ open, onOpenChange, data, compromissos, agendamentos = [], onMarcarConcluido, onEditar, onExcluir, onAdicionarCompromisso }) {
  if (!data) return null;

  const totalAtividades = compromissos.length + agendamentos.length;
  const diaSemana = format(parseISO(data), 'EEEE', { locale: ptBR });
  const diaFormatado = format(parseISO(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-600 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="mb-1 text-3xl font-bold uppercase text-cyan-100">
                {diaSemana}
              </DialogTitle>
              <p className="flex items-center gap-2 text-lg text-slate-300">
                <Calendar className="w-5 h-5" />
                {diaFormatado}
              </p>
            </div>
            <Badge className="text-lg px-4 py-2">
              {totalAtividades} {totalAtividades === 1 ? 'atividade' : 'atividades'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {totalAtividades === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-400" />
              </div>
              <p className="mb-4 text-xl text-slate-300">Nenhum compromisso neste dia</p>
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
                      className={`border-slate-600 bg-slate-950/55 transition-all duration-200 hover:border-cyan-400/40 hover:shadow-lg ${isConcluido ? 'border-green-400/30' : ''}`}
                      style={{ borderLeft: `4px solid ${compromisso.cor || '#3b82f6'}` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className={`mb-2 text-2xl font-bold text-cyan-100 ${isConcluido ? 'line-through text-slate-300' : ''}`}>
                              {compromisso.titulo}
                            </h3>
                            <div className="mb-3 flex items-center gap-3 text-cyan-200">
                              <Clock className="w-5 h-5" />
                              <span className="text-lg font-semibold">{compromisso.horario}</span>
                            </div>
                            {compromisso.descricao && (
                              <p className="mt-2 text-slate-300">{compromisso.descricao}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onMarcarConcluido(compromisso)}
                            className={`font-bold ${
                              isConcluido
                                ? 'border-green-400/50 bg-green-400/15 text-green-300 hover:bg-green-400/25 hover:text-green-200'
                                : 'border-cyan-400/50 bg-cyan-400/15 text-cyan-200 hover:bg-cyan-400/25 hover:text-cyan-100'
                            }`}
                          >
                            {isConcluido ? 'Reabrir' : 'Concluir'}
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge className={`${prioridadeCor[compromisso.prioridade]}`}>
                            {compromisso.prioridade}
                          </Badge>
                          
                          {compromisso.recorrente && (
                            <Badge className="border-purple-400/40 bg-purple-400/15 text-purple-200">
                              🔄 {compromisso.tipo_recorrencia}
                            </Badge>
                          )}
                          
                          {compromisso.notificar_whatsapp && (
                            <Badge className="border-green-400/40 bg-green-400/15 text-green-200">
                              <Bell className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Badge>
                          )}

                          {isConcluido && (
                            <Badge className="border-green-400/40 bg-green-400/15 text-green-200">
                              ✓ Concluído
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2 border-t border-slate-600 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              onEditar(compromisso);
                              onOpenChange(false);
                            }}
                            className="flex-1 border-cyan-400/50 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20 hover:text-cyan-100"
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
                            className="flex-1 border-red-400/50 bg-red-400/10 text-red-300 hover:bg-red-400/20 hover:text-red-200"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {agendamentos.map((agendamento) => (
                  <AgendamentoDiaCard key={agendamento.id} agendamento={agendamento} />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}