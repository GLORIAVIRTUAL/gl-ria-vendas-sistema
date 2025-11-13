
import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Plus, DollarSign, Trash2, TrendingUp, AlertCircle, ExternalLink, Send, TrendingDown, Percent, Download, Mail, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import EditNegocioDialog from "../components/negocios/EditNegocioDialog";

const produtoConfig = {
  Atendimento_IA_24_7: { nome: "Atendimento IA 24/7", corBadge: "bg-blue-100 text-blue-700 border-blue-200" },
  Maquina_de_Videos: { nome: "Máquina de Vídeos", corBadge: "bg-purple-100 text-purple-700 border-purple-200" },
  Gloria_Clinica: { nome: "Glória Clínica", corBadge: "bg-green-100 text-green-700 border-green-200" },
  Gloria_Vendas: { nome: "Glória Vendas", corBadge: "bg-orange-100 text-orange-700 border-orange-200" },
  Especialistas_Virtuais: { nome: "Especialistas Virtuais", corBadge: "bg-pink-100 text-pink-700 border-pink-200" },
  Sites_em_24_Horas: { nome: "Sites em 24 Horas", corBadge: "bg-cyan-100 text-cyan-700 border-cyan-200" }
};

const statusConfig = {
  Ativo: { cor: "bg-green-100 text-green-700" },
  Inadimplente: { cor: "bg-red-100 text-red-700" },
  Cancelado: { cor: "bg-slate-100 text-slate-700" },
  Suspenso: { cor: "bg-yellow-100 text-yellow-700" }
};

const formasPagamento = {
  card: "Cartão de Crédito",
  boleto: "Boleto Bancário"
};

export default function Negocios() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [mesSelecionado, setMesSelecionado] = useState(format(new Date(), 'yyyy-MM'));
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [negocioParaEditar, setNegocioParaEditar] = useState(null);
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);
  const [dialogStatusAberto, setDialogStatusAberto] = useState(false);
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(null);
  const [enviandoEmail, setEnviandoEmail] = useState(null);

  const { data: negocios = [], isLoading } = useQuery({
    queryKey: ['negocios'],
    queryFn: () => base44.entities.NegocioFechado.list('-created_date'),
    initialData: [],
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => base44.entities.Produto.list(),
    initialData: [],
  });

  const { data: afiliados = [] } = useQuery({
    queryKey: ['afiliados'],
    queryFn: () => base44.entities.Afiliado.list(),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: async (negocio) => {
      if (negocio.stripe_subscription_id) {
        await base44.functions.invoke('stripeCancelSubscription', {
          subscriptionId: negocio.stripe_subscription_id
        });
      }
      await base44.entities.NegocioFechado.delete(negocio.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negocios'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.NegocioFechado.update(id, { status_pagamento: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negocios'] });
      setDialogStatusAberto(false);
      setNegocioSelecionado(null);
      setNovoStatus("");
    },
  });

  const updateNegocioMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NegocioFechado.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negocios'] });
      setDialogEditarAberto(false);
      setNegocioParaEditar(null);
    },
  });

  const negociosFiltrados = negocios.filter(neg => {
    const matchBusca = neg.nome_cliente.toLowerCase().includes(busca.toLowerCase()) ||
                       neg.nome_empresa.toLowerCase().includes(busca.toLowerCase()) ||
                       neg.email_cliente.toLowerCase().includes(busca.toLowerCase());
    const matchProduto = filtroProduto === "todos" || neg.produto === filtroProduto;
    const matchStatus = filtroStatus === "todos" || neg.status_pagamento === filtroStatus;
    
    let matchMes = true;
    if (mesSelecionado !== 'todos') {
      if (!neg.created_date) return false; 
      const negocioData = parseISO(neg.created_date);
      const mesNegocio = format(negocioData, 'yyyy-MM');
      matchMes = mesNegocio === mesSelecionado;
    }
    
    return matchBusca && matchProduto && matchStatus && matchMes;
  });

  const negociosAtivos = negociosFiltrados.filter(n => n.status_pagamento === "Ativo");
  
  const receitaMensal = negociosAtivos.reduce((acc, n) => acc + (n.valor_mensalidade || 0), 0);

  const calcularCustos = () => {
    let impostos = 0;
    let taxasCartao = 0;
    let custoFixo = 0;
    let comissaoAfiliados = 0;

    negociosAtivos.forEach(neg => {
      const valor = neg.valor_mensalidade || 0;
      
      const nomesProdutos = neg.produto ? neg.produto.split(" + ") : [];
      nomesProdutos.forEach(nomeProduto => {
        const produto = produtos.find(p => p.produto === nomeProduto.trim());
        if (produto) {
          custoFixo += produto.custo_fixo || 0;
          impostos += valor * 0.09;
          taxasCartao += valor * 0.04;
        }
      });

      if (neg.afiliado_id) {
        const afiliado = afiliados.find(a => a.id === neg.afiliado_id);
        if (afiliado) {
          comissaoAfiliados += valor * ((afiliado.percentual_comissao || 0) / 100);
        }
      }
    });

    return {
      impostos,
      taxasCartao,
      custoFixo,
      comissaoAfiliados,
      custoTotal: custoFixo + impostos + taxasCartao + comissaoAfiliados
    };
  };

  const custos = calcularCustos();
  const lucroLiquido = receitaMensal - custos.custoTotal;
  const margemLiquida = receitaMensal > 0 ? (lucroLiquido / receitaMensal) * 100 : 0;

  const totalClientes = negociosFiltrados.length;
  const clientesAtivos = negociosAtivos.length;
  const clientesInadimplentes = negociosFiltrados.filter(n => n.status_pagamento === "Inadimplente").length;

  const handleChangeStatus = () => {
    if (negocioSelecionado && novoStatus) {
      updateStatusMutation.mutate({ id: negocioSelecionado.id, status: novoStatus });
    }
  };

  const handleEditarNegocio = (data) => {
    if (negocioParaEditar) {
      updateNegocioMutation.mutate({ id: negocioParaEditar.id, data });
    }
  };

  const enviarLinkPagamento = async (negocio) => {
    try {
      const response = await base44.functions.invoke('stripeGetLatestInvoice', {
        subscriptionId: negocio.stripe_subscription_id
      });

      if (response.status === 200 && response.data?.invoiceUrl) {
        await navigator.clipboard.writeText(response.data.invoiceUrl);
        alert('✅ Link copiado! Cole no WhatsApp/Telegram do cliente.');
      } else {
        alert('Não foi possível obter o link da fatura. Verifique no Stripe Dashboard.');
      }
    } catch (error) {
      console.error('Erro ao buscar link:', error);
      alert('Erro ao buscar link: ' + error.message);
    }
  };

  const enviarWhatsApp = async (negocio) => {
    if (!negocio.telefone_cliente) {
      alert('⚠️ Cliente não possui telefone cadastrado!');
      return;
    }
    if (!negocio.stripe_subscription_id) {
      alert('⚠️ Negócio não possui assinatura Stripe para gerar link de pagamento.');
      return;
    }

    setEnviandoWhatsApp(negocio.id);
    try {
      const response = await base44.functions.invoke('stripeGetLatestInvoice', {
        subscriptionId: negocio.stripe_subscription_id
      });

      if (!response.data?.invoiceUrl) {
        throw new Error('Não foi possível obter o link da fatura');
      }

      const linkPagamento = response.data.invoiceUrl;

      const mensagem = `Olá ${negocio.nome_cliente}! 👋

Seu contrato de *${negocio.produto}* está ativo! 🎉

💰 *Valor da mensalidade:* R$ ${negocio.valor_mensalidade.toFixed(2).replace('.', ',')}
📅 *Dia de cobrança:* Todo dia ${negocio.dia_cobranca}

Para efetuar o pagamento, acesse o link abaixo:

🔗 *Link de pagamento:*
${linkPagamento}

Caso tenha dúvidas, estamos à disposição! 😊`;

      await base44.functions.invoke('whatsapp/sendMessage', {
        telefone: negocio.telefone_cliente,
        mensagem
      });

      alert('✅ Mensagem enviada para o WhatsApp!');
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      alert('❌ Erro ao enviar WhatsApp: ' + error.message);
    } finally {
      setEnviandoWhatsApp(null);
    }
  };

  const enviarEmail = async (negocio) => {
    if (!negocio.email_cliente) {
      alert('⚠️ Cliente não possui email cadastrado!');
      return;
    }
    if (!negocio.stripe_subscription_id) {
      alert('⚠️ Negócio não possui assinatura Stripe para gerar link de pagamento.');
      return;
    }

    setEnviandoEmail(negocio.id);
    try {
      const response = await base44.functions.invoke('stripeGetLatestInvoice', {
        subscriptionId: negocio.stripe_subscription_id
      });

      if (!response.data?.invoiceUrl) {
        throw new Error('Não foi possível obter o link da fatura');
      }

      const linkPagamento = response.data.invoiceUrl;

      const assunto = `💳 Cobrança mensal - ${negocio.produto}`;
      const corpo = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Olá ${negocio.nome_cliente}! 👋</h2>
          
          <p>Seu contrato de <strong>${negocio.produto}</strong> está ativo!</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>💰 Valor da mensalidade:</strong> R$ ${negocio.valor_mensalidade.toFixed(2).replace('.', ',')}</p>
            <p style="margin: 5px 0;"><strong>📅 Dia de cobrança:</strong> Todo dia ${negocio.dia_cobranca}</p>
            <p style="margin: 5px 0;"><strong>🏢 Empresa:</strong> ${negocio.nome_empresa}</p>
          </div>
          
          <p>Para efetuar o pagamento, acesse o link abaixo:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${linkPagamento}" 
               style="background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🔗 Acessar Link de Pagamento
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px;">Caso tenha dúvidas, estamos à disposição!</p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 12px;">
            Este é um email automático. Por favor, não responda.
          </p>
        </div>
      `;

      await base44.functions.invoke('email/sendEmail', {
        email_destinatario: negocio.email_cliente,
        assunto,
        corpo
      });

      alert('✅ Email enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      alert('❌ Erro ao enviar email: ' + error.message);
    } finally {
      setEnviandoEmail(null);
    }
  };

  const downloadRelatorio = async () => {
    try {
      const mesNome = mesSelecionado === 'todos' 
        ? 'Todos os Meses' 
        : format(parseISO(mesSelecionado + '-01'), 'MMMM yyyy', { locale: ptBR });

      const response = await base44.functions.invoke('gerarRelatorioPDF', {
        mesSelecionado: mesNome,
        receitaMensal,
        lucroLiquido,
        margemLiquida,
        custos,
        totalClientes,
        clientesAtivos,
        clientesInadimplentes,
        negociosAtivos: negociosAtivos.map(neg => ({
          nome_cliente: neg.nome_cliente,
          nome_empresa: neg.nome_empresa,
          produto: neg.produto,
          valor_mensalidade: neg.valor_mensalidade,
          data_criacao: neg.created_date ? format(parseISO(neg.created_date), 'dd/MM/yyyy') : '',
        }))
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-financeiro-${mesSelecionado}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        alert('Erro ao gerar relatório');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao baixar relatório: ' + error.message);
    }
  };

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set();
    negocios.forEach(neg => {
      if (neg.created_date) {
        const mes = format(parseISO(neg.created_date), 'yyyy-MM');
        meses.add(mes);
      }
    });
    return Array.from(meses).sort((a, b) => b.localeCompare(a));
  }, [negocios]);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Negócios Fechados
            </h1>
            <p className="text-slate-600">
              Gestão financeira dos contratos
            </p>
          </div>
          <Link to={createPageUrl("NovoNegocio")}>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Novo Negócio
            </Button>
          </Link>
        </div>

        <Card className="p-6 shadow-lg border-0">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-3">
              <Label htmlFor="mes-select" className="font-semibold text-slate-700">Período:</Label>
              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger id="mes-select" className="w-48">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Meses</SelectItem>
                  {mesesDisponiveis.map(mes => (
                    <SelectItem key={mes} value={mes}>
                      {format(parseISO(mes + '-01'), 'MMMM yyyy', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={downloadRelatorio}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Download className="w-5 h-5 mr-2" />
              Baixar Relatório
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm opacity-90 mb-1">💰 Receita Mensal</p>
            <p className="text-3xl font-bold">R$ {receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
              <Percent className="w-5 h-5" />
            </div>
            <p className="text-sm opacity-90 mb-1">📈 Lucro Líquido</p>
            <p className="text-3xl font-bold">R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs opacity-80 mt-1">Margem: {margemLiquida.toFixed(1)}%</p>
          </Card>

          <Card className="p-6 shadow-lg">
            <p className="text-sm text-slate-600 mb-1">👥 Total de Clientes</p>
            <p className="text-3xl font-bold text-slate-900">{totalClientes}</p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-green-100 text-green-700 text-xs">{clientesAtivos} ativos</Badge>
              {clientesInadimplentes > 0 && (
                <Badge className="bg-red-100 text-red-700 text-xs">{clientesInadimplentes} inadimplentes</Badge>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8" />
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm opacity-90 mb-1">💸 Custos Totais</p>
            <p className="text-3xl font-bold">R$ {custos.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </Card>
        </div>

        <Card className="shadow-lg border-0">
          <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b">
            <h3 className="text-lg font-bold text-slate-900">📊 Detalhamento de Custos Mensais</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700 mb-1">🏛️ Impostos (9%)</p>
                <p className="text-xl font-bold text-orange-900">R$ {custos.impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 mb-1">💳 Taxas Cartão (4%)</p>
                <p className="text-xl font-bold text-purple-900">R$ {custos.taxasCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              
              <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-200">
                <p className="text-sm text-pink-700 mb-1">🤝 Comissão Afiliados</p>
                <p className="text-xl font-bold text-pink-900">R$ {custos.comissaoAfiliados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700 mb-1">⚙️ Custo Fixo</p>
                <p className="text-xl font-bold text-slate-900">R$ {custos.custoFixo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar por cliente, empresa ou email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Select value={filtroProduto} onValueChange={setFiltroProduto}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Produtos</SelectItem>
                {Object.entries(produtoConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold">Cliente / Empresa</TableHead>
                  <TableHead className="font-bold">Produto</TableHead>
                  <TableHead className="font-bold">Mensalidade</TableHead>
                  <TableHead className="font-bold">Dia Cobrança</TableHead>
                  <TableHead className="font-bold">Forma Pagamento</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Stripe</TableHead>
                  <TableHead className="font-bold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {negociosFiltrados.map((neg) => (
                  <TableRow key={neg.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">{neg.nome_cliente}</p>
                        <p className="text-sm text-slate-600">{neg.nome_empresa}</p>
                        <p className="text-xs text-slate-500">{neg.email_cliente}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${produtoConfig[neg.produto.split(" + ")[0].trim()]?.corBadge} border`}>
                        {neg.produto}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      R$ {neg.valor_mensalidade?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-mono">
                      Dia {neg.dia_cobranca}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {formasPagamento[neg.forma_pagamento]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Dialog open={dialogStatusAberto && negocioSelecionado?.id === neg.id} onOpenChange={(open) => {
                        setDialogStatusAberto(open);
                        if (!open) {
                          setNegocioSelecionado(null);
                          setNovoStatus("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => {
                              setNegocioSelecionado(neg);
                              setNovoStatus(neg.status_pagamento);
                              setDialogStatusAberto(true);
                            }}
                            className="w-full text-left"
                          >
                            <Badge className={`${statusConfig[neg.status_pagamento]?.cor} cursor-pointer hover:opacity-80 transition-opacity`}>
                              {neg.status_pagamento}
                            </Badge>
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Alterar Status do Pagamento</DialogTitle>
                            <DialogDescription>
                              {neg.nome_cliente} - {neg.nome_empresa}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <Select value={novoStatus} onValueChange={setNovoStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Ativo">Ativo</SelectItem>
                                <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                                <SelectItem value="Cancelado">Cancelado</SelectItem>
                                <SelectItem value="Suspenso">Suspenso</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={handleChangeStatus}
                              disabled={updateStatusMutation.isPending || !novoStatus}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                              {updateStatusMutation.isPending ? "Atualizando..." : "Confirmar Alteração"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {neg.stripe_customer_id && (
                          <a
                            href={`https://dashboard.stripe.com/customers/${neg.stripe_customer_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                            title="Ver cliente no Stripe"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Cliente
                          </a>
                        )}
                        {neg.stripe_subscription_id && (
                          <a
                            href={`https://dashboard.stripe.com/subscriptions/${neg.stripe_subscription_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 text-xs flex items-center gap-1"
                            title="Ver assinatura no Stripe"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Assinatura
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        {/* Botão WhatsApp */}
                        {neg.stripe_subscription_id && neg.telefone_cliente && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => enviarWhatsApp(neg)}
                            disabled={enviandoWhatsApp === neg.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Enviar link por WhatsApp"
                          >
                            {enviandoWhatsApp === neg.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        
                        {/* Botão Email */}
                        {neg.stripe_subscription_id && neg.email_cliente && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => enviarEmail(neg)}
                            disabled={enviandoEmail === neg.id}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Enviar link por Email"
                          >
                            {enviandoEmail === neg.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNegocioParaEditar(neg);
                            setDialogEditarAberto(true);
                          }}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Tem certeza? Isso também cancelará a assinatura no Stripe (se existir).')) {
                              deleteMutation.mutate(neg);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {negociosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">Nenhum negócio encontrado</p>
            </div>
          )}
        </Card>
      </div>

      <EditNegocioDialog
        negocio={negocioParaEditar}
        open={dialogEditarAberto}
        onOpenChange={setDialogEditarAberto}
        onSave={handleEditarNegocio}
        isSaving={updateNegocioMutation.isPending}
      />
    </div>
  );
}
