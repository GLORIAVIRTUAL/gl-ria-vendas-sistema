import React, { useState } from "react";
import { metaAdsApi } from "@/functions/metaAdsApi";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, Eye, MousePointerClick, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import CampaignAnalysis from "./CampaignAnalysis";

const PERIODOS = [
  { value: "today", label: "Hoje" },
  { value: "last_7d", label: "Últimos 7 dias" },
  { value: "last_30d", label: "Últimos 30 dias" },
  { value: "last_90d", label: "Últimos 90 dias" }
];

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`flex items-center gap-2 text-xs mb-1 ${color}`}><Icon className="w-4 h-4" /> {label}</div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function CampaignResults() {
  const [periodo, setPeriodo] = useState("last_7d");

  const { data, isLoading, error } = useQuery({
    queryKey: ["meta-campaigns", periodo],
    queryFn: async () => {
      const campRes = await metaAdsApi({ action: "list_campaigns" });
      const campaigns = campRes.data.campaigns || [];
      const withInsights = await Promise.all(
        campaigns.map(async (c) => {
          try {
            const ins = await metaAdsApi({ action: "campaign_insights", params: { campaign_id: c.id, date_preset: periodo } });
            return { ...c, insights: ins.data.insights };
          } catch {
            return { ...c, insights: null };
          }
        })
      );
      return withInsights;
    },
    retry: false
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  if (error) return <Card><CardContent className="pt-6 text-red-600 text-sm">{error?.response?.data?.error || error.message}</CardContent></Card>;

  const campaigns = data || [];
  const agg = campaigns.reduce((acc, c) => {
    const i = c.insights || {};
    acc.spend += parseFloat(i.spend || 0);
    acc.impressions += parseInt(i.impressions || 0);
    acc.clicks += parseInt(i.clicks || 0);
    acc.reach += parseInt(i.reach || 0);
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, reach: 0 });

  const ctr = agg.impressions ? ((agg.clicks / agg.impressions) * 100).toFixed(2) : "0.00";
  const cpc = agg.clicks ? (agg.spend / agg.clicks).toFixed(2) : "0.00";
  const cpm = agg.impressions ? ((agg.spend / agg.impressions) * 1000).toFixed(2) : "0.00";

  const chartData = campaigns.map(c => ({
    name: c.name?.slice(0, 15) || c.id,
    gasto: parseFloat(c.insights?.spend || 0),
    cliques: parseInt(c.insights?.clicks || 0)
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIODOS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Gasto" value={`R$ ${agg.spend.toFixed(2)}`} color="text-green-600" />
        <KpiCard icon={Eye} label="Impressões" value={agg.impressions.toLocaleString()} color="text-blue-600" />
        <KpiCard icon={MousePointerClick} label="Cliques" value={agg.clicks.toLocaleString()} color="text-purple-600" />
        <KpiCard icon={Users} label="Alcance" value={agg.reach.toLocaleString()} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-slate-500">CTR</p><p className="text-xl font-bold">{ctr}%</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-slate-500">CPC</p><p className="text-xl font-bold">R$ {cpc}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-slate-500">CPM</p><p className="text-xl font-bold">R$ {cpm}</p></CardContent></Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Gasto x Cliques por campanha</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="gasto" fill="#22c55e" name="Gasto (R$)" />
                <Bar dataKey="cliques" fill="#8b5cf6" name="Cliques" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Campanhas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {campaigns.length === 0 && <p className="text-sm text-slate-500">Nenhuma campanha encontrada.</p>}
          {campaigns.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-slate-500">{c.objective}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">R$ {parseFloat(c.insights?.spend || 0).toFixed(2)}</span>
                <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <CampaignAnalysis kpis={{ spend: agg.spend.toFixed(2), impressions: agg.impressions, clicks: agg.clicks, reach: agg.reach, ctr, cpc, cpm }} />
    </div>
  );
}