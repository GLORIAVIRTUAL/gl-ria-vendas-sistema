import React from "react";
import { Badge } from "@/components/ui/badge";

const LABELS = {
  interessado: "Interessado",
  pediu_demonstracao: "Pediu demonstração",
  pediu_preco: "Pediu preço",
  pediu_informacoes: "Pediu informações",
  pediu_contato_whatsapp: "Pediu WhatsApp",
  pediu_reuniao: "Pediu reunião",
  nao_interessado: "Não interessado",
  pessoa_errada: "Pessoa errada",
  indicou_outro_responsavel: "Indicou outro responsável",
  fora_do_escritorio: "Fora do escritório",
  mensagem_automatica: "Mensagem automática",
  email_invalido: "E-mail inválido",
  remover_da_lista: "Pediu remoção da lista",
  duvida_comercial: "Dúvida comercial",
  outro: "Outro",
};

const CORES = {
  positivo: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
  neutro: "bg-slate-500/20 text-slate-200 border-slate-400/40",
  negativo: "bg-red-500/20 text-red-200 border-red-400/40",
};

export default function ClassificacaoEmail({ email, mostrarAcao = false }) {
  if (!email?.classificacao_email) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={`text-xs border ${CORES[email.sentimento_comercial] || CORES.neutro}`}>
        {LABELS[email.classificacao_email] || email.classificacao_email}
      </Badge>
      {email.necessita_humano && (
        <Badge className="text-xs border border-amber-400/40 bg-amber-500/20 text-amber-200">
          Precisa de humano
        </Badge>
      )}
      {mostrarAcao && email.proxima_acao && (
        <span className="text-xs text-cyan-100">Próxima ação: {email.proxima_acao}</span>
      )}
    </div>
  );
}