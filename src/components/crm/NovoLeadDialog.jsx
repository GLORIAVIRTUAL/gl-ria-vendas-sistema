import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { User, Package, Check } from "lucide-react";

const produtoConfig = {
  Gloria_Atendente: { nome: "Glória Atendente", icon: "👤" },
  Gloria_Clinica: { nome: "Glória Clínica", icon: "🏥" },
  Maquina_de_Videos: { nome: "Máquina de Vídeos", icon: "🎬" },
  Gloria_Financas: { nome: "Glória Finanças", icon: "💰" },
  Avatar_ao_Vivo: { nome: "Avatar ao Vivo", icon: "🎭" }
};

export default function NovoLeadDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome_cliente: "",
    nome_empresa: "",
    email_cliente: "",
    telefone_cliente: "",
    produto_interesse: "",
    valor_estimado: "",
    data_reuniao: "",
    prioridade: "Media",
    observacoes: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create({
      ...data,
      valor_estimado: data.valor_estimado ? parseFloat(data.valor_estimado) : 0,
      estagio: "Reuniao_Marcada"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onOpenChange(false);
      setFormData({
        nome_cliente: "",
        nome_empresa: "",
        email_cliente: "",
        telefone_cliente: "",
        produto_interesse: "",
        valor_estimado: "",
        data_reuniao: "",
        prioridade: "Media",
        observacoes: ""
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Dados do Cliente */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
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
                <Label htmlFor="nome_empresa">Nome da Empresa</Label>
                <Input
                  id="nome_empresa"
                  value={formData.nome_empresa}
                  onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})}
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

          {/* Produto */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produto de Interesse *
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(produtoConfig).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({...formData, produto_interesse: key})}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    formData.produto_interesse === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{config.icon}</span>
                    <span className="text-sm font-medium">{config.nome}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detalhes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Detalhes</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
                <Input
                  id="valor_estimado"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_estimado}
                  onChange={(e) => setFormData({...formData, valor_estimado: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="data_reuniao">Data da Reunião</Label>
                <Input
                  id="data_reuniao"
                  type="date"
                  value={formData.data_reuniao}
                  onChange={(e) => setFormData({...formData, data_reuniao: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select 
                  value={formData.prioridade} 
                  onValueChange={(value) => setFormData({...formData, prioridade: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Media">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                "Criando..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Criar Lead
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}