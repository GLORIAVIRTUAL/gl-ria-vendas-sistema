import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X, ExternalLink, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function EmailNotification() {
  const [dismissed, setDismissed] = useState(new Set());
  const [emailsExibidos, setEmailsExibidos] = useState(new Set());
  const [audioContext, setAudioContext] = useState(null);
  const [audioHabilitado, setAudioHabilitado] = useState(false);

  // Inicializa AudioContext no primeiro clique
  useEffect(() => {
    const initAudio = () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(ctx);
      setAudioHabilitado(true);
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Função para tocar som de notificação
  const tocarSomEmail = () => {
    if (!audioContext || !audioHabilitado) return;
    
    try {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const beep = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      beep(800, now, 0.1);
      beep(1000, now + 0.15, 0.1);
      beep(1200, now + 0.3, 0.15);
    } catch (error) {
      console.log('Erro ao tocar som:', error);
    }
  };

  // Busca emails não lidos
  const { data: emails = [] } = useQuery({
    queryKey: ['email-notifications'],
    queryFn: async () => {
      const todas = await base44.entities.EmailNotificacao.filter({ lido: false }, '-created_date', 10);
      return todas;
    },
    refetchInterval: 3000,
    initialData: [],
  });

  // Detecta novos emails, toca som e marca como lido automaticamente
  useEffect(() => {
    const novosEmails = emails.filter(email => !emailsExibidos.has(email.id));
    
    if (novosEmails.length > 0) {
      console.log('🔔 Novos emails detectados:', novosEmails.length);
      tocarSomEmail();
      
      // Marca como lido no banco imediatamente
      novosEmails.forEach(async (email) => {
        await base44.entities.EmailNotificacao.update(email.id, { lido: true });
      });
      
      setEmailsExibidos(prev => {
        const updated = new Set(prev);
        novosEmails.forEach(email => updated.add(email.id));
        return updated;
      });
    }
  }, [emails]);



  const visibleEmails = emails.filter(email => 
    !dismissed.has(email.id)
  );

  const handleDismiss = async (email) => {
    setDismissed(prev => new Set([...prev, email.id]));
    await base44.entities.EmailNotificacao.update(email.id, { lido: true });
  };

  const openGmail = () => {
    window.open('https://mail.google.com/mail/u/adm@gloriavirtual.com/', '_blank');
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-3">
      {!audioHabilitado && (
        <Alert className="bg-yellow-50 border-yellow-300">
          <AlertDescription className="text-sm text-yellow-800">
            ⚠️ Clique em qualquer lugar para ativar alertas sonoros
          </AlertDescription>
        </Alert>
      )}
      <AnimatePresence>
        {visibleEmails.slice(0, 3).map((email, index) => (
          <motion.div
            key={email.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="w-5 h-5 text-blue-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <AlertTitle className="text-slate-900 font-bold mb-1 pr-6">
                    📧 Novo Email!
                  </AlertTitle>
                  <AlertDescription className="space-y-1">
                    <p className="text-sm font-semibold text-blue-900 truncate">
                      {email.subject || 'Sem assunto'}
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      De: {email.from}
                    </p>
                    {email.text && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {email.text}
                      </p>
                    )}
                  </AlertDescription>
                  <Button
                    onClick={openGmail}
                    size="sm"
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Gmail
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDismiss(email)}
                  className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {visibleEmails.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-slate-100 border-slate-300 text-center">
            <p className="text-sm text-slate-700">
              + {visibleEmails.length - 3} email{visibleEmails.length - 3 > 1 ? 's' : ''} não lido{visibleEmails.length - 3 > 1 ? 's' : ''}
            </p>
            <Button
              onClick={openGmail}
              size="sm"
              variant="outline"
              className="mt-2 w-full"
            >
              Ver todos no Gmail
            </Button>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}