import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

export default function RelatorioEntregaDialog({ open, campanha, onClose }) {
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!open) {
      setRelatorio(null);
      setErro("");
      return;
    }
    let cancelado = false;
    const executar = async () => {
      setLoading(true);
      setErro("");
      setRelatorio(null);
      try {
        const response = await base44.functions.invoke("relatorioEntregaEmail", {});
        if (!cancelado) setRelatorio(response.data);
      } catch (e) {
        if (!cancelado) setErro(e.response?.data?.error || e.message || "Erro ao gerar relatório");
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    executar();
    return () => { cancelado = true; };
  }, [open]);

  const resumo = relatorio?.resumo;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-950/95 border-slate-500/40">
        <DialogHeader>
          <DialogTitle className="text-cyan-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-300" />
            Relatório de Entrega de Email
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {campanha?.nome || "Campanha"} — análise de bounces no Gmail (últimos 30 dias)
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
            <p className="text-sm text-slate-300">Consultando Gmail e cruzando com os envios...</p>
            <p className="text-xs text-slate-500">Isso pode levar até 1 minuto</p>
          </div>
        )}

        {erro && !loading && (
          <div className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-400/10 p-4">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{erro}</p>
          </div>
        )}

        {relatorio && !loading && (
          <div className="space-y-5">
            {/* Resumo */}
            {resumo && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-slate-500/40 bg-slate-900/60 p-3 text-center">
                  <p className="text-2xl font-bold text-cyan-100">{resumo.total_enviados}</p>
                  <p className="text-xs text-slate-400">Enviados</p>
                </div>
                <div className="rounded-lg border border-green-400/30 bg-green-400/10 p-3 text-center">
                  <p className="text-2xl font-bold text-green-200">{resumo.total_entregues}</p>
                  <p className="text-xs text-slate-400">Entregues</p>
                </div>
                <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-center">
                  <p className="text-2xl font-bold text-red-200">{resumo.total_bounces}</p>
                  <p className="text-xs text-slate-400">Bounces</p>
                </div>
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3 text-center">
                  <p className="text-2xl font-bold text-cyan-200">{resumo.taxa_entrega}</p>
                  <p className="text-xs text-slate-400">Taxa de Entrega</p>
                </div>
              </div>
            )}

            {/* Ações realizadas */}
            {relatorio.acoes_realizadas && (
              <div className="flex flex-wrap gap-2">
                <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {relatorio.acoes_realizadas.envios_marcados_erro} envios marcados como erro
                </Badge>
                <Badge className="border-red-400/30 bg-red-400/10 text-red-200">
                  <XCircle className="w-3 h-3 mr-1" />
                  {relatorio.acoes_realizadas.prospects_marcados_optout} prospects em opt-out
                </Badge>
              </div>
            )}

            {/* Motivos dos bounces */}
            {relatorio.motivos && relatorio.motivos.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-cyan-100">Bounces por motivo</h4>
                {relatorio.motivos.map((m, i) => (
                  <div key={i} className="rounded-lg border border-slate-500/30 bg-slate-900/50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-200">{m.motivo}</p>
                      <Badge variant="outline" className="text-cyan-200 border-cyan-400/30">{m.quantidade}</Badge>
                    </div>
                    {m.emails && m.emails.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.emails.map((email, j) => (
                          <span key={j} className="text-xs text-slate-400 bg-slate-800/60 rounded px-2 py-0.5">{email}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-green-400/30 bg-green-400/10 p-4">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <p className="text-sm text-green-200">Nenhum bounce encontrado para esta campanha.</p>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Bounces encontrados no Gmail: {relatorio.bounces_encontrados_no_gmail} |
              Com email identificado: {relatorio.bounces_com_email_identificado ?? "—"} |
              Sem email identificado: {relatorio.bounces_sem_email_identificado}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}