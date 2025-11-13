import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { User, CreditCard, Check } from "lucide-react";

export default function EditAfiliadoDialog({ afiliado, open, onOpenChange, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    stripe_connect_account_id: "",
    percentual_comissao: 20,
    ativo: true,
    observacoes: ""
  });

  useEffect(() => {
    if (afiliado) {
      setFormData({
        nome: afiliado.nome || "",
        email: afiliado.email || "",
        telefone: afiliado.telefone || "",
        stripe_connect_account_id: afiliado.stripe_connect_account_id || "",
        percentual_comissao: afiliado.percentual_comissao || 20,
        ativo: afiliado.ativo !== undefined ? afiliado.ativo : true,
        observacoes: afiliado.observacoes || ""
      });
    }
  }, [afiliado]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      percentual_comissao: parseFloat(formData.percentual_comissao)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Afiliado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
              <User className="w-4 h-4" />
              Dados do Afiliado
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
              <CreditCard className="w-4 h-4" />
              Stripe Connect
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stripe_connect_account_id">ID da Conta Conectada *</Label>
                <Input
                  id="stripe_connect_account_id"
                  value={formData.stripe_connect_account_id}
                  onChange={(e) => setFormData({...formData, stripe_connect_account_id: e.target.value.trim()})}
                  placeholder="acct_..."
                  required
                  className="font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  ⚠️ Cuidado com "l" (L minúsculo) vs "I" (i maiúsculo)
                </p>
                {formData.stripe_connect_account_id && !formData.stripe_connect_account_id.startsWith('acct_') && (
                  <p className="text-xs text-red-600 mt-1">
                    ❌ ID deve começar com "acct_"
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="percentual_comissao">Percentual de Comissão (%) *</Label>
                <Input
                  id="percentual_comissao"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.percentual_comissao}
                  onChange={(e) => setFormData({...formData, percentual_comissao: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
            />
            <Label>Afiliado Ativo</Label>
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
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
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