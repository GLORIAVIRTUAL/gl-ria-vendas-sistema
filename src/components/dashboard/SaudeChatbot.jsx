import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

const LIMITE_SEM_RESPOSTA_MS = 10 * 60 * 1000;

function calcularSaude(mensagens) {
  const ultimas24h = mensagens.filter(
    (m) => new Date(m.created_date).getTime() > Date.now() - 24 * 60 * 60 * 1000
  );

  const recebidas = ultimas24h.filter((m) => m.direction === 'inbound').length;
  const respostasIA = ultimas24h.filter((m) => m.direction === 'outbound' && m.sender === 'ai').length;
  const falhas = ultimas24h.filter((m) => m.status === 'failed').length;

  const ultimaPorContato = new Map();
  for (const m of mensagens) {
    const atual = ultimaPorContato.get(m.contact_id);
    if (!atual || new Date(m.created_date) > new Date(atual.created_date)) {
      ultimaPorContato.set(m.contact_id, m);
    }
  }
  const semResposta = [...ultimaPorContato.values()].filter(
    (m) => m.direction === 'inbound' && Date.now() - new Date(m.created_date).getTime() > LIMITE_SEM_RESPOSTA_MS
  ).length;

  return { recebidas, respostasIA, falhas, semResposta };
}

export default function SaudeChatbot() {
  const { data: mensagens = [] } = useQuery({
    queryKey: ['saude-chatbot-mensagens'],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
    initialData: [],
    refetchInterval: 60000,
  });

  const { recebidas, respostasIA, falhas, semResposta } = calcularSaude(mensagens);

  const itens = [
    { label: 'Mensagens recebidas (24h)', valor: recebidas, cor: 'text-blue-600' },
    { label: 'Respostas da IA (24h)', valor: respostasIA, cor: 'text-green-600' },
    { label: 'Falhas de envio (24h)', valor: falhas, cor: falhas > 0 ? 'text-red-500' : 'text-slate-500' },
    { label: 'Conversas sem resposta', valor: semResposta, cor: semResposta > 0 ? 'text-orange-600' : 'text-slate-500' },
  ];

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Saúde do Chatbot</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {itens.map((item) => (
            <div key={item.label} className="p-4 bg-slate-50 rounded-lg border">
              <p className="text-sm text-slate-600 mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.cor}`}>{item.valor}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}