import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, LayoutDashboard, List, Video, TestTube, TrendingUp, Users, Code, Clock, LogOut, Settings, ChevronDown, ChevronRight, CalendarCheck, Mail, MessageSquare, Bot, Megaphone } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import ReminderAlert from "../components/ReminderAlert";
import CompromissoAlert from "../components/agenda/CompromissoAlert";
import EmailNotification from "../components/EmailNotification";
import NovasMensagensAlert from "../components/NovasMensagensAlert";

function RelogioBrasil() {
  const [horaFormatada, setHoraFormatada] = useState('');

  useEffect(() => {
    const atualizarHora = () => {
      const agora = new Date();
      
      // Usa toLocaleString com timezone de Recife/Brasil
      const horaRecife = agora.toLocaleString('pt-BR', {
        timeZone: 'America/Recife',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      setHoraFormatada(horaRecife);
    };

    atualizarHora();
    const timer = setInterval(atualizarHora, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-white/5 px-4 py-2 backdrop-blur-md">
      <Clock className="w-4 h-4 text-cyan-300 animate-pulse" />
      <div className="text-sm">
        <p className="font-semibold text-slate-100 capitalize">{horaFormatada}</p>
        <p className="text-xs text-cyan-200/80">Horário de Recife, Brasil (GMT-3)</p>
      </div>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [configOpen, setConfigOpen] = useState(false);

  const isPublicPage = location.pathname.startsWith("/OnboardingPublico") || location.pathname.startsWith("/AgendamentoPublico") || location.pathname.startsWith("/FormularioStart") || currentPageName === "AgendamentoPublico" || currentPageName === "OnboardingPublico" || currentPageName === "FormularioStart";

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
    enabled: !isPublicPage,
  });

  if (isPublicPage) {
    return <div className="app-theme min-h-screen">{children}</div>;
  }

  const isAfiliado = user?.tipo_conta === 'afiliado';

  const mainNavigationAdmin = [
    { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
    { title: "📅 Agenda", url: createPageUrl("Agenda"), icon: CalendarCheck },
    { title: "CRM / Funil", url: createPageUrl("CRM"), icon: TrendingUp },
    { title: "🤖 Chat IA", url: createPageUrl("ChatIA"), icon: MessageSquare },
    { title: "🦅 Clientes OpenClaw", url: createPageUrl("ClientesOpenClaw"), icon: MessageSquare },
    { title: "📢 Tráfego Pago", url: createPageUrl("Trafego"), icon: Megaphone },
    { title: "🎯 Pipeline IA", url: createPageUrl("PipelineIA"), icon: Bot },
    { title: "📊 Dashboard IA", url: createPageUrl("DashboardIA"), icon: LayoutDashboard },
    { title: "Agendar Reunião", url: createPageUrl("Agendar"), icon: Calendar },
    { title: "Todos Agendamentos", url: createPageUrl("Agendamentos"), icon: List },
    { title: "Negócios Fechados", url: createPageUrl("Negocios"), icon: Video },
    { title: "👥 Clientes", url: createPageUrl("Clientes"), icon: Users },
    { title: "🤝 Afiliados", url: createPageUrl("Afiliados"), icon: Users },
    { title: "📧 Emails", url: createPageUrl("Emails"), icon: Mail },
  ];

  const configNavigationAdmin = [
    { title: "🤖 Configurar IA", url: createPageUrl("ConfiguracoesIA") },
    { title: "📦 Importar Produtos", url: createPageUrl("ImportarProdutos") },
    { title: "💬 Gateway WhatsApp", url: createPageUrl("GerenciarWhatsApp") },
    { title: "📧 Disparos Email", url: createPageUrl("DisparosEmail") },
    { title: "📱 Disparos WhatsApp", url: createPageUrl("DisparosWhatsApp") },
    { title: "🧪 Testar WhatsApp", url: createPageUrl("TesteWhatsApp") },
    { title: "⏰ Configurar Cron Job", url: createPageUrl("ConfigurarCron") },
    { title: "📅 Google Calendar", url: createPageUrl("ConfigurarGoogleCalendar") },
    { title: "🌐 Código para Site", url: createPageUrl("CodigoEmbed") },
    { title: "📚 API / Chatbot", url: createPageUrl("APIDocumentacao") },
    { title: "🔧 Testar Stripe", url: createPageUrl("TesteStripe") },
    { title: "🔗 Testar Webhook", url: createPageUrl("TesteWebhook") },
    { title: "➕ Criar Conta Afiliado", url: createPageUrl("CriarContaAfiliado") },
    { title: "👤 Gerenciar Usuários", url: createPageUrl("GerenciarUsuarios") },
  ];

  const navigationItemsAfiliado = [
    { title: "📊 Meu Dashboard", url: createPageUrl("DashboardAfiliado"), icon: LayoutDashboard },
    { title: "📅 Minha Agenda", url: createPageUrl("AgendaAfiliado"), icon: CalendarCheck },
    { title: "🎯 Meu CRM", url: createPageUrl("CRMAfiliado"), icon: TrendingUp },
    { title: "📅 Agendar Reunião", url: createPageUrl("AgendarAfiliado"), icon: Calendar },
    { title: "📋 Meus Agendamentos", url: createPageUrl("AgendamentosAfiliado"), icon: List },
    { title: "💰 Meus Negócios", url: createPageUrl("NegociosAfiliado"), icon: Video },
    { title: "👥 Meus Clientes", url: createPageUrl("ClientesAfiliado"), icon: Users },
  ];

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <SidebarProvider>
      <div className="app-theme min-h-screen flex w-full">
        <ReminderAlert />
        <CompromissoAlert />
        <EmailNotification />
        <NovasMensagensAlert />
        
        <Sidebar className="border-r border-slate-500/30 bg-slate-950/75 backdrop-blur-xl">
          <SidebarHeader className="border-b border-slate-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f3ccc3a454aaec766ae684/2f46531d6_Untitleddesign34.png"
                alt="Glória Vendas"
                className="w-16 h-16 rounded-xl object-contain shadow-md"
              />
              <div>
                <h2 className="font-bold text-white text-lg">Glória Vendas</h2>
                <p className="text-xs text-slate-500">
                  {isAfiliado ? '🤝 Painel do Afiliado' : 'Sistema de Vendas'}
                </p>
              </div>
            </div>
            <RelogioBrasil />
            {user && (
              <div className="mt-3 rounded-lg border border-cyan-400/30 bg-white/5 p-3 backdrop-blur-md">
                <p className="text-xs font-semibold text-slate-100">{user.display_name || user.full_name}</p>
                <p className="text-xs text-cyan-200/80">{user.email}</p>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  Sair do Sistema
                </Button>
              </div>
            )}
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Navegação
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {(isAfiliado ? navigationItemsAfiliado : mainNavigationAdmin).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`rounded-xl mb-1 transition-all duration-200 hover:bg-white/10 hover:text-cyan-200 ${
                          location.pathname === item.url ? 'border border-cyan-400/40 bg-cyan-400/15 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.22)] hover:bg-cyan-400/20 hover:text-white' : 'text-slate-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  {!isAfiliado && (
                    <SidebarMenuItem>
                      <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton 
                            className="hover:bg-slate-100 transition-all duration-200 rounded-xl mb-1 px-4 py-3"
                          >
                            <Settings className="w-5 h-5" />
                            <span className="font-medium flex-1">⚙️ Configurações</span>
                            {configOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4 space-y-1">
                          {configNavigationAdmin.map((item) => (
                            <SidebarMenuButton
                              key={item.title}
                              asChild
                              className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg text-sm ${
                                location.pathname === item.url ? 'bg-blue-100 text-blue-700 font-semibold' : ''
                              }`}
                            >
                              <Link to={item.url} className="flex items-center gap-2 px-3 py-2">
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-500/30 bg-slate-950/80 px-6 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f3ccc3a454aaec766ae684/2f46531d6_Untitleddesign34.png"
                  alt="Glória Vendas"
                  className="w-10 h-10 rounded object-contain"
                />
                <h1 className="text-xl font-bold text-white">Glória Vendas</h1>
              </div>
              {user && (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sair
                </Button>
              )}
            </div>
            <div className="mt-3">
              <RelogioBrasil />
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-slate-950/35">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}