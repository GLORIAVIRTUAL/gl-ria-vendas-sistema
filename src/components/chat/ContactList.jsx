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
    const dateStr = date.endsWith('Z') ? date : date + 'Z';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const brasiliaTime = new Date(d.getTime() - (3 * 60 * 60 * 1000));
    if (isToday(brasiliaTime)) {
      return brasiliaTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (isYesterday(brasiliaTime)) return 'Ontem';
    return format(brasiliaTime, 'dd/MM', { locale: ptBR });
  } catch (e) {
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
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">Nenhuma conversa ainda</p>
          </div>
        ) : (
          contacts.map((contact) => {
            const unread = unreadCounts[contact.id] || 0;
            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer transition-all border-b border-slate-100",
                  "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50",
                  selectedContact?.id === contact.id && "bg-gradient-to-r from-blue-100 to-cyan-100 border-l-4 border-l-blue-500"
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                    <AvatarImage src={contact.profile_picture} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold">
                      {(contact.name || contact.phone || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {contact.ai_enabled ? (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
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
                    <h3 className="font-semibold text-slate-800 truncate">
                      {contact.name || contact.phone}
                    </h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                      {formatMessageTime(contact.last_message_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full text-white font-medium",
                        pipelineColors[contact.pipeline_stage] || 'bg-gray-400'
                      )}>
                        {pipelineLabels[contact.pipeline_stage] || 'Novo'}
                      </span>
                    </div>
                    
                    {unread > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 animate-pulse">
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