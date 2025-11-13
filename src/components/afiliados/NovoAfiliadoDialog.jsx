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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, CreditCard, Check, AlertCircle, ExternalLink } from "lucide-react";

export default function NovoAfiliadoDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    stripe_connect_account_id: "",
    percentual_comissao: 20,
    ativo: true,
    observacoes: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Afiliado.create({
      ...data,
      percentual_comissao: parseFloat(data.percentual_comissao)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afiliados'] });
      onOpenChange(false);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        stripe_connect_account_id: "",
        percentual_comissao: 20,
        ativo: true,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Afiliado</DialogTitle>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            <strong>⚠️ Importante:</strong> Certifique-se de usar uma conta conectada do mesmo ambiente (TEST ou LIVE) que sua chave API.
            <br />
            <a 
              href="https://dashboard.stripe.com/connect/accounts/overview" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-semibold mt-1 inline-flex items-center gap-1"
            >
              Criar conta conectada no Stripe (LIVE) <ExternalLink className="w-3 h-3" />
            </a>
            {" | "}
            <a 
              href="https://dashboard.stripe.com/test/connect/accounts/overview" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-semibold inline-flex items-center gap-1"
            >
              Criar no modo TEST <ExternalLink className="w-3 h-3" />
            </a>
          </AlertDescription>
        </Alert>

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
                  onChange={(e) => setFormData({...formData, stripe_connect_account_id: e.target.value})}
                  placeholder="acct_..."
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Começa com "acct_"</p>
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
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                "Criando..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Criar Afiliado
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}