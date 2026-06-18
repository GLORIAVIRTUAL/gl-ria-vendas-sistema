import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ArrowRight, Target, Users, DollarSign } from "lucide-react";

export default function CampaignResearch({ onUseStrategy }) {
  const [briefing, setBriefing] = useState("");
  const [objetivoNegocio, setObjetivoNegocio] = useState("");
  const [orcamento, setOrcamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [estrategia, setEstrategia] = useState(null);

  const gerarEstrategia = async () => {
    if (!briefing.trim()) return;
    setLoading(true);
    setEstrategia(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um gestor de tráfego sênior especialista em Meta Ads (Facebook e Instagram).
Com base no briefing abaixo, crie uma estratégia COMPLETA e pronta para publicação de uma campanha no Meta Ads.

BRIEFING DO NEGÓCIO: ${briefing}
OBJETIVO DE NEGÓCIO: ${objetivoNegocio || "não especificado"}
ORÇAMENTO DIÁRIO (R$): ${orcamento || "não especificado"}

Retorne uma estratégia profissional e realista para o mercado brasileiro.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            nome_campanha: { type: "string" },
            objetivo_meta: { type: "string", enum: ["OUTCOME_AWARENESS", "OUTCOME_TRAFFIC", "OUTCOME_ENGAGEMENT", "OUTCOME_LEADS", "OUTCOME_SALES"] },
            objetivo_descricao: { type: "string" },
            publico: {
              type: "object",
              properties: {
                idade_min: { type: "number" },
                idade_max: { type: "number" },
                genero: { type: "string", enum: ["todos", "masculino", "feminino"] },
                localizacao: { type: "string" },
                interesses: { type: "array", items: { type: "string" } }
              }
            },
            posicionamentos: { type: "array", items: { type: "string" } },
            cta: { type: "string" },
            copy: {
              type: "object",
              properties: {
                headline: { type: "string" },
                primary_text: { type: "string" },
                description: { type: "string" }
              }
            },
            url_destino: { type: "string" },
            kpi_principal: { type: "string" },
            alcance_estimado: { type: "string" },
            custo_estimado: { type: "string" },
            justificativa: { type: "string" }
          }
        }
      });
      setEstrategia(result);
    } catch (e) {
      alert("Erro ao gerar estratégia: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Pesquisar Estratégia com IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Briefing do negócio / produto *</Label>
            <Textarea
              placeholder="Ex: Sou consultor de marketing e quero atrair pequenas empresas que precisam de presença digital..."
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              className="h-28"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Objetivo de negócio</Label>
              <Input placeholder="Ex: gerar leads qualificados" value={objetivoNegocio} onChange={(e) => setObjetivoNegocio(e.target.value)} />
            </div>
            <div>
              <Label>Orçamento diário (R$)</Label>
              <Input type="number" placeholder="Ex: 50" value={orcamento} onChange={(e) => setOrcamento(e.target.value)} />
            </div>
          </div>
          <Button onClick={gerarEstrategia} disabled={loading || !briefing.trim()} className="bg-purple-600 hover:bg-purple-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Gerar Estratégia
          </Button>
        </CardContent>
      </Card>

      {estrategia && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg">{estrategia.nome_campanha}</CardTitle>
            <p className="text-sm text-slate-500">{estrategia.objetivo_descricao}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Target className="w-3 h-3" /> Objetivo Meta</div>
                <p className="font-semibold text-sm">{estrategia.objetivo_meta}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Users className="w-3 h-3" /> Alcance estimado</div>
                <p className="font-semibold text-sm">{estrategia.alcance_estimado}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><DollarSign className="w-3 h-3" /> Custo estimado</div>
                <p className="font-semibold text-sm">{estrategia.custo_estimado}</p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-500">Público</Label>
              <p className="text-sm">{estrategia.publico?.idade_min}-{estrategia.publico?.idade_max} anos · {estrategia.publico?.genero} · {estrategia.publico?.localizacao}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {(estrategia.publico?.interesses || []).map((i, idx) => <Badge key={idx} variant="secondary">{i}</Badge>)}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <Label className="text-xs text-blue-600">Copy do anúncio</Label>
              <p className="font-semibold text-sm">{estrategia.copy?.headline}</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">{estrategia.copy?.primary_text}</p>
              <p className="text-xs text-slate-500">{estrategia.copy?.description}</p>
              <Badge className="bg-blue-600">{estrategia.cta}</Badge>
            </div>

            <p className="text-xs text-slate-500 italic">{estrategia.justificativa}</p>

            <Button onClick={() => onUseStrategy(estrategia)} className="w-full bg-green-600 hover:bg-green-700">
              Usar tudo na criação <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}