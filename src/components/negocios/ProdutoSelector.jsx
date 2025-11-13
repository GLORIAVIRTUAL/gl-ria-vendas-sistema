import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, DollarSign, AlertCircle, Plus, X, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProdutoSelector({ produtos, onProdutosChange, valorPersonalizado, onValorChange }) {
  const [dialogAberto, setDialogAberto] = useState(false);
  
  const { data: produtosDB = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => base44.entities.Produto.list(),
    initialData: [],
  });

  const produtosAtivos = produtosDB.filter(p => p.ativo);
  const produtosNomes = produtos || [];
  
  const produtosSelecionados = produtosNomes
    .map(nome => produtosAtivos.find(p => p.produto === nome))
    .filter(Boolean);

  const calcularValorTotal = () => {
    if (valorPersonalizado) {
      return parseFloat(valorPersonalizado) || 0;
    }
    
    return produtosSelecionados.reduce((acc, prod) => acc + (prod.preco_recomendado || 0), 0);
  };

  const valorTotal = calcularValorTotal();

  const adicionarProduto = (produtoNome) => {
    const novosProdutos = [...produtosNomes, produtoNome];
    onProdutosChange(novosProdutos);
    
    const novoProduto = produtosAtivos.find(p => p.produto === produtoNome);
    if (novoProduto && onValorChange) {
      const novoValorTotal = valorTotal + novoProduto.preco_recomendado;
      onValorChange(novoValorTotal.toString());
    }
    setDialogAberto(false);
  };

  const removerProduto = (produtoNome) => {
    const novosProdutos = produtosNomes.filter(p => p !== produtoNome);
    onProdutosChange(novosProdutos);
    
    const produtoRemovido = produtosAtivos.find(p => p.produto === produtoNome);
    if (produtoRemovido && onValorChange) {
      const novoValorTotal = valorTotal - produtoRemovido.preco_recomendado;
      onValorChange(novoValorTotal.toString());
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-slate-600">Carregando produtos...</p>
      </div>
    );
  }

  if (produtosAtivos.length === 0) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-900">
          <strong>Nenhum produto cadastrado!</strong>
          <br />
          Vá em <strong>Importar Produtos</strong> para adicionar produtos ao sistema.
        </AlertDescription>
      </Alert>
    );
  }

  const produtosDisponiveis = produtosAtivos.filter(p => 
    !produtosNomes.includes(p.produto)
  );

  return (
    <div className="space-y-6">
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-4 h-4" />
          Produtos Selecionados *
        </Label>

        {produtosSelecionados.length === 0 ? (
          <Alert className="bg-slate-50 border-slate-200">
            <Package className="h-4 w-4 text-slate-600" />
            <AlertDescription className="text-slate-700">
              Nenhum produto selecionado. Clique em "Adicionar Produto" para começar.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {produtosSelecionados.map((produto, index) => (
              <div key={index} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex-1">
                  <p className="font-bold text-blue-900 text-lg">{produto.produto}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-sm font-semibold text-green-600">
                      💰 R$ {produto.preco_recomendado.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removerProduto(produto.produto)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {produtosDisponiveis.length > 0 && (
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-3 border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Selecionar Produto</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                {produtosDisponiveis.map((produto) => (
                  <button
                    key={produto.id}
                    type="button"
                    onClick={() => adicionarProduto(produto.produto)}
                    className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{produto.produto}</p>
                      <span className="text-green-600 font-semibold text-sm">
                        R$ {produto.preco_recomendado.toFixed(2)}
                      </span>
                    </div>
                    <Plus className="w-5 h-5 text-blue-600" />
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div>
        <Label htmlFor="valor_mensalidade" className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4" />
          Valor Total da Mensalidade (R$) *
        </Label>
        <Input
          id="valor_mensalidade"
          type="number"
          min="0"
          step="0.01"
          value={valorPersonalizado}
          onChange={(e) => onValorChange && onValorChange(e.target.value)}
          required
          className="text-lg font-semibold"
        />
        <p className="text-xs text-slate-500 mt-1">
          💡 O valor é calculado automaticamente, mas você pode editá-lo se necessário.
        </p>
      </div>
    </div>
  );
}