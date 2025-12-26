import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay, isToday, isThisWeek, isThisMonth, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatsCard from '../components/dashboard/StatsCard';
import { MessagesAreaChart, HourlyBarChart, PipelinePieChart } from '../components/dashboard/ConversationChart';
import { MessageSquare, Users, Bot, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardIA() {
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['allMessages'],
    queryFn: () => base44.entities.Message.list('-created_date', 1000),
  });

  const stats = useMemo(() => {
    const activeConversations = contacts.filter(c => c.is_active !== false).length;
    const closedConversations = contacts.filter(c => c.is_active === false).length;
    
    const todayMessages = messages.filter(m => isToday(new Date(m.created_date)));
    const weekMessages = messages.filter(m => isThisWeek(new Date(m.created_date)));
    const monthMessages = messages.filter(m => isThisMonth(new Date(m.created_date)));
    
    const aiMessages = messages.filter(m => m.sender === 'ai');
    const humanMessages = messages.filter(m => m.sender === 'human');
    
    return {
      activeConversations,
      closedConversations,
      totalMessages: messages.length,
      todayMessages: todayMessages.length,
      weekMessages: weekMessages.length,
      monthMessages: monthMessages.length,
      aiMessages: aiMessages.length,
      humanMessages: humanMessages.length,
      aiPercentage: messages.length > 0 ? Math.round((aiMessages.length / messages.length) * 100) : 0
    };
  }, [contacts, messages]);

  const chartData = useMemo(() => {
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const count = messages.filter(m => {
        const msgDate = new Date(m.created_date);
        return msgDate >= dayStart && msgDate <= dayEnd;
      }).length;
      dailyData.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        messages: count
      });
    }

    const hourlyData = [];
    for (let i = 0; i < 24; i++) {
      const count = messages.filter(m => getHours(new Date(m.created_date)) === i).length;
      hourlyData.push({
        hour: `${i}h`,
        count
      });
    }

    const pipelineData = [
      { name: 'Novos', value: contacts.filter(c => c.pipeline_stage === 'novo_lead' || !c.pipeline_stage).length },
      { name: 'Qualificados', value: contacts.filter(c => c.pipeline_stage === 'qualificado').length },
      { name: 'Proposta', value: contacts.filter(c => c.pipeline_stage === 'proposta').length },
      { name: 'Negociação', value: contacts.filter(c => c.pipeline_stage === 'negociacao').length },
      { name: 'Ganhos', value: contacts.filter(c => c.pipeline_stage === 'fechado_ganho').length },
      { name: 'Perdidos', value: contacts.filter(c => c.pipeline_stage === 'fechado_perdido').length },
    ].filter(d => d.value > 0);

    return { dailyData, hourlyData, pipelineData };
  }, [messages, contacts]);

  const recentContacts = useMemo(() => {
    return [...contacts]
      .sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date))
      .slice(0, 5);
  }, [contacts]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard IA</h1>
          <p className="text-slate-500">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Horário de Brasília: {format(new Date(), "HH:mm 'h'", { locale: ptBR })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Conversas Ativas"
          value={stats.activeConversations}
          icon={MessageSquare}
          color="blue"
        />
        <StatsCard
          title="Total de Mensagens"
          value={stats.totalMessages}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Mensagens Hoje"
          value={stats.todayMessages}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Atendimento IA"
          value={`${stats.aiPercentage}%`}
          icon={Bot}
          color="purple"
          trend="up"
          trendValue={`${stats.aiMessages} mensagens`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessagesAreaChart data={chartData.dailyData} />
        <HourlyBarChart data={chartData.hourlyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PipelinePieChart data={chartData.pipelineData} />
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Contatos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.profile_picture} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                        {(contact.name || contact.phone || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-800">{contact.name || 'Sem nome'}</p>
                      <p className="text-xs text-slate-500">{contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.keywords?.slice(0, 2).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {kw}
                      </Badge>
                    ))}
                    {contact.last_message_at && (
                      <span className="text-xs text-slate-400">
                        {format(new Date(contact.last_message_at), 'HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {recentContacts.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Nenhum contato ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Esta Semana</p>
                <p className="text-2xl font-bold text-slate-800">{stats.weekMessages}</p>
                <p className="text-xs text-slate-400">mensagens</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Este Mês</p>
                <p className="text-2xl font-bold text-slate-800">{stats.monthMessages}</p>
                <p className="text-xs text-slate-400">mensagens</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Finalizadas</p>
                <p className="text-2xl font-bold text-slate-800">{stats.closedConversations}</p>
                <p className="text-xs text-slate-400">conversas</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}