import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, MessageSquare, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from 'sonner';

const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');

export default function NovasMensagensAlert() {
  const [alert, setAlert] = useState(null);
  const [displayedAlerts, setDisplayedAlerts] = useState(new Set());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const audioContextRef = useRef(null);
  const lastMessageIdRef = useRef(null);

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

  // Verifica permissão ao carregar e inicia automaticamente
  useEffect(() => {
    const checkPermission = async () => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        console.log('✅ Permissão já concedida, inicializando...');
        setAudioEnabled(true);
        
        // Já marca como habilitado para esconder o alerta
        setPushEnabled(true);
        
        // Registra o token em background
        try {
          const swUrl = window.location.origin + '/api/firebase-messaging-sw';
          const registration = await navigator.serviceWorker.register(swUrl);
          
          const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
          const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js');

          const app = initializeApp({
            apiKey: "AIzaSyDummyKey",
            projectId: "gloria-vendas",
            messagingSenderId: "19066612248",
            appId: "1:19066612248:web:1206105e95972329db316d"
          });

          const messaging = getMessaging(app);
          const vapidKey = 'BKSc-8HFhxU8ing4XxyGoUqtN8r5v5JQLP1OJ1mPmYTev_Yo1Nw2yZWCnKQaoGLZUhpYWvjCg4C7JjYlG41BRR4';
          const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
          
          if (token) {
            const user = await base44.auth.me();
            await base44.auth.updateMe({
              custom_fields: { ...user.custom_fields, fcm_token: token }
            });
            console.log('✅ Push configurado em background');
          }
        } catch (error) {
          console.error('⚠️ Erro ao configurar push:', error);
        }
      }
    };
    
    checkPermission();
  }, []);

  // Inicializa áudio context e push notifications
  const initNotifications = async () => {
    if (isLoading) return;
    setIsLoading(true);
    console.log('🚀 Iniciando notificações...');

    try {
      // Áudio
      console.log('🔊 Iniciando áudio...');
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setAudioEnabled(true);
      console.log('✅ Áudio habilitado');

      // Push Notifications
      console.log('🔔 Verificando permissão...');
      let permission = Notification.permission;
      console.log('📋 Permissão atual:', permission);
      
      // Só solicita se ainda não foi decidido
      if (permission === 'default') {
        console.log('⏳ Solicitando permissão ao usuário...');
        permission = await Notification.requestPermission();
        console.log('📋 Nova permissão:', permission);
      }
      
      if (permission === 'granted') {
        console.log('📝 Registrando Service Worker...');
        const swUrl = window.location.origin + '/api/firebase-messaging-sw';
        const registration = await navigator.serviceWorker.register(swUrl);
        console.log('✅ Service Worker registrado:', registration);

        console.log('🔥 Carregando Firebase...');
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
        const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js');

        console.log('🔥 Inicializando app Firebase...');
        const app = initializeApp({
          apiKey: "AIzaSyDummyKey",
          projectId: "gloria-vendas",
          messagingSenderId: "19066612248",
          appId: "1:19066612248:web:1206105e95972329db316d"
        });

        console.log('💬 Obtendo messaging...');
        const messaging = getMessaging(app);
        const vapidKey = 'BKSc-8HFhxU8ing4XxyGoUqtN8r5v5JQLP1OJ1mPmYTev_Yo1Nw2yZWCnKQaoGLZUhpYWvjCg4C7JjYlG41BRR4';

        console.log('🎫 Obtendo token FCM...');
        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
        console.log('🎫 Token recebido:', token ? 'SIM' : 'NÃO');
        
        if (token) {
          console.log('✅ FCM Token:', token.substring(0, 50) + '...');
          
          console.log('💾 Salvando token no usuário...');
          const user = await base44.auth.me();
          await base44.auth.updateMe({
            custom_fields: {
              ...user.custom_fields,
              fcm_token: token
            }
          });
          console.log('✅ Token salvo!');

          setPushEnabled(true);
          toast.success('🔔 Notificações push ativadas!');
        } else {
          console.warn('⚠️ Token não foi gerado');
          toast.warning('Token não foi gerado, tente novamente');
        }
      } else {
        console.log('❌ Permissão negada:', permission);
        // Se negou, pelo menos habilita áudio e explica como ativar push
        toast.error('Para receber notificações push, ative nas configurações do navegador (ícone 🔒 na barra de endereço)', {
          duration: 8000
        });
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar push:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      console.log('🏁 Finalizando...');
      setIsLoading(false);
    }
  };

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
        new Date(contact.created_date).getTime() > (Date.now() - 60000); // Criado nos últimos 60 segundos
      
      if (contactCreatedRecently) {
        setAlert({
          id: latestMessage.id,
          contact: contact,
          message: latestMessage,
          timestamp: new Date()
        });

        if (audioEnabled) {
          notificationSound.play().catch(() => {});
        }
      }

      setDisplayedAlerts(prev => new Set([...prev, latestMessage.id]));
      lastMessageIdRef.current = latestMessage.id;
    }
  }, [messages, contacts, audioEnabled, displayedAlerts]);

  const handleClose = () => {
    setAlert(null);
  };

  // Verifica se notificações estão bloqueadas
  const isBlocked = typeof Notification !== 'undefined' && Notification.permission === 'denied';

  if (!audioEnabled && !dismissed) {
    return (
      <div 
        className="fixed top-20 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 rounded-xl shadow-2xl max-w-sm"
        style={{ 
          zIndex: 999999, 
          pointerEvents: 'auto',
          position: 'fixed'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {isBlocked ? (
          <div>
            <div className="flex items-start gap-3 mb-3">
              <Bell className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg mb-1">🔊 Alertas Sonoros Ativos</p>
                <p className="text-sm opacity-90 mb-2">
                  ✅ Você ouvirá um som quando chegar mensagem
                </p>
                <p className="text-xs opacity-75 mb-2">
                  Push bloqueado - para desbloquear:
                </p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-xs space-y-1">
              <ol className="list-decimal list-inside space-y-1">
                <li>Clique no <strong>🔒</strong> ao lado da URL</li>
                <li>Mude "Notificações" para "Permitir"</li>
                <li>Pressione F5 para recarregar</li>
              </ol>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full mt-2 bg-white text-blue-600 hover:bg-gray-100 font-semibold px-3 py-2 rounded-lg text-sm"
            >
              ↻ Recarregar Página
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-3">
              <Bell className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg mb-1">🔔 Ativar Alertas</p>
                <p className="text-sm opacity-90">
                  Som + Notificações Push
                </p>
              </div>
            </div>
            <button 
              type="button"
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                initNotifications();
              }}
              className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? '⏳ Ativando...' : '▶ Ativar Agora'}
            </button>
          </>
        )}
      </div>
    );
  }

  if (!alert) return null;

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