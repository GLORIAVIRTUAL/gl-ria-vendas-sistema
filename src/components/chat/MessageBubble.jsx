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

export default function MessageBubble({ message }) {
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
      "flex mb-3",
      isOutbound ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
        isOutbound 
          ? isAI 
            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-md" 
            : "bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-br-md"
          : "bg-white border border-slate-100 rounded-bl-md"
      )}>
        {isOutbound && (
          <div className={cn(
            "flex items-center gap-1.5 text-[10px] mb-1",
            isAI ? "text-blue-100" : "text-slate-300"
          )}>
            {isAI ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
            <span>{isAI ? 'IA GLÓRIA' : 'Atendente'}</span>
          </div>
        )}
        
        {renderMedia()}
        
        {message.content && (
          <p className={cn(
            "text-sm whitespace-pre-wrap break-words",
            isOutbound ? "text-white" : "text-slate-700"
          )}>
            {message.content}
          </p>
        )}
        
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1",
          isOutbound ? "text-white/70" : "text-slate-400"
        )}>
          <span className="text-[10px]">
            {(() => {
              if (!message.created_date) return '';
              try {
                const date = new Date(message.created_date);
                if (isNaN(date.getTime())) return '';
                return date.toLocaleTimeString('pt-BR', { 
                  timeZone: 'America/Recife',
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
              } catch (e) {
                return '';
              }
            })()}
          </span>
          {isOutbound && statusIcons[message.status || 'sent']}
        </div>

        {message.extracted_data && Object.keys(message.extracted_data).length > 0 && (
          <div className={cn(
            "mt-2 pt-2 border-t text-[10px]",
            isOutbound ? "border-white/20 text-white/70" : "border-slate-200 text-slate-500"
          )}>
            <span className="font-medium">Dados capturados:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(message.extracted_data).map(([key, value]) => (
                <span key={key} className="bg-white/20 px-2 py-0.5 rounded">
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}