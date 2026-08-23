import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Search, Trash2, ExternalLink, CheckCircle, Circle, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ClassificacaoEmail from "@/components/emails/ClassificacaoEmail";

export default function Emails() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [emailSelecionado, setEmailSelecionado] = useState(null);

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['emails-list'],
    queryFn: () => base44.entities.EmailNotificacao.list('-created_date'),
    initialData: [],
  });

  const marcarComoLidoMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailNotificacao.update(id, { lido: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails-list'] });
    },
  });

  const marcarComoNaoLidoMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailNotificacao.update(id, { lido: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails-list'] });
    },
  });

  const deletarEmailMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailNotificacao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails-list'] });
    },
  });

  const emailsFiltrados = emails.filter(email => 
    email.subject?.toLowerCase().includes(busca.toLowerCase()) ||
    email.from?.toLowerCase().includes(busca.toLowerCase()) ||
    email.text?.toLowerCase().includes(busca.toLowerCase())
  );

  const totalEmails = emails.length;
  const emailsNaoLidos = emails.filter(e => !e.lido).length;

  const openGmail = () => {
    window.open('https://mail.google.com/mail/u/adm@gloriavirtual.com/', '_blank');
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              📧 Emails Recebidos
            </h1>
            <p className="text-slate-600">
              Histórico completo de emails monitorados
            </p>
          </div>
          <Button 
            onClick={openGmail}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Abrir Gmail
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total de Emails</p>
                  <p className="text-3xl font-bold text-slate-900">{totalEmails}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Emails Não Lidos</p>
                  <p className="text-3xl font-bold text-orange-600">{emailsNaoLidos}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Circle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar por assunto, remetente ou texto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Emails List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="shadow-lg border-0">
              <CardContent className="p-8 text-center">
                <p className="text-slate-500">Carregando emails...</p>
              </CardContent>
            </Card>
          ) : emailsFiltrados.length === 0 ? (
            <Card className="shadow-lg border-0">
              <CardContent className="p-8 text-center">
                <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {busca ? "Nenhum email encontrado" : "Nenhum email recebido ainda"}
                </p>
              </CardContent>
            </Card>
          ) : (
            emailsFiltrados.map((email) => (
              <Card 
                key={email.id} 
                onClick={() => setEmailSelecionado(email)}
                className={`shadow-lg border-0 transition-all hover:shadow-xl cursor-pointer ${
                  !email.lido ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <CardContent className="p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">
                            {email.subject || 'Sem assunto'}
                          </h3>
                          <p className="text-sm text-slate-600 truncate">
                            De: {email.from}
                          </p>
                        </div>
                        {!email.lido && (
                          <Badge className="bg-blue-500 hover:bg-blue-600 flex-shrink-0">
                            Novo
                          </Badge>
                        )}
                      </div>
                      
                      {email.text && (
                        <p className="text-sm text-slate-700 line-clamp-2 ml-13 mb-3">
                          {email.text}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 ml-13">
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(email.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </Badge>
                        <ClassificacaoEmail email={email} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {email.lido ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => marcarComoNaoLidoMutation.mutate(email.id)}
                          className="h-9"
                        >
                          <Circle className="w-4 h-4 mr-1" />
                          Não Lido
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => marcarComoLidoMutation.mutate(email.id)}
                          className="h-9"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Marcar Lido
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletarEmailMutation.mutate(email.id)}
                        className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog para visualizar email completo */}
        <Dialog open={!!emailSelecionado} onOpenChange={() => setEmailSelecionado(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 pr-8">
                <Mail className="w-6 h-6 text-blue-600" />
                <span className="flex-1">{emailSelecionado?.subject || 'Sem assunto'}</span>
              </DialogTitle>
            </DialogHeader>
            {emailSelecionado && (
              <div className="space-y-4 py-4">
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">De:</p>
                      <p className="font-semibold text-slate-900">{emailSelecionado.from}</p>
                    </div>
                    <Badge variant={emailSelecionado.lido ? "secondary" : "default"}>
                      {emailSelecionado.lido ? 'Lido' : 'Não lido'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Recebido em:</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(emailSelecionado.created_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {emailSelecionado.classificacao_email && (
                  <div className="rounded-lg border border-cyan-400/30 bg-slate-950/40 p-4 space-y-2">
                    <p className="text-sm text-slate-600">Análise da IA:</p>
                    <ClassificacaoEmail email={emailSelecionado} mostrarAcao />
                    {emailSelecionado.motivo_necessita_humano && (
                      <p className="text-xs text-amber-200">{emailSelecionado.motivo_necessita_humano}</p>
                    )}
                    {emailSelecionado.decisor_indicado && (
                      <p className="text-xs text-cyan-100">Responsável indicado: {emailSelecionado.decisor_indicado}</p>
                    )}
                    {emailSelecionado.retomar_em && (
                      <p className="text-xs text-cyan-100">
                        Retomar contato em: {format(new Date(emailSelecionado.retomar_em), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Conteúdo do Email:</h4>
                  <div className="bg-white border rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {emailSelecionado.text || 'Este email não possui conteúdo de texto.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={openGmail}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir no Gmail
                  </Button>
                  {emailSelecionado.lido ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        marcarComoNaoLidoMutation.mutate(emailSelecionado.id);
                        setEmailSelecionado(null);
                      }}
                    >
                      <Circle className="w-4 h-4 mr-2" />
                      Marcar como Não Lido
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        marcarComoLidoMutation.mutate(emailSelecionado.id);
                        setEmailSelecionado(null);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Lido
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      deletarEmailMutation.mutate(emailSelecionado.id);
                      setEmailSelecionado(null);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}