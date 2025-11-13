import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Package, Target, CheckCircle } from "lucide-react";

const produtoConfig = {
  Gloria_Atendente: { nome: "Glória Atendente", icon: "👤" },
  Gloria_Clinica: { nome: "Glória Clínica", icon: "🏥" },
  Maquina_de_Videos: { nome: "Máquina de Vídeos", icon: "🎬" },
  Gloria_Financas: { nome: "Glória Finanças", icon: "💰" },
  Avatar_ao_Vivo: { nome: "Avatar ao Vivo", icon: "🎭" }
};

const statusOnboardingConfig = {
  Nao_Iniciado: { nome: "Não Iniciado", cor: "bg-slate-100 text-slate-700" },
  Em_Andamento: { nome: "Em Andamento", cor: "bg-blue-100 text-blue-700" },
  Aguardando_Cliente: { nome: "Aguardando Cliente", cor: "bg-yellow-100 text-yellow-700" },
  Concluido: { nome: "Concluído", cor: "bg-green-100 text-green-700" }
};

export default function EditLeadDialog({ lead, open, onOpenChange, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    nome_cliente: "",
    nome_empresa: "",
    email_cliente: "",
    telefone_cliente: "",
    produto_interesse: "",
    valor_estimado: "",
    data_reuniao: "",
    prioridade: "Media",
    observacoes: "",
    proximos_passos: "",
    data_entrega: "",
    tarefas_pendentes: "",
    status_onboarding: "Nao_Iniciado"
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        nome_cliente: lead.nome_cliente || "",
        nome_empresa: lead.nome_empresa || "",
        email_cliente: lead.email_cliente || "",
        telefone_cliente: lead.telefone_cliente || "",
        produto_interesse: lead.produto_interesse || "",
        valor_estimado: lead.valor_estimado || "",
        data_reuniao: lead.data_reuniao || "",
        prioridade: lead.prioridade || "Media",
        observacoes: lead.observacoes || "",
        proximos_passos: lead.proximos_passos || "",
        data_entrega: lead.data_entrega || "",
        tarefas_pendentes: lead.tarefas_pendentes || "",
        status_onboarding: lead.status_onboarding || "Nao_Iniciado"
      });
    }
  }, [lead]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : 0
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
          <DialogDescription>
            Atualize as informações e acompanhamento do cliente
          </DialogDescription>
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

          {/* Produto e Valores */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
              <Package className="w-4 h-4" />
              Produto e Detalhes
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

          {/* Onboarding e Acompanhamento */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
              <Target className="w-4 h-4" />
              Onboarding e Acompanhamento
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_entrega">📅 Data de Entrega Prevista</Label>
                <Input
                  id="data_entrega"
                  type="date"
                  value={formData.data_entrega}
                  onChange={(e) => setFormData({...formData, data_entrega: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="status_onboarding">Status do Onboarding</Label>
                <Select 
                  value={formData.status_onboarding} 
                  onValueChange={(value) => setFormData({...formData, status_onboarding: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusOnboardingConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="proximos_passos">📋 Próximos Passos</Label>
              <Textarea
                id="proximos_passos"
                value={formData.proximos_passos}
                onChange={(e) => setFormData({...formData, proximos_passos: e.target.value})}
                placeholder="Ex: Enviar proposta, agendar call técnica, solicitar documentos..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tarefas_pendentes">✅ Tarefas Pendentes</Label>
              <Textarea
                id="tarefas_pendentes"
                value={formData.tarefas_pendentes}
                onChange={(e) => setFormData({...formData, tarefas_pendentes: e.target.value})}
                placeholder="Lista de tarefas que precisam ser concluídas..."
                rows={3}
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">💬 Observações Gerais</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={3}
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
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={isSaving}
            >
              {isSaving ? (
                "Salvando..."
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