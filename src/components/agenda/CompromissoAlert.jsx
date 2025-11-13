import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bell, X, Clock } from "lucide-react";
import { parseISO, differenceInMinutes, isToday } from "date-fns";

export default function CompromissoAlert() {
  const [alertas, setAlertas] = useState([]);
  const [alertasExibidos, setAlertasExibidos] = useState(new Set());
  const audioContextRef = useRef(null);
  const audioInicializadoRef = useRef(false);

  const { data: compromissos = [] } = useQuery({
    queryKey: ['compromissos'],
    queryFn: () => base44.entities.Compromisso.list(),
    initialData: [],
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  // Inicializa o AudioContext automaticamente na primeira interação
  useEffect(() => {
    const inicializarAudio = () => {
      if (!audioInicializadoRef.current) {
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().then(() => {
              console.log('🔊 AudioContext inicializado e pronto');
              audioInicializadoRef.current = true;
            });
          } else {
            console.log('🔊 AudioContext já está ativo');
            audioInicializadoRef.current = true;
          }
        } catch (error) {
          console.error('❌ Erro ao inicializar AudioContext:', error);
        }
      }
    };

    const eventos = ['click', 'touchstart', 'keydown', 'mousemove'];
    eventos.forEach(evento => {
      document.addEventListener(evento, inicializarAudio, { once: true });
    });

    return () => {
      eventos.forEach(evento => {
        document.removeEventListener(evento, inicializarAudio);
      });
    };
  }, []);

  const tocarSomAlerta = () => {
    if (!audioContextRef.current) {
      console.warn('⚠️ AudioContext não inicializado ainda');
      return;
    }

    if (audioContextRef.current.state !== 'running') {
      console.warn('⚠️ AudioContext não está rodando:', audioContextRef.current.state);
      audioContextRef.current.resume().then(() => {
        console.log('🔊 AudioContext resumido para tocar som');
        executarSom();
      });
      return;
    }

    executarSom();
  };

  const executarSom = () => {
    try {
      // Toca uma sequência de 3 bips altos e distintos
      const frequencies = [800, 1000, 1200];
      
      frequencies.forEach((freq, i) => {
        setTimeout(() => {
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          // Volume mais alto
          gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.4);
          
          oscillator.start(audioContextRef.current.currentTime);
          oscillator.stop(audioContextRef.current.currentTime + 0.4);
          
          console.log(`🔊 Bip ${i + 1} tocado (${freq}Hz)`);
        }, i * 500);
      });
    } catch (error) {
      console.error('❌ Erro ao tocar som:', error);
    }
  };

  useEffect(() => {
    const verificarAlertas = () => {
      const agora = new Date();
      const novosAlertas = [];

      compromissos.forEach(comp => {
        if (comp.status !== 'Pendente') return;
        
        try {
          const dataHora = parseISO(`${comp.data}T${comp.horario}:00`);
          const minutosRestantes = differenceInMinutes(dataHora, agora);

          // Alerta quando falta 30 minutos ou menos
          if (minutosRestantes > 0 && minutosRestantes <= 30 && isToday(dataHora)) {
            const alertaId = `comp-${comp.id}-${comp.data}-${comp.horario}`;
            
            if (!alertasExibidos.has(alertaId)) {
              console.log(`⏰ Novo alerta: ${comp.titulo} em ${minutosRestantes} minutos`);
              
              novosAlertas.push({
                id: alertaId,
                compromisso: comp,
                minutosRestantes
              });
              
              console.log('🔊 Tentando tocar som de alerta...');
              tocarSomAlerta();
              setAlertasExibidos(prev => new Set([...prev, alertaId]));
            }
          }
        } catch (error) {
          console.error("Erro ao verificar alerta:", error);
        }
      });

      if (novosAlertas.length > 0) {
        console.log(`✅ ${novosAlertas.length} novo(s) alerta(s) criado(s)`);
        setAlertas(prev => [...prev, ...novosAlertas]);
      }
    };

    verificarAlertas();
    const interval = setInterval(verificarAlertas, 60000);

    return () => clearInterval(interval);
  }, [compromissos, alertasExibidos]);

  const fecharAlerta = (alertaId) => {
    console.log(`🔕 Fechando alerta: ${alertaId}`);
    setAlertas(prev => prev.filter(a => a.id !== alertaId));
  };

  if (alertas.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {alertas.map(alerta => (
        <Alert 
          key={alerta.id}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-2xl animate-bounce"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Bell className="w-6 h-6 mt-1 animate-pulse" />
              <div>
                <AlertTitle className="text-lg font-bold mb-2 text-white">
                  ⏰ Compromisso em {alerta.minutosRestantes} minutos!
                </AlertTitle>
                <AlertDescription className="text-white space-y-1">
                  <p className="font-semibold text-lg">{alerta.compromisso.titulo}</p>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <Clock className="w-4 h-4" />
                    <span>{alerta.compromisso.horario}</span>
                  </div>
                  {alerta.compromisso.descricao && (
                    <p className="text-sm opacity-90 mt-2">{alerta.compromisso.descricao}</p>
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
      ))}
    </div>
  );
}