import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Check, Clock, User, Mail, Phone, Calendar as CalendarIcon, AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isWeekend, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

const horarios = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

export default function Agendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [etapa, setEtapa] = useState(1);
  const [formData, setFormData] = useState({
    nome_cliente: "",
    email_cliente: "",
    telefone_cliente: "",
    data: null,
    horario: "",
    observacoes: ""
  });
  const [erro, setErro] = useState(null);
  const [criandoEvento, setCriandoEvento] = useState(false);
  const [processingStepMessage, setProcessingStepMessage] = useState("Criando reunião...");

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      setCriandoEvento(true);
      setErro(null);
      setProcessingStepMessage("Processando..."); // Initial message for the process

      try {
        const dataStr = format(data.data, 'yyyy-MM-dd');
        const startDateTime = `${dataStr}T${data.horario}:00`;
        const [hora, minuto] = data.horario.split(':');
        const endHora = String(parseInt(hora) + 1).padStart(2, '0');
        const endDateTime = `${dataStr}T${endHora}:${minuto}:00`;

        setProcessingStepMessage("Criando evento no Google Calendar..."); // Specific step message
        const response = await base44.functions.invoke('createGoogleCalendarEvent', {
          summary: `Reunião - ${data.nome_cliente}`,
          description: `Reunião com ${data.nome_cliente}\nEmail: ${data.email_cliente}\n\nObservações: ${data.observacoes || 'Nenhuma'}`,
          startDateTime,
          endDateTime,
          attendeeEmail: data.email_cliente,
          attendeeName: data.nome_cliente
        });

        if (response.status !== 200 || !response.data || response.data.error) {
          throw new Error(response.data?.message || response.data?.error || 'Erro ao criar evento');
        }

        setProcessingStepMessage("Registrando agendamento..."); // Specific step message
        const agendamento = await base44.entities.Agendamento.create({
          nome_cliente: data.nome_cliente,
          email_cliente: data.email_cliente,
          telefone_cliente: data.telefone_cliente,
          data: dataStr,
          horario: data.horario,
          observacoes: data.observacoes,
          link_reuniao: response.data.meetLink || '',
          status: "Agendada",
          origem: "Manual" // Added origin field
        });

        setProcessingStepMessage("Criando Lead no CRM..."); // Specific step message
        // Cria lead no CRM automaticamente
        await base44.entities.Lead.create({
          nome_cliente: data.nome_cliente,
          email_cliente: data.email_cliente,
          telefone_cliente: data.telefone_cliente,
          data_reuniao: dataStr,
          observacoes: data.observacoes,
          agendamento_id: agendamento.id,
          estagio: "Reuniao_Marcada",
          prioridade: "Media"
        });

        // Programar lembretes automáticos via WhatsApp
        if (data.telefone_cliente) {
          try {
            setProcessingStepMessage("Programando lembretes WhatsApp...");
            // Lembrete 24h antes
            await base44.functions.invoke('whatsapp/scheduleReminder', {
              agendamento_id: agendamento.id,
              horas_antes: 24
            });
            // Lembrete 1h antes
            await base44.functions.invoke('whatsapp/scheduleReminder', {
              agendamento_id: agendamento.id,
              horas_antes: 1
            });
            console.log('✅ Lembretes WhatsApp programados!');
          } catch (error) {
            console.error('⚠️ Erro ao programar lembretes WhatsApp:', error);
            // Não quebra o fluxo se falhar
          }
        }

        // 📧 NOVO: Programar emails automáticos
        try {
          setProcessingStepMessage("Enviando email de confirmação...");
          // Email de confirmação IMEDIATO
          await base44.functions.invoke('email/scheduleReminder', {
            agendamento_id: agendamento.id,
            horas_antes: 0,
            tipo: 'Confirmacao'
          });
          
          setProcessingStepMessage("Programando lembrete por email...");
          // Email de lembrete 2 horas antes
          await base44.functions.invoke('email/scheduleReminder', {
            agendamento_id: agendamento.id,
            horas_antes: 2,
            tipo: 'Lembrete'
          });
          
          console.log('✅ Emails programados com sucesso!');
        } catch (error) {
          console.error('⚠️ Erro ao programar emails:', error);
        }

        console.log('✅ Agendamento criado! Link da reunião:', response.data.meetLink);

        return agendamento;
      } catch (error) {
        console.error("Erro completo:", error);
        console.error("Resposta do erro:", error.response?.data);
        
        let mensagemErro = 'Erro desconhecido ao criar reunião';
        
        if (error.response?.data?.message) {
          mensagemErro = error.response.data.message;
        } else if (error.response?.data?.error) {
          mensagemErro = error.response.data.error;
        } else if (error.message) {
          mensagemErro = error.message;
        }
        
        throw new Error(mensagemErro);
      } finally {
        setCriandoEvento(false);
        setProcessingStepMessage("Criando reunião..."); // Reset message after process
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // Invalidate leads query as well
      navigate(createPageUrl("Dashboard"));
    },
    onError: (error) => {
      console.error("Erro na mutation:", error);
      setErro(error.message);
      setCriandoEvento(false);
      setProcessingStepMessage("Criando reunião..."); // Reset message on error
    }
  });

  const verificarDisponibilidade = (data, horario) => {
    if (!data || !horario) return true;
    
    const dataStr = format(data, 'yyyy-MM-dd');
    return !agendamentos.some(ag => 
      ag.data === dataStr && 
      ag.horario === horario && 
      ag.status !== "Cancelada"
    );
  };

  const handleSubmit = async () => {
    setErro(null);

    if (!formData.nome_cliente || !formData.email_cliente || !formData.data || !formData.horario) {
      setErro("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!verificarDisponibilidade(formData.data, formData.horario)) {
      setErro("Este horário já está ocupado. Por favor, escolha outro.");
      return;
    }
    
    createMutation.mutate(formData);
  };

  const isDateDisabled = (date) => {
    return isWeekend(date) || isBefore(date, startOfDay(new Date()));
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Agendar Nova Reunião</h1>
            <p className="text-slate-600 mt-1">Preencha os dados para criar um agendamento</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {[1, 2].map((step) => (
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
                  {step === 1 && "Cliente"}
                  {step === 2 && "Data e Hora"}
                </span>
              </div>
              {step < 2 && <div className={`w-12 h-1 rounded ${etapa > step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {erro && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {criandoEvento && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-900">
              {processingStepMessage}
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-0">
          <CardContent className="p-6 md:p-8">
            {/* Etapa 1: Dados do Cliente */}
            {etapa === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Dados do Cliente</h2>
                    <p className="text-sm text-slate-600">Informações de contato</p>
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
                      Telefone
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
                  disabled={!formData.nome_cliente || !formData.email_cliente || criandoEvento}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold shadow-lg"
                >
                  Próximo: Data e Hora
                </Button>
              </div>
            )}

            {/* Etapa 2: Data e Horário */}
            {etapa === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Data e Horário</h2>
                    <p className="text-sm text-slate-600">Escolha quando será a reunião</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-3 block font-semibold">Escolha a Data *</Label>
                    <Calendar
                      mode="single"
                      selected={formData.data}
                      onSelect={(date) => setFormData({...formData, data: date})}
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
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                      {horarios.map((horario) => {
                        const disponivel = verificarDisponibilidade(formData.data, horario);
                        return (
                          <button
                            key={horario}
                            onClick={() => disponivel && setFormData({...formData, horario})}
                            disabled={!disponivel || !formData.data || criandoEvento}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 font-semibold ${
                              formData.horario === horario
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : disponivel && formData.data
                                ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <Clock className="w-4 h-4 inline mr-2" />
                            {horario}
                          </button>
                        );
                      })}
                    </div>
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
                    placeholder="Adicione informações extras sobre a reunião..."
                    rows={3}
                    disabled={criandoEvento}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setEtapa(1)}
                    variant="outline"
                    className="flex-1 h-12"
                    disabled={criandoEvento}
                  >
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!formData.data || !formData.horario || createMutation.isPending || criandoEvento}
                    className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg"
                  >
                    {criandoEvento || createMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {processingStepMessage}
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