
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

    if (!formData.nome_cliente || !formData.email_cliente || !formData.produto || !formData.data || !formData.horario) {
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
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f3ccc3a454aaec766ae684/2f46531d6_Untitleddesign34.png"
            alt="Glória Vendas"
            className="w-24 h-24 mx-auto mb-4 rounded-xl shadow-lg object-contain"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Agende sua Reunião
          </h1>
          <p className="text-slate-600">
            Preencha os dados abaixo para marcar um horário
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={`flex items-center gap-2 ${etapa >= step ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  etapa >= step 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {etapa > step ? <Check className="w-6 h-6" /> : step}
                </div>
                <span className="hidden md:inline font-medium text-slate-700">
                  {step === 1 && "Seus Dados"}
                  {step === 2 && "Escolher Produto"}
                  {step === 3 && "Data e Hora"}
                </span>
              </div>
              {step < 3 && <div className={`w-12 h-1 rounded ${etapa > step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {erro && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-0">
          <CardContent className="p-6 md:p-8">
            {/* Etapa 1: Dados */}
            {etapa === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Seus Dados</h2>
                    <p className="text-sm text-slate-600">Como podemos te contatar?</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome_cliente" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Nome Completo *
                    </Label>
                    <Input
                      id="nome_cliente"
                      value={formData.nome_cliente}
                      onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})}
                      placeholder="Ex: João Silva"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email_cliente" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </Label>
                    <Input
                      id="email_cliente"
                      type="email"
                      value={formData.email_cliente}
                      onChange={(e) => setFormData({...formData, email_cliente: e.target.value})}
                      placeholder="joao@email.com"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefone_cliente" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Telefone (opcional)
                    </Label>
                    <Input
                      id="telefone_cliente"
                      value={formData.telefone_cliente}
                      onChange={(e) => setFormData({...formData, telefone_cliente: e.target.value})}
                      placeholder="(11) 99999-9999"
                      className="h-12"
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => setEtapa(2)}
                  disabled={!formData.nome_cliente || !formData.email_cliente}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold shadow-lg"
                >
                  Próximo: Escolher Produto
                </Button>
              </div>
            )}

            {/* Etapa 2: Produto */}
            {etapa === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Escolha o Produto</h2>
                    <p className="text-sm text-slate-600">Qual solução você deseja conhecer?</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(produtoConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setFormData({...formData, produto: key})}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
                        formData.produto === key
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{config.icon}</span>
                        <div className={`w-3 h-3 rounded-full ${config.cor}`}></div>
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg">{config.nome}</h3>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setEtapa(1)}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Voltar
                  </Button>
                  <Button 
                    onClick={() => setEtapa(3)}
                    disabled={!formData.produto}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg"
                  >
                    Próximo: Data e Hora
                  </Button>
                </div>
              </div>
            )}

            {/* Etapa 3: Data e Hora */}
            {etapa === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Data e Horário</h2>
                    <p className="text-sm text-slate-600">Quando você gostaria de conversar?</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-3 block font-semibold">Escolha a Data *</Label>
                    <Calendar
                      mode="single"
                      selected={formData.data}
                      onSelect={(date) => setFormData({...formData, data: date, horario: ""})}
                      disabled={isDateDisabled}
                      locale={ptBR}
                      className="rounded-xl border shadow-sm"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      * Apenas dias úteis (Segunda a Sexta)
                    </p>
                  </div>

                  <div>
                    <Label className="mb-3 block font-semibold">Escolha o Horário *</Label>
                    {verificandoHorarios ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    ) : formData.data ? (
                      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                        {horariosDisponiveis.length > 0 ? (
                          horariosDisponiveis.map((horario) => (
                            <button
                              key={horario}
                              onClick={() => setFormData({...formData, horario})}
                              className={`p-3 rounded-lg border-2 transition-all duration-200 font-semibold ${
                                formData.horario === horario
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <Clock className="w-4 h-4 inline mr-2" />
                              {horario}
                            </button>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-8 text-slate-500">
                            Nenhum horário disponível para esta data
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-slate-400">
                        Selecione uma data primeiro
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes" className="mb-2 block">
                    Observações (opcional)
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    placeholder="Conte-nos mais sobre o que você precisa..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setEtapa(2)}
                    variant="outline"
                    className="flex-1 h-12"
                    disabled={agendando}
                  >
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!formData.data || !formData.horario || agendando}
                    className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg"
                  >
                    {agendando ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Agendando...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Confirmar Agendamento
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
