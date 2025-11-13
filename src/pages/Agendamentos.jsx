import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, Trash2, CheckCircle, XCircle, Clock, Send, AlertCircle, RefreshCw, Video } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const produtoConfig = {
  Atendimento_IA_24_7: { nome: "Atendimento IA 24/7", corBadge: "bg-blue-100 text-blue-700 border-blue-200" },
  Maquina_de_Videos: { nome: "Máquina de Vídeos", corBadge: "bg-purple-100 text-purple-700 border-purple-200" },
  Gloria_Clinica: { nome: "Glória Clínica", corBadge: "bg-green-100 text-green-700 border-green-200" },
  Gloria_Vendas: { nome: "Glória Vendas", corBadge: "bg-orange-100 text-orange-700 border-orange-200" },
  Especialistas_Virtuais: { nome: "Especialistas Virtuais", corBadge: "bg-pink-100 text-pink-700 border-pink-200" },
  Sites_em_24_Horas: { nome: "Sites em 24 Horas", corBadge: "bg-cyan-100 text-cyan-700 border-cyan-200" }
};

const statusConfig = {
  Agendada: { cor: "bg-blue-100 text-blue-700", icon: Clock },
  Confirmada: { cor: "bg-green-100 text-green-700", icon: CheckCircle },
  Concluída: { cor: "bg-slate-100 text-slate-700", icon: CheckCircle },
  Cancelada: { cor: "bg-red-100 text-red-700", icon: XCircle }
};

export default function Agendamentos() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [dialogStatusAberto, setDialogStatusAberto] = useState(false);
  const [dialogWhatsAppAberto, setDialogWhatsAppAberto] = useState(false);
  const [agendamentoParaWhatsApp, setAgendamentoParaWhatsApp] = useState(null);
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("");
  const [erro, setErro] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [recreatingLink, setRecreatingLink] = useState(null);
  const [movingToEvaluation, setMovingToEvaluation] = useState(null);

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const lista = await base44.entities.Agendamento.list();
      return lista.sort((a, b) => {
        const dataHoraA = new Date(`${a.data}T${a.horario}`);
        const dataHoraB = new Date(`${b.data}T${b.horario}`);
        return dataHoraA.getTime() - dataHoraB.getTime();
      });
    },
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Agendamento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Agendamento.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setAgendamentoSelecionado(null);
      setNovoStatus("");
      setDialogStatusAberto(false);
    },
  });

  const sendWhatsAppMutation = useMutation({
    mutationFn: async ({ telefone, mensagem, agendamento_id }) => {
      console.log('📤 Enviando WhatsApp:', { telefone, agendamento_id });
      const response = await base44.functions.invoke('whatsapp/sendMessage', {
        telefone,
        mensagem,
        agendamento_id
      });
      console.log('✅ Resposta:', response);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ WhatsApp enviado com sucesso!', data);
      setDialogWhatsAppAberto(false);
      setAgendamentoParaWhatsApp(null);
      setMensagemWhatsApp("");
      setErro(null);
    },
    onError: (error) => {
      console.error('❌ Erro ao enviar WhatsApp:', error);
      setErro(`Erro ao enviar WhatsApp: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  });

  // Mutation para recriar link
  const recreateLinkMutation = useMutation({
    mutationFn: async (agendamento) => {
      setRecreatingLink(agendamento.id);
      
      const produtoNomes = {
        Atendimento_IA_24_7: 'Atendimento IA 24/7',
        Maquina_de_Videos: 'Máquina de Vídeos',
        Gloria_Clinica: 'Glória Clínica',
        Gloria_Vendas: 'Glória Vendas',
        Especialistas_Virtuais: 'Especialistas Virtuais',
        Sites_em_24_Horas: 'Sites em 24 Horas'
      };

      const startDateTime = `${agendamento.data}T${agendamento.horario}:00`;
      const [horaStr, minutoStr] = agendamento.horario.split(':');
      const hora = parseInt(horaStr, 10);
      const endHora = String(hora + 1).padStart(2, '0');
      const endDateTime = `${agendamento.data}T${endHora}:${minutoStr}:00`;

      const response = await base44.functions.invoke('createGoogleCalendarEvent', {
        summary: `Reunião - ${produtoNomes[agendamento.produto] || agendamento.produto} - ${agendamento.nome_cliente}`,
        description: `Reunião sobre ${produtoNomes[agendamento.produto] || agendamento.produto}\n\nCliente: ${agendamento.nome_cliente}\nEmail: ${agendamento.email_cliente}\nTelefone: ${agendamento.telefone_cliente || 'Não informado'}`,
        startDateTime,
        endDateTime,
        attendeeEmail: agendamento.email_cliente,
        attendeeName: agendamento.nome_cliente
      });

      if (response.status !== 200 || !response.data || response.data.error) {
        throw new Error(response.data?.message || response.data?.error || 'Erro ao criar evento');
      }

      // Atualiza o agendamento com o novo link
      await base44.entities.Agendamento.update(agendamento.id, {
        link_reuniao: response.data.meetLink
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setRecreatingLink(null);
      alert('✅ Link recriado com sucesso!');
    },
    onError: (error) => {
      setRecreatingLink(null);
      alert(`❌ Erro ao recriar link: ${error.message}`);
    }
  });

  // Mutation para mover lead para "Em Avaliação"
  const moveToEvaluationMutation = useMutation({
    mutationFn: async (agendamentoId) => {
      setMovingToEvaluation(agendamentoId);
      
      const leads = await base44.entities.Lead.filter({ 
        agendamento_id: agendamentoId 
      });

      if (leads.length > 0) {
        const lead = leads[0];
        
        if (lead.estagio === 'Reuniao_Marcada') {
          await base44.entities.Lead.update(lead.id, {
            estagio: 'Em_Avaliacao'
          });
          return { success: true, moved: true };
        }
        return { success: true, moved: false, message: 'Lead já está em estágio avançado' };
      }
      return { success: false, message: 'Nenhum lead encontrado' };
    },
    onSuccess: (data) => {
      setMovingToEvaluation(null);
      if (data.moved) {
        alert('✅ Lead movido para "Em Avaliação"!');
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      } else {
        alert(`ℹ️ ${data.message}`);
      }
    },
    onError: (error) => {
      setMovingToEvaluation(null);
      alert(`❌ Erro: ${error.message}`);
    }
  });

  const handleOpenWhatsApp = (agendamento) => {
    setAgendamentoParaWhatsApp(agendamento);
    setErro(null);

    const produtoNome = produtoConfig[agendamento.produto]?.nome || agendamento.produto;

    const mensagemPadrao = `Olá ${agendamento.nome_cliente}! 👋

Sua reunião sobre *${produtoNome}* está confirmada para:

📅 *Data:* ${format(parseISO(agendamento.data), "dd 'de' MMMM", { locale: ptBR })}
⏰ *Horário:* ${agendamento.horario}

${agendamento.link_reuniao ? `🎥 *Link da reunião:*\n${agendamento.link_reuniao}\n\n` : ''}Estamos ansiosos para conversar com você! 🚀`;

    setMensagemWhatsApp(mensagemPadrao);
    setDialogWhatsAppAberto(true);
  };

  const handleSendWhatsApp = () => {
    setErro(null);
    if (agendamentoParaWhatsApp && mensagemWhatsApp && agendamentoParaWhatsApp.telefone_cliente) {
      console.log('🚀 Iniciando envio para:', agendamentoParaWhatsApp.telefone_cliente);
      sendWhatsAppMutation.mutate({
        telefone: agendamentoParaWhatsApp.telefone_cliente,
        mensagem: mensagemWhatsApp,
        agendamento_id: agendamentoParaWhatsApp.id
      });
    } else {
      console.warn('⚠️ Dados incompletos:', {
        agendamento: !!agendamentoParaWhatsApp,
        mensagem: !!mensagemWhatsApp,
        telefone: agendamentoParaWhatsApp?.telefone_cliente
      });
      setErro('Dados incompletos para enviar a mensagem. Por favor, verifique se o cliente possui um telefone cadastrado e se a mensagem não está vazia.');
    }
  };

  const handleDebugLink = (ag) => {
    setDebugInfo({
      agendamento_id: ag.id,
      nome_cliente: ag.nome_cliente,
      link_reuniao_original: ag.link_reuniao || 'NÃO ENCONTRADO',
      link_type: typeof ag.link_reuniao,
      link_length: ag.link_reuniao?.length || 0
    });
  };

  const agendamentosFiltrados = agendamentos.filter(ag => {
    const matchBusca = ag.nome_cliente.toLowerCase().includes(busca.toLowerCase()) ||
                       ag.email_cliente.toLowerCase().includes(busca.toLowerCase()) ||
                       (ag.telefone_cliente && ag.telefone_cliente.includes(busca));
    const matchProduto = filtroProduto === "todos" || ag.produto === filtroProduto;
    const matchStatus = filtroStatus === "todos" || ag.status === filtroStatus;
    return matchBusca && matchProduto && matchStatus;
  });

  const handleChangeStatus = () => {
    if (agendamentoSelecionado && novoStatus) {
      updateStatusMutation.mutate({ id: agendamentoSelecionado.id, status: novoStatus });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Todos os Agendamentos
          </h1>
          <p className="text-slate-600">
            Gerencie todas as reuniões agendadas (ordenadas por proximidade)
          </p>
        </div>

        {/* Filtros */}
        <Card className="p-6 shadow-lg border-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Select value={filtroProduto} onValueChange={setFiltroProduto}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Produtos</SelectItem>
                {Object.entries(produtoConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="Agendada">Agendada</SelectItem>
                <SelectItem value="Confirmada">Confirmada</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Debug Info */}
        {debugInfo && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>🔍 Debug Info:</strong>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDebugInfo(null)}
                className="mt-2"
              >
                Fechar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabela */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold">Cliente</TableHead>
                  <TableHead className="font-bold">Produto</TableHead>
                  <TableHead className="font-bold">Data</TableHead>
                  <TableHead className="font-bold">Horário</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Origem</TableHead>
                  <TableHead className="font-bold">Link/Ações</TableHead>
                  <TableHead className="font-bold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentosFiltrados.map((ag) => {
                  const StatusIcon = statusConfig[ag.status]?.icon || Clock;
                  
                  return (
                    <TableRow key={ag.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">{ag.nome_cliente}</p>
                          <p className="text-sm text-slate-500">{ag.email_cliente}</p>
                          {ag.telefone_cliente && (
                            <p className="text-xs text-slate-400 mt-0.5">📱 {ag.telefone_cliente}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${produtoConfig[ag.produto]?.corBadge} border`}>
                          {produtoConfig[ag.produto]?.nome}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(ag.data), "dd 'de' MMMM", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {ag.horario}
                      </TableCell>
                      <TableCell>
                        <Dialog
                          open={dialogStatusAberto && agendamentoSelecionado?.id === ag.id}
                          onOpenChange={(open) => {
                            setDialogStatusAberto(open);
                            if (!open) {
                              setAgendamentoSelecionado(null);
                              setNovoStatus("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <button
                              onClick={() => {
                                setAgendamentoSelecionado(ag);
                                setNovoStatus(ag.status);
                                setDialogStatusAberto(true);
                              }}
                              className="w-full text-left"
                            >
                              <Badge className={`${statusConfig[ag.status]?.cor} cursor-pointer hover:opacity-80 transition-opacity`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {ag.status}
                              </Badge>
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Alterar Status da Reunião</DialogTitle>
                              <DialogDescription>
                                {ag.nome_cliente} - {format(parseISO(ag.data), "dd/MM/yyyy", { locale: ptBR })} às {ag.horario}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <Select value={novoStatus} onValueChange={setNovoStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Agendada">Agendada</SelectItem>
                                  <SelectItem value="Confirmada">Confirmada</SelectItem>
                                  <SelectItem value="Concluída">Concluída</SelectItem>
                                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={handleChangeStatus}
                                disabled={updateStatusMutation.isPending || !novoStatus}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                              >
                                {updateStatusMutation.isPending ? "Atualizando..." : "Confirmar Alteração"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        {ag.origem === 'Chatbot' ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            🤖 Chatbot
                          </Badge>
                        ) : ag.origem === 'Agendamento Online' ? (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            🌐 Online
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-600">
                            Manual
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center flex-wrap">
                          {ag.link_reuniao ? (
                            <>
                              {/* Link direto do Google Meet */}
                              <a
                                href={ag.link_reuniao}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                title="Abrir Google Meet"
                              >
                                <Video className="w-4 h-4" />
                                Entrar
                              </a>
                              
                              {/* Botão para mover lead para "Em Avaliação" */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveToEvaluationMutation.mutate(ag.id)}
                                disabled={movingToEvaluation === ag.id}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs"
                                title="Marcar lead como 'Em Avaliação' no CRM"
                              >
                                {movingToEvaluation === ag.id ? "..." : "→ CRM"}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDebugLink(ag)}
                                className="text-slate-400 hover:text-slate-600 p-1 h-auto"
                                title="Ver detalhes do link"
                              >
                                <AlertCircle className="w-3 h-3" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => recreateLinkMutation.mutate(ag)}
                                disabled={recreatingLink === ag.id}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-1 h-auto"
                                title="Recriar link (se estiver expirado)"
                              >
                                {recreatingLink === ag.id ? (
                                  <Clock className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-red-500">Sem link</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => recreateLinkMutation.mutate(ag)}
                                disabled={recreatingLink === ag.id}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto text-xs"
                              >
                                {recreatingLink === ag.id ? "Criando..." : "Criar Link"}
                              </Button>
                            </>
                          )}
                          
                          {ag.telefone_cliente && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenWhatsApp(ag)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 h-auto"
                              title="Enviar mensagem no WhatsApp"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate(ag.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir agendamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {agendamentosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">Nenhum agendamento encontrado</p>
            </div>
          )}
        </Card>

        {/* Dialog de envio de WhatsApp */}
        <Dialog open={dialogWhatsAppAberto} onOpenChange={setDialogWhatsAppAberto}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-green-600" />
                Enviar Mensagem no WhatsApp
              </DialogTitle>
              <DialogDescription>
                {agendamentoParaWhatsApp?.nome_cliente} - 📱 {agendamentoParaWhatsApp?.telefone_cliente}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  rows={12}
                  value={mensagemWhatsApp}
                  onChange={(e) => setMensagemWhatsApp(e.target.value)}
                  className="font-mono text-sm resize-y"
                />
              </div>
              {erro && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleSendWhatsApp}
                disabled={!mensagemWhatsApp || !agendamentoParaWhatsApp?.telefone_cliente || sendWhatsAppMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {sendWhatsAppMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Agora
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}