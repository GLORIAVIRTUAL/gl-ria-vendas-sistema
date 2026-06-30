import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, BellOff, RefreshCw, Info } from 'lucide-react';
import ContactList from '../components/chat/ContactList';
import ChatWindow from '../components/chat/ChatWindow';
import ContactDetails from '../components/chat/ContactDetails';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

export default function ChatIA() {
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [llmFilter, setLlmFilter] = useState('atual');
  const [isSending, setIsSending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const lastMessageCountRef = useRef({});
  
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: contacts = [], isLoading: loadingContacts, error: contactsError, refetch: refetchContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-last_message_at'),
    refetchInterval: 5000,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedContact?.id],
    queryFn: () => selectedContact 
      ? base44.entities.Message.filter({ contact_id: selectedContact.id }, 'created_date')
      : [],
    enabled: !!selectedContact,
    refetchInterval: 3000,
  });

  useEffect(() => {
    contacts.forEach(contact => {
      const currentCount = messages.filter(m => m.contact_id === contact.id && m.direction === 'inbound').length;
      const lastCount = lastMessageCountRef.current[contact.id] || 0;
      
      if (currentCount > lastCount && lastCount > 0 && notificationsEnabled) {
        notificationSound.play().catch(() => {});
        toast.info(`Nova mensagem de ${contact.name || contact.phone}`, {
          duration: 5000,
        });
      }
      lastMessageCountRef.current[contact.id] = currentCount;
    });
  }, [contacts, messages, notificationsEnabled]);

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contato atualizado!');
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedContact?.id] });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId) => {
      const msgs = await base44.entities.Message.filter({ contact_id: contactId });
      await Promise.all(msgs.map(m => base44.entities.Message.delete(m.id)));
      await base44.entities.Contact.delete(contactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSelectedContact(null);
      setDeleteDialogOpen(false);
      toast.success('Conversa excluída com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir conversa');
    }
  });

  const handleSelectContact = useCallback((contact) => {
    setSelectedContact(contact);
    setUnreadCounts(prev => ({ ...prev, [contact.id]: 0 }));
  }, []);

  // Seleciona o contato automaticamente a partir do parâmetro ?contact= na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contactId = params.get('contact');
    if (contactId && contacts.length > 0 && selectedContact?.id !== contactId) {
      const found = contacts.find(c => c.id === contactId);
      if (found) {
        setSelectedContact(found);
        setUnreadCounts(prev => ({ ...prev, [found.id]: 0 }));
      }
    }
  }, [contacts]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendMessage = async (messageData) => {
    if (!selectedContact) return;
    setIsSending(true);
    
    try {
      // Salva mensagem no banco com nome do atendente
      const savedMessage = await createMessageMutation.mutateAsync({
        contact_id: selectedContact.id,
        direction: 'outbound',
        sender: 'human',
        content: messageData.content,
        type: messageData.type || 'text',
        media_url: messageData.media_url,
        media_mime_type: messageData.media_mime_type,
        status: 'sent',
        extracted_data: { sent_by: currentUser?.full_name || currentUser?.email }
      });

      // Envia via WhatsApp (Z-API)
      try {
        const result = await base44.functions.invoke('whatsapp/sendMessage', {
          telefone: selectedContact.phone,
          mensagem: messageData.content
        });

        if (result.status === 200 && result.data?.success) {
          console.log('✅ Mensagem enviada via Z-API');
          // Salva o messageId do Z-API para rastrear status (tracinhos)
          if (result.data.messageId && savedMessage?.id) {
            await base44.entities.Message.update(savedMessage.id, {
              whatsapp_message_id: result.data.messageId
            });
          }
        } else {
          console.error('❌ Erro ao enviar:', result.data);
          toast.error(result.data?.error || 'Erro ao enviar mensagem ao WhatsApp');
        }
      } catch (whatsappError) {
        console.error('❌ Erro ao enviar WhatsApp:', whatsappError);
        toast.error('Erro ao enviar mensagem ao WhatsApp');
      }

      await updateContactMutation.mutateAsync({
        id: selectedContact.id,
        data: { last_message_at: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
      refetchMessages();
    }
  };

  const handleUpdateContact = async (data) => {
    if (!selectedContact) return;
    await updateContactMutation.mutateAsync({ id: selectedContact.id, data });
    setSelectedContact({ ...selectedContact, ...data });
  };

  const handleDeleteContact = () => {
    if (selectedContact) {
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (selectedContact) {
      deleteContactMutation.mutate(selectedContact.id);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    const destino = contact.llm_destino || 'atual';
    const matchLlm = destino === llmFilter;
    const matchSearch =
      (contact.name?.toLowerCase().includes(searchLower)) ||
      (contact.phone?.includes(searchTerm)) ||
      (contact.keywords?.some(k => k.toLowerCase().includes(searchLower)));
    return matchLlm && matchSearch;
  });

  return (
    <div className="h-[calc(100vh-80px)] flex bg-slate-50">
      <div className="w-80 bg-white border-r border-slate-100 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Conversas IA</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={cn(
                  notificationsEnabled ? "text-blue-500" : "text-slate-400"
                )}
              >
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetchContacts()}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              onClick={() => { setLlmFilter('atual'); setSelectedContact(null); }}
              className={cn(
                "w-full",
                llmFilter === 'atual'
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              )}
            >
              🤖 IA Atual
            </Button>
            <Button
              onClick={() => { setLlmFilter('openclaw'); setSelectedContact(null); }}
              className={cn(
                "w-full",
                llmFilter === 'openclaw'
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-red-50 hover:bg-red-100 text-red-600"
              )}
            >
              🦅 OpenClaw
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {contactsError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-medium text-red-600 mb-1">Não foi possível carregar as conversas</p>
            <p className="text-xs text-slate-500 mb-4">Sua sessão pode ter expirado. Recarregue a página.</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar página
            </Button>
          </div>
        ) : (
          <ContactList 
            contacts={filteredContacts}
            selectedContact={selectedContact}
            onSelectContact={handleSelectContact}
            unreadCounts={unreadCounts}
          />
        )}
      </div>

      <ChatWindow
        contact={selectedContact}
        messages={messages}
        onSendMessage={handleSendMessage}
        onUpdateContact={handleUpdateContact}
        onClose={() => setSelectedContact(null)}
        onDelete={handleDeleteContact}
        isSending={isSending}
        currentUser={currentUser}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as mensagens e dados do contato serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedContact && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Info className="w-5 h-5" />
        </Button>
      )}

      {showDetails && selectedContact && (
        <ContactDetails
          contact={selectedContact}
          onUpdate={handleUpdateContact}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}