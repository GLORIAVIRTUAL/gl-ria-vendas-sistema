import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { metaAdsApi } from "@/functions/metaAdsApi";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Rocket, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";

const OBJETIVOS = [
  { value: "OUTCOME_AWARENESS", label: "Reconhecimento" },
  { value: "OUTCOME_TRAFFIC", label: "Tráfego" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engajamento" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_SALES", label: "Vendas" }
];

const CTAS = ["LEARN_MORE", "SIGN_UP", "SHOP_NOW", "CONTACT_US", "SUBSCRIBE", "BOOK_TRAVEL", "GET_QUOTE", "WHATSAPP_MESSAGE"];

export default function CampaignCreator({ prefill }) {
  const [form, setForm] = useState({
    name: "", objective: "OUTCOME_TRAFFIC", daily_budget: "",
    age_min: 18, age_max: 65, genero: "todos", page_id: "",
    headline: "", primary_text: "", description: "", link: "", cta_type: "LEARN_MORE"
  });
  const [imageHash, setImageHash] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const { data: pagesData, isLoading: loadingPages, error: pagesError } = useQuery({
    queryKey: ["meta-pages"],
    queryFn: () => metaAdsApi({ action: "list_pages" }),
    retry: false
  });
  const pages = pagesData?.data?.pages || [];

  useEffect(() => {
    if (prefill) {
      const generoMap = { todos: "todos", masculino: "masculino", feminino: "feminino" };
      setForm(f => ({
        ...f,
        name: prefill.nome_campanha || f.name,
        objective: prefill.objetivo_meta || f.objective,
        age_min: prefill.publico?.idade_min || 18,
        age_max: prefill.publico?.idade_max || 65,
        genero: generoMap[prefill.publico?.genero] || "todos",
        headline: prefill.copy?.headline || "",
        primary_text: prefill.copy?.primary_text || "",
        description: prefill.copy?.description || "",
        link: prefill.url_destino || "",
        cta_type: prefill.cta || "LEARN_MORE"
      }));
    }
  }, [prefill]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMediaPreview(file_url);
      const res = await metaAdsApi({ action: "upload_image_from_url", params: { image_url: file_url } });
      setImageHash(res.data.image_hash);
    } catch (err) {
      alert("Erro no upload: " + (err?.response?.data?.error || err.message));
    }
    setUploading(false);
  };

  const gerarCopy = async () => {
    setGenerating(true);
    try {
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie copy para um anúncio de Meta Ads. Campanha: "${form.name}". Objetivo: ${form.objective}. Gere headline curta, texto principal persuasivo e descrição.`,
        response_json_schema: {
          type: "object",
          properties: { headline: { type: "string" }, primary_text: { type: "string" }, description: { type: "string" } }
        }
      });
      setForm(f => ({ ...f, headline: r.headline, primary_text: r.primary_text, description: r.description }));
    } catch (err) {
      alert("Erro ao gerar copy: " + err.message);
    }
    setGenerating(false);
  };

  const publicar = async () => {
    if (!form.page_id) { alert("Selecione uma página do Facebook."); return; }
    if (!form.daily_budget) { alert("Informe o orçamento diário."); return; }
    setPublishing(true);
    setResult(null);
    try {
      const genders = form.genero === "masculino" ? [1] : form.genero === "feminino" ? [2] : [0];
      const res = await metaAdsApi({
        action: "publish_complete_campaign",
        params: {
          name: form.name,
          objective: form.objective,
          status: "PAUSED",
          daily_budget_cents: Math.round(parseFloat(form.daily_budget) * 100),
          page_id: form.page_id,
          targeting: {
            geo_locations: { countries: ["BR"] },
            age_min: Number(form.age_min),
            age_max: Number(form.age_max),
            genders,
            publisher_platforms: ["facebook", "instagram"]
          },
          creative: {
            message: form.primary_text,
            link: form.link,
            headline: form.headline,
            description: form.description,
            cta_type: form.cta_type,
            image_hash: imageHash
          }
        }
      });
      setResult(res.data);
    } catch (err) {
      alert("Erro ao publicar: " + (err?.response?.data?.error || err.message));
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-6">
      {pagesError && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 text-sm text-amber-700">
            Não foi possível carregar as páginas. Verifique se os secrets META_ADS_TOKEN e META_AD_ACCOUNT_ID estão configurados. ({pagesError?.response?.data?.error || pagesError.message})
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">1. Configuração da campanha</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nome da campanha</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Objetivo</Label>
              <Select value={form.objective} onValueChange={(v) => set("objective", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OBJETIVOS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Orçamento diário (R$)</Label><Input type="number" value={form.daily_budget} onChange={(e) => set("daily_budget", e.target.value)} /></div>
          </div>
          <div>
            <Label>Página do Facebook</Label>
            <Select value={form.page_id} onValueChange={(v) => set("page_id", v)} disabled={loadingPages}>
              <SelectTrigger><SelectValue placeholder={loadingPages ? "Carregando..." : "Selecione a página"} /></SelectTrigger>
              <SelectContent>{pages.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">2. Público</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div><Label>Idade mínima</Label><Input type="number" value={form.age_min} onChange={(e) => set("age_min", e.target.value)} /></div>
          <div><Label>Idade máxima</Label><Input type="number" value={form.age_max} onChange={(e) => set("age_max", e.target.value)} /></div>
          <div>
            <Label>Gênero</Label>
            <Select value={form.genero} onValueChange={(v) => set("genero", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            3. Criativo
            <Button size="sm" variant="outline" onClick={gerarCopy} disabled={generating}>
              {generating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Gerar copy
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Imagem do anúncio</Label>
            <div className="flex items-center gap-3 mt-1">
              <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-slate-50 text-sm">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {imageHash ? "Trocar imagem" : "Enviar imagem"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
              {mediaPreview && <img src={mediaPreview} alt="preview" className="h-16 w-16 object-cover rounded-lg" />}
              {imageHash && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </div>
          </div>
          <div><Label>Headline</Label><Input value={form.headline} onChange={(e) => set("headline", e.target.value)} /></div>
          <div><Label>Texto principal</Label><Textarea value={form.primary_text} onChange={(e) => set("primary_text", e.target.value)} className="h-24" /></div>
          <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>URL de destino</Label><Input placeholder="https://" value={form.link} onChange={(e) => set("link", e.target.value)} /></div>
            <div>
              <Label>Call to Action</Label>
              <Select value={form.cta_type} onValueChange={(v) => set("cta_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CTAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={publicar} disabled={publishing} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base">
        {publishing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Rocket className="w-5 h-5 mr-2" />}
        Publicar campanha (criada como PAUSADA)
      </Button>

      {result?.ok && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 space-y-2">
            <div className="flex items-center gap-2 text-green-700 font-semibold"><CheckCircle2 className="w-5 h-5" /> Campanha publicada!</div>
            <p className="text-xs text-slate-600">Campanha: {result.campaign_id}</p>
            <p className="text-xs text-slate-600">Conjunto: {result.adset_id} · Anúncio: {result.ad_id}</p>
            <a href={result.ads_manager_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium">
              Abrir no Gerenciador de Anúncios <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}