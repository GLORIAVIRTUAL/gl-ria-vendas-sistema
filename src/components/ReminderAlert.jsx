import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bell, X, Video, Sparkles, Monitor, User, Volume2, VolumeX } from "lucide-react";
import { format, parseISO, differenceInMinutes, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

const origemConfig = {
  Chatbot: {
    cor: "from-green-500 to-emerald-600",
    icone: "🤖",
    titulo: "Novo Agendamento via Chatbot",
    Icon: Sparkles
  },
  Manual: {
    cor: "from-blue-500 to-indigo-600",
    icone: "👤",
    titulo: "Novo Agendamento Manual",
    Icon: User
  },
  "Agendamento Online": {
    cor: "from-purple-500 to-pink-600",
    icone: "🌐",
    titulo: "Novo Agendamento Online",
    Icon: Monitor
  }
};

export default function ReminderAlert() {
  const [alertas, setAlertas] = useState([]);
  const [alertasExibidos, setAlertasExibidos] = useState(new Set());
  const [ultimoAgendamentoId, setUltimoAgendamentoId] = useState(null);
  const [audioHabilitado, setAudioHabilitado] = useState(false);
  const [mostrarAvisoAudio, setMostrarAvisoAudio] = useState(false);
  const audioContextRef = useRef(null);

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list(),
    initialData: [],
    refetchInterval: 10000,
  });

  // Tenta inicializar o AudioContext na primeira interação
  useEffect(() => {
    const inicializarAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🔊 AudioContext inicializado:', audioContextRef.current.state);
        
        if (audioContextRef.current.state === 'running') {
          setAudioHabilitado(true);
          setMostrarAvisoAudio(false);
        }
      }
    };

    // Tenta inicializar em qualquer interação do usuário
    const eventos = ['click', 'touchstart', 'keydown'];
    eventos.forEach(evento => {
      document.addEventListener(evento, inicializarAudio, { once: true });
    });

    return () => {
      eventos.forEach(evento => {
        document.removeEventListener(evento, inicializarAudio);
      });
    };
  }, []);

  // Detecta novos agendamentos
  useEffect(() => {
    if (agendamentos.length > 0) {
      const maisRecente = agendamentos.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      )[0];

      if (ultimoAgendamentoId === null) {
        setUltimoAgendamentoId(maisRecente.id);
        return;
      }

      if (maisRecente.id !== ultimoAgendamentoId) {
        const alertaId = `novo-${maisRecente.id}`;
        if (!alertasExibidos.has(alertaId)) {
          // Tenta tocar som
          const sucesso = tocarAlertaNovoAgendamento(maisRecente.origem);
          
          // Se falhou, mostra aviso
          if (!sucesso && !audioHabilitado) {
            setMostrarAvisoAudio(true);
          }
          
          setAlertas(prev => [...prev, {
            id: alertaId,
            tipo: 'novo',
            agendamento: maisRecente
          }]);
          setAlertasExibidos(prev => new Set([...prev, alertaId]));
        }
        setUltimoAgendamentoId(maisRecente.id);
      }
    }
  }, [agendamentos, ultimoAgendamentoId, alertasExibidos, audioHabilitado]);

  // Verifica reuniões próximas
  useEffect(() => {
    const verificarAlertas = () => {
      const agora = new Date();
      const novosAlertas = [];

      agendamentos.forEach(ag => {
        if (ag.status === "Cancelada") return;
        
        try {
          const dataReuniao = parseISO(`${ag.data}T${ag.horario}:00`);
          const minutosRestantes = differenceInMinutes(dataReuniao, agora);

          if (minutosRestantes >= 29 && minutosRestantes <= 31 && isToday(dataReuniao)) {
            const alertaId = `proximo-${ag.id}-${ag.data}-${ag.horario}`;
            
            if (!alertasExibidos.has(alertaId)) {
              novosAlertas.push({
                id: alertaId,
                tipo: 'proximo',
                agendamento: ag,
                minutosRestantes
              });
              
              tocarAlertaProximo();
              setAlertasExibidos(prev => new Set([...prev, alertaId]));
            }
          }
        } catch (error) {
          console.error("Erro ao verificar alerta:", error);
        }
      });

      if (novosAlertas.length > 0) {
        setAlertas(prev => [...prev, ...novosAlertas]);
      }
    };

    verificarAlertas();
  }, [agendamentos, alertasExibidos]);

  const habilitarAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Resume o contexto se estiver suspenso
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      console.log('🔊 Áudio habilitado! Estado:', audioContextRef.current.state);
      setAudioHabilitado(true);
      setMostrarAvisoAudio(false);
      
      // Toca um som de teste
      tocarSomTeste();
    } catch (error) {
      console.error('❌ Erro ao habilitar áudio:', error);
    }
  };

  const tocarSomTeste = () => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
      return false;
    }

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.2);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.2);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao tocar som de teste:', error);
      return false;
    }
  };

  const tocarAlertaNovoAgendamento = (origem) => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
      console.warn('⚠️ AudioContext não está rodando');
      return false;
    }

    try {
      if (origem === 'Chatbot') {
        // Som especial para chatbot (melodia ascendente rápida)
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);
            
            oscillator.frequency.value = 500 + (i * 150);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.15);
            
            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + 0.15);
          }, i * 150);
        }
      } else if (origem === 'Agendamento Online') {
        // Som para agendamento online (melodia ondulante)
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);
            
            oscillator.frequency.value = i % 2 === 0 ? 600 : 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.2);
            
            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + 0.2);
          }, i * 200);
        }
      } else {
        // Som para manual (2 bips simples)
        for (let i = 0; i < 2; i++) {
          setTimeout(() => {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);
            
            oscillator.frequency.value = 700;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.2);
            
            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + 0.2);
          }, i * 300);
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Erro ao tocar alerta:', error);
      return false;
    }
  };

  const tocarAlertaProximo = () => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
      return false;
    }

    try {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
          
          oscillator.start(audioContextRef.current.currentTime);
          oscillator.stop(audioContextRef.current.currentTime + 0.3);
        }, i * 400);
      }
      return true;
    } catch (error) {
      console.error('❌ Erro ao tocar alerta:', error);
      return false;
    }
  };

  const fecharAlerta = (alertaId) => {
    setAlertas(prev => prev.filter(a => a.id !== alertaId));
  };

  if (alertas.length === 0 && !mostrarAvisoAudio) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {/* Aviso para habilitar áudio */}
      {mostrarAvisoAudio && (
        <Alert className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <VolumeX className="w-6 h-6 mt-1" />
              <div>
                <AlertTitle className="text-lg font-bold mb-2 text-white">
                  🔊 Ativar Notificações Sonoras
                </AlertTitle>
                <AlertDescription className="text-white space-y-2">
                  <p className="text-sm opacity-90">
                    Clique no botão abaixo para habilitar os alertas sonoros quando houver novos agendamentos!
                  </p>
                  <Button
                    onClick={habilitarAudio}
                    className="bg-white text-orange-600 hover:bg-orange-50 font-semibold mt-2"
                    size="sm"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Ativar Sons
                  </Button>
                </AlertDescription>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMostrarAvisoAudio(false)}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Alertas de agendamentos */}
      {alertas.map(alerta => {
        if (alerta.tipo === 'novo') {
          const origem = alerta.agendamento.origem || 'Manual';
          const config = origemConfig[origem] || origemConfig.Manual;
          const IconeOrigem = config.Icon;

          return (
            <Alert 
              key={alerta.id}
              className={`bg-gradient-to-r ${config.cor} text-white border-0 shadow-2xl animate-bounce`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="relative">
                    <IconeOrigem className="w-6 h-6 mt-1 animate-spin" />
                    <span className="absolute -top-1 -right-1 text-2xl">{config.icone}</span>
                  </div>
                  <div>
                    <AlertTitle className="text-lg font-bold mb-2 text-white">
                      🎉 {config.titulo}
                    </AlertTitle>
                    <AlertDescription className="text-white space-y-1">
                      <p className="font-semibold">{alerta.agendamento.nome_cliente}</p>
                      <p className="text-sm opacity-90">
                        {format(parseISO(alerta.agendamento.data), "dd 'de' MMMM", { locale: ptBR })} às {alerta.agendamento.horario}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                          {config.icone} {origem}
                        </span>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                          📧 {alerta.agendamento.email_cliente}
                        </span>
                      </div>
                    </AlertDescription>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => fecharAlerta(alerta.id)}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Alert>
          );
        }

        return (
          <Alert 
            key={alerta.id}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-2xl animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Bell className="w-6 h-6 mt-1 animate-bounce" />
                <div>
                  <AlertTitle className="text-lg font-bold mb-2 text-white">
                    🔔 Reunião em {alerta.minutosRestantes} minutos!
                  </AlertTitle>
                  <AlertDescription className="text-white space-y-1">
                    <p className="font-semibold">{alerta.agendamento.nome_cliente}</p>
                    <p className="text-sm opacity-90">
                      {format(parseISO(alerta.agendamento.data), "dd 'de' MMMM", { locale: ptBR })} às {alerta.agendamento.horario}
                    </p>
                    {alerta.agendamento.link_reuniao && (
                      <a
                        href={alerta.agendamento.link_reuniao}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        Entrar na Reunião
                      </a>
                    )}
                  </AlertDescription>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => fecharAlerta(alerta.id)}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}