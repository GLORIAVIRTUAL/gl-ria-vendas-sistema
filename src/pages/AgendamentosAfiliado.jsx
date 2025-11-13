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
import { Search, Filter, ExternalLink, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const produtoConfig = {
  Gloria_Atendente: { nome: "Glória Atendente", cor: "bg-blue-500", corBadge: "bg-blue-100 text-blue-700 border-blue-200" },
  Gloria_Clinica: { nome: "Glória Clínica", cor: "bg-green-500", corBadge: "bg-green-100 text-green-700 border-green-200" },
  Maquina_de_Videos: { nome: "Máquina de Vídeos", cor: "bg-purple-500", corBadge: "bg-purple-100 text-purple-700 border-purple-200" },
  Gloria_Financas: { nome: "Glória Finanças", cor: "bg-orange-500", corBadge: "bg-orange-100 text-orange-700 border-orange-200" },
  Avatar_ao_Vivo: { nome: "Avatar ao Vivo", cor: "bg-pink-500", corBadge: "bg-pink-100 text-pink-700 border-pink-200" }
};

const statusConfig = {
  Agendada: { cor: "bg-blue-100 text-blue-700", icon: Clock },
  Confirmada: { cor: "bg-green-100 text-green-700", icon: CheckCircle },
  Concluída: { cor: "bg-slate-100 text-slate-700", icon: CheckCircle },
  Cancelada: { cor: "bg-red-100 text-red-700", icon: XCircle }
};

export default function AgendamentosAfiliado() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [novoStatus, setNovoStatus] = useState("");

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ['agendamentos-afiliado', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const lista = await base44.entities.Agendamento.filter({ created_by: user.email });
      return lista.sort((a, b) => {
        const dataHoraA = new Date(`${a.data}T${a.horario}`);
        const dataHoraB = new Date(`${b.data}T${b.horario}`);
        return dataHoraA.getTime() - dataHoraB.getTime();
      });
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Agendamento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos-afiliado'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Agendamento.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos-afiliado'] });
      setAgendamentoSelecionado(null);
      setNovoStatus("");
    },
  });

  const agendamentosFiltrados = agendamentos.filter(ag => {
    const matchBusca = ag.nome_cliente.toLowerCase().includes(busca.toLowerCase()) ||
                       ag.email_cliente.toLowerCase().includes(busca.toLowerCase());
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
            📋 Meus Agendamentos
          </h1>
          <p className="text-slate-600">
            Gerencie todas as reuniões que você agendou
          </p>
        </div>

        {/* Filtros */}
        <Card className="p-6 shadow-lg border-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nome ou email..."
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
                  <TableHead className="font-bold">Link</TableHead>
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              onClick={() => {
                                setAgendamentoSelecionado(ag);
                                setNovoStatus(ag.status);
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
                                {ag.nome_cliente} - {format(parseISO(ag.data), "dd/MM/yyyy")} às {ag.horario}
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
                        {ag.origem === 'Chatbot' || ag.origem === 'Agendamento Online' ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            {ag.origem === 'Chatbot' ? '🤖 Chatbot' : '🌐 Online'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-600">
                            Manual
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {ag.link_reuniao && (
                          <a
                            href={ag.link_reuniao}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate(ag.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      </div>
    </div>
  );
}