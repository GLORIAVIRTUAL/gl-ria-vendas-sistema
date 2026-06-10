import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, MessageSquare, Bell, Calendar, UserCog } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from 'sonner';

const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');

export default function NovasMensagensAlert() {
  const [alert, setAlert] = useState(null);
  const [displayedAlerts, setDisplayedAlerts] = useState(new Set());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const lastAgendamentoIdRef = useRef(null);
  const transferidosVistosRef = useRef(new Set());
  const transferInitRef = useRef(false);

  const { data: messages = [] } = useQuery({
    queryKey: ['latest-messages'],
    queryFn: async () => {
      const msgs = await base44.entities.Message.list('-created_date', 10);
      return msgs.filter(m => m.direction === 'inbound' && m.sender === 'customer');
    },
    refetchInterval: 15000,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-alert'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['latest-agendamentos'],
    queryFn: () => base44.entities.Agendamento.list('-created_date', 10),
    refetchInterval: 15000,
  });

  const { data: transferidos = [] } = useQuery({
    queryKey: ['contatos-transferidos'],
    queryFn: async () => {
      const list = await base44.entities.Contact.list('-transferido_humano_at', 10);
      return list.filter(c => c.transferido_humano_at);
    },
    refetchInterval: 10000,
  });

  // Ativa áudio automaticamente no primeiro clique
  useEffect(() => {
    const handleFirstClick = async () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      setAudioEnabled(true);
      document.removeEventListener('click', handleFirstClick);
    };

    document.addEventListener('click', handleFirstClick);
    return () => document.removeEventListener('click', handleFirstClick);
  }, []);

  // Detecta novas mensagens (apenas PRIMEIRA mensagem do contato)
  useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[0];
    
    if (!lastMessageIdRef.current) {
      lastMessageIdRef.current = latestMessage.id;
      return;
    }

    if (latestMessage.id !== lastMessageIdRef.current && !displayedAlerts.has(latestMessage.id)) {
      const contact = contacts.find(c => c.id === latestMessage.contact_id);
      
      // Verifica se é a primeira mensagem deste contato (contato criado recentemente)
      const contactCreatedRecently = contact && 
        new Date(contact.created_date).getTime() > (Date.now() - 60000);
      
      if (contactCreatedRecently) {
        setAlert({
          id: latestMessage.id,
          type: 'message',
          contact: contact,
          message: latestMessage,
          timestamp: new Date()
        });

        // Toca som
        if (audioEnabled) {
          notificationSound.play().catch(() => {});
        }
      }

      setDisplayedAlerts(prev => new Set([...prev, latestMessage.id]));
      lastMessageIdRef.current = latestMessage.id;
    }
  }, [messages, contacts, audioEnabled, displayedAlerts]);

  // Detecta novos agendamentos
  useEffect(() => {
    if (agendamentos.length === 0) return;

    const latestAgendamento = agendamentos[0];
    
    if (!lastAgendamentoIdRef.current) {
      lastAgendamentoIdRef.current = latestAgendamento.id;
      return;
    }

    if (latestAgendamento.id !== lastAgendamentoIdRef.current && !displayedAlerts.has('agendamento-' + latestAgendamento.id)) {
      // Verifica se foi criado recentemente (últimos 30 segundos)
      const createdRecently = new Date(latestAgendamento.created_date).getTime() > (Date.now() - 30000);
      
      if (createdRecently) {
        setAlert({
          id: 'agendamento-' + latestAgendamento.id,
          type: 'agendamento',
          agendamento: latestAgendamento,
          timestamp: new Date()
        });

        // Toca som
        if (audioEnabled) {
          notificationSound.play().catch(() => {});
        }
      }

      setDisplayedAlerts(prev => new Set([...prev, 'agendamento-' + latestAgendamento.id]));
      lastAgendamentoIdRef.current = latestAgendamento.id;
    }
  }, [agendamentos, audioEnabled, displayedAlerts]);

  // Detecta clientes transferidos para atendimento humano
  useEffect(() => {
    if (transferidos.length === 0) return;

    // Na primeira carga, apenas registra os existentes sem alertar
    if (!transferInitRef.current) {
      transferidos.forEach(c => transferidosVistosRef.current.add(c.id + c.transferido_humano_at));
      transferInitRef.current = true;
      return;
    }

    const novo = transferidos.find(c => {
      const key = c.id + c.transferido_humano_at;
      const recente = new Date(c.transferido_humano_at).getTime() > (Date.now() - 60000);
      return recente && !transferidosVistosRef.current.has(key);
    });

    if (novo) {
      transferidosVistosRef.current.add(novo.id + novo.transferido_humano_at);
      setAlert({
        id: 'transfer-' + novo.id + novo.transferido_humano_at,
        type: 'transfer',
        contact: novo,
        timestamp: new Date()
      });
      if (audioEnabled) {
        notificationSound.play().catch(() => {});
      }
    }
  }, [transferidos, audioEnabled]);

  const handleClose = () => {
    setAlert(null);
  };

  if (!alert) return null;

  if (alert.type === 'transfer') {
    return (
      <div className="fixed top-4 right-4 z-[100] bg-gradient-to-r from-orange-500 to-red-600 text-white p-5 rounded-xl shadow-2xl max-w-md animate-in slide-in-from-right duration-500 ring-4 ring-orange-300/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="bg-white/20 rounded-full p-3">
              <UserCog className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">🙋 Cliente quer um humano!</h3>
              <p className="text-sm opacity-90 mb-1">
                <span className="font-semibold">{alert.contact?.name || alert.contact?.phone}</span>
              </p>
              <p className="text-sm bg-white/10 rounded p-2">
                A IA foi desligada. Assuma a conversa manualmente.
              </p>
              <Link to={createPageUrl("ChatIA")}>
                <Button
                  className="mt-3 w-full bg-white text-red-600 hover:bg-gray-100"
                  size="sm"
                >
                  Atender Agora →
                </Button>
              </Link>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (alert.type === 'agendamento') {
    return (
      <div className="fixed top-4 right-4 z-[100] bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-5 rounded-xl shadow-2xl max-w-md animate-in slide-in-from-right duration-500">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="bg-white/20 rounded-full p-3">
              <Calendar className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">📅 Novo Agendamento!</h3>
              <p className="text-sm opacity-90 mb-1">
                <span className="font-semibold">{alert.agendamento.nome_cliente}</span>
              </p>
              <p className="text-sm bg-white/10 rounded p-2">
                📅 {new Date(alert.agendamento.data + 'T00:00:00').toLocaleDateString('pt-BR')}<br/>
                🕐 {alert.agendamento.horario}
              </p>
              <Link to={createPageUrl("Agendamentos")}>
                <Button 
                  className="mt-3 w-full bg-white text-blue-600 hover:bg-gray-100"
                  size="sm"
                >
                  Ver Agendamentos →
                </Button>
              </Link>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[100] bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-xl shadow-2xl max-w-md animate-in slide-in-from-right duration-500">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-white/20 rounded-full p-3">
            <MessageSquare className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">💬 Nova Mensagem!</h3>
            <p className="text-sm opacity-90 mb-1">
              <span className="font-semibold">{alert.contact?.name || alert.contact?.phone}</span>
            </p>
            <p className="text-sm bg-white/10 rounded p-2 line-clamp-2">
              {alert.message.content}
            </p>
            <Link to={createPageUrl("ChatIA")}>
              <Button 
                className="mt-3 w-full bg-white text-green-600 hover:bg-gray-100"
                size="sm"
              >
                Ver Conversa →
              </Button>
            </Link>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}