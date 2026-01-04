import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PipelineBoard from '../components/crm/PipelineBoard';
import ContactDetails from '../components/chat/ContactDetails';
import { toast } from 'sonner';

export default function PipelineIA() {
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-last_message_at'),
    refetchInterval: 20000,
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const contact = contacts.find(c => c.id === draggableId);
    if (!contact) return;

    await updateContactMutation.mutateAsync({
      id: draggableId,
      data: { pipeline_stage: destination.droppableId }
    });

    toast.success(`${contact.name || 'Contato'} movido para ${destination.droppableId.replace(/_/g, ' ')}`);
  };

  const handleUpdateContact = async (data) => {
    if (!selectedContact) return;
    await updateContactMutation.mutateAsync({ id: selectedContact.id, data });
    setSelectedContact({ ...selectedContact, ...data });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex">
      <div className="flex-1 p-6 overflow-hidden">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Pipeline IA</h1>
          <p className="text-slate-500">Arraste os contatos entre as etapas do funil</p>
        </div>
        
        <PipelineBoard 
          contacts={contacts}
          onDragEnd={handleDragEnd}
          onSelectContact={setSelectedContact}
        />
      </div>

      {selectedContact && (
        <ContactDetails
          contact={selectedContact}
          onUpdate={handleUpdateContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
}