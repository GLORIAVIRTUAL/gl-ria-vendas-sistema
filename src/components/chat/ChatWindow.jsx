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
      "relative flex-1 flex flex-col h-full overflow-hidden bg-slate-950",
      isOpenClaw ? "shadow-[inset_0_1px_0_rgba(248,113,113,0.18)]" : "shadow-[inset_0_1px_0_rgba(103,232,249,0.18)]"
    )}>
      <div className="relative z-20 grid grid-cols-1 gap-4 border-b border-cyan-300/25 bg-slate-950/90 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:grid-cols-[220px_1fr_auto] lg:px-6 lg:py-4">
        <div className="border-r border-cyan-300/20 pr-5">
          <p className="font-heading text-xl font-bold tracking-tight text-cyan-300">GLÓRIA IA</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{contact.name || contact.phone}</p>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => handleAIToggle(true)} className="rounded-md border border-emerald-400/35 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.18)]">● IA ativa</button>
            <button className="rounded-md border border-red-400/35 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 shadow-[0_0_16px_rgba(248,113,113,0.18)]">● OpenClaw ativa</button>
            <button onClick={() => handleAIToggle(false)} className="rounded-md border border-slate-500/40 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300">● Atendimento manual</button>
          </div>
          <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] text-slate-400">Mover para:</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {pipelineStages.map((stage) => (
                <button key={stage.value} onClick={() => handlePipelineChange(stage.value)} className="text-xs font-medium text-slate-100 transition-colors hover:text-cyan-300">
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 border-l border-cyan-300/20 pl-4 text-xs">
          <button onClick={handleFinishConversation} className="font-semibold text-red-300 hover:text-red-200">Finalizar conversa</button>
          <button onClick={onClose} className="font-semibold text-slate-200 hover:text-cyan-200">Fechar janela</button>
          {isAdmin && <button onClick={onDelete} className="font-semibold text-red-400 hover:text-red-300">Excluir conversa</button>}
        </div>
      </div>

      <div
        className="relative flex-1 overflow-y-auto bg-slate-950/50 px-4 pb-28 pt-5 bg-blend-overlay before:absolute before:inset-0 before:bg-slate-950/30 md:px-8"
        style={{
          backgroundImage: "url('https://media.base44.com/images/public/68f3ccc3a454aaec766ae684/e72093d7d_generated_image.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          perspective: '1200px'
        }}
      >
        <div className="relative z-10 mx-auto max-w-4xl animate-in fade-in duration-700">
          <TemplateSelector contact={contact} onSent={() => {}} />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl space-y-3 [transform-style:preserve-3d]">
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

      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-cyan-300/15 bg-slate-950/55 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-cyan-300/45 bg-cyan-400/10 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.55),0_0_26px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] [transform:translateZ(36px)]">
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
              className="min-h-[44px] max-h-32 resize-none rounded-xl border-cyan-300/35 bg-slate-950/45 pr-12 text-slate-100 shadow-[inset_0_0_24px_rgba(34,211,238,0.08)] placeholder:text-slate-400 focus:border-cyan-300 focus:ring-cyan-300"
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