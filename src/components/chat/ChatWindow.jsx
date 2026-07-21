import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, Paperclip,
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
import AudioRecorder from './AudioRecorder';
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
  const isOpenClaw = contact?.llm_destino === 'openclaw';

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
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/45">
        <div className="w-32 h-32 rounded-3xl border border-cyan-300/30 bg-cyan-400/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,211,238,0.16)] backdrop-blur-xl">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_681fe32a55525de555018f29/7457ca111_Untitleddesign14.png" 
            alt="GLÓRIA"
            className="w-24 h-24 object-contain"
          />
        </div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Central inteligente</p>
        <h2 className="font-heading text-2xl font-semibold text-slate-50 mb-2">GLÓRIA IA</h2>
        <p className="text-slate-400">Selecione uma conversa para começar</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 flex flex-col h-full bg-slate-950/45",
      isOpenClaw ? "shadow-[inset_0_1px_0_rgba(248,113,113,0.12)]" : "shadow-[inset_0_1px_0_rgba(103,232,249,0.12)]"
    )}>
      <div className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-cyan-400/20 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Avatar className={cn("h-10 w-10 border-2", isOpenClaw ? "border-red-200" : "border-blue-200")}>
            <AvatarImage src={contact.profile_picture} />
            <AvatarFallback className={cn(
              "text-white",
              isOpenClaw ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-blue-500 to-cyan-500"
            )}>
              {(contact.name || contact.phone || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-slate-50">{contact.name || contact.phone}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{contact.phone}</span>
              <Badge variant="outline" className={cn(
                "text-[10px] py-0",
                isOpenClaw ? "bg-red-500" : pipelineStages.find(s => s.value === contact.pipeline_stage)?.color,
                "text-white border-none"
              )}>
                {pipelineStages.find(s => s.value === contact.pipeline_stage)?.label || 'Novo'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-slate-600/60 bg-slate-900/70 rounded-full px-3 py-1.5">
            <span className={cn(
              "text-xs font-semibold whitespace-nowrap",
              contact.ai_enabled ? "text-cyan-200" : "text-amber-200"
            )}>
              {contact.ai_enabled
                ? `${isOpenClaw ? "OpenClaw" : "IA"} ativa`
                : "Atendimento manual"}
            </span>
            <Switch
              checked={contact.ai_enabled}
              onCheckedChange={handleAIToggle}
              aria-label={contact.ai_enabled ? "Desativar atendimento automático" : "Ativar atendimento automático"}
              className="data-[state=checked]:bg-cyan-400"
            />
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
                Finalizar conversa
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
        <div className="mx-4 mb-2 p-3 bg-slate-900/85 rounded-xl border border-cyan-400/20 flex items-center gap-3 backdrop-blur-xl">
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

      <div className="p-4 bg-slate-950/85 border-t border-cyan-400/20 backdrop-blur-xl">
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
            className="text-slate-400 hover:bg-cyan-400/10 hover:text-cyan-300"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <AudioRecorder onRecorded={(file) => setAttachmentFile(file)} isOpenClaw={isOpenClaw} />

          <div className="flex-1 relative">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="min-h-[44px] max-h-32 resize-none pr-12 rounded-2xl border-slate-600/70 bg-slate-900/70 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
              rows={1}
            />
          </div>

          <Button 
            onClick={handleSend}
            disabled={(!newMessage.trim() && !attachmentFile) || isSending || isUploading}
            className={cn(
              "rounded-full h-11 w-11 p-0",
              isOpenClaw
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                : "bg-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.32)] hover:bg-cyan-300"
            )}
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