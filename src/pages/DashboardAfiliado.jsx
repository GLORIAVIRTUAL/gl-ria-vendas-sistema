
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, TrendingUp, Plus, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { parseISO, isToday, isFuture, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

import StatsCard from "../components/dashboard/StatsCard";
import ProductChart from "../components/dashboard/ProductChart";
import UpcomingMeetings from "../components/dashboard/UpcomingMeetings";

const produtoConfig = {
  Atendimento_IA_24_7: { nome: "Atendimento IA 24/7", cor: "bg-blue-500", corTexto: "text-blue-700", corFundo: "bg-blue-50" },
  Maquina_de_Videos: { nome: "Máquina de Vídeos", cor: "bg-purple-500", corTexto: "text-purple-700", corFundo: "bg-purple-50" },
  Gloria_Clinica: { nome: "Glória Clínica", cor: "bg-green-500", corTexto: "text-green-700", corFundo: "bg-green-50" },
  Gloria_Vendas: { nome: "Glória Vendas", cor: "bg-orange-500", corTexto: "text-orange-700", corFundo: "bg-orange-50" },
  Especialistas_Virtuais: { nome: "Especialistas Virtuais", cor: "bg-pink-500", corTexto: "text-pink-700", corFundo: "bg-pink-50" },
  Sites_em_24_Horas: { nome: "Sites em 24 Horas", cor: "bg-cyan-500", corTexto: "text-cyan-700", corFundo: "bg-cyan-50" }
};

export default function DashboardAfiliado() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Busca todos os afiliados uma única vez
  const { data: afiliados = [] } = useQuery({
    queryKey: ['afiliados-todos'],
    queryFn: () => base44.entities.Afiliado.list(),
    initialData: [],
  });

  // Encontra o afiliado APENAS pelo email
  const afiliado = React.useMemo(() => {
    if (!user?.email || !afiliados.length) return null;
    return afiliados.find(af => af.email === user.email);
  }, [user?.email, afiliados]);

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ['agendamentos-afiliado', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const lista = await base44.entities.Agendamento.filter({ created_by: user.email });
      return lista.sort((a, b) => {
        const dataHoraA = new Date(`${a.data}T${a.horario}`);
        const dataHoraB = new Date(`${b.data}T${b.horario}`);
        return dataHoraA - dataHoraB;
      });
    },
    enabled: !!user?.email,
    initialData: [],
  });

  // Busca negócios SOMENTE se tiver o afiliado correto
  const { data: negocios = [] } = useQuery({
    queryKey: ['negocios-afiliado', afiliado?.id],
    queryFn: async () => {
      if (!afiliado?.id) return [];
      console.log('🔍 Buscando negócios para afiliado Base44 ID:', afiliado.id);
      const lista = await base44.entities.NegocioFechado.filter({ afiliado_id: afiliado.id });
      console.log('📊 Negócios encontrados:', lista.length);
      return lista;
    },
    enabled: !!afiliado?.id,
    initialData: [],
    refetchInterval: 3000,
  });

  const agendamentosHoje = () => {
    return agendamentos.filter(ag => isToday(parseISO(ag.data)));
  };

  const agendamentosSemana = () => {
    const inicio = startOfWeek(new Date(), { weekStartsOn: 1 });
    const fim = endOfWeek(new Date(), { weekStartsOn: 1 });
    return agendamentos.filter(ag => {
      const dataAg = parseISO(ag.data);
      return isWithinInterval(dataAg, { start: inicio, end: fim });
    });
  };

  const proximasReunioes = agendamentos
    .filter(ag => {
      const dataHora = parseISO(`${ag.data}T${ag.horario}`);
      return isFuture(dataHora) || isToday(parseISO(ag.data));
    })
    .slice(0, 5);

  const agendamentosPorProduto = agendamentos.reduce((acc, ag) => {
    acc[ag.produto] = (acc[ag.produto] || 0) + 1;
    return acc;
  }, {});

  // Calcula comissão mensal
  const comissaoMensal = negocios
    .filter(n => n.status_pagamento === 'Ativo')
    .reduce((acc, n) => {
      const comissao = (n.valor_mensalidade || 0) * ((afiliado?.percentual_comissao || 0) / 100);
      console.log(`💰 Negócio ${n.id}: R$ ${n.valor_mensalidade} x ${afiliado?.percentual_comissao}% = R$ ${comissao.toFixed(2)}`);
      return acc + comissao;
    }, 0);

  console.log('💰 Comissão mensal total:', comissaoMensal);
  console.log('📊 Dados do afiliado:', afiliado);
  console.log('👤 Dados do usuário:', user);
  console.log('📋 Total de negócios:', negocios.length);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              📊 Meu Dashboard
            </h1>
            <p className="text-slate-600">
              Visão geral dos seus clientes e comissões
            </p>
            {afiliado && (
              <div className="mt-2 flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  💰 Comissão: {afiliado.percentual_comissao}%
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  ID: {afiliado.id.slice(0, 8)}...
                </Badge>
              </div>
            )}
          </div>
          <Link to={createPageUrl("AgendarAfiliado")}>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-5 h-5 mr-2" />
              Nova Reunião
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            titulo="Total de Reuniões"
            valor={agendamentos.length}
            icon={Calendar}
            cor="from-blue-500 to-blue-600"
            tendencia="+12% este mês"
          />
          <StatsCard
            titulo="Hoje"
            valor={agendamentosHoje().length}
            icon={Clock}
            cor="from-green-500 to-green-600"
            tendencia={`${agendamentosHoje().length} agendadas`}
          />
          <StatsCard
            titulo="Esta Semana"
            valor={agendamentosSemana().length}
            icon={Users}
            cor="from-purple-500 to-purple-600"
            tendencia="Segunda a Sexta"
          />
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8" />
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-sm opacity-90 mb-1">Minha Comissão Mensal</p>
              <p className="text-3xl font-bold">R$ {comissaoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs opacity-80 mt-1">
                {negocios.filter(n => n.status_pagamento === 'Ativo').length} clientes ativos
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts and Upcoming */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProductChart 
              agendamentosPorProduto={agendamentosPorProduto}
              produtoConfig={produtoConfig}
              isLoading={isLoading}
            />
          </div>
          <div>
            <UpcomingMeetings 
              reunioes={proximasReunioes}
              produtoConfig={produtoConfig}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
