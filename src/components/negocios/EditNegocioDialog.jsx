import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
import { User, Package, CreditCard, Check } from "lucide-react";

const produtoConfig = {
  Gloria_Atendente: { nome: "Glória Atendente" },
  Gloria_Clinica: { nome: "Glória Clínica" },
  Maquina_de_Videos: { nome: "Máquina de Vídeos" },
  Gloria_Financas: { nome: "Glória Finanças" },
  Avatar_ao_Vivo: { nome: "Avatar ao Vivo" }
};

export default function EditNegocioDialog({ negocio, open, onOpenChange, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    nome_cliente: "",
    nome_empresa: "",
    email_cliente: "",
    telefone_cliente: "",
    produto: "",
    valor_mensalidade: "",
    dia_cobranca: "",
    forma_pagamento: "",
    afiliado_id: "",
    observacoes: ""
  });

  const { data: afiliados = [] } = useQuery({
    queryKey: ['afiliados'],
    queryFn: () => base44.entities.Afiliado.list(),
    initialData: [],
  });

  useEffect(() => {
    if (negocio) {
      setFormData({
        nome_cliente: negocio.nome_cliente || "",
        nome_empresa: negocio.nome_empresa || "",
        email_cliente: negocio.email_cliente || "",
        telefone_cliente: negocio.telefone_cliente || "",
        produto: negocio.produto || "",
        valor_mensalidade: negocio.valor_mensalidade || "",
        dia_cobranca: negocio.dia_cobranca || "",
        forma_pagamento: negocio.forma_pagamento || "",
        afiliado_id: negocio.afiliado_id || "",
        observacoes: negocio.observacoes || ""
      });
    }
  }, [negocio]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      valor_mensalidade: parseFloat(formData.valor_mensalidade),
      dia_cobranca: parseInt(formData.dia_cobranca)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Negócio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Dados do Cliente */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
              <User className="w-4 h-4" />
              Dados do Cliente
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
            </div>
          </div>

          {/* Produto e Valores */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
              <Package className="w-4 h-4" />
              Produto e Valores
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="produto">Produto *</Label>
                <Select value={formData.produto} onValueChange={(value) => setFormData({...formData, produto: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(produtoConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="valor_mensalidade">Valor Mensalidade (R$) *</Label>
                <Input
                  id="valor_mensalidade"
                  type="number"
                  step="0.01"
                  value={formData.valor_mensalidade}
                  onChange={(e) => setFormData({...formData, valor_mensalidade: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="afiliado_id">Afiliado</Label>
                <Select value={formData.afiliado_id} onValueChange={(value) => setFormData({...formData, afiliado_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem afiliado" />
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
            </div>
          </div>

          {/* Cobrança */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
              <CreditCard className="w-4 h-4" />
              Dados de Cobrança
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dia_cobranca">Dia de Cobrança *</Label>
                <Input
                  id="dia_cobranca"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_cobranca}
                  onChange={(e) => setFormData({...formData, dia_cobranca: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                <Select value={formData.forma_pagamento} onValueChange={(value) => setFormData({...formData, forma_pagamento: value})} required>
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
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={3}
            />
          </div>

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
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={isSaving}
            >
              {isSaving ? (
                "Salvando..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
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