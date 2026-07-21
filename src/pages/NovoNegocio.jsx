import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, User, AlertCircle, Loader2, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProdutoSelector from "../components/negocios/ProdutoSelector";

export default function NovoNegocio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    nome_cliente: "",
    nome_empresa: "",
    email_cliente: "",
    telefone_cliente: "",
    produtos: [],
    valor_mensalidade: "",
    dia_cobranca: "",
    data_primeira_cobranca: "",
    forma_pagamento: "",
    afiliado_id: "",
    observacoes: ""
  });
  const [erro, setErro] = useState(null);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [processingStepMessage, setProcessingStepMessage] = useState("Processando...");

  const { data: afiliados = [] } = useQuery({
    queryKey: ['afiliados'],
    queryFn: () => base44.entities.Afiliado.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      setIsProcessingStripe(true);
      setErro(null);

      try {
        setProcessingStepMessage("Criando cliente...");
        const customerResponse = await base44.functions.invoke('stripeCreateCustomer', {
          email: data.email_cliente,
          name: data.nome_cliente,
          phone: data.telefone_cliente
        });

        if (!customerResponse.data?.customerId) {
          throw new Error('Falha ao criar cliente');
        }

        const customerId = customerResponse.data.customerId;

        let afiliadoData = null;
        if (data.afiliado_id) {
          setProcessingStepMessage("Buscando dados do afiliado...");
          const filteredAfiliados = await base44.entities.Afiliado.filter({ id: data.afiliado_id });
          if (filteredAfiliados.length > 0) {
            afiliadoData = filteredAfiliados[0];
          }
        }

        setProcessingStepMessage("Criando negócio...");
        
        const nomeProdutoCompleto = data.produto;

        const negocio = await base44.entities.NegocioFechado.create({
          ...data,
          valor_mensalidade: parseFloat(data.valor_mensalidade),
          dia_cobranca: parseInt(data.dia_cobranca),
          stripe_customer_id: customerId,
          status_pagamento: "Ativo",
          afiliado_id: data.afiliado_id || null,
          produto: nomeProdutoCompleto 
        });

        setProcessingStepMessage("Criando assinatura no Stripe...");
        const subscriptionResponse = await base44.functions.invoke('stripeCreateSubscription', {
          customerId,
          priceAmount: parseFloat(data.valor_mensalidade),
          productName: nomeProdutoCompleto,
          negocioId: negocio.id,
          afiliadoStripeAccountId: afiliadoData?.stripe_connect_account_id || null,
          percentualComissao: afiliadoData?.percentual_comissao || null
        });

        if (!subscriptionResponse.data?.subscriptionId) {
          throw new Error('Falha ao criar assinatura');
        }

        await base44.entities.NegocioFechado.update(negocio.id, {
          stripe_subscription_id: subscriptionResponse.data.subscriptionId
        });

        setProcessingStepMessage("Atualizando CRM...");
        try {
          const leads = await base44.entities.Lead.filter({ 
            email_cliente: data.email_cliente 
          });

          if (leads.length > 0) {
            const lead = leads[0];
            await base44.entities.Lead.update(lead.id, {
              estagio: 'Negocio_Fechado',
              negocio_id: negocio.id,
              valor_estimado: parseFloat(data.valor_mensalidade)
            });
          }
        } catch (error) {
          console.error('⚠️ Erro ao atualizar lead no CRM:', error);
        }
        
        return negocio;

      } catch (error) {
        console.error('Erro:', error);
        throw error;
      } finally {
        setIsProcessingStripe(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negocios'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      alert('✅ Negócio criado com sucesso! Email enviado automaticamente para o cliente.');
      navigate(createPageUrl("Negocios"));
    },
    onError: (error) => {
      setErro(error.message);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome_cliente || !formData.nome_empresa || !formData.email_cliente || 
        !formData.produtos?.length || !formData.valor_mensalidade || !formData.dia_cobranca || 
        !formData.data_primeira_cobranca || !formData.forma_pagamento) {
      setErro("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const nomeProdutoCompleto = formData.produtos.join(" + ");

    createMutation.mutate({
      ...formData,
      produto: nomeProdutoCompleto 
    });
  };

  const handleProdutoChange = (novosProdutos) => {
    setFormData(prev => ({
      ...prev,
      produtos: novosProdutos
    }));
  };

  const handleValorChange = (valor) => {
    setFormData(prev => ({
      ...prev,
      valor_mensalidade: valor
    }));
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Negocios")}>
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Novo Negócio Fechado</h1>
            <p className="text-slate-600 mt-1">Registre um novo contrato</p>
          </div>
        </div>

        {erro && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {isProcessingStripe && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-900">
              {processingStepMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="shadow-xl border-0 mb-6">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_cliente">Nome do Cliente *</Label>
                  <Input
                    id="nome_cliente"
                    value={formData.nome_cliente}
                    onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})}
                    required
                    disabled={isProcessingStripe}
                  />
                </div>
                <div>
                  <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                  <Input
                    id="nome_empresa"
                    value={formData.nome_empresa}
                    onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})}
                    required
                    disabled={isProcessingStripe}
                  />
                </div>
                <div>
                  <Label htmlFor="email_cliente">Email *</Label>
                  <Input
                    id="email_cliente"
                    type="email"
                    value={formData.email_cliente}
                    onChange={(e) => setFormData({...formData, email_cliente: e.target.value})}
                    required
                    disabled={isProcessingStripe}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone_cliente">Telefone</Label>
                  <Input
                    id="telefone_cliente"
                    value={formData.telefone_cliente}
                    onChange={(e) => setFormData({...formData, telefone_cliente: e.target.value})}
                    disabled={isProcessingStripe}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 mb-6">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle>Produto e Valores</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ProdutoSelector
                produtos={formData.produtos}
                onProdutosChange={handleProdutoChange}
                valorPersonalizado={formData.valor_mensalidade}
                onValorChange={handleValorChange}
              />

              <div className="mt-6">
                <Label htmlFor="afiliado_id">Afiliado (Opcional)</Label>
                <Select 
                  value={formData.afiliado_id} 
                  onValueChange={(value) => setFormData({...formData, afiliado_id: value})}
                  disabled={isProcessingStripe}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um afiliado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Sem afiliado</SelectItem>
                    {afiliados.filter(a => a.ativo).map(af => (
                      <SelectItem key={af.id} value={af.id}>
                        {af.nome} ({af.percentual_comissao}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 mb-6">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle>Dados de Cobrança</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dia_cobranca" className="text-cyan-100">Dia de Cobrança *</Label>
                  <Input
                    id="dia_cobranca"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_cobranca}
                    onChange={(e) => setFormData({...formData, dia_cobranca: e.target.value})}
                    required
                    disabled={isProcessingStripe}
                    className="border-cyan-300/60 bg-slate-950/70 font-semibold text-cyan-100"
                  />
                </div>
                <div>
                  <Label htmlFor="data_primeira_cobranca" className="text-cyan-100">Data da Primeira Cobrança *</Label>
                  <Input
                    id="data_primeira_cobranca"
                    type="date"
                    value={formData.data_primeira_cobranca}
                    onChange={(e) => setFormData({...formData, data_primeira_cobranca: e.target.value})}
                    required
                    disabled={isProcessingStripe}
                    className="border-cyan-300/60 bg-slate-950/70 font-semibold text-cyan-100 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-200 [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                  <Select 
                    value={formData.forma_pagamento} 
                    onValueChange={(value) => setFormData({...formData, forma_pagamento: value})}
                    disabled={isProcessingStripe}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Cartão de Crédito</SelectItem>
                      <SelectItem value="boleto">Boleto Bancário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                  disabled={isProcessingStripe}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Link to={createPageUrl("Negocios")} className="flex-1">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                disabled={isProcessingStripe}
              >
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit"
              disabled={createMutation.isPending || isProcessingStripe}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {createMutation.isPending || isProcessingStripe ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {processingStepMessage}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Confirmar Negócio
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}