import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Clock, Users, CheckCircle, TrendingUp, ArrowUp, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState('');

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list(),
    initialData: [],
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, fullName }) => {
      const response = await base44.functions.invoke('updateUserName', { userId: id, fullName });
      const result = response.data;
      if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setEditingUserId(null);
      toast.success('Nome atualizado!');
    },
    onError: (error) => toast.error(error.message || 'Erro ao atualizar'),
  });

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setEditName(user.full_name || '');
  };

  const handleSaveUser = (userId) => {
    updateUserMutation.mutate({ id: userId, fullName: editName });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Estatísticas
  const hoje = new Date().toISOString().split('T')[0];
  const agendamentosHoje = agendamentos.filter(a => a.data === hoje);
  
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const agendamentosSemana = agendamentos.filter(a => new Date(a.data) >= inicioSemana);
  
  const confirmados = agendamentos.filter(a => a.status === 'Confirmada').length;

  // Dados do gráfico por produto
  const produtosCount = agendamentos.reduce((acc, ag) => {
    const prod = ag.produto || 'Outros';
    acc[prod] = (acc[prod] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(produtosCount).map(([produto, count]) => ({
    name: produto.replace(/_/g, ' '),
    reunioes: count
  }));

  // Próximas reuniões
  const proximasReunioes = agendamentos
    .filter(a => new Date(a.data) >= new Date())
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 5);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Dashboard
            </h1>
            <p className="text-slate-600">
              Visão geral dos seus agendamentos
            </p>
          </div>
          <Link to={createPageUrl("Agendar")}>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Nova Reunião
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Total de Reuniões</p>
              <p className="text-3xl font-bold text-slate-900">{agendamentos.length}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">12% este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Hoje</p>
              <p className="text-3xl font-bold text-slate-900">{agendamentosHoje.length}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-sm text-slate-500">{agendamentosHoje.length} agendadas</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Esta Semana</p>
              <p className="text-3xl font-bold text-slate-900">{agendamentosSemana.length}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-sm text-slate-500">Segunda a Sexta</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Confirmadas</p>
              <p className="text-3xl font-bold text-slate-900">{confirmados}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-sm text-slate-500">Prontas para iniciar</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Usuários do Sistema */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
            </div>
            {usuarios.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Nenhum usuário encontrado</p>
            ) : (
              <div className="space-y-3">
                {usuarios.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1"
                          placeholder="Nome do usuário"
                        />
                        <Button size="sm" onClick={() => handleSaveUser(user.id)} className="bg-green-600 hover:bg-green-700">
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="font-medium text-slate-900">{user.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {user.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Reuniões por Produto</h3>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="reunioes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center py-12">Nenhum dado para exibir</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Próximas Reuniões</h3>
              <p className="text-sm text-slate-500 mb-4">Ordenadas por proximidade</p>
              {proximasReunioes.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Nenhuma reunião agendada</p>
              ) : (
                <div className="space-y-3">
                  {proximasReunioes.map(ag => (
                    <div key={ag.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-slate-900">{ag.nome_cliente}</p>
                        <a 
                          href={ag.link_reuniao} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          ↗
                        </a>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{ag.email_cliente}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-white px-2 py-1 rounded-full border border-slate-200">
                          📅 {new Date(ag.data).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs bg-white px-2 py-1 rounded-full border border-slate-200">
                          🕐 {ag.horario}
                        </span>
                      </div>
                      {ag.produto && (
                        <p className="text-xs text-purple-600 mt-2 font-medium">
                          {ag.produto.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}