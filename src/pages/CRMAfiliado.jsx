
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Users, DollarSign, Calendar, Package, ChevronRight } from "lucide-react";

import LeadCard from "../components/crm/LeadCard";
import NovoLeadDialog from "../components/crm/NovoLeadDialog";
import EditLeadDialog from "../components/crm/EditLeadDialog";

const estagios = [
  { id: "Reuniao_Marcada", nome: "Reunião Marcada", cor: "bg-blue-500", icone: Calendar },
  { id: "Em_Avaliacao", nome: "Em Avaliação", cor: "bg-yellow-500", icone: TrendingUp },
  { id: "Negocio_Fechado", nome: "Negócio Fechado", cor: "bg-green-500", icone: DollarSign },
  { id: "Implantacao", nome: "Implantação", cor: "bg-purple-500", icone: Package },
  { id: "Inicio_de_Uso", nome: "Início de Uso", cor: "bg-orange-500", icone: Users },
  { id: "Estavel", nome: "Estável", cor: "bg-emerald-500", icone: ChevronRight }
];

const produtoConfig = {
  Gloria_Atendente: { nome: "Glória Atendente", cor: "bg-blue-100 text-blue-700" },
  Gloria_Clinica: { nome: "Glória Clínica", cor: "bg-green-100 text-green-700" },
  Maquina_de_Videos: { nome: "Máquina de Vídeos", cor: "bg-purple-100 text-purple-700" },
  Gloria_Financas: { nome: "Glória Finanças", cor: "bg-orange-100 text-orange-700" },
  Avatar_ao_Vivo: { nome: "Avatar ao Vivo", cor: "bg-pink-100 text-pink-700" }
};

export default function CRMAfiliado() {
  const queryClient = useQueryClient();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [leadParaEditar, setLeadParaEditar] = useState(null);
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads-afiliado', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Lead.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-afiliado'] });
      setDialogEditarAberto(false);
      setLeadParaEditar(null);
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const leadId = result.draggableId;
    const novoEstagio = result.destination.droppableId;

    updateLeadMutation.mutate({
      id: leadId,
      data: { estagio: novoEstagio }
    });
  };

  const handleEditarLead = (data) => {
    if (leadParaEditar) {
      updateLeadMutation.mutate({
        id: leadParaEditar.id,
        data
      });
    }
  };

  const leadsPorEstagio = (estagioId) => {
    return leads.filter(lead => lead.estagio === estagioId);
  };

  const totalValorPorEstagio = (estagioId) => {
    return leadsPorEstagio(estagioId).reduce((acc, lead) => acc + (lead.valor_estimado || 0), 0);
  };

  const totalLeads = leads.length;
  const totalValor = leads.reduce((acc, lead) => acc + (lead.valor_estimado || 0), 0);
  const taxaConversao = totalLeads > 0 
    ? ((leads.filter(l => l.estagio === "Negocio_Fechado" || l.estagio === "Implantacao" || l.estagio === "Inicio_de_Uso" || l.estagio === "Estavel").length / totalLeads) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-4 md:p-8 min-h-screen overflow-x-auto">
      <div className="min-w-max space-y-6 pb-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              🎯 Meu CRM - Funil de Vendas
            </h1>
            <p className="text-slate-600">
              Gerencie seus leads e acompanhe o progresso
            </p>
          </div>
          <Button 
            onClick={() => setDialogAberto(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Lead
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Meus Leads</p>
                  <p className="text-3xl font-bold text-slate-900">{totalLeads}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Valor Pipeline</p>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Taxa de Conversão</p>
                  <p className="text-3xl font-bold text-purple-600">{taxaConversao}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Kanban */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            {estagios.map((estagio) => {
              const Icon = estagio.icone;
              const leadsDoEstagio = leadsPorEstagio(estagio.id);
              const valorTotal = totalValorPorEstagio(estagio.id);

              return (
                <Droppable key={estagio.id} droppableId={estagio.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`w-80 flex-shrink-0 ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      } transition-colors duration-200`}
                    >
                      <Card className="h-full shadow-lg border-0">
                        <CardHeader className={`${estagio.cor} text-white rounded-t-lg`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="w-5 h-5" />
                              <CardTitle className="text-lg font-bold">
                                {estagio.nome}
                              </CardTitle>
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                              {leadsDoEstagio.length}
                            </Badge>
                          </div>
                          {valorTotal > 0 && (
                            <p className="text-sm opacity-90 mt-2">
                              R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 min-h-[500px] max-h-[600px] overflow-y-auto">
                          {leadsDoEstagio.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <LeadCard 
                                    lead={lead} 
                                    produtoConfig={produtoConfig}
                                    isDragging={snapshot.isDragging}
                                    onEdit={(lead) => {
                                      setLeadParaEditar(lead);
                                      setDialogEditarAberto(true);
                                    }}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {leadsDoEstagio.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                              <p className="text-sm">Nenhum lead neste estágio</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <NovoLeadDialog 
        open={dialogAberto}
        onOpenChange={setDialogAberto}
      />

      <EditLeadDialog
        lead={leadParaEditar}
        open={dialogEditarAberto}
        onOpenChange={setDialogEditarAberto}
        onSave={handleEditarLead}
        isSaving={updateLeadMutation.isPending}
      />
    </div>
  );
}
