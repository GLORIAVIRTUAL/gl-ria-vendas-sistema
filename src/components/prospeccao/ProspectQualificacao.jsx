import React from "react";

const CAMPOS = [
  ["cargo_pessoa", "Cargo do contato"],
  ["quantidade_funcionarios", "Funcionários"],
  ["unidades", "Unidades"],
  ["sistema_atual", "Sistema atual"],
  ["principal_problema", "Principal problema"],
  ["produto_interesse", "Produto de interesse"],
  ["urgencia", "Urgência"],
  ["decisao_depende_de_outra_pessoa", "Decisão depende de outro"],
  ["orcamento_informado", "Orçamento informado"],
  ["observacoes", "Observações"]
];

export default function ProspectQualificacao({ prospect }) {
  const qualificacao = prospect.qualificacao || {};
  const preenchidos = CAMPOS.filter(([campo]) => qualificacao[campo]);
  const objecoes = prospect.objecoes || [];

  if (!preenchidos.length && !objecoes.length && !prospect.intent_score) return null;

  return <div className="rounded-lg border border-cyan-400/30 bg-slate-950/50 p-3 text-sm text-slate-300">
    <div className="flex items-center justify-between">
      <strong className="text-cyan-100">Qualificação do Agente Comercial</strong>
      <span className="text-xs text-cyan-200">Intenção: {prospect.intent_score || 0}/100</span>
    </div>
    {preenchidos.length ? <div className="mt-2 grid gap-1 md:grid-cols-2">
      {preenchidos.map(([campo, label]) => <p key={campo}><strong>{label}:</strong> {qualificacao[campo]}</p>)}
    </div> : <p className="mt-2 text-slate-400">Nenhuma informação coletada ainda.</p>}
    {prospect.interesse_registrado ? <p className="mt-2"><strong>Interesse:</strong> {prospect.interesse_registrado}</p> : null}
    {objecoes.length ? <p className="mt-2 text-orange-200"><strong>Objeções:</strong> {objecoes.join("; ")}</p> : null}
  </div>;
}