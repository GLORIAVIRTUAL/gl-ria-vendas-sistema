import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building2, FileText, Upload, X, CheckCircle, Loader2, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditClienteDialog({ cliente, open, onOpenChange, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    nome_cliente: "",
    nome_empresa: "",
    email_cliente: "",
    telefone_cliente: "",
    produto: "",
    valor_mensalidade: "",
    dia_pagamento: "",
    status_pagamento: "",
    cnpj: "",
    endereco_completo: "",
    representante_nome: "",
    representante_cargo: "",
    representante_email: "",
    representante_telefone: "",
    representante_cpf: "",
    observacoes: "",
    arquivos_urls: []
  });

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome_cliente: cliente.nome_cliente || "",
        nome_empresa: cliente.nome_empresa || "",
        email_cliente: cliente.email_cliente || "",
        telefone_cliente: cliente.telefone_cliente || "",
        produto: cliente.produto || "",
        valor_mensalidade: cliente.valor_mensalidade || "",
        dia_pagamento: cliente.dia_pagamento || "",
        status_pagamento: cliente.status_pagamento || "",
        cnpj: cliente.cnpj || "",
        endereco_completo: cliente.endereco_completo || "",
        representante_nome: cliente.representante_nome || "",
        representante_cargo: cliente.representante_cargo || "",
        representante_email: cliente.representante_email || "",
        representante_telefone: cliente.representante_telefone || "",
        representante_cpf: cliente.representante_cpf || "",
        observacoes: cliente.observacoes || "",
        arquivos_urls: cliente.arquivos_urls || []
      });
    }
  }, [cliente]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadError(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const novoArquivo = {
        nome: file.name,
        url: file_url,
        tipo: file.type,
        data_upload: new Date().toISOString()
      };

      setFormData(prev => ({
        ...prev,
        arquivos_urls: [...prev.arquivos_urls, novoArquivo]
      }));

      setUploadingFile(false);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setUploadError(error.message);
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      arquivos_urls: prev.arquivos_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      valor_mensalidade: parseFloat(formData.valor_mensalidade) || 0,
      dia_pagamento: parseInt(formData.dia_pagamento, 10) || undefined
    });
  };

  const getTipoArquivo = (tipo) => {
    if (tipo.includes('pdf')) return '📄 PDF';
    if (tipo.includes('image')) return '🖼️ Imagem';
    if (tipo.includes('word') || tipo.includes('document')) return '📝 Documento';
    return '📎 Arquivo';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 border-b-2 border-blue-500 pb-2">
              <Building2 className="w-5 h-5" />
              Dados da Empresa
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_cliente">Nome do Cliente *</Label>
                <Input
                  id="nome_cliente"
                  value={formData.nome_cliente}
                  onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                <Input
                  id="nome_empresa"
                  value={formData.nome_empresa}
                  onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})}
                  required
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
                />
              </div>
              <div>
                <Label htmlFor="telefone_cliente">Telefone</Label>
                <Input
                  id="telefone_cliente"
                  value={formData.telefone_cliente}
                  onChange={(e) => setFormData({...formData, telefone_cliente: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label htmlFor="produto">Produto</Label>
                <Input
                  id="produto"
                  value={formData.produto}
                  onChange={(e) => setFormData({...formData, produto: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="valor_mensalidade">Valor Mensalidade (R$)</Label>
                <Input
                  id="valor_mensalidade"
                  type="number"
                  step="0.01"
                  value={formData.valor_mensalidade}
                  onChange={(e) => setFormData({...formData, valor_mensalidade: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="dia_pagamento">Dia do Pagamento</Label>
                <Input
                  id="dia_pagamento"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_pagamento}
                  onChange={(e) => setFormData({...formData, dia_pagamento: e.target.value})}
                  placeholder="Ex: 10"
                />
              </div>
              <div>
                <Label htmlFor="status_pagamento">Status</Label>
                <Select 
                  value={formData.status_pagamento} 
                  onValueChange={(value) => setFormData({...formData, status_pagamento: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="endereco_completo">Endereço Completo</Label>
              <Input
                id="endereco_completo"
                value={formData.endereco_completo}
                onChange={(e) => setFormData({...formData, endereco_completo: e.target.value})}
                placeholder="Rua, número, bairro, cidade, estado, CEP"
              />
            </div>
          </div>

          {/* Dados do Representante */}
          <div className="space-y-4 bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
            <h3 className="font-bold text-lg text-purple-900 flex items-center gap-2 border-b-2 border-purple-500 pb-2">
              <User className="w-5 h-5" />
              Dados do Representante Legal
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="representante_nome">Nome do Representante</Label>
                <Input
                  id="representante_nome"
                  value={formData.representante_nome}
                  onChange={(e) => setFormData({...formData, representante_nome: e.target.value})}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="representante_cargo">Cargo</Label>
                <Input
                  id="representante_cargo"
                  value={formData.representante_cargo}
                  onChange={(e) => setFormData({...formData, representante_cargo: e.target.value})}
                  placeholder="Ex: Diretor, Gerente, Sócio"
                />
              </div>
              <div>
                <Label htmlFor="representante_email">Email</Label>
                <Input
                  id="representante_email"
                  type="email"
                  value={formData.representante_email}
                  onChange={(e) => setFormData({...formData, representante_email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="representante_telefone">Telefone</Label>
                <Input
                  id="representante_telefone"
                  value={formData.representante_telefone}
                  onChange={(e) => setFormData({...formData, representante_telefone: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="representante_cpf">CPF</Label>
                <Input
                  id="representante_cpf"
                  value={formData.representante_cpf}
                  onChange={(e) => setFormData({...formData, representante_cpf: e.target.value})}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>

          {/* Arquivos Anexos */}
          <div className="space-y-4 bg-green-50 p-6 rounded-xl border-2 border-green-200">
            <h3 className="font-bold text-lg text-green-900 flex items-center gap-2 border-b-2 border-green-500 pb-2">
              <FileText className="w-5 h-5" />
              Arquivos Anexos
            </h3>
            
            <div>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-100 transition-all">
                  {uploadingFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                      <p className="text-green-700 font-semibold">Fazendo upload...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-700 font-semibold">Clique para fazer upload</p>
                      <p className="text-sm text-green-600 mt-1">PDFs, Imagens, Documentos</p>
                    </>
                  )}
                </div>
              </Label>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>

            {uploadError && (
              <Alert variant="destructive">
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {formData.arquivos_urls.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-900">Arquivos anexados:</p>
                {formData.arquivos_urls.map((arquivo, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{arquivo.nome}</p>
                        <p className="text-xs text-slate-500">
                          {getTipoArquivo(arquivo.tipo)} • {new Date(arquivo.data_upload).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={arquivo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={4}
              placeholder="Informações adicionais sobre o cliente..."
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}