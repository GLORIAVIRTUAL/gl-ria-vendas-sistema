import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, DollarSign, Building2, Pencil, ExternalLink, FileText, Eye, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const prioridadeCor = {
  Baixa: "bg-slate-100 text-slate-700",
  Media: "bg-yellow-100 text-yellow-700",
  Alta: "bg-red-100 text-red-700"
};

const statusOnboardingCor = {
  Nao_Iniciado: "bg-slate-100 text-slate-600",
  Em_Andamento: "bg-blue-100 text-blue-700",
  Aguardando_Cliente: "bg-yellow-100 text-yellow-700",
  Concluido: "bg-green-100 text-green-700"
};

export default function LeadCard({ lead, produtoConfig, isDragging, onEdit, onEnviarFormulario, onVerOnboarding, onDelete }) {
  // Busca o agendamento relacionado para pegar o link da reunião
  const { data: agendamento } = useQuery({
    queryKey: ['agendamento', lead.agendamento_id],
    queryFn: async () => {
      if (!lead.agendamento_id) return null;
      const agendamentos = await base44.entities.Agendamento.filter({ id: lead.agendamento_id });
      return agendamentos.length > 0 ? agendamentos[0] : null;
    },
    enabled: !!lead.agendamento_id,
  });

  const linkReuniao = agendamento?.link_reuniao;

  return (
    <Card className={`cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 ${
      isDragging ? 'shadow-2xl rotate-2 opacity-90' : ''
    }`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-1">{lead.nome_cliente}</h3>
            {lead.nome_empresa && (
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {lead.nome_empresa}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lead.prioridade && (
              <Badge className={`${prioridadeCor[lead.prioridade]} text-xs`}>
                {lead.prioridade}
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lead);
              }}
              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Tem certeza que deseja excluir o lead "${lead.nome_cliente}"?`)) {
                  onDelete(lead.id);
                }
              }}
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4" />
            <span className="truncate">{lead.email_cliente}</span>
          </div>
          {lead.telefone_cliente && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4" />
              <span>{lead.telefone_cliente}</span>
            </div>
          )}
          {lead.data_reuniao && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>{format(parseISO(lead.data_reuniao), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <Badge className={`${produtoConfig[lead.produto_interesse]?.cor} border w-full justify-center`}>
          {produtoConfig[lead.produto_interesse]?.nome}
        </Badge>

        {/* Status do Onboarding */}
        {lead.status_onboarding && (
          <Badge className={`${statusOnboardingCor[lead.status_onboarding]} border w-full justify-center text-xs`}>
            📋 {lead.status_onboarding === 'Nao_Iniciado' ? 'Não Iniciado' : 
                lead.status_onboarding === 'Em_Andamento' ? 'Em Andamento' :
                lead.status_onboarding === 'Aguardando_Cliente' ? 'Aguardando Cliente' : 'Concluído'}
          </Badge>
        )}

        {lead.valor_estimado && (
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <DollarSign className="w-4 h-4" />
            <span>R$ {lead.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        {/* Botão para ver onboarding - só mostra se estiver concluído */}
        {lead.status_onboarding === 'Concluido' && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onVerOnboarding(lead);
            }}
            className="w-full text-sm text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 h-9"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Dados do Onboarding
          </Button>
        )}

        {/* Botão para enviar formulário - só mostra se não estiver concluído */}
        {lead.status_onboarding !== 'Concluido' && lead.telefone_cliente && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onEnviarFormulario(lead);
            }}
            className="w-full text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 h-9"
          >
            <FileText className="w-4 h-4 mr-2" />
            Enviar Formulário
          </Button>
        )}

        {/* Link da reunião - USA O LINK DIRETO DO AGENDAMENTO */}
        {linkReuniao && lead.estagio === 'Reuniao_Marcada' && (
          <a
            href={linkReuniao}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 h-9"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Link da Reunião
            </Button>
          </a>
        )}

        {lead.data_entrega && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
            <p className="text-xs font-semibold text-orange-700">📅 Entrega prevista:</p>
            <p className="text-sm text-orange-900">{format(parseISO(lead.data_entrega), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
        )}

        {lead.proximos_passos && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <p className="text-xs font-semibold text-blue-700">📋 Próximos passos:</p>
            <p className="text-sm text-blue-900 line-clamp-2">{lead.proximos_passos}</p>
          </div>
        )}

        {lead.observacoes && (
          <p className="text-xs text-slate-500 line-clamp-2">
            {lead.observacoes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}