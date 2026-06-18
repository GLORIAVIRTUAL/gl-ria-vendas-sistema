import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function CampaignAnalysis({ kpis }) {
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState("");

  const analisar = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um gestor de tráfego sênior. Analise os números abaixo de campanhas de Meta Ads e dê recomendações práticas e diretas (o que melhorar, o que pausar, onde investir mais).

DADOS AGREGADOS:
- Gasto total: R$ ${kpis.spend}
- Impressões: ${kpis.impressions}
- Cliques: ${kpis.clicks}
- Alcance: ${kpis.reach}
- CTR: ${kpis.ctr}%
- CPC: R$ ${kpis.cpc}
- CPM: R$ ${kpis.cpm}

Responda em português, formato markdown, com tópicos curtos e acionáveis.`
      });
      setAnalise(result);
    } catch (e) {
      setAnalise("Erro ao analisar: " + e.message);
    }
    setLoading(false);
  };

  return (
    <Card className="border-purple-200">
      <CardContent className="pt-6">
        <Button onClick={analisar} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Analisar resultados com IA
        </Button>
        {analise && (
          <div className="mt-4 prose prose-sm max-w-none text-slate-700">
            <ReactMarkdown>{analise}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}