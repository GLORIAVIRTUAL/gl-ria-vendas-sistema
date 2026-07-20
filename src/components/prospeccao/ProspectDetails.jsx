import React from "react";
import { formatMoney } from "@/lib/prospectUtils";

const formatDate = (value) => {
  if (!value) return "Não informada";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const getPartnerPhones = (partner) => {
  const phones = partner.telefones_socio || partner.telefones || partner.phones || [];
  const values = Array.isArray(phones) ? phones : [phones];
  return values.map((phone) => typeof phone === "string" ? phone : phone.telefone_completo || phone.telefone || phone.numero).filter(Boolean);
};

const getPartnerEmails = (partner) => {
  const emails = partner.emails_socio || partner.emails || [];
  const values = Array.isArray(emails) ? emails : [emails];
  return values.map((email) => typeof email === "string" ? email : email.email || email.endereco).filter(Boolean);
};

export default function ProspectDetails({ prospect }) {
  const source = prospect.dados_kipflow || {};
  const partners = Array.isArray(source.socios) ? source.socios : [];
  const companyType = source.matriz === true ? "Matriz" : source.matriz === false ? "Filial" : "Não informado";

  return <div className="space-y-4">
    <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
      <p><strong>Atividade:</strong> {prospect.ramo_atividade || prospect.cnae || "Não informada"}</p>
      <p><strong>Segmento:</strong> {prospect.segmento || "Não informado"}</p>
      <p><strong>Porte:</strong> {prospect.porte || "Não informado"}</p>
      <p><strong>Funcionários:</strong> {prospect.faixa_funcionarios || "Não informado"}</p>
      <p><strong>Faturamento estimado:</strong> {prospect.faturamento ? formatMoney(prospect.faturamento) : "Não informado"}</p>
      <p><strong>Capital social:</strong> {prospect.capital_social ? formatMoney(prospect.capital_social) : "Não informado"}</p>
      <p><strong>Natureza jurídica:</strong> {source.natureza_juridica || "Não informada"}</p>
      <p><strong>Início da atividade:</strong> {formatDate(source.data_inicio_atividade)}</p>
      <p><strong>Estabelecimento:</strong> {companyType}</p>
      <p><strong>Telefone:</strong> {prospect.whatsapp || prospect.telefone || "Não informado"}</p>
      <p><strong>E-mail:</strong> {prospect.email || "Não informado"}</p>
      <p className="md:col-span-2"><strong>Endereço:</strong> {prospect.endereco || "Não informado"}</p>
    </div>
    <div className="rounded-lg border border-slate-500/30 bg-slate-950/35 p-3 text-sm text-slate-300">
      <strong>Sócios e administradores:</strong>
      {partners.length ? <ul className="mt-2 space-y-2">{partners.map((partner, index) => {
        const phones = getPartnerPhones(partner);
        const emails = getPartnerEmails(partner);
        return <li key={`${partner.cnpj_cpf_socio || partner.cpf || index}-${partner.nome_socio || partner.nome || index}`}>
          <p>{partner.nome_socio || partner.nome || "Nome não informado"}{(partner.qualificacao_socio || partner.qualificacao) ? ` — ${partner.qualificacao_socio || partner.qualificacao}` : ""}</p>
          {phones.length ? <p className="text-cyan-200">Telefone: {phones.join(", ")}</p> : null}
          {emails.length ? <p className="text-cyan-200">E-mail: {emails.join(", ")}</p> : null}
        </li>;
      })}</ul> : <p className="mt-1 text-slate-400">Não informados</p>}
    </div>
  </div>;
}