
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function UpcomingMeetings({ reunioes, produtoConfig, isLoading }) {
  // Sort meetings by date and time
  const sortedReunioes = [...reunioes].sort((a, b) => {
    const dateA = parseISO(a.data);
    const [hoursA, minutesA] = a.horario.split(':').map(Number);
    dateA.setHours(hoursA, minutesA, 0, 0);

    const dateB = parseISO(b.data);
    const [hoursB, minutesB] = b.horario.split(':').map(Number);
    dateB.setHours(hoursB, minutesB, 0, 0);

    return dateA.getTime() - dateB.getTime();
  });

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600" />
          <CardTitle>Próximas Reuniões</CardTitle>
        </div>
        <p className="text-xs text-slate-500 mt-1">Ordenadas por proximidade</p>
      </CardHeader>
      <CardContent className="p-6">
        {sortedReunioes.length > 0 ? (
          <div className="space-y-4">
            {sortedReunioes.map((reuniao) => (
              <div
                key={reuniao.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{reuniao.nome_cliente}</p>
                    <p className="text-sm text-slate-500">{reuniao.email_cliente}</p>
                  </div>
                  {reuniao.link_reuniao && (
                    <a
                      href={reuniao.link_reuniao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <Badge className={`${produtoConfig[reuniao.produto]?.corFundo} ${produtoConfig[reuniao.produto]?.corTexto} border mb-2`}>
                  {produtoConfig[reuniao.produto]?.nome}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(parseISO(reuniao.data), "dd/MM", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {reuniao.horario}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            Nenhuma reunião próxima
          </div>
        )}
      </CardContent>
    </Card>
  );
}
