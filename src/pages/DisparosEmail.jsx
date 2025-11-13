import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statusConfig = {
  Programado: { cor: "bg-blue-100 text-blue-700", icon: Clock },
  Enviado: { cor: "bg-green-100 text-green-700", icon: CheckCircle },
  Erro: { cor: "bg-red-100 text-red-700", icon: XCircle }
};

export default function DisparosEmail() {
  const queryClient = useQueryClient();

  const { data: disparos = [], isLoading, refetch } = useQuery({
    queryKey: ['disparos-email'],
    queryFn: () => base44.entities.DisparoEmail.list('-created_date'),
    initialData: [],
    refetchInterval: 10000,
  });

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list(),
    initialData: [],
  });

  const processScheduledMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('email/processScheduled');
      return response.data;
    },
    onSuccess: (data) => {
      alert(`✅ Processado! ${data.enviados} emails enviados.`);
      queryClient.invalidateQueries({ queryKey: ['disparos-email'] });
    },
    onError: (error) => {
      alert(`❌ Erro: ${error.message}`);
    }
  });

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
              📧 Disparos de Email
            </h1>
            <p className="text-slate-600">
              Gerencie emails automáticos de confirmação e lembretes
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
          </div>
        </div>

        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>✅ Funcionamento Automático:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Email de confirmação enviado IMEDIATAMENTE após agendar</li>
              <li>Email de lembrete enviado 2 HORAS ANTES da reunião</li>
              <li>O Cron Job processa os lembretes <strong>automaticamente a cada 5 minutos</strong></li>
              <li>Você <strong>NÃO precisa</strong> fazer nada - tudo é automático! 🎉</li>
            </ul>
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
                  <Mail className="w-6 h-6 text-slate-600" />
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
              Próximos Emails Programados
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
                          📧 {disparo.email_destinatario}
                        </p>
                        <Badge className="mt-2 bg-purple-100 text-purple-700">
                          {disparo.tipo}
                        </Badge>
                        {jaPassou && (
                          <Badge className="bg-orange-100 text-orange-700 ml-2">
                            ⏰ Horário já passou - será enviado no próximo cron
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">
                          {format(dataProgramada, "dd/MM 'às' HH:mm", { locale: ptBR })}
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
              <p className="text-center text-slate-500 py-8">Nenhum email programado</p>
            )}
          </CardContent>
        </Card>

        {/* Histórico Recente */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Emails Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Programado para</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disparosRecentes.map((disparo) => {
                    const agendamento = agendamentos.find(a => a.id === disparo.agendamento_id);
                    const StatusIcon = statusConfig[disparo.status]?.icon || Mail;
                    return (
                      <TableRow key={disparo.id} className="hover:bg-slate-50">
                        <TableCell className="font-semibold">
                          {agendamento?.nome_cliente || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {disparo.email_destinatario}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-purple-100 text-purple-700">
                            {disparo.tipo}
                          </Badge>
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {disparosRecentes.length === 0 && (
              <p className="text-center text-slate-500 py-8">Nenhum email recente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}