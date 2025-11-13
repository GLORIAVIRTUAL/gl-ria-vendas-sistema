import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, Trash2 } from "lucide-react";

export default function ImportarProdutos() {
  const queryClient = useQueryClient();
  const [arquivo, setArquivo] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => base44.entities.Produto.list('-created_date'),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Produto.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setArquivo(file);
      setErro(null);
    } else {
      setErro('Por favor, selecione um arquivo CSV válido');
      setArquivo(null);
    }
  };

  const handleImport = async () => {
    if (!arquivo) {
      setErro('Selecione um arquivo CSV primeiro');
      return;
    }

    setProcessando(true);
    setErro(null);
    setResultado(null);

    try {
      // 1. Upload do arquivo
      const formData = new FormData();
      formData.append('file', arquivo);

      const uploadResponse = await base44.integrations.Core.UploadFile({ file: arquivo });
      
      if (!uploadResponse.file_url) {
        throw new Error('Erro ao fazer upload do arquivo');
      }

      // 2. Processar CSV
      const jsonSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            Produto: { type: "string" },
            "Preço Recomendado": { type: "number" },
            "Custo Fixo": { type: "number" },
            "Impostos (9%)": { type: "number" },
            "Taxa Cartão (4,4%)": { type: "number" },
            "Comissão Vendedor (20%)": { type: "number" },
            "Custo Total": { type: "number" },
            "Lucro Líquido": { type: "number" },
            "Margem Líquida (%)": { type: "number" }
          }
        }
      };

      const extractResponse = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadResponse.file_url,
        json_schema: jsonSchema
      });

      if (extractResponse.status !== 'success') {
        throw new Error(extractResponse.details || 'Erro ao processar CSV');
      }

      // 3. Importar produtos
      const produtosParaImportar = extractResponse.output.map(item => ({
        produto: item.Produto,
        preco_recomendado: parseFloat(item["Preço Recomendado"]) || 0,
        custo_fixo: parseFloat(item["Custo Fixo"]) || 0,
        impostos: parseFloat(item["Impostos (9%)"]) || 0,
        taxa_cartao: parseFloat(item["Taxa Cartão (4,4%)"]) || 0,
        comissao_vendedor: parseFloat(item["Comissão Vendedor (20%)"]) || 0,
        custo_total: parseFloat(item["Custo Total"]) || 0,
        lucro_liquido: parseFloat(item["Lucro Líquido"]) || 0,
        margem_liquida: parseFloat(item["Margem Líquida (%)"]) || 0,
        ativo: true
      }));

      await base44.entities.Produto.bulkCreate(produtosParaImportar);

      setResultado({
        sucesso: true,
        total: produtosParaImportar.length,
        produtos: produtosParaImportar
      });

      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setArquivo(null);

    } catch (error) {
      console.error('Erro:', error);
      setErro(error.message);
    } finally {
      setProcessando(false);
    }
  };

  const baixarModeloCSV = () => {
    const csvContent = `Produto,Preço Recomendado,Custo Fixo,Impostos (9%),"Taxa Cartão (4,4%)",Comissão Vendedor (20%),Custo Total,Lucro Líquido,Margem Líquida (%)
Glória Atendente,790.00,200.00,71.10,34.76,158.00,463.86,326.14,41.28
Glória Clínica,549.00,150.00,49.41,24.16,109.80,333.37,215.63,39.28
Máquina de Vídeos - Basic,840.00,300.00,75.60,36.96,168.00,580.56,259.44,30.89`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_produtos.csv';
    link.click();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Importar Produtos
            </h1>
            <p className="text-slate-600">
              Gerencie seus produtos via importação de CSV
            </p>
          </div>
          <Button
            onClick={baixarModeloCSV}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-5 h-5 mr-2" />
            Baixar Modelo CSV
          </Button>
        </div>

        {/* Upload Section */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <span className="text-lg font-semibold text-slate-700 hover:text-blue-600">
                  Clique para selecionar o arquivo CSV
                </span>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {arquivo && (
                <p className="mt-3 text-sm text-green-600 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  {arquivo.name}
                </p>
              )}
            </div>

            {erro && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            {resultado && resultado.sucesso && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  ✅ {resultado.total} produtos importados com sucesso!
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleImport}
              disabled={!arquivo || processando}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold"
            >
              {processando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Importar Produtos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Produtos Existentes */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Produtos Cadastrados ({produtos.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold">Produto</TableHead>
                    <TableHead className="font-bold">Preço</TableHead>
                    <TableHead className="font-bold">Custo Total</TableHead>
                    <TableHead className="font-bold">Lucro</TableHead>
                    <TableHead className="font-bold">Margem</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.map((produto) => (
                    <TableRow key={produto.id} className="hover:bg-slate-50">
                      <TableCell className="font-semibold">{produto.produto}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        R$ {produto.preco_recomendado?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        R$ {produto.custo_total?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-blue-600 font-semibold">
                        R$ {produto.lucro_liquido?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${
                          produto.margem_liquida >= 40 ? 'bg-green-100 text-green-700' :
                          produto.margem_liquida >= 30 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {produto.margem_liquida?.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={produto.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja deletar este produto?')) {
                              deleteMutation.mutate(produto.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {produtos.length === 0 && (
              <div className="text-center py-12">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">Nenhum produto cadastrado ainda</p>
                <p className="text-slate-400 text-sm mt-2">Importe um arquivo CSV para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}