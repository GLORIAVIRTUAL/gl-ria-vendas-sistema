import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Users, Pencil, FileText, Building2, DollarSign, Trash2 } from "lucide-react";

import EditClienteDialog from "../components/clientes/EditClienteDialog";

const statusConfig = {
  Ativo: { cor: "bg-green-100 text-green-700" },
  Inadimplente: { cor: "bg-red-100 text-red-700" },
  Cancelado: { cor: "bg-slate-100 text-slate-700" },
  Suspenso: { cor: "bg-yellow-100 text-yellow-700" }
};

export default function Clientes() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [dialogAberto, setDialogAberto] = useState(false);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('-created_date'),
    initialData: [],
  });

  const { data: negocios = [], isFetching: carregandoNegocios } = useQuery({
    queryKey: ['negocios'],
    queryFn: () => base44.entities.NegocioFechado.list(),
    initialData: [],
  });

  const { data: leads = [], isFetching: carregandoLeads } = useQuery({
    queryKey: ['leads-clientes'],
    queryFn: () => base44.entities.Lead.list(),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setDialogAberto(false);
      setClienteSelecionado(null);
    },
  });

  const sincronizarNegociosMutation = useMutation({
    mutationFn: async () => {
      const clientesExistentes = await base44.entities.Cliente.list();
      const estagiosPermitidos = ['Negocio_Fechado', 'Implantacao', 'Inicio_de_Uso', 'Estavel'];
      const leadsElegiveis = leads.filter(lead => estagiosPermitidos.includes(lead.estagio));

      const resultados = await Promise.all(leadsElegiveis.map(async (lead) => {
        const negocio = lead.negocio_id ? negocios.find(item => item.id === lead.negocio_id) : null;
        const email = negocio?.email_cliente || lead.email_cliente;
        const referenciaCliente = lead.negocio_id || `lead:${lead.id}`;
        const clienteExiste = clientesExistentes.find(cliente => cliente.negocio_id === referenciaCliente);

        if (clienteExiste || !email) return null;

        return base44.entities.Cliente.create({
          negocio_id: referenciaCliente,
          nome_cliente: negocio?.nome_cliente || lead.nome_cliente,
          nome_empresa: negocio?.nome_empresa || lead.nome_empresa || 'Não informado',
          email_cliente: email,
          telefone_cliente: negocio?.telefone_cliente || lead.telefone_cliente || '',
          produto: negocio?.produto || lead.produto_interesse || '',
          valor_mensalidade: negocio?.valor_mensalidade || lead.valor_estimado || 0,
          status_pagamento: negocio?.status_pagamento || 'Ativo',
          cnpj: '',
          endereco_completo: '',
          observacoes: negocio?.observacoes || lead.observacoes || '',
          arquivos_urls: [],
          data_inicio_contrato: negocio?.data_primeira_cobranca || negocio?.created_date || lead.created_date
        });
      }));

      return resultados.filter(Boolean).length;
    },
    onSuccess: (totalCriados) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      alert(`Clientes atualizados com sucesso! ${totalCriados} novo(s) cliente(s) adicionado(s).`);
    },
  });

  const clientesFiltrados = clientes.filter(cliente => {
    const matchBusca = cliente.nome_cliente?.toLowerCase().includes(busca.toLowerCase()) ||
                       cliente.nome_empresa?.toLowerCase().includes(busca.toLowerCase()) ||
                       cliente.email_cliente?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || cliente.status_pagamento === filtroStatus;
    return matchBusca && matchStatus;
  });

  const clientesAtivos = clientes.filter(c => c.status_pagamento === 'Ativo').length;
  const receitaTotal = clientes
    .filter(c => c.status_pagamento === 'Ativo')
    .reduce((acc, c) => acc + (c.valor_mensalidade || 0), 0);

  const handleEditar = (cliente) => {
    setClienteSelecionado(cliente);
    setDialogAberto(true);
  };

  const handleSalvar = (data) => {
    if (clienteSelecionado) {
      updateMutation.mutate({ id: clienteSelecionado.id, data });
    }
  };

  const handleDeletar = (id) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              👥 Clientes
            </h1>
            <p className="text-slate-600">
              Gestão completa de clientes e contratos
            </p>
          </div>
          <Button
            onClick={() => sincronizarNegociosMutation.mutate()}
            disabled={sincronizarNegociosMutation.isPending || carregandoLeads || carregandoNegocios}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          >
            <Users className="w-5 h-5 mr-2" />
            {carregandoLeads || carregandoNegocios ? 'Carregando...' : sincronizarNegociosMutation.isPending ? 'Atualizando...' : 'Atualizar Clientes'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90 mb-1">Total de Clientes</p>
            <p className="text-3xl font-bold">{clientes.length}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90 mb-1">Clientes Ativos</p>
            <p className="text-3xl font-bold">{clientesAtivos}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90 mb-1">Receita Mensal Total</p>
            <p className="text-3xl font-bold">R$ {receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-6 shadow-lg border-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar por cliente, empresa ou email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
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
                  <TableHead className="font-bold">Cliente / Empresa</TableHead>
                  <TableHead className="font-bold">Representante</TableHead>
                  <TableHead className="font-bold">Produto</TableHead>
                  <TableHead className="font-bold">Valor</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Arquivos</TableHead>
                  <TableHead className="font-bold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </TableCell>
                  </TableRow>
                ) : clientesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">{cliente.nome_cliente}</p>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {cliente.nome_empresa}
                          </p>
                          <p className="text-xs text-slate-500">{cliente.email_cliente}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cliente.representante_nome ? (
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{cliente.representante_nome}</p>
                            <p className="text-xs text-slate-600">{cliente.representante_cargo || 'Não informado'}</p>
                            <p className="text-xs text-slate-500">{cliente.representante_telefone || 'Sem telefone'}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">Não cadastrado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-700">{cliente.produto || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        R$ {cliente.valor_mensalidade?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig[cliente.status_pagamento]?.cor}`}>
                          {cliente.status_pagamento || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-600">
                            {cliente.arquivos_urls?.length || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditar(cliente)}
                            className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletar(cliente.id)}
                            className="text-red-300 hover:text-red-200 hover:bg-red-500/10"
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <EditClienteDialog
        cliente={clienteSelecionado}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        onSave={handleSalvar}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}