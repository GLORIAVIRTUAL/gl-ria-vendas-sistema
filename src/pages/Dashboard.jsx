
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Video, Clock, Plus } from "lucide-react";
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

export default function Dashboard() {
  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const lista = await base44.entities.Agendamento.list();
      // Ordena por data e horário (mais próximos primeiro)
      return lista.sort((a, b) => {
        const dataHoraA = new Date(`${a.data}T${a.horario}`);
        const dataHoraB = new Date(`${b.data}T${b.horario}`);
        return dataHoraA - dataHoraB;
      });
    },
    initialData: [],
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

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
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
          <StatsCard
            titulo="Confirmadas"
            valor={agendamentos.filter(a => a.status === "Confirmada").length}
            icon={Video}
            cor="from-orange-500 to-orange-600"
            tendencia="Prontas para iniciar"
          />
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

