import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Users, DollarSign, Phone, Mail, Calendar, Package, ChevronRight, FileText, Send, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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

export default function CRM() {
  const queryClient = useQueryClient();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [leadParaEditar, setLeadParaEditar] = useState(null);
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);
  
  const [dialogFormularioAberto, setDialogFormularioAberto] = useState(false);
  const [leadParaFormulario, setLeadParaFormulario] = useState(null);
  const [mensagemFormulario, setMensagemFormulario] = useState("");

  // Novos states para onboarding
  const [dialogOnboardingAberto, setDialogOnboardingAberto] = useState(false);
  const [onboardingSelecionado, setOnboardingSelecionado] = useState(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
    initialData: [],
  });

  const { data: onboardings = [] } = useQuery({
    queryKey: ['onboardings'],
    queryFn: () => base44.entities.OnboardingCliente.list(),
    initialData: [],
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setDialogEditarAberto(false);
      setLeadParaEditar(null);
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const sendFormularioMutation = useMutation({
    mutationFn: async ({ telefone, mensagem, lead_id }) => {
      const response = await base44.functions.invoke('whatsapp/sendMessage', {
        telefone,
        mensagem,
        agendamento_id: null
      });

      if (response.status !== 200) {
        throw new Error(response.data?.error || 'Erro ao enviar mensagem');
      }
      
      await base44.entities.Lead.update(lead_id, {
        status_onboarding: 'Aguardando_Cliente',
        proximos_passos: 'Aguardando preenchimento do formulário de onboarding pelo cliente'
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setDialogFormularioAberto(false);
      setLeadParaFormulario(null);
      toast.success("Formulário enviado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao enviar formulário:", error);
      toast.error(`Erro ao enviar: ${error.message}`);
    }
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

  const handleEnviarFormulario = (lead) => {
    setLeadParaFormulario(lead);
    
    const baseUrl = window.location.origin;
    const formLink = `${baseUrl}/api/functions/formularioOnboarding?email=${encodeURIComponent(lead.email_cliente)}&lead_id=${lead.id}`;
    
    const produtoNome = produtoConfig[lead.produto_interesse]?.nome || lead.produto_interesse;
    
    const mensagemPadrao = `Olá ${lead.nome_cliente}! 👋

Para darmos continuidade ao processo de ${produtoNome}, precisamos que você preencha o formulário de cadastro da sua empresa.

📋 *Formulário de Onboarding:*
${formLink}

São apenas alguns minutos e isso vai nos ajudar a personalizar ainda mais a solução para você! 🚀

Qualquer dúvida, estou à disposição!`;

    setMensagemFormulario(mensagemPadrao);
    setDialogFormularioAberto(true);
  };

  const handleEnviarWhatsAppFormulario = () => {
    if (leadParaFormulario && mensagemFormulario && leadParaFormulario.telefone_cliente) {
      sendFormularioMutation.mutate({
        telefone: leadParaFormulario.telefone_cliente,
        mensagem: mensagemFormulario,
        lead_id: leadParaFormulario.id
      });
    }
  };

  const handleVerOnboarding = (lead) => {
    // Busca o onboarding relacionado ao lead
    const onboarding = onboardings.find(o => o.lead_id === lead.id);
    if (onboarding) {
      setOnboardingSelecionado(onboarding);
      setDialogOnboardingAberto(true);
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
              CRM - Funil de Vendas
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
                  <p className="text-sm text-slate-600 mb-1">Total de Leads</p>
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
                  <p className="text-sm text-slate-600 mb-1">Valor Total Pipeline</p>
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
                      className={`w-96 flex-shrink-0 ${
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
                        <CardContent className="p-4 space-y-3 min-h-[700px] max-h-[85vh] overflow-y-auto">
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
                                    onEnviarFormulario={handleEnviarFormulario}
                                    onVerOnboarding={handleVerOnboarding}
                                    onDelete={(id) => deleteLeadMutation.mutate(id)}
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

      <Dialog open={dialogFormularioAberto} onOpenChange={setDialogFormularioAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Enviar Formulário de Onboarding
            </DialogTitle>
            <DialogDescription>
              {leadParaFormulario?.nome_cliente} - 📱 {leadParaFormulario?.telefone_cliente}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="mensagem-formulario">Mensagem</Label>
              <Textarea
                id="mensagem-formulario"
                rows={12}
                value={mensagemFormulario}
                onChange={(e) => setMensagemFormulario(e.target.value)}
                className="font-mono text-sm resize-y"
              />
            </div>
            <Button
              onClick={handleEnviarWhatsAppFormulario}
              disabled={!mensagemFormulario || !leadParaFormulario?.telefone_cliente || sendFormularioMutation.isPending}
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-base"
            >
              {sendFormularioMutation.isPending ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar Agora
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar onboarding */}
      <Dialog open={dialogOnboardingAberto} onOpenChange={setDialogOnboardingAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Dados do Onboarding
            </DialogTitle>
            <DialogDescription>
              Informações preenchidas pelo cliente
            </DialogDescription>
          </DialogHeader>
          {onboardingSelecionado && (
            <div className="space-y-6 py-4">
              {/* Dados Básicos */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 border-b pb-2">📋 Dados Básicos</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-slate-600">Nome da Empresa</Label>
                    <p className="font-medium">{onboardingSelecionado.nome_empresa}</p>
                  </div>
                  {onboardingSelecionado.cnpj && (
                    <div>
                      <Label className="text-sm text-slate-600">CNPJ</Label>
                      <p className="font-medium">{onboardingSelecionado.cnpj}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-slate-600">Email</Label>
                    <p className="font-medium">{onboardingSelecionado.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Telefone / WhatsApp</Label>
                    <p className="font-medium">{onboardingSelecionado.telefone_whatsapp}</p>
                  </div>
                </div>
              </div>

              {/* Atividades */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 border-b pb-2">💼 Atividades</h3>
                <div>
                  <Label className="text-sm text-slate-600">Ramos de Atividade</Label>
                  <p className="font-medium">{onboardingSelecionado.ramos_atividade}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Produtos/Serviços</Label>
                  <p className="font-medium">{onboardingSelecionado.produtos_servicos}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Horário de Funcionamento</Label>
                  <p className="font-medium">{onboardingSelecionado.horario_funcionamento}</p>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 border-b pb-2">📍 Endereço</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-slate-600">País</Label>
                    <p className="font-medium">{onboardingSelecionado.pais}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Estado</Label>
                    <p className="font-medium">{onboardingSelecionado.estado}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Cidade</Label>
                    <p className="font-medium">{onboardingSelecionado.cidade}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">CEP</Label>
                    <p className="font-medium">{onboardingSelecionado.cep}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Bairro</Label>
                    <p className="font-medium">{onboardingSelecionado.bairro}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Rua</Label>
                    <p className="font-medium">{onboardingSelecionado.rua}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Número</Label>
                    <p className="font-medium">{onboardingSelecionado.numero}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}