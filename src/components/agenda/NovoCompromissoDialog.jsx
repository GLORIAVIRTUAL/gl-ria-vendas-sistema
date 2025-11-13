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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, CheckCircle, Loader2 } from "lucide-react";

const coresDisponiveis = [
  { valor: '#3b82f6', nome: 'Azul' },
  { valor: '#10b981', nome: 'Verde' },
  { valor: '#f59e0b', nome: 'Laranja' },
  { valor: '#ef4444', nome: 'Vermelho' },
  { valor: '#8b5cf6', nome: 'Roxo' },
  { valor: '#ec4899', nome: 'Rosa' },
];

export default function NovoCompromissoDialog({ open, onOpenChange, onSave, isSaving, dataInicial }) {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data: "",
    horario: "",
    prioridade: "Media",
    notificar_whatsapp: false,
    telefone_notificacao: "",
    minutos_antes_notificar: 30,
    cor: "#3b82f6",
    recorrente: false,
    tipo_recorrencia: "Nenhuma"
  });

  useEffect(() => {
    if (dataInicial) {
      setFormData(prev => ({ ...prev, data: dataInicial }));
    }
  }, [dataInicial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormData({
      titulo: "",
      descricao: "",
      data: "",
      horario: "",
      prioridade: "Media",
      notificar_whatsapp: false,
      telefone_notificacao: "",
      minutos_antes_notificar: 30,
      cor: "#3b82f6",
      recorrente: false,
      tipo_recorrencia: "Nenhuma"
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Novo Compromisso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              placeholder="Ex: Reunião com cliente"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              placeholder="Detalhes do compromisso..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data *
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({...formData, data: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="horario" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horário *
              </Label>
              <Input
                id="horario"
                type="time"
                value={formData.horario}
                onChange={(e) => setFormData({...formData, horario: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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

            <div>
              <Label htmlFor="cor">Cor</Label>
              <Select 
                value={formData.cor} 
                onValueChange={(value) => setFormData({...formData, cor: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {coresDisponiveis.map(cor => (
                    <SelectItem key={cor.valor} value={cor.valor}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-slate-300" 
                          style={{ backgroundColor: cor.valor }}
                        />
                        {cor.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => setFormData({...formData, recorrente: checked, tipo_recorrencia: checked ? "Semanal" : "Nenhuma"})}
              />
              <Label htmlFor="recorrente" className="font-semibold text-purple-900">
                🔄 Compromisso Recorrente
              </Label>
            </div>

            {formData.recorrente && (
              <div className="pl-6">
                <Label htmlFor="tipo_recorrencia">Repetir</Label>
                <Select 
                  value={formData.tipo_recorrencia} 
                  onValueChange={(value) => setFormData({...formData, tipo_recorrencia: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semanal">Toda Semana (mesmo dia da semana)</SelectItem>
                    <SelectItem value="Mensal">Todo Mês (mesmo dia do mês)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-purple-600 mt-2">
                  ⚠️ Os próximos 8 compromissos serão criados automaticamente
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notificar_whatsapp"
                checked={formData.notificar_whatsapp}
                onCheckedChange={(checked) => setFormData({...formData, notificar_whatsapp: checked})}
              />
              <Label htmlFor="notificar_whatsapp" className="font-semibold text-green-900">
                📱 Notificar via WhatsApp
              </Label>
            </div>

            {formData.notificar_whatsapp && (
              <div className="space-y-3 pl-6">
                <div>
                  <Label htmlFor="telefone_notificacao">Telefone *</Label>
                  <Input
                    id="telefone_notificacao"
                    value={formData.telefone_notificacao}
                    onChange={(e) => setFormData({...formData, telefone_notificacao: e.target.value})}
                    placeholder="5511999999999"
                    required={formData.notificar_whatsapp}
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Formato: Código do país + DDD + número (ex: 5511999999999)
                  </p>
                </div>

                <div>
                  <Label htmlFor="minutos_antes">Notificar quanto tempo antes?</Label>
                  <Select 
                    value={String(formData.minutos_antes_notificar)} 
                    onValueChange={(value) => setFormData({...formData, minutos_antes_notificar: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos antes</SelectItem>
                      <SelectItem value="30">30 minutos antes</SelectItem>
                      <SelectItem value="60">1 hora antes</SelectItem>
                      <SelectItem value="120">2 horas antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Criar Compromisso
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}