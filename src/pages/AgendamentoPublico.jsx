import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, User, Mail, Phone, Package, Calendar as CalendarIcon, AlertCircle, Loader2, PartyPopper } from "lucide-react";
import { format, isWeekend, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 🔓 PÁGINA PÚBLICA - Não requer autenticação
const produtoConfig = {
  gloria_atendente: { nome: "Glória Atendente", cor: "bg-blue-500", icon: "👤" },
  gloria_clinica: { nome: "Glória Clínica", cor: "bg-green-500", icon: "🏥" },
  maquina_de_videos: { nome: "Máquina de Vídeos", cor: "bg-purple-500", icon: "🎬" },
  gloria_financas: { nome: "Glória Finanças", cor: "bg-orange-500", icon: "💰" },
  avatar_ao_vivo: { nome: "Avatar ao Vivo", cor: "bg-pink-500", icon: "🎭" }
};

export default function AgendamentoPublico() {
  const [etapa, setEtapa] = useState(1);
  const [formData, setFormData] = useState({
    nome_cliente: "",
    email_cliente: "",
    telefone_cliente: "",
    nome_empresa: "",
    site_instagram_empresa: "",
    processo_resolver: "",
    produto: "",
    data: null,
    horario: "",
    observacoes: ""
  });
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const [linkReuniao, setLinkReuniao] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [verificandoHorarios, setVerificandoHorarios] = useState(false);
  const [agendando, setAgendando] = useState(false);

  const verificarDisponibilidade = async (data) => {
    if (!data) return;
    
    setVerificandoHorarios(true);
    setErro(null);

    try {
      const dataStr = format(data, 'yyyy-MM-dd');
      
      // Usa a origem atual (funciona em qualquer domínio onde o iframe está)
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/functions/verificardisponibilidade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: dataStr,
          api_key: "apiflskcjfjhsydkifms"
        })
      });

      const result = await response.json();

      if (response.ok && result?.horarios) {
        setHorariosDisponiveis(result.horarios);
      } else {
        setHorariosDisponiveis([]);
        setErro(result.message || "Erro ao verificar disponibilidade");
      }
    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error);
      setErro("Erro ao verificar disponibilidade: " + error.message);
      setHorariosDisponiveis([]);
    } finally {
      setVerificandoHorarios(false);
    }
  };

  useEffect(() => {
    if (formData.data) {
      verificarDisponibilidade(formData.data);
    }
  }, [formData.data]);

  const handleSubmit = async () => {
    setErro(null);
    setAgendando(true);

    if (!formData.nome_cliente || !formData.email_cliente || !formData.nome_empresa || !formData.site_instagram_empresa || !formData.processo_resolver || !formData.produto || !formData.data || !formData.horario) {
      setErro("Por favor, preencha todos os campos obrigatórios");
      setAgendando(false);
      return;
    }

    if (!horariosDisponiveis.includes(formData.horario)) {
      setErro("Este horário não está disponível. Por favor, escolha outro.");
      setAgendando(false);
      return;
    }

    try {
      const dataStr = format(formData.data, 'yyyy-MM-dd');

      // Usa a origem atual
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/functions/agendarviachatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome_cliente: formData.nome_cliente,
          email_cliente: formData.email_cliente,
          telefone_cliente: formData.telefone_cliente,
          nome_empresa: formData.nome_empresa,
          site_instagram_empresa: formData.site_instagram_empresa,
          processo_resolver: formData.processo_resolver,
          produto: formData.produto,
          data: dataStr,
          horario: formData.horario,
          observacoes: formData.observacoes,
          api_key: "apiflskcjfjhsydkifms"
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSucesso(true);
        setLinkReuniao(result.agendamento?.link_reuniao || "");
      } else {
        setErro(result.message || result.error || "Erro ao criar agendamento");
      }
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      setErro("Erro ao criar agendamento: " + error.message);
    } finally {
      setAgendando(false);
    }
  };

  const isDateDisabled = (date) => {
    return isWeekend(date) || isBefore(date, startOfDay(new Date()));
  };

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <Card className="max-w-2xl w-full shadow-2xl border-0">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <PartyPopper className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                🎉 Reunião Agendada com Sucesso!
              </h1>
              <p className="text-lg text-slate-600">
                Sua reunião foi confirmada para:
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">{formData.nome_cliente}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                  <span className="text-slate-700">
                    {format(formData.data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="text-slate-700 font-mono font-bold">{formData.horario}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-orange-600" />
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {produtoConfig[formData.produto]?.nome}
                  </Badge>
                </div>
              </div>
            </div>

            {linkReuniao && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  📧 Enviamos um email de confirmação com o link da reunião
                </p>
                <a
                  href={linkReuniao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg px-8 py-6 shadow-lg">
                    🎥 Acessar Link da Reunião
                  </Button>
                </a>
              </div>
            )}

            <div className="pt-6 border-t">
              <p className="text-sm text-slate-500">
                ✨ Obrigado por agendar conosco! Estamos ansiosos para conversar com você.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-8 md:py-16">
      <section
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[10px] border border-slate-700/70 bg-slate-950 bg-cover bg-center px-5 py-7 text-white shadow-2xl md:px-12 md:py-10"
        style={{ backgroundImage: "url('https://media.base44.com/images/public/68f3ccc3a454aaec766ae684/cdb261cb2_generated_image.png')" }}
      >
        <div className="absolute inset-0 bg-slate-950/35" />
        <div className="relative z-10">
          <header className="mb-5">
            <p className="mb-1 text-3xl font-semibold tracking-wide text-white md:text-4xl">GLÓRIA</p>
            <h1 className="text-2xl font-semibold text-white md:text-3xl">Agende sua Reunião</h1>
            <p className="mt-1 text-sm text-slate-200">Preencha os dados abaixo para marcar um horário</p>
          </header>

          <div className="mb-5 grid gap-3 md:grid-cols-3 md:gap-4">
            {[1, 2, 3, 4].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setEtapa(step)}
                className="group flex min-w-0 items-center gap-2 text-left"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm transition-all ${
                  etapa >= step
                    ? 'border-cyan-300 bg-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.7)]'
                    : 'border-slate-500 bg-slate-900/60 text-slate-200'
                }`}>
                  {etapa > step ? <Check className="h-4 w-4" /> : step}
                </span>
                <span className="whitespace-nowrap text-sm text-slate-100">
                  {step === 1 && 'Seus Dados'}
                  {step === 2 && 'Sua Empresa'}
                  {step === 3 && 'Escolher Produto'}
                  {step === 4 && 'Data e Hora'}
                </span>
                <span className={`ml-2 h-px min-w-4 flex-1 ${etapa >= step ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]' : 'bg-slate-600'} ${step === 4 ? 'md:hidden' : ''}`} />
              </button>
            ))}
          </div>

          {erro && (
            <Alert variant="destructive" className="mb-5 border-red-400/50 bg-red-950/70 text-red-100 backdrop-blur-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-4 lg:gap-5">
            <Card className={`border border-slate-400/50 bg-white/[0.08] text-white shadow-xl backdrop-blur-xl transition-all ${etapa === 1 ? 'ring-1 ring-cyan-400/70' : ''}`}>
              <CardContent className="p-5">
                <h2 className="mb-6 whitespace-nowrap text-lg font-semibold">Como podemos te contatar?</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome_cliente" className="mb-2 block text-sm font-normal text-slate-100">Nome Completo *</Label>
                    <Input
                      id="nome_cliente"
                      value={formData.nome_cliente}
                      onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})}
                      placeholder="Ex: João Silva"
                      className="h-10 border-slate-300/80 bg-slate-900/45 text-white placeholder:text-slate-300 focus-visible:border-cyan-300 focus-visible:ring-cyan-400/80 focus-visible:shadow-[0_0_14px_rgba(34,211,238,0.65)]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_cliente" className="mb-2 block text-sm font-normal text-slate-100">Email *</Label>
                    <Input
                      id="email_cliente"
                      type="email"
                      value={formData.email_cliente}
                      onChange={(e) => setFormData({...formData, email_cliente: e.target.value})}
                      placeholder="joao@email.com"
                      className="h-10 border-slate-300/80 bg-slate-900/45 text-white placeholder:text-slate-300 focus-visible:border-cyan-300 focus-visible:ring-cyan-400/80 focus-visible:shadow-[0_0_14px_rgba(34,211,238,0.65)]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone_cliente" className="mb-2 block text-sm font-normal text-slate-100">Telefone (opcional)</Label>
                    <Input
                      id="telefone_cliente"
                      value={formData.telefone_cliente}
                      onChange={(e) => setFormData({...formData, telefone_cliente: e.target.value})}
                      placeholder="(11) 99999-9999"
                      className="h-10 border-slate-300/80 bg-slate-900/45 text-white placeholder:text-slate-300 focus-visible:border-cyan-300 focus-visible:ring-cyan-400/80"
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button
                    onClick={() => setEtapa(2)}
                    disabled={!formData.nome_cliente || !formData.email_cliente}
                    className="h-10 bg-cyan-400 px-5 font-semibold text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.65)] hover:bg-cyan-300"
                  >
                    Próximo: Sua Empresa
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={`border border-slate-400/50 bg-white/[0.08] text-white shadow-xl backdrop-blur-xl transition-all ${etapa === 2 ? 'ring-1 ring-cyan-400/70' : ''}`}>
              <CardContent className="p-5">
                <h2 className="mb-1 text-lg font-semibold">Sua Empresa</h2>
                <p className="mb-4 text-sm text-slate-200">Conte-nos sobre o seu negócio.</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome_empresa" className="mb-2 block text-sm font-normal text-slate-100">Nome da Empresa *</Label>
                    <Input
                      id="nome_empresa"
                      value={formData.nome_empresa}
                      onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})}
                      placeholder="Ex: Empresa Glória"
                      className="h-10 border-slate-300/80 bg-slate-900/45 text-white placeholder:text-slate-300 focus-visible:border-cyan-300 focus-visible:ring-cyan-400/80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="site_instagram_empresa" className="mb-2 block text-sm font-normal text-slate-100">Site ou Instagram da Empresa *</Label>
                    <Input
                      id="site_instagram_empresa"
                      value={formData.site_instagram_empresa}
                      onChange={(e) => setFormData({...formData, site_instagram_empresa: e.target.value})}
                      placeholder="site.com.br ou @empresa"
                      className="h-10 border-slate-300/80 bg-slate-900/45 text-white placeholder:text-slate-300 focus-visible:border-cyan-300 focus-visible:ring-cyan-400/80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="processo_resolver" className="mb-2 block text-sm font-normal text-slate-100">Qual processo quer resolver? *</Label>
                    <Textarea
                      id="processo_resolver"
                      value={formData.processo_resolver}
                      onChange={(e) => setFormData({...formData, processo_resolver: e.target.value})}
                      placeholder="Descreva brevemente o processo"
                      rows={3}
                      className="border-slate-300/80 bg-slate-900/45 text-white placeholder:text-slate-300 focus-visible:ring-cyan-400/80"
                    />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button onClick={() => setEtapa(1)} variant="outline" className="h-10 border-slate-300 bg-transparent text-white hover:bg-white/10 hover:text-white">Voltar</Button>
                  <Button
                    onClick={() => setEtapa(3)}
                    disabled={!formData.nome_empresa || !formData.site_instagram_empresa || !formData.processo_resolver}
                    className="h-10 whitespace-nowrap bg-cyan-400 px-2 text-xs font-semibold text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.65)] hover:bg-cyan-300"
                  >
                    Próximo: Produto
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={`border border-slate-400/50 bg-white/[0.08] text-white shadow-xl backdrop-blur-xl transition-all ${etapa === 3 ? 'ring-1 ring-cyan-400/70' : ''}`}>
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold">Escolha o Produto</h2>
                <p className="mb-4 text-sm text-slate-200">Qual solução você deseja conhecer?</p>
                <div className="space-y-2">
                  {Object.entries(produtoConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({...formData, produto: key})}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                        formData.produto === key
                          ? 'border-cyan-300 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.7)]'
                          : 'border-slate-300/70 bg-slate-900/35 hover:border-cyan-300/70 hover:bg-white/10'
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full border ${formData.produto === key ? 'border-cyan-300 bg-cyan-400 ring-2 ring-cyan-400/25' : 'border-slate-300'}`} />
                      <span>{config.nome}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button onClick={() => setEtapa(2)} variant="outline" className="h-10 border-slate-300 bg-transparent text-white hover:bg-white/10 hover:text-white">Voltar</Button>
                  <Button
                    onClick={() => setEtapa(4)}
                    disabled={!formData.produto}
                    className="h-10 whitespace-nowrap bg-cyan-400 px-2 text-xs font-semibold text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.65)] hover:bg-cyan-300"
                  >
                    Próximo: Data e Hora
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={`border border-slate-400/50 bg-white/[0.08] text-white shadow-xl backdrop-blur-xl transition-all ${etapa === 4 ? 'ring-1 ring-cyan-400/70' : ''}`}>
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold">Data e Horário</h2>
                <p className="mb-4 text-sm text-slate-200">Quando você gostaria de conversar?</p>
                <div>
                  <Label className="mb-2 block text-sm font-normal text-slate-100">Escolha a Data *</Label>
                  <Calendar
                    mode="single"
                    selected={formData.data}
                    onSelect={(date) => setFormData({...formData, data: date, horario: ''})}
                    disabled={isDateDisabled}
                    locale={ptBR}
                    className="w-full rounded-lg border border-slate-300/70 bg-slate-950/55 p-2 text-white"
                    classNames={{
                      month: "space-y-2",
                      caption: "flex justify-center pt-0 relative items-center",
                      caption_label: "text-sm font-medium",
                      table: "w-full border-collapse",
                      head_row: "flex justify-between",
                      head_cell: "text-slate-400 rounded-md w-7 font-normal text-[0.7rem]",
                      row: "flex w-full justify-between mt-1",
                      cell: "h-7 w-7 text-center text-xs p-0 relative",
                      day: "h-7 w-7 p-0 font-normal aria-selected:opacity-100"
                    }}
                  />
                  <p className="mt-2 text-xs text-slate-300">* Apenas dias úteis (Segunda a Sexta)</p>
                </div>
                <div className="mt-4">
                  <Label className="mb-2 block text-sm font-normal text-slate-100">Escolha o Horário *</Label>
                  {verificandoHorarios ? (
                    <div className="flex h-24 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-300" /></div>
                  ) : formData.data ? (
                    <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {horariosDisponiveis.length > 0 ? horariosDisponiveis.map((horario) => (
                        <button
                          key={horario}
                          type="button"
                          onClick={() => setFormData({...formData, horario})}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${formData.horario === horario ? 'border-cyan-300 bg-cyan-400/15 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.6)]' : 'border-slate-400/60 bg-slate-900/40 text-slate-100 hover:border-cyan-300/70'}`}
                        >
                          {horario}
                        </button>
                      )) : <div className="col-span-2 rounded-lg border border-slate-600 bg-slate-800/70 p-3 text-center text-sm text-slate-300">Nenhum horário disponível para esta data</div>}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-600 bg-slate-800/70 p-3 text-center text-sm text-slate-300">Selecione uma data primeiro</div>
                  )}
                </div>
                <div className="mt-4">
                  <Label htmlFor="observacoes" className="mb-2 block text-sm font-normal text-slate-100">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    placeholder="Conte-nos mais sobre o que você precisa..."
                    rows={3}
                    className="border-slate-300/80 bg-slate-900/45 text-white placeholder:text-slate-300 focus-visible:ring-cyan-400/80"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.data || !formData.horario || agendando}
                  className="mt-5 h-10 w-full bg-cyan-400 font-semibold text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.65)] hover:bg-cyan-300"
                >
                  {agendando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Agendando...</> : <><Check className="mr-2 h-4 w-4" />Confirmar Agendamento</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}