
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, User, AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProdutoSelector, { PRODUTOS } from "../components/negocios/ProdutoSelector";

export default function NovoNegocioAfiliado() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    nome_cliente: "",
    email_cliente: "",
    telefone_cliente: "",
    nome_empresa: "",
    produtos: [], // 🆕 Array de produtos
    valor_mensalidade: "",
    dia_cobranca: "",
    forma_pagamento: "card"
  });
  const [erro, setErro] = useState(null);
  const [processando, setProcessando] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: afiliados = [] } = useQuery({
    queryKey: ['afiliados-todos'],
    queryFn: () => base44.entities.Afiliado.list(),
    initialData: [],
  });

  const afiliado = React.useMemo(() => {
    if (!user?.email || !afiliados.length) return null;
    return afiliados.find(af => af.email === user.email);
  }, [user?.email, afiliados]);

  const createMutation = useMutation({
    mutationFn: async (data) => { // 'data' here will include `produtos` (array) and `produto` (formatted string)
      setProcessando(true);
      setErro(null);

      try {
        if (!afiliado) {
          throw new Error('Afiliado não encontrado. Entre em contato com o administrador.');
        }

        const customerResponse = await base44.functions.invoke('stripeCreateCustomer', {
          email: data.email_cliente,
          name: data.nome_cliente,
          phone: data.telefone_cliente
        });

        if (customerResponse.status !== 200 || !customerResponse.data?.customerId) {
          throw new Error('Erro ao criar cliente no Stripe');
        }

        const customerId = customerResponse.data.customerId;

        // O nome do produto já vem formatado como uma string combinada do handleSubmit
        // Ex: "Máquina de Vídeos - Plano Básico + Glória Atendente + CRM Essencial"
        const subscriptionResponse = await base44.functions.invoke('stripeCreateSubscription', {
          customerId,
          priceAmount: parseFloat(data.valor_mensalidade),
          productName: data.produto, // Usando o nome completo do produto já formatado
          negocioId: 'pending', 
          afiliadoStripeAccountId: afiliado.stripe_connect_account_id,
          percentualComissao: afiliado.percentual_comissao
        });

        if (subscriptionResponse.status !== 200 || !subscriptionResponse.data?.subscriptionId) {
          throw new Error(subscriptionResponse.data?.error || 'Erro ao criar assinatura');
        }

        const negocio = await base44.entities.NegocioFechado.create({
          nome_cliente: data.nome_cliente,
          email_cliente: data.email_cliente,
          telefone_cliente: data.telefone_cliente,
          nome_empresa: data.nome_empresa,
          produto: data.produto, // Armazena a string combinada de produtos
          // plano_maquina_videos e adicionar_gloria_atendente são removidos, pois a complexidade é encapsulada na string `produto` ou no array `data.produtos`
          valor_mensalidade: parseFloat(data.valor_mensalidade),
          dia_cobranca: parseInt(data.dia_cobranca),
          data_primeira_cobranca: new Date().toISOString().split('T')[0],
          forma_pagamento: data.forma_pagamento,
          status_pagamento: "Ativo",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionResponse.data.subscriptionId,
          afiliado_id: afiliado.id,
          observacoes: `Criado por ${user.full_name} (afiliado)`
        });

        // 🆕 Atualiza o Lead no CRM para "Negocio_Fechado"
        try {
          // Busca lead pelo email do cliente
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
            console.log(`✅ Lead ${lead.id} atualizado para Negocio_Fechado`);
          }
        } catch (error) {
          console.error('⚠️ Erro ao atualizar lead no CRM:', error);
          // Não quebra o fluxo se falhar
        }

        return negocio;

      } catch (error) {
        console.error("❌ Erro completo:", error);
        throw error;
      } finally {
        setProcessando(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negocios-afiliado'] });
      queryClient.invalidateQueries({ queryKey: ['negocios'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-afiliado'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // 🆕 Invalida leads também
      
      setTimeout(() => {
        navigate(createPageUrl("NegociosAfiliado"));
      }, 500);
    },
    onError: (error) => {
      setErro(error.message);
      setProcessando(false);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome_cliente || !formData.email_cliente || !formData.nome_empresa || 
        !formData.produtos?.length || !formData.valor_mensalidade || !formData.dia_cobranca) {
      setErro("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (parseInt(formData.dia_cobranca) < 1 || parseInt(formData.dia_cobranca) > 28) {
      setErro("Dia de cobrança deve ser entre 1 e 28");
      return;
    }

    if (!afiliado) {
      setErro("Afiliado não encontrado. Entre em contato com o administrador.");
      return;
    }

    // Validação específica para Máquina de Vídeos se for selecionado sem plano
    const maquinaVideosProduct = formData.produtos.find(p => p.id === "Maquina_de_Videos");
    if (maquinaVideosProduct && !maquinaVideosProduct.plano) {
      setErro("Selecione um plano para Máquina de Vídeos");
      return;
    }

    // Monta o nome do produto completo para Stripe e NegocioFechado
    // Assumimos que formData.produtos é um array de objetos como:
    // [{ id: "Maquina_de_Videos", plano: "basic", adicionar_gloria_atendente: true }, { id: "CRM" }]
    const formattedProductNames = formData.produtos.map(p => {
        let name = PRODUTOS[p.id]?.nome || p.id;
        if (p.id === "Maquina_de_Videos" && p.plano) {
            name += ` - ${PRODUTOS.Maquina_de_Videos.planos[p.plano].nome}`;
        }
        if (p.adicionar_gloria_atendente) {
            name += " + Glória Atendente";
        }
        return name;
    });
    const nomeProdutoCompleto = formattedProductNames.join(" + ");


    createMutation.mutate({
      ...formData,
      produto: nomeProdutoCompleto // Passa a string formatada para o mutationFn
    });
  };

  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!afiliado) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro:</strong> Seu usuário não está vinculado a nenhum afiliado. Entre em contato com o administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("NegociosAfiliado")}>
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Novo Negócio Fechado</h1>
            <p className="text-slate-600 mt-1">Cadastre um novo cliente com assinatura recorrente</p>
            <p className="text-sm text-purple-600 mt-1">
              💰 Sua comissão: {afiliado.percentual_comissao}% sobre cada mensalidade
            </p>
          </div>
        </div>

        {erro && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {processando && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-900">
              Processando... Criando cliente e assinatura no Stripe
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-0">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do Cliente */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Dados do Cliente</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome_cliente">Nome Completo *</Label>
                    <Input
                      id="nome_cliente"
                      value={formData.nome_cliente}
                      onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})}
                      placeholder="João Silva"
                      disabled={processando}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email_cliente">Email *</Label>
                    <Input
                      id="email_cliente"
                      type="email"
                      value={formData.email_cliente}
                      onChange={(e) => setFormData({...formData, email_cliente: e.target.value})}
                      placeholder="joao@empresa.com"
                      disabled={processando}
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefone_cliente">Telefone</Label>
                    <Input
                      id="telefone_cliente"
                      value={formData.telefone_cliente}
                      onChange={(e) => setFormData({...formData, telefone_cliente: e.target.value})}
                      placeholder="(11) 99999-9999"
                      disabled={processando}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                    <Input
                      id="nome_empresa"
                      value={formData.nome_empresa}
                      onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})}
                      placeholder="Empresa LTDA"
                      disabled={processando}
                    />
                  </div>
                </div>
              </div>

              {/* Produto */}
              <div className="space-y-4">
                <ProdutoSelector
                  value={{
                    produtos: formData.produtos // 🆕 Passa o array de produtos selecionados
                  }}
                  onChange={(data) => {
                    setFormData({
                      ...formData,
                      produtos: data.produtos || [] // Espera um array de objetos de produtos
                    });
                  }}
                  valorPersonalizado={formData.valor_mensalidade}
                  onValorChange={(valor) => setFormData({...formData, valor_mensalidade: valor})}
                />

                {formData.valor_mensalidade && afiliado && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900">
                      💰 Sua comissão mensal: <span className="font-bold">
                        R$ {(parseFloat(formData.valor_mensalidade) * (afiliado.percentual_comissao / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Cobrança */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Dados de Cobrança</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dia_cobranca">Dia da Cobrança (1-28) *</Label>
                    <Input
                      id="dia_cobranca"
                      type="number"
                      min="1"
                      max="28"
                      value={formData.dia_cobranca}
                      onChange={(e) => setFormData({...formData, dia_cobranca: e.target.value})}
                      placeholder="5"
                      disabled={processando}
                    />
                  </div>

                  <div>
                    <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                    <Select
                      value={formData.forma_pagamento}
                      onValueChange={(value) => setFormData({...formData, forma_pagamento: value})}
                      disabled={processando}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Cartão de Crédito</SelectItem>
                        <SelectItem value="boleto">Boleto Bancário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Link to={createPageUrl("NegociosAfiliado")} className="flex-1">
                  <Button type="button" variant="outline" className="w-full h-12" disabled={processando}>
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={processando || createMutation.isPending}
                  className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg"
                >
                  {processando || createMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Criar Negócio
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
