import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageCircle, Send, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

const statusConfig = {
  Programado: { cor: "bg-blue-100 text-blue-700", icon: Clock },
  Enviado: { cor: "bg-green-100 text-green-700", icon: CheckCircle },
  Erro: { cor: "bg-red-100 text-red-700", icon: XCircle }
};

const createPageUrl = (pageName) => {
  switch (pageName) {
    case "ConfigurarCron":
      return "/cron-config";
    default:
      return "#";
  }
};

const produtoConfig = {
  "Consultoria": { nome: "Consultoria Estratégica" },
  "Treinamento": { nome: "Treinamento Personalizado" },
  "Suporte": { nome: "Suporte Técnico" },
  // Add other products as needed, default will use the product name directly
};

export default function DisparosWhatsApp() {
  const queryClient = useQueryClient();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [formData, setFormData] = useState({
    telefone: "",
    mensagem: ""
  });

  // New states for the WhatsApp onboarding feature
  const [agendamentoParaWhatsApp, setAgendamentoParaWhatsApp] = useState(null);
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("");
  const [dialogWhatsAppAberto, setDialogWhatsAppAberto] = useState(false);
  const [erro, setErro] = useState(null);

  const { data: disparos = [], isLoading, refetch } = useQuery({
    queryKey: ['disparos-whatsapp'],
    queryFn: () => base44.entities.DisparoWhatsApp.list('-created_date'),
    initialData: [],
    refetchInterval: 10000,
  });

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list(),
    initialData: [],
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('whatsapp/sendMessage', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disparos-whatsapp'] });
      setDialogAberto(false);
      setFormData({ telefone: "", mensagem: "" });
    },
  });

  const processScheduledMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('whatsapp/processScheduled');
      return response.data;
    },
    onSuccess: (data) => {
      alert(`✅ Processado! ${data.processados} disparos enviados.`);
      queryClient.invalidateQueries({ queryKey: ['disparos-whatsapp'] });
    },
    onError: (error) => {
      alert(`❌ Erro: ${error.message}`);
    }
  });

  const handleEnviarManual = () => {
    sendMutation.mutate({
      telefone: formData.telefone,
      mensagem: formData.mensagem
    });
  };

  const handleOpenWhatsApp = (agendamento) => {
    setAgendamentoParaWhatsApp(agendamento);
    setErro(null); // Reset error state

    // Validate mandatory fields for the onboarding form link
    if (!agendamento.email_cliente) {
      setErro("🚨 Erro: Email do cliente não encontrado. Não é possível gerar o link do formulário de onboarding.");
      setMensagemWhatsApp(""); // Clear message as it cannot be generated
      setDialogWhatsAppAberto(true);
      return;
    }
    if (!agendamento.id) {
        setErro("🚨 Erro: ID do agendamento não encontrado. Não é possível gerar o link do formulário de onboarding.");
        setMensagemWhatsApp(""); // Clear message as it cannot be generated
        setDialogWhatsAppAberto(true);
        return;
    }

    const produtoNome = produtoConfig[agendamento.produto]?.nome || agendamento.produto;

    // Gera link do formulário de onboarding, agora incluindo agendamentoId
    const baseUrl = window.location.origin;
    const formLink = `${baseUrl}/api/functions/formularioOnboarding?email=${encodeURIComponent(agendamento.email_cliente)}&agendamentoId=${agendamento.id}`;

    const mensagemPadrao = `Olá ${agendamento.nome_cliente}! 👋

Sua reunião sobre *${produtoNome}* está confirmada para:

📅 *Data:* ${format(parseISO(agendamento.data), "dd 'de' MMMM", { locale: ptBR })}
⏰ *Horário:* ${agendamento.horario}

${agendamento.link_reuniao ? `🎥 *Link da reunião:*\n${agendamento.link_reuniao}\n\n` : ''}Para agilizar o processo, por favor preencha o formulário de cadastro da sua empresa:

📋 *Formulário de Onboarding:*
${formLink}

Estamos ansiosos para conversar com você! 🚀`;

    setMensagemWhatsApp(mensagemPadrao);
    setDialogWhatsAppAberto(true);
  };

  const handleTestarFormulario = () => {
    const baseUrl = window.location.origin;
    const emailTeste = 'teste@example.com';
    // Use the ID of the first available appointment or a fallback 'test-id'
    const agendamentoId = agendamentos.length > 0 ? agendamentos[0].id : 'test-id';
    const formLink = `${baseUrl}/api/functions/formularioOnboarding?email=${encodeURIComponent(emailTeste)}&agendamentoId=${agendamentoId}`;
    window.open(formLink, '_blank', 'noopener noreferrer');
  };

  const proximosDisparos = disparos
    .filter(d => d.status === 'Programado')
    .slice(0, 5);

  const disparosRecentes = disparos
    .filter(d => d.status === 'Enviado')
    .slice(0, 10);

  const agora = new Date();

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              📱 Disparos WhatsApp
            </h1>
            <p className="text-slate-600">
              Gerencie lembretes automáticos para clientes
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Link to={createPageUrl("ConfigurarCron")}>
              <Button
                variant="outline"
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                Configurar Cron Job
              </Button>
            </Link>
            <Button
              onClick={handleTestarFormulario}
              variant="outline"
              className="gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700"
            >
              📋 Testar Formulário
            </Button>
            <Button
              onClick={() => processScheduledMutation.mutate()}
              disabled={processScheduledMutation.isPending}
              variant="outline"
              className="gap-2"
              title="Apenas para testes - o cron job faz isso automaticamente"
            >
              <Clock className="w-4 h-4" />
              {processScheduledMutation.isPending ? "Processando..." : "🧪 Processar Agora (Teste)"}
            </Button>
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2">
                  <Send className="w-4 h-4" />
                  Enviar Manual
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Mensagem Manual</DialogTitle>
                  <DialogDescription>
                    Envie uma mensagem imediata via WhatsApp
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="telefone">Telefone (com DDD)</Label>
                    <Input
                      id="telefone"
                      placeholder="(11) 99999-9999"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mensagem">Mensagem</Label>
                    <Textarea
                      id="mensagem"
                      rows={6}
                      placeholder="Digite sua mensagem..."
                      value={formData.mensagem}
                      onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                    />
                  </div>
                  <Button
                    onClick={handleEnviarManual}
                    disabled={!formData.telefone || !formData.mensagem || sendMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {sendMutation.isPending ? "Enviando..." : "Enviar Agora"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogWhatsAppAberto} onOpenChange={setDialogWhatsAppAberto}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mensagem de Onboarding WhatsApp</DialogTitle>
                  <DialogDescription>
                    Confira e envie a mensagem de onboarding para o cliente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Display general error if set */}
                  {erro && <Alert variant="destructive">{erro}</Alert>}
                  <div>
                    <Label htmlFor="onboarding-message">Mensagem para {agendamentoParaWhatsApp?.nome_cliente || 'o cliente'}</Label>
                    <Textarea
                      id="onboarding-message"
                      rows={10}
                      value={mensagemWhatsApp}
                      onChange={(e) => setMensagemWhatsApp(e.target.value)}
                      disabled={!!erro} // Disable textarea if there's an error that prevents message generation
                    />
                  </div>

                  {/* Specific alert for missing phone number */}
                  {!agendamentoParaWhatsApp?.telefone && (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      Telefone do cliente não disponível para enviar mensagem.
                    </Alert>
                  )}

                  {/* WhatsApp button */}
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!agendamentoParaWhatsApp?.telefone || !mensagemWhatsApp || !!erro}
                    onClick={() => {
                      if (agendamentoParaWhatsApp?.telefone && mensagemWhatsApp && !erro) {
                        const whatsappLink = `https://wa.me/${agendamentoParaWhatsApp.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagemWhatsApp)}`;
                        window.open(whatsappLink, '_blank', 'noopener noreferrer');
                      }
                    }}
                  >
                    {agendamentoParaWhatsApp?.telefone && mensagemWhatsApp && !erro
                      ? `Abrir WhatsApp para ${agendamentoParaWhatsApp.telefone}`
                      : erro
                        ? "Corrija o erro acima para enviar"
                        : !agendamentoParaWhatsApp?.telefone
                          ? "Telefone do cliente não disponível"
                          : "Mensagem de onboarding não gerada" // Fallback if no error but message is empty
                    }
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>✅ Funcionamento Automático:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Lembretes são criados automaticamente quando você agenda uma reunião</li>
              <li>O Cron Job do cron-job.org processa e envia os lembretes <strong>automaticamente a cada 5 minutos</strong></li>
              <li>Você <strong>NÃO precisa</strong> fazer nada - tudo é automático! 🎉</li>
              <li>O botão "Processar Agora" é apenas para testes manuais</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>📋 Como funciona:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Você agenda uma reunião → Sistema cria 2 lembretes (24h e 1h antes)</li>
              <li>Cron Job roda a cada 5 minutos → Verifica se há lembretes para enviar</li>
              <li>Se a data/hora do lembrete chegou → Envia automaticamente via WhatsApp</li>
              <li>Status muda de "Programado" para "Enviado"</li>
            </ol>
            <br />
            <strong>🕐 Horário atual:</strong> {format(agora, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
          </AlertDescription>
        </Alert>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Enviados</p>
                  <p className="text-3xl font-bold text-green-600">
                    {disparos.filter(d => d.status === 'Enviado').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Programados</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {disparos.filter(d => d.status === 'Programado').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Com Erro</p>
                  <p className="text-3xl font-bold text-red-600">
                    {disparos.filter(d => d.status === 'Erro').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {disparos.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximos Disparos */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Próximos Disparos Programados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {proximosDisparos.length > 0 ? (
              <div className="space-y-3">
                {proximosDisparos.map((disparo) => {
                  const agendamento = agendamentos.find(a => a.id === disparo.agendamento_id);
                  const dataProgramada = parseISO(disparo.data_programada);
                  const jaPassou = dataProgramada <= agora;
                  
                  return (
                    <div key={disparo.id} className={`flex items-center justify-between p-4 rounded-lg ${jaPassou ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50'}`}>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {agendamento?.nome_cliente || 'Cliente'}
                        </p>
                        <p className="text-sm text-slate-600">
                          📱 {disparo.telefone}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {disparo.horas_antes}h antes da reunião
                        </p>
                        {jaPassou && (
                          <Badge className="bg-orange-100 text-orange-700 mt-2">
                            ⏰ Horário já passou - será enviado no próximo cron
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">
                          {format(dataProgramada, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <Badge className="bg-blue-100 text-blue-700 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          Programado
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">Nenhum disparo programado</p>
            )}
          </CardContent>
        </Card>

        {/* Histórico Recente */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Disparos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Programado para</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disparosRecentes.map((disparo) => {
                    const agendamento = agendamentos.find(a => a.id === disparo.agendamento_id);
                    const StatusIcon = statusConfig[disparo.status]?.icon || MessageCircle;
                    return (
                      <TableRow key={disparo.id} className="hover:bg-slate-50">
                        <TableCell className="font-semibold">
                          {agendamento?.nome_cliente || 'Manual'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {disparo.telefone}
                        </TableCell>
                        <TableCell className="text-sm">
                          {disparo.data_programada
                            ? format(parseISO(disparo.data_programada), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {disparo.data_envio
                            ? format(parseISO(disparo.data_envio), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[disparo.status]?.cor}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {disparo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-slate-600">
                          {disparo.mensagem.substring(0, 50)}...
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {disparosRecentes.length === 0 && (
              <p className="text-center text-slate-500 py-8">Nenhum disparo recente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}