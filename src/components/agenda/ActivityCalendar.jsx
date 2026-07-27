import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ActivityCalendar({ compromissos, agendamentos, selectedDate, onSelectDate }) {
  const compromissosDatas = new Set(compromissos.map((item) => item.data));
  const agendamentosDatas = new Set(agendamentos.map((item) => item.data));
  const possuiAmbos = (date) => {
    const key = format(date, "yyyy-MM-dd");
    return compromissosDatas.has(key) && agendamentosDatas.has(key);
  };

  return (
    <Card className="border-cyan-400/25 bg-slate-950/55 p-4 shadow-lg backdrop-blur-xl">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-cyan-100">Calendário de atividades</h2>
        <p className="text-sm text-slate-400">Clique em um dia para ver todas as atividades</p>
      </div>
      <Calendar
        mode="single"
        locale={ptBR}
        selected={selectedDate ? parseISO(selectedDate) : undefined}
        onDayClick={(date) => onSelectDate(format(date, "yyyy-MM-dd"))}
        modifiers={{
          compromisso: (date) => compromissosDatas.has(format(date, "yyyy-MM-dd")) && !possuiAmbos(date),
          reuniao: (date) => agendamentosDatas.has(format(date, "yyyy-MM-dd")) && !possuiAmbos(date),
          ambos: possuiAmbos,
        }}
        modifiersClassNames={{
          compromisso: "bg-cyan-400/25 text-cyan-100 font-bold",
          reuniao: "bg-violet-400/25 text-violet-100 font-bold",
          ambos: "bg-cyan-400/30 text-violet-100 font-bold ring-2 ring-inset ring-violet-400",
        }}
        className="mx-auto w-fit text-slate-200"
      />
      <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
        <span><i className="mr-2 inline-block h-3 w-3 rounded bg-cyan-400/70" />Compromisso</span>
        <span><i className="mr-2 inline-block h-3 w-3 rounded bg-violet-400/70" />Reunião</span>
        <span><i className="mr-2 inline-block h-3 w-3 rounded bg-cyan-400 ring-2 ring-violet-400" />Ambos</span>
      </div>
    </Card>
  );
}