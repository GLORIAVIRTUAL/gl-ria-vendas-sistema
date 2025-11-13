import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, DollarSign, TrendingUp, Pencil, Trash2, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import NovoAfiliadoDialog from "../components/afiliados/NovoAfiliadoDialog";
import EditAfiliadoDialog from "../components/afiliados/EditAfiliadoDialog";

export default function Afiliados() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [afiliadoParaEditar, setAfiliadoParaEditar] = useState(null);
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);

  const { data: afiliados = [], isLoading } = useQuery({
    queryKey: ['afiliados'],
    queryFn: () => base44.entities.Afiliado.list('-created_date'),
    initialData: [],
  });

  const { data: negocios = [] } = useQuery({
    queryKey: ['negocios'],
    queryFn: () => base44.entities.NegocioFechado.list(),
    initialData: [],
  });

  const deleteAfiliadoMutation = useMutation({
    mutationFn: (id) => base44.entities.Afiliado.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afiliados'] });
    },
  });

  const updateAfiliadoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Afiliado.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afiliados'] });
      setDialogEditarAberto(false);
      setAfiliadoParaEditar(null);
    },
  });

  const afiliadosFiltrados = afiliados.filter(af => 
    af.nome.toLowerCase().includes(busca.toLowerCase()) ||
    af.email.toLowerCase().includes(busca.toLowerCase())
  );

  const calcularEstatisticas = (afiliadoId) => {
    const negociosAfiliado = negocios.filter(n => n.afiliado_id === afiliadoId);
    const totalClientes = negociosAfiliado.length;
    const clientesAtivos = negociosAfiliado.filter(n => n.status_pagamento === 'Ativo').length;
    const receitaMensal = negociosAfiliado
      .filter(n => n.status_pagamento === 'Ativo')
      .reduce((acc, n) => acc + (n.valor_mensalidade || 0), 0);
    
    return { totalClientes, clientesAtivos, receitaMensal };
  };

  const handleEditarAfiliado = (data) => {
    if (afiliadoParaEditar) {
      updateAfiliadoMutation.mutate({ id: afiliadoParaEditar.id, data });
    }
  };

  const totalAfiliados = afiliados.length;
  const afiliadosAtivos = afiliados.filter(a => a.ativo).length;
  const totalVendas = negocios.filter(n => n.afiliado_id).length;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              🤝 Afiliados
            </h1>
            <p className="text-slate-600">
              Gerencie parceiros e comissões via Stripe Connect
            </p>
          </div>
          <Button 
            onClick={() => setDialogAberto(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Afiliado
          </Button>
        </div>

        {/* Alert com instruções */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>⚠️ Importante:</strong> Para que as comissões funcionem, o afiliado precisa ter uma conta Stripe Connect configurada. 
            <br />
            <a 
              href="https://dashboard.stripe.com/test/connect/accounts/overview" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-semibold mt-1 inline-block"
            >
              Ver contas conectadas no Stripe →
            </a>
          </AlertDescription>
        </Alert>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total de Afiliados</p>
                  <p className="text-3xl font-bold text-slate-900">{totalAfiliados}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Afiliados Ativos</p>
                  <p className="text-3xl font-bold text-green-600">{afiliadosAtivos}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Vendas por Afiliados</p>
                  <p className="text-3xl font-bold text-blue-600">{totalVendas}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <Input
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-12"
            />
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold">Afiliado</TableHead>
                  <TableHead className="font-bold">Stripe Connect</TableHead>
                  <TableHead className="font-bold">Comissão</TableHead>
                  <TableHead className="font-bold">Clientes</TableHead>
                  <TableHead className="font-bold">Receita Mensal</TableHead>
                  <TableHead className="font-bold">Comissão Mensal</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {afiliadosFiltrados.map((afiliado) => {
                  const stats = calcularEstatisticas(afiliado.id);
                  const comissaoMensal = stats.receitaMensal * (afiliado.percentual_comissao / 100);

                  return (
                    <TableRow key={afiliado.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">{afiliado.nome}</p>
                          <p className="text-sm text-slate-600">{afiliado.email}</p>
                          {afiliado.telefone && (
                            <p className="text-xs text-slate-500">{afiliado.telefone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {afiliado.stripe_connect_account_id ? (
                          <a
                            href={`https://dashboard.stripe.com/connect/accounts/${afiliado.stripe_connect_account_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm"
                          >
                            <code className="text-xs">{afiliado.stripe_connect_account_id}</code>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                            Não Conectado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          {afiliado.percentual_comissao}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-semibold text-slate-900">{stats.totalClientes}</p>
                          <p className="text-xs text-green-600">{stats.clientesAtivos} ativos</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        R$ {stats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        R$ {comissaoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className={afiliado.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                          {afiliado.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAfiliadoParaEditar(afiliado);
                              setDialogEditarAberto(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir este afiliado?')) {
                                deleteAfiliadoMutation.mutate(afiliado.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {afiliadosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">Nenhum afiliado encontrado</p>
            </div>
          )}
        </Card>
      </div>

      <NovoAfiliadoDialog 
        open={dialogAberto}
        onOpenChange={setDialogAberto}
      />

      <EditAfiliadoDialog
        afiliado={afiliadoParaEditar}
        open={dialogEditarAberto}
        onOpenChange={setDialogEditarAberto}
        onSave={handleEditarAfiliado}
        isSaving={updateAfiliadoMutation.isPending}
      />
    </div>
  );
}