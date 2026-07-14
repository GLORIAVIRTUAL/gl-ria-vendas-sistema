import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User, MessageSquare } from 'lucide-react';
import { cn } from "@/lib/utils";

const formatMessageTime = (date) => {
  if (!date) return '';
  try {
    // Converte para Date UTC
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      // Se a string não termina com Z, adiciona para forçar UTC
      const dateStr = date.endsWith('Z') ? date : date + 'Z';
      d = new Date(dateStr);
    } else {
      d = new Date(date);
    }
    
    if (isNaN(d.getTime())) {
      console.error('Data inválida:', date);
      return '';
    }
    
    // Verifica se é hoje (no fuso de Recife)
    const now = new Date();
    const todayRecife = now.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' });
    const messageDateRecife = d.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' });
    
    if (todayRecife === messageDateRecife) {
      return d.toLocaleTimeString('pt-BR', { 
        timeZone: 'America/Recife',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Verifica se é ontem
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayRecife = yesterday.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' });
    
    if (yesterdayRecife === messageDateRecife) {
      return 'Ontem';
    }
    
    // Retorna data formatada
    return d.toLocaleDateString('pt-BR', { 
      timeZone: 'America/Recife',
      day: '2-digit', 
      month: '2-digit' 
    });
  } catch (e) {
    console.error('Erro ao formatar horário:', e, date);
    return '';
  }
};

const pipelineLabels = {
  novo_lead: 'Novo Lead',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado_ganho: 'Fechado',
  fechado_perdido: 'Perdido'
};

const pipelineColors = {
  novo_lead: 'bg-blue-500',
  qualificado: 'bg-cyan-500',
  proposta: 'bg-yellow-500',
  negociacao: 'bg-orange-500',
  fechado_ganho: 'bg-green-500',
  fechado_perdido: 'bg-gray-500'
};

export default function ContactList({ contacts, selectedContact, onSelectContact, unreadCounts = {} }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">Nenhuma conversa ainda</p>
          </div>
        ) : (
          contacts.map((contact) => {
            const unread = unreadCounts[contact.id] || 0;
            const isOpenClaw = contact.llm_destino === 'openclaw';
            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer transition-all border-b border-slate-700/60 border-l-2 border-l-transparent",
                  isOpenClaw
                    ? "hover:border-l-red-400 hover:bg-red-500/10"
                    : "hover:border-l-cyan-300 hover:bg-cyan-400/10",
                  selectedContact?.id === contact.id && (isOpenClaw
                    ? "border-l-red-400 bg-red-500/15 shadow-[inset_12px_0_24px_-20px_rgba(248,113,113,0.8)]"
                    : "border-l-cyan-300 bg-cyan-400/15 shadow-[inset_12px_0_24px_-20px_rgba(103,232,249,0.8)]")
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border border-cyan-200/40 bg-slate-900 shadow-[0_0_16px_rgba(34,211,238,0.12)]">
                    <AvatarImage src={contact.profile_picture} />
                    <AvatarFallback className={cn(
                      "font-semibold",
                      isOpenClaw ? "bg-red-500/20 text-red-100" : "bg-cyan-400/15 text-cyan-100"
                    )}>
                      {(contact.name || contact.phone || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {contact.ai_enabled ? (
                    <div className={cn(
                      "absolute -bottom-1 -right-1 rounded-full p-1",
                      isOpenClaw ? "bg-red-500" : "bg-blue-500"
                    )}>
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-100 truncate">
                      {contact.name || contact.phone}
                    </h3>
                    {contact.last_message_at && (
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                        {formatMessageTime(contact.last_message_at)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full text-white font-semibold ring-1 ring-white/10",
                        isOpenClaw ? "bg-red-500" : (pipelineColors[contact.pipeline_stage] || 'bg-gray-400')
                      )}>
                        {pipelineLabels[contact.pipeline_stage] || 'Novo'}
                      </span>
                    </div>
                    
                    {unread > 0 && (
                      <span className={cn(
                        "text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 animate-pulse",
                        isOpenClaw ? "bg-red-500" : "bg-blue-500"
                      )}>
                        {unread}
                      </span>
                    )}
                  </div>

                  {contact.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {contact.keywords.slice(0, 2).map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 border-blue-200 text-blue-600">
                          {kw}
                        </Badge>
                      ))}
                      {contact.keywords.length > 2 && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-200 text-slate-500">
                          +{contact.keywords.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}