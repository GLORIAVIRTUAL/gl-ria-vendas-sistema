import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Building2, Phone, Globe, Briefcase, MapPin, Share2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function FormularioStart() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  // Dados iniciais da URL
  const initialLeadId = searchParams.get("lead_id") || "";
  const initialEmail = searchParams.get("email") || "";
  const initialAgendamentoId = searchParams.get("agendamentoId") || "";

  const [formData, setFormData] = useState({
    produtos_escolhidos: [],
    email: initialEmail,
    email_comercial: "",
    nome_empresa: "",
    cnpj: "",
    telefone_whatsapp: "",
    telegram: "",
    site: "",
    outros_contatos: "",
    ramos_atividade: "",
    produtos_servicos: "",
    portfolio: "",
    diferenciais: "",
    precos: "",
    profissionais: "",
    horario_funcionamento: "",
    endereco_empresa: "",
    pais: "Brasil",
    estado: "",
    cidade: "",
    cep: "",
    bairro: "",
    rua: "",
    numero: "",
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    x_twitter: "",
    concorrentes: "",
    promocoes: "",
    faq: "",
    lead_id: initialLeadId,
    agendamento_id: initialAgendamentoId,
    logotipo_url: "https://via.placeholder.com/150",
    outros_arquivos_urls: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (value) => {
    setFormData(prev => {
      const newProdutos = prev.produtos_escolhidos.includes(value)
        ? prev.produtos_escolhidos.filter(item => item !== value)
        : [...prev.produtos_escolhidos, value];
      return { ...prev, produtos_escolhidos: newProdutos };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      const response = await base44.functions.invoke('submitOnboarding', formData);
      const data = response.data;

      if (response.status !== 200 || !data.success) {
        throw new Error(data.error || data.message || "Erro ao enviar formulário");
      }

      setSucesso(true);
      toast.success("Formulário enviado com sucesso!");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Erro:", error);
      setErro(error.message);
      toast.error("Erro ao enviar formulário: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center shadow-2xl border-0">
          <CardContent className="pt-12 pb-12 px-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Formulário Enviado!
            </h2>
            <p className="text-slate-600 text-lg mb-8">
              Obrigado por preencher todas as informações. Nossa equipe recebeu seus dados e daremos andamento ao seu processo de implantação.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Preencher novamente (se necessário)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 md:p-12 text-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f3ccc3a454aaec766ae684/2f46531d6_Untitleddesign34.png"
              alt="Glória Vendas" 
              className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg object-contain bg-white"
            />
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Formulário de Onboarding</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Complete as informações abaixo para personalizarmos sua experiência e iniciarmos a implantação do seu sistema.
            </p>
          </div>

          <div className="p-6 md:p-12">
            {erro && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <div className="ml-2">
                  <h5 className="font-bold mb-1">Erro ao enviar</h5>
                  <AlertDescription>{erro}</AlertDescription>
                </div>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* Produtos */}
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3 mb-6 border-b border-purple-200 pb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-purple-900">Produtos Contratados</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { id: "Gloria_Clinica", label: "🏥 Glória Clínica", desc: "Gestão para clínicas" },
                    { id: "Gloria_Vendas", label: "💼 Glória Vendas", desc: "Gestão de vendas" },
                    { id: "Gloria_Atendente", label: "🤖 Glória Atendente", desc: "Atendimento IA 24/7" },
                    { id: "Maquina_de_Videos", label: "🎬 Máquina de Vídeos", desc: "Criação de vídeos" },
                    { id: "Gloria_Financas", label: "💰 Glória Finanças", desc: "Gestão financeira" },
                    { id: "Avatar_ao_Vivo", label: "👤 Avatar ao Vivo", desc: "Avatar em tempo real" }
                  ].map((item) => (
                    <label 
                      key={item.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                        formData.produtos_escolhidos.includes(item.id)
                          ? 'bg-purple-100 border-purple-500'
                          : 'bg-white border-purple-100 hover:border-purple-300'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={formData.produtos_escolhidos.includes(item.id)}
                        onChange={() => handleCheckboxChange(item.id)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{item.label}</span>
                        <span className="text-xs text-slate-600">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dados Básicos */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-slate-100">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Dados Básicos</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_comercial">Email Comercial *</Label>
                    <Input id="email_comercial" name="email_comercial" type="email" value={formData.email_comercial} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                    <Input id="nome_empresa" name="nome_empresa" value={formData.nome_empresa} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={handleInputChange} />
                  </div>
                </div>
              </section>

              {/* Contatos */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-slate-100">
                  <Phone className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Contatos</h2>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="telefone_whatsapp">Telefone / WhatsApp *</Label>
                    <Input id="telefone_whatsapp" name="telefone_whatsapp" value={formData.telefone_whatsapp} onChange={handleInputChange} required placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegram">Telegram</Label>
                    <Input id="telegram" name="telegram" value={formData.telegram} onChange={handleInputChange} placeholder="@usuario" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site">Site</Label>
                    <Input id="site" name="site" value={formData.site} onChange={handleInputChange} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outros_contatos">Outros Contatos</Label>
                  <Textarea id="outros_contatos" name="outros_contatos" value={formData.outros_contatos} onChange={handleInputChange} rows={2} />
                </div>
              </section>

              {/* Sobre a Empresa */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-slate-100">
                  <Briefcase className="w-6 h-6 text-orange-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Sobre a Empresa</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="ramos_atividade">Ramos de Atividade *</Label>
                    <Textarea id="ramos_atividade" name="ramos_atividade" value={formData.ramos_atividade} onChange={handleInputChange} required rows={2} placeholder="Ex: Tecnologia, Varejo..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="produtos_servicos">Produtos ou Serviços *</Label>
                    <Textarea id="produtos_servicos" name="produtos_servicos" value={formData.produtos_servicos} onChange={handleInputChange} required rows={3} placeholder="Descreva seus principais produtos..." />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="portfolio">Portfólio</Label>
                      <Textarea id="portfolio" name="portfolio" value={formData.portfolio} onChange={handleInputChange} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diferenciais">Diferenciais</Label>
                      <Textarea id="diferenciais" name="diferenciais" value={formData.diferenciais} onChange={handleInputChange} rows={3} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precos">Preços / Tabela de Valores</Label>
                    <Textarea id="precos" name="precos" value={formData.precos} onChange={handleInputChange} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profissionais">Equipe / Profissionais</Label>
                    <Textarea id="profissionais" name="profissionais" value={formData.profissionais} onChange={handleInputChange} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horario_funcionamento">Horário de Funcionamento *</Label>
                    <Input id="horario_funcionamento" name="horario_funcionamento" value={formData.horario_funcionamento} onChange={handleInputChange} required placeholder="Ex: Seg-Sex 9h-18h" />
                  </div>
                </div>
              </section>

              {/* Endereço */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-slate-100">
                  <MapPin className="w-6 h-6 text-red-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Endereço</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco_empresa">Endereço Completo</Label>
                    <Input id="endereco_empresa" name="endereco_empresa" value={formData.endereco_empresa} onChange={handleInputChange} placeholder="Rua, Número, Bairro, Cidade..." />
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pais">País *</Label>
                      <Input id="pais" name="pais" value={formData.pais} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado *</Label>
                      <Input id="estado" name="estado" value={formData.estado} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade *</Label>
                      <Input id="cidade" name="cidade" value={formData.cidade} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP *</Label>
                      <Input id="cep" name="cep" value={formData.cep} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro *</Label>
                      <Input id="bairro" name="bairro" value={formData.bairro} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rua">Rua *</Label>
                      <Input id="rua" name="rua" value={formData.rua} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número *</Label>
                      <Input id="numero" name="numero" value={formData.numero} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
              </section>

              {/* Redes Sociais */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-slate-100">
                  <Share2 className="w-6 h-6 text-pink-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Redes Sociais</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" name="instagram" value={formData.instagram} onChange={handleInputChange} placeholder="@usuario" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input id="facebook" name="facebook" value={formData.facebook} onChange={handleInputChange} placeholder="facebook.com/usuario" />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input id="youtube" name="youtube" value={formData.youtube} onChange={handleInputChange} placeholder="youtube.com/@usuario" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input id="tiktok" name="tiktok" value={formData.tiktok} onChange={handleInputChange} placeholder="@usuario" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="x_twitter">X (Twitter)</Label>
                    <Input id="x_twitter" name="x_twitter" value={formData.x_twitter} onChange={handleInputChange} placeholder="@usuario" />
                  </div>
                </div>
              </section>

              {/* Informações Adicionais */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-slate-100">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Informações Adicionais</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="concorrentes">Concorrentes e Referências</Label>
                    <Textarea id="concorrentes" name="concorrentes" value={formData.concorrentes} onChange={handleInputChange} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promocoes">Promoções Atuais</Label>
                    <Textarea id="promocoes" name="promocoes" value={formData.promocoes} onChange={handleInputChange} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faq">Perguntas Frequentes (FAQ)</Label>
                    <Textarea id="faq" name="faq" value={formData.faq} onChange={handleInputChange} rows={5} placeholder="Liste as perguntas mais frequentes dos seus clientes..." />
                  </div>
                </div>
              </section>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando Informações...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Enviar Formulário Completo
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-slate-500 mt-4">
                  Seus dados estão seguros conosco.
                </p>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}