import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Webhook, ArrowDownLeft, ArrowUpRight, Copy, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from 'date-fns';

const eventTypes = [
  'new_message',
  'new_contact',
  'pipeline_changed',
  'keyword_detected',
  'ai_response',
  'human_takeover'
];

export default function WebhookManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    type: 'outgoing',
    url: '',
    events: [],
    headers: {},
    is_active: true,
    secret_token: ''
  });

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.entities.WebhookConfig.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WebhookConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook criado!');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WebhookConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook atualizado!');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WebhookConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook removido!');
    },
  });

  const resetForm = () => {
    setNewWebhook({
      name: '',
      type: 'outgoing',
      url: '',
      events: [],
      headers: {},
      is_active: true,
      secret_token: ''
    });
    setEditingWebhook(null);
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim()) return;
    
    if (editingWebhook) {
      updateMutation.mutate({ id: editingWebhook.id, data: newWebhook });
    } else {
      createMutation.mutate(newWebhook);
    }
  };

  const handleEdit = (webhook) => {
    setEditingWebhook(webhook);
    setNewWebhook({
      name: webhook.name,
      type: webhook.type,
      url: webhook.url,
      events: webhook.events || [],
      headers: webhook.headers || {},
      is_active: webhook.is_active ?? true,
      secret_token: webhook.secret_token || ''
    });
    setIsDialogOpen(true);
  };

  const toggleEvent = (event) => {
    const current = newWebhook.events || [];
    if (current.includes(event)) {
      setNewWebhook({ ...newWebhook, events: current.filter(e => e !== event) });
    } else {
      setNewWebhook({ ...newWebhook, events: [...current, event] });
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('URL copiada!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateToken = () => {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    setNewWebhook({ ...newWebhook, secret_token: token });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Webhooks</h2>
          <p className="text-slate-500">Configure integrações com sistemas externos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <Plus className="w-4 h-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="Ex: Integração CRM, Notificação Slack..."
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newWebhook.type}
                  onValueChange={(value) => setNewWebhook({ ...newWebhook, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outgoing">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-blue-500" />
                        Saída (Enviar dados)
                      </div>
                    </SelectItem>
                    <SelectItem value="incoming">
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft className="w-4 h-4 text-green-500" />
                        Entrada (Receber dados)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://api.exemplo.com/webhook"
                />
              </div>

              {newWebhook.type === 'outgoing' && (
                <div className="space-y-2">
                  <Label>Eventos que disparam</Label>
                  <div className="flex flex-wrap gap-2">
                    {eventTypes.map((event) => (
                      <Badge
                        key={event}
                        variant={newWebhook.events?.includes(event) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          newWebhook.events?.includes(event) 
                            ? "bg-blue-500 hover:bg-blue-600" 
                            : "hover:bg-slate-100"
                        }`}
                        onClick={() => toggleEvent(event)}
                      >
                        {event.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Token Secreto (opcional)</Label>
                  <Button variant="ghost" size="sm" onClick={generateToken}>
                    Gerar
                  </Button>
                </div>
                <Input
                  value={newWebhook.secret_token}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret_token: e.target.value })}
                  placeholder="Token para validação"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch
                  checked={newWebhook.is_active}
                  onCheckedChange={(checked) => setNewWebhook({ ...newWebhook, is_active: checked })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingWebhook ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    webhook.type === 'incoming' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {webhook.type === 'incoming' 
                      ? <ArrowDownLeft className="w-5 h-5 text-green-500" />
                      : <ArrowUpRight className="w-5 h-5 text-blue-500" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{webhook.name}</p>
                      <Badge 
                        variant={webhook.is_active ? "default" : "secondary"}
                        className={webhook.is_active ? "bg-green-100 text-green-700" : ""}
                      >
                        {webhook.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500 font-mono truncate max-w-xs">
                        {webhook.url}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(webhook.url, webhook.id)}
                      >
                        {copiedId === webhook.id 
                          ? <CheckCircle className="w-3 h-3 text-green-500" />
                          : <Copy className="w-3 h-3" />
                        }
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {webhook.events?.length > 0 && (
                    <div className="flex gap-1">
                      {webhook.events.slice(0, 2).map((event, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          {event.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {webhook.events.length > 2 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{webhook.events.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {webhook.last_triggered && (
                    <span className="text-xs text-slate-400">
                      Último: {format(new Date(webhook.last_triggered), 'dd/MM HH:mm')}
                    </span>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(webhook)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteMutation.mutate(webhook.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {webhooks.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Webhook className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum webhook configurado</p>
          <p className="text-sm text-slate-400">Configure webhooks para integrar com outros sistemas</p>
        </div>
      )}
    </div>
  );
}