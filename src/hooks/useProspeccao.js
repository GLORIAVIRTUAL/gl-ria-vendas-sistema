import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { kipflowSearch } from "@/functions/kipflowSearch";
import { normalizeCompany } from "@/lib/prospectUtils";

export default function useProspeccao() {
  const queryClient = useQueryClient();
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState("");
  const lastSearchKey = useRef("");
  const nextPage = useRef(0);
  const seenCnpjs = useRef(new Set());
  const { data: prospects = [], isLoading } = useQuery({ queryKey: ["prospects"], queryFn: () => base44.entities.Prospect.list("-created_date") });

  const search = async (filters) => {
    setHasSearched(true);
    setSearching(true);
    try {
      const { resultSize, ...searchFilters } = filters;
      const searchKey = JSON.stringify(searchFilters);
      if (searchKey !== lastSearchKey.current) {
        lastSearchKey.current = searchKey;
        nextPage.current = 0;
        seenCnpjs.current = new Set();
      }

      const requestedPage = nextPage.current;
      const response = await kipflowSearch({ filters: searchFilters, page: requestedPage, size: Number(resultSize) || 20 });
      const payload = response.data;
      if (payload?.error) throw new Error(payload.error);

      const freshResults = (payload?.data || [])
        .map(normalizeCompany)
        .filter((company) => company.cnpj && !seenCnpjs.current.has(company.cnpj));
      freshResults.forEach((company) => seenCnpjs.current.add(company.cnpj));
      nextPage.current = requestedPage + 1;
      setResults(freshResults);
      setPagination(payload?.pagination || null);
      if (!freshResults.length) toast.info("Não há novas empresas para estes filtros.");
    } catch (error) { toast.error(error.response?.data?.error || error.message); }
    finally { setSearching(false); }
  };

  const save = async (prospect) => {
    if (prospects.some((item) => item.cnpj === prospect.cnpj)) return toast.info("Esta empresa já está salva.");
    setBusyId(prospect.cnpj);
    try { await base44.entities.Prospect.create(prospect); await queryClient.invalidateQueries({ queryKey: ["prospects"] }); toast.success("Prospect salvo."); }
    finally { setBusyId(""); }
  };

  const addCRM = async (prospect, stage) => {
    const telefone = prospect.whatsapp || prospect.telefone;
    if (!prospect.email && !telefone) return toast.error("O prospect precisa ter telefone ou e-mail para entrar no CRM.");
    setBusyId(prospect.id);
    try {
      const lead = await base44.entities.Lead.create({ nome_cliente: prospect.nome_fantasia || prospect.razao_social, nome_empresa: prospect.razao_social, ...(prospect.email ? { email_cliente: prospect.email } : {}), ...(telefone ? { telefone_cliente: telefone } : {}), estagio: stage, prioridade: "Media", observacoes: `Prospect Kipflow. CNPJ: ${prospect.cnpj}. ${prospect.ramo_atividade || prospect.cnae || ""}` });
      await base44.entities.Prospect.update(prospect.id, { status: "no_crm", crm_lead_id: lead.id });
      await queryClient.invalidateQueries({ queryKey: ["prospects"] }); toast.success("Prospect adicionado ao CRM.");
    } finally { setBusyId(""); }
  };

  const markContacted = async (prospect) => { await base44.entities.Prospect.update(prospect.id, { status: "contatado" }); await queryClient.invalidateQueries({ queryKey: ["prospects"] }); };
  const sendWhatsApp = async (prospect, mensagem) => { setBusyId(prospect.id); try { await base44.functions.invoke("whatsapp/sendMessage", { telefone: prospect.whatsapp || prospect.telefone, mensagem }); await markContacted(prospect); toast.success("WhatsApp enviado."); } finally { setBusyId(""); } };
  const sendEmail = async (prospect, assunto, corpo) => { setBusyId(prospect.id); try { await base44.functions.invoke("email/sendEmail", { email_destinatario: prospect.email, assunto, corpo: corpo.replace(/\n/g, "<br>") }); await markContacted(prospect); toast.success("E-mail enviado."); } finally { setBusyId(""); } };
  return { results, pagination, hasSearched, prospects, isLoading, searching, busyId, search, save, addCRM, sendWhatsApp, sendEmail };
}