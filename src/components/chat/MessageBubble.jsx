import React from 'react';
import { Bot, User, Check, CheckCheck, Clock, AlertCircle, FileText, Image, Mic, Video } from 'lucide-react';
import { cn } from "@/lib/utils";

const statusIcons = {
  sent: <Check className="w-3 h-3" />,
  delivered: <CheckCheck className="w-3 h-3" />,
  read: <CheckCheck className="w-3 h-3 text-blue-500" />,
  failed: <AlertCircle className="w-3 h-3 text-red-500" />,
  pending: <Clock className="w-3 h-3" />
};

export default function MessageBubble({ message, isOpenClaw = false }) {
  const isOutbound = message.direction === 'outbound';
  const isAI = message.sender === 'ai';
  
  const renderMedia = () => {
    if (!message.media_url) return null;
    
    switch (message.type) {
      case 'image':
        return (
          <img 
            src={message.media_url} 
            alt="Imagem" 
            className="max-w-full rounded-lg mb-2 max-h-60 object-cover"
          />
        );
      case 'video':
        return (
          <video 
            src={message.media_url} 
            controls 
            className="max-w-full rounded-lg mb-2 max-h-60"
          />
        );
      case 'audio':
        return (
          <audio 
            src={message.media_url} 
            controls 
            className="w-full mb-2"
          />
        );
      case 'document':
        return (
          <a 
            href={message.media_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-100 rounded-lg p-3 mb-2 hover:bg-slate-200 transition-colors"
          >
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-medium text-slate-700">Documento</p>
              <p className="text-xs text-slate-500">Clique para abrir</p>
            </div>
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "flex mb-4 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-700 [transform-style:preserve-3d]",
      isOutbound ? "justify-end [transform:translateZ(34px)]" : "justify-start [transform:translateZ(18px)]"
    )}>
      <div className={cn(
        "relative max-w-[72%] rounded-xl border px-4 py-3 backdrop-blur-xl transition-all duration-300 after:pointer-events-none after:absolute after:inset-x-3 after:-bottom-2 after:h-3 after:rounded-b-xl after:bg-slate-950/75 after:blur-[1px] hover:-translate-y-2 hover:scale-[1.015] hover:[transform:translateZ(42px)_rotateX(-2deg)]",
        isOutbound 
          ? isAI 
            ? isOpenClaw
              ? "border-red-300/70 bg-red-950/65 text-white shadow-[0_18px_38px_rgba(0,0,0,0.48),0_0_22px_rgba(248,113,113,0.3),inset_0_1px_0_rgba(255,255,255,0.14)] rounded-br-sm"
              : "border-cyan-200/80 bg-cyan-950/90 text-slate-50 shadow-[0_18px_38px_rgba(0,0,0,0.5),0_0_24px_rgba(34,211,238,0.38),inset_0_1px_0_rgba(255,255,255,0.16)] rounded-br-sm"
              : "border-slate-400/50 bg-slate-800/80 text-white shadow-[0_18px_36px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-br-sm"
              : "border-cyan-300/45 bg-slate-950/90 text-slate-100 shadow-[0_16px_34px_rgba(0,0,0,0.5),0_0_18px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-bl-sm",
        isOutbound
          ? "[transform:translateZ(28px)_rotateY(-3deg)_rotateX(1deg)]"
          : "[transform:translateZ(28px)_rotateY(3deg)_rotateX(1deg)]"
      )}>
        {isOutbound && (
          <div className={cn(
            "flex items-center gap-1.5 text-[10px] mb-1",
            isAI ? (isOpenClaw ? "text-red-300" : "text-cyan-300") : "text-slate-300"
          )}>
            {isAI ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
            <span>{isAI ? (isOpenClaw ? 'OPENCLAW' : 'IA GLÓRIA') : (message.extracted_data?.sent_by || 'Atendente')}</span>
          </div>
        )}
        {!isOutbound && message.extracted_data?.sender_name && (
          <div className="flex items-center gap-1.5 text-[10px] mb-1 text-slate-500">
            <User className="w-3 h-3" />
            <span>{message.extracted_data.sender_name}</span>
          </div>
        )}
        
        {renderMedia()}
        
        {message.content && (
          <p className={cn(
            "text-sm whitespace-pre-wrap break-words",
            isOutbound ? "text-slate-50" : "text-slate-100"
          )}>
            {message.content}
          </p>
        )}
        
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1",
          isOutbound ? (isAI && !isOpenClaw ? "text-cyan-100/70" : "text-white/70") : "text-slate-400"
        )}>
          <span className="text-[10px]">
            {(() => {
              if (!message.created_date) return '';
              try {
                // Converte para Date UTC
                let date;
                if (message.created_date instanceof Date) {
                  date = message.created_date;
                } else if (typeof message.created_date === 'string') {
                  // Se a string não termina com Z, adiciona para forçar UTC
                  const dateStr = message.created_date.endsWith('Z') 
                    ? message.created_date 
                    : message.created_date + 'Z';
                  date = new Date(dateStr);
                } else {
                  date = new Date(message.created_date);
                }
                  
                if (isNaN(date.getTime())) {
                  console.error('Data inválida:', message.created_date);
                  return '';
                }
                
                // Converte para horário de Recife (UTC-3)
                return date.toLocaleTimeString('pt-BR', { 
                  timeZone: 'America/Recife',
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
              } catch (e) {
                console.error('Erro ao formatar horário:', e, message.created_date);
                return '';
              }
            })()}
          </span>
          {isOutbound && statusIcons[message.status || 'sent']}
        </div>
      </div>
    </div>
  );
}