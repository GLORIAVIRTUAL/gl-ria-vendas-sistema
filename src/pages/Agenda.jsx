import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import NovoCompromissoDialog from "../components/agenda/NovoCompromissoDialog";
import EditCompromissoDialog from "../components/agenda/EditCompromissoDialog";
import CompromissoCard from "../components/agenda/CompromissoCard";
import DiaFullscreenDialog from "../components/agenda/DiaFullscreenDialog";

const prioridadeCor = {
  Baixa: "bg-blue-100 text-blue-700 border-blue-200",
  Media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Alta: "bg-red-100 text-red-700 border-red-200"
};

export default function Agenda() {
  const queryClient = useQueryClient();
  const [semanaInicio, setSemanaInicio] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [dialogNovoAberto, setDialogNovoAberto] = useState(false);
  const [compromissoParaEditar, setCompromissoParaEditar] = useState(null);
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [diaFullscreenAberto, setDiaFullscreenAberto] = useState(false);
  const [diaFullscreenData, setDiaFullscreenData] = useState(null);

  const { data: compromissos = [], isLoading } = useQuery({
    queryKey: ['compromissos'],
    queryFn: () => base44.entities.Compromisso.list('-data', 200),
    initialData: [],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const compromissoCriado = await base44.entities.Compromisso.create(data);
      
      // Se for recorrente, cria os próximos 8 compromissos
      if (data.recorrente && data.tipo_recorrencia !== 'Nenhuma') {
        const compromissosRecorrentes = [];
        
        for (let i = 1; i <= 8; i++) {
          const dataOriginal = parseISO(data.data);
          let novaData;
          
          if (data.tipo_recorrencia === 'Semanal') {
            novaData = addDays(dataOriginal, 7 * i);
          } else if (data.tipo_recorrencia === 'Mensal') {
            const mesOriginal = dataOriginal.getMonth();
            const diaOriginal = dataOriginal.getDate();
            novaData = new Date(dataOriginal);
            novaData.setMonth(mesOriginal + i);
            
            // Se o dia não existe no mês (ex: 31 de fevereiro), usa o último dia do mês
            if (novaData.getDate() !== diaOriginal) {
              novaData.setDate(0); // Volta para o último dia do mês anterior
            }
          }
          
          compromissosRecorrentes.push({
            ...data,
            data: format(novaData, 'yyyy-MM-dd'),
            compromisso_pai_id: compromissoCriado.id,
            notificacao_enviada: false
          });
        }
        
        // Cria todos os compromissos recorrentes
        await Promise.all(
          compromissosRecorrentes.map(comp => 
            base44.entities.Compromisso.create(comp)
          )
        );
      }
      
      return compromissoCriado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      setDialogNovoAberto(false);
      setDataSelecionada(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Compromisso.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      setDialogEditarAberto(false);
      setCompromissoParaEditar(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Compromisso.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
    },
  });

  const diasDaSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(semanaInicio, i));
  }, [semanaInicio]);

  const compromissosPorDia = useMemo(() => {
    const agrupados = {};
    
    diasDaSemana.forEach(dia => {
      const dataStr = format(dia, 'yyyy-MM-dd');
      agrupados[dataStr] = compromissos
        .filter(c => c.data === dataStr)
        .sort((a, b) => a.horario.localeCompare(b.horario));
    });
    
    return agrupados;
  }, [diasDaSemana, compromissos]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const compromisso = compromissos.find(c => c.id === draggableId);
    if (!compromisso) return;

    updateMutation.mutate({
      id: compromisso.id,
      data: {
        ...compromisso,
        data: destination.droppableId
      }
    });
  };

  const handleMarcarConcluido = (compromisso) => {
    updateMutation.mutate({
      id: compromisso.id,
      data: {
        ...compromisso,
        status: compromisso.status === 'Concluido' ? 'Pendente' : 'Concluido'
      }
    });
  };

  const handleExcluir = (id) => {
    if (confirm('Tem certeza que deseja excluir este compromisso?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditar = (compromisso) => {
    setCompromissoParaEditar(compromisso);
    setDialogEditarAberto(true);
  };

  const handleNovoCompromisso = (data) => {
    createMutation.mutate(data);
  };

  const handleAtualizarCompromisso = (data) => {
    if (compromissoParaEditar) {
      updateMutation.mutate({ id: compromissoParaEditar.id, data });
    }
  };

  const handleAbrirDiaFullscreen = (dataStr) => {
    setDiaFullscreenData(dataStr);
    setDiaFullscreenAberto(true);
  };

  const handleAdicionarCompromisso = (dataStr) => {
    setDataSelecionada(dataStr);
    setDialogNovoAberto(true);
  };

  const totalCompromissos = compromissos.length;
  const compromissosPendentes = compromissos.filter(c => c.status === 'Pendente').length;
  const compromissosConcluidos = compromissos.filter(c => c.status === 'Concluido').length;

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-white drop-shadow-[0_0_18px_rgba(34,211,238,0.28)] md:text-4xl">
              <CalendarIcon className="h-8 w-8 text-cyan-300 md:h-10 md:w-10" />
              Minha Agenda
            </h1>
            <p className="font-medium tracking-wide text-cyan-100/70">
              Organize seus compromissos por dia da semana
            </p>
          </div>
          <Button
            onClick={() => {
              setDataSelecionada(null);
              setDialogNovoAberto(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Compromisso
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-cyan-400/25 bg-cyan-400/5 p-6 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90 mb-1">Total de Compromissos</p>
            <p className="font-heading text-3xl font-bold text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.32)]">{totalCompromissos}</p>
          </Card>

          <Card className="border border-amber-400/25 bg-amber-400/5 p-6 text-amber-100 shadow-[0_0_28px_rgba(251,191,36,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90 mb-1">Pendentes</p>
            <p className="font-heading text-3xl font-bold text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.28)]">{compromissosPendentes}</p>
          </Card>

          <Card className="border border-emerald-400/25 bg-emerald-400/5 p-6 text-emerald-100 shadow-[0_0_28px_rgba(52,211,153,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <Check className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90 mb-1">Concluídos</p>
            <p className="font-heading text-3xl font-bold text-emerald-200 drop-shadow-[0_0_12px_rgba(52,211,153,0.28)]">{compromissosConcluidos}</p>
          </Card>
        </div>

        {/* Navegação de Semana */}
        <Card className="p-4 shadow-lg border-0">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemanaInicio(addDays(semanaInicio, -7))}
              aria-label="Voltar para a semana anterior"
            >
              Semana anterior
            </Button>
            
            <div className="text-center">
              <p className="font-heading text-lg font-bold tracking-tight text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.18)]">
                {format(diasDaSemana[0], "dd 'de' MMMM", { locale: ptBR })} - {format(diasDaSemana[6], "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSemanaInicio(startOfWeek(new Date(), { weekStartsOn: 0 }))}
                className="text-blue-600 hover:text-blue-700"
              >
                Ir para hoje
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemanaInicio(addDays(semanaInicio, 7))}
              aria-label="Avançar para a próxima semana"
            >
              Próxima semana
            </Button>
          </div>
        </Card>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {diasDaSemana.map((dia, index) => {
              const dataStr = format(dia, 'yyyy-MM-dd');
              const compromissosDoDia = compromissosPorDia[dataStr] || [];
              const isHoje = isSameDay(dia, new Date());
              
              return (
                <Droppable key={dataStr} droppableId={dataStr}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[600px] overflow-hidden border-slate-500/25 bg-slate-950/45 transition-all backdrop-blur-xl ${
                        snapshot.isDraggingOver ? 'ring-2 ring-cyan-400 bg-cyan-400/10' : ''
                      } ${isHoje ? 'ring-2 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.16)]' : ''}`}
                    >
                      <div 
                        className={`cursor-pointer border-b p-4 transition-colors ${isHoje ? 'border-cyan-400/30 bg-cyan-400/10' : 'border-slate-500/25 bg-white/[0.03] hover:bg-white/[0.06]'}`}
                        onClick={() => handleAbrirDiaFullscreen(dataStr)}
                      >
                        <p className={`font-heading text-xs font-semibold uppercase tracking-[0.12em] ${isHoje ? 'text-cyan-200' : 'text-slate-300'}`}>
                          {format(dia, 'EEEE', { locale: ptBR })}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`font-heading text-2xl font-bold ${isHoje ? 'text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'text-slate-100'}`}>
                            {format(dia, 'dd')}
                          </p>
                          <Badge className={isHoje ? 'border border-cyan-300/40 bg-cyan-950/80 text-cyan-100' : 'border border-slate-500/50 bg-slate-900/90 text-slate-100'}>
                            {compromissosDoDia.length}
                          </Badge>
                        </div>
                        {isHoje && (
                          <Badge className="mt-2 border border-cyan-300/25 bg-cyan-300/10 text-xs font-semibold tracking-wide text-cyan-200">
                            🔥 HOJE
                          </Badge>
                        )}
                      </div>

                      <div className="p-3 space-y-3 overflow-y-auto max-h-[500px]">
                        {compromissosDoDia.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-slate-400 text-sm mb-3">Sem compromissos</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDataSelecionada(dataStr);
                                setDialogNovoAberto(true);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        ) : (
                          <>
                            {compromissosDoDia.map((compromisso, idx) => (
                              <Draggable key={compromisso.id} draggableId={compromisso.id} index={idx}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <CompromissoCard
                                      compromisso={compromisso}
                                      isDragging={snapshot.isDragging}
                                      onMarcarConcluido={handleMarcarConcluido}
                                      onEditar={handleEditar}
                                      onExcluir={handleExcluir}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            
                            {/* Botão para adicionar mais compromissos */}
                            <div className="pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDataSelecionada(dataStr);
                                  setDialogNovoAberto(true);
                                }}
                                className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-dashed border-2"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Adicionar compromisso
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <NovoCompromissoDialog
        open={dialogNovoAberto}
        onOpenChange={setDialogNovoAberto}
        onSave={handleNovoCompromisso}
        isSaving={createMutation.isPending}
        dataInicial={dataSelecionada}
      />

      <EditCompromissoDialog
        compromisso={compromissoParaEditar}
        open={dialogEditarAberto}
        onOpenChange={setDialogEditarAberto}
        onSave={handleAtualizarCompromisso}
        isSaving={updateMutation.isPending}
      />

      <DiaFullscreenDialog
        open={diaFullscreenAberto}
        onOpenChange={setDiaFullscreenAberto}
        data={diaFullscreenData}
        compromissos={diaFullscreenData ? compromissosPorDia[diaFullscreenData] || [] : []}
        onMarcarConcluido={handleMarcarConcluido}
        onEditar={handleEditar}
        onExcluir={handleExcluir}
        onAdicionarCompromisso={handleAdicionarCompromisso}
      />
    </div>
  );
}