import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Plus, X, Bot, Zap, AlertTriangle, Cpu } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AIPromptEditor() {
  const queryClient = useQueryClient();
  
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['aiSettings'],
    queryFn: () => base44.entities.AISettings.list(),
  });

  const [currentSettings, setCurrentSettings] = useState({
    name: 'Principal',
    system_prompt: '',
    greeting_message: '',
    transfer_keywords: [],
    is_active: true,
    capture_fields: [],
    functions: [],
    ai_model: 'gpt-4o'
  });

  const [newTransferKeyword, setNewTransferKeyword] = useState('');
  const [newFunction, setNewFunction] = useState({
    name: '',
    description: '',
    webhook_url: ''
  });

  useEffect(() => {
    if (settings.length > 0) {
      setCurrentSettings(settings[0]);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings.length > 0) {
        return base44.entities.AISettings.update(settings[0].id, data);
      } else {
        return base44.entities.AISettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiSettings'] });
      toast.success('Configurações salvas com sucesso!');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(currentSettings);
  };

  const handleAddTransferKeyword = () => {
    if (!newTransferKeyword.trim()) return;
    setCurrentSettings({
      ...currentSettings,
      transfer_keywords: [...(currentSettings.transfer_keywords || []), newTransferKeyword.trim()]
    });
    setNewTransferKeyword('');
  };

  const handleRemoveTransferKeyword = (keyword) => {
    setCurrentSettings({
      ...currentSettings,
      transfer_keywords: (currentSettings.transfer_keywords || []).filter(k => k !== keyword)
    });
  };

  const handleAddFunction = () => {
    if (!newFunction.name || !newFunction.webhook_url) return;
    setCurrentSettings({
      ...currentSettings,
      functions: [...(currentSettings.functions || []), { ...newFunction }]
    });
    setNewFunction({ name: '', description: '', webhook_url: '' });
  };

  const handleRemoveFunction = (index) => {
    setCurrentSettings({
      ...currentSettings,
      functions: (currentSettings.functions || []).filter((_, i) => i !== index)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              Status da IA
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm",
                currentSettings.is_active ? "text-green-500" : "text-slate-500"
              )}>
                {currentSettings.is_active ? 'Ativa' : 'Inativa'}
              </span>
              <Switch
                checked={currentSettings.is_active}
                onCheckedChange={(checked) => setCurrentSettings({ ...currentSettings, is_active: checked })}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-500" />
            Modelo de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Selecione o modelo GPT</Label>
            <Select
              value={currentSettings.ai_model || 'gpt-4o'}
              onValueChange={(value) => setCurrentSettings({ ...currentSettings, ai_model: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">
                  <div className="flex flex-col">
                    <span className="font-semibold">GPT-4o</span>
                    <span className="text-xs text-slate-500">Mais inteligente e completo - Recomendado</span>
                  </div>
                </SelectItem>
                <SelectItem value="gpt-4o-mini">
                  <div className="flex flex-col">
                    <span className="font-semibold">GPT-4o Mini</span>
                    <span className="text-xs text-slate-500">Rápido e econômico - Bom para tarefas simples</span>
                  </div>
                </SelectItem>
                <SelectItem value="gpt-4-turbo">
                  <div className="flex flex-col">
                    <span className="font-semibold">GPT-4 Turbo</span>
                    <span className="text-xs text-slate-500">Alto desempenho - Versão anterior</span>
                  </div>
                </SelectItem>
                <SelectItem value="gpt-3.5-turbo">
                  <div className="flex flex-col">
                    <span className="font-semibold">GPT-3.5 Turbo</span>
                    <span className="text-xs text-slate-500">Econômico - Para alto volume</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              💡 GPT-4o oferece melhor qualidade de resposta e compreensão de contexto.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prompt de Sistema (Personalidade da IA)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={currentSettings.system_prompt || ''}
            onChange={(e) => setCurrentSettings({ ...currentSettings, system_prompt: e.target.value })}
            placeholder="Defina a personalidade e comportamento da IA. Ex: Você é um assistente virtual chamado GLÓRIA, especializado em atendimento ao cliente. Seja sempre educado, prestativo e direto nas respostas..."
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500 mt-2">
            Este prompt define como a IA irá se comportar e responder aos clientes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mensagem de Saudação</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={currentSettings.greeting_message || ''}
            onChange={(e) => setCurrentSettings({ ...currentSettings, greeting_message: e.target.value })}
            placeholder="Olá! 👋 Bem-vindo(a) à GLÓRIA. Como posso ajudar você hoje?"
            rows={4}
          />
          <p className="text-xs text-slate-500 mt-2">
            💡 A IA atende 24 horas por dia, 7 dias por semana!
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Palavras de Transferência para Humano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Quando o cliente mencionar estas palavras, a conversa será automaticamente transferida para um atendente humano.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(currentSettings.transfer_keywords || []).map((kw, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200"
                onClick={() => handleRemoveTransferKeyword(kw)}
              >
                {kw}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTransferKeyword}
              onChange={(e) => setNewTransferKeyword(e.target.value)}
              placeholder="Ex: falar com humano, atendente, gerente..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddTransferKeyword()}
            />
            <Button variant="outline" onClick={handleAddTransferKeyword}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Functions / Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Configure webhooks que a IA pode acionar para realizar ações externas (ex: agendar, consultar estoque).
          </p>
          
          <div className="space-y-3 mb-4">
            {(currentSettings.functions || []).map((func, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{func.name}</p>
                  <p className="text-xs text-slate-500">{func.webhook_url}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleRemoveFunction(i)}
                >
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <Input
              value={newFunction.name}
              onChange={(e) => setNewFunction({ ...newFunction, name: e.target.value })}
              placeholder="Nome da função"
            />
            <Input
              value={newFunction.description}
              onChange={(e) => setNewFunction({ ...newFunction, description: e.target.value })}
              placeholder="Descrição"
            />
            <div className="flex gap-2">
              <Input
                value={newFunction.webhook_url}
                onChange={(e) => setNewFunction({ ...newFunction, webhook_url: e.target.value })}
                placeholder="URL do webhook"
              />
              <Button variant="outline" onClick={handleAddFunction}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-8"
          disabled={saveMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}