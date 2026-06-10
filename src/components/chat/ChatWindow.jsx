import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, Paperclip, Bot, User, 
  MoreVertical, X, Loader2, FileText, Trash2, CheckCircle2 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import MessageBubble from './MessageBubble';
import TemplateSelector from './TemplateSelector';
import { base44 } from '@/api/base44Client';

const pipelineStages = [
  { value: 'novo_lead', label: 'Novo Lead', color: 'bg-blue-500' },
  { value: 'qualificado', label: 'Qualificado', color: 'bg-cyan-500' },
  { value: 'proposta', label: 'Proposta', color: 'bg-yellow-500' },
  { value: 'negociacao', label: 'Negociação', color: 'bg-orange-500' },
  { value: 'fechado_ganho', label: 'Fechado (Ganho)', color: 'bg-green-500' },
  { value: 'fechado_perdido', label: 'Fechado (Perdido)', color: 'bg-gray-500' },
];

export default function ChatWindow({ 
  contact, 
  messages, 
  onSendMessage, 
  onUpdateContact,
  onClose,
  onDelete,
  isSending,
  currentUser
}) {
  const [newMessage, setNewMessage] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const isAdmin = currentUser?.role === 'admin';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() && !attachmentFile) return;
    
    let mediaUrl = null;
    let mediaType = 'text';

    if (attachmentFile) {
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: attachmentFile });
      mediaUrl = file_url;
      
      if (attachmentFile.type.startsWith('image/')) mediaType = 'image';
      else if (attachmentFile.type.startsWith('video/')) mediaType = 'video';
      else if (attachmentFile.type.startsWith('audio/')) mediaType = 'audio';
      else mediaType = 'document';
      
      setIsUploading(false);
    }

    await onSendMessage({
      content: newMessage,
      type: mediaType,
      media_url: mediaUrl,
      media_mime_type: attachmentFile?.type
    });
    
    setNewMessage('');
    setAttachmentFile(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  const handleAIToggle = (enabled) => {
    onUpdateContact({ ai_enabled: enabled });
  };

  const handlePipelineChange = (stage) => {
    onUpdateContact({ pipeline_stage: stage });
  };

  const handleFinishConversation = async () => {
    // Envia mensagem de encerramento via WhatsApp
    const finishMessage = "✅ *Conversa Finalizada*\n\nObrigado pelo seu contato! 🙏\n\nCaso precise de algo mais, é só enviar uma nova mensagem que iniciaremos um novo atendimento.\n\nAté breve! 👋";
    
    try {
      await onSendMessage({
        content: finishMessage,
        type: 'text'
      });
      
      // Só atualiza o contato APÓS enviar a mensagem com sucesso
      await onUpdateContact({ 
        ai_enabled: true, // Mantém IA ativa para próxima conversa
        is_active: false, // Marca como inativa para zerar contexto
        conversation_finished: true 
      });
    } catch (error) {
      console.error('Erro ao finalizar conversa:', error);
    }
  };

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-2xl">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_681fe32a55525de555018f29/7457ca111_Untitleddesign14.png" 
            alt="GLÓRIA"
            className="w-24 h-24 object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-slate-700 mb-2">GLÓRIA IA</h2>
        <p className="text-slate-500">Selecione uma conversa para começar</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-blue-200">
            <AvatarImage src={contact.profile_picture} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              {(contact.name || contact.phone || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-slate-800">{contact.name || contact.phone}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{contact.phone}</span>
              <Badge variant="outline" className={cn(
                "text-[10px] py-0",
                pipelineStages.find(s => s.value === contact.pipeline_stage)?.color,
                "text-white border-none"
              )}>
                {pipelineStages.find(s => s.value === contact.pipeline_stage)?.label || 'Novo'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5">
            <User className={cn("w-4 h-4", !contact.ai_enabled ? "text-green-500" : "text-slate-400")} />
            <Switch 
              checked={contact.ai_enabled}
              onCheckedChange={handleAIToggle}
              className="data-[state=checked]:bg-blue-500"
            />
            <Bot className={cn("w-4 h-4", contact.ai_enabled ? "text-blue-500" : "text-slate-400")} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="font-medium text-slate-500">
                Mover para:
              </DropdownMenuItem>
              {pipelineStages.map((stage) => (
                <DropdownMenuItem 
                  key={stage.value}
                  onClick={() => handlePipelineChange(stage.value)}
                  className="gap-2"
                >
                  <span className={cn("w-2 h-2 rounded-full", stage.color)} />
                  {stage.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-green-600 font-semibold" 
                onClick={handleFinishConversation}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                ✅ Finalizar Conversa
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-500" onClick={onClose}>
                Fechar janela
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem 
                  className="text-red-600 font-semibold" 
                  onClick={onDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir conversa
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <TemplateSelector contact={contact} onSent={() => {}} />
        <div className="space-y-1">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOpenClaw={contact.llm_destino === 'openclaw'} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {attachmentFile && (
        <div className="mx-4 mb-2 p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
          {attachmentFile.type.startsWith('image/') ? (
            <img 
              src={URL.createObjectURL(attachmentFile)} 
              alt="Preview" 
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-sm truncate">{attachmentFile.name}</p>
            <p className="text-xs text-slate-500">{(attachmentFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setAttachmentFile(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
          />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-500 hover:text-blue-500"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="min-h-[44px] max-h-32 resize-none pr-12 rounded-2xl border-slate-200 focus:border-blue-400"
              rows={1}
            />
          </div>

          <Button 
            onClick={handleSend}
            disabled={(!newMessage.trim() && !attachmentFile) || isSending || isUploading}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-full h-11 w-11 p-0"
          >
            {isSending || isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}