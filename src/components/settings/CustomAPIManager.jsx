import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Globe, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomAPIManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAPI, setEditingAPI] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    method: 'POST',
    headers: {},
    body_template: '',
    is_active: true
  });
  
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const { data: apis = [], isLoading } = useQuery({
    queryKey: ['custom-apis'],
    queryFn: async () => {
      return await base44.entities.CustomAPI.list();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-apis'] });
      toast.success('API criada com sucesso');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-apis'] });
      toast.success('API atualizada com sucesso');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-apis'] });
      toast.success('API removida');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      url: '',
      method: 'POST',
      headers: {},
      body_template: '',
      is_active: true
    });
    setEditingAPI(null);
    setDialogOpen(false);
    setHeaderKey('');
    setHeaderValue('');
  };

  const handleSave = () => {
    const dataToSave = {
      name: formData.name,
      description: formData.description,
      url: formData.url,
      method: formData.method,
      headers: formData.headers || {},
      body_template: formData.body_template || '',
      is_active: formData.is_active
    };
    
    if (editingAPI) {
      updateMutation.mutate({ id: editingAPI.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleEdit = (api) => {
    setEditingAPI(api);
    const headers = api.headers && typeof api.headers === 'object' ? api.headers : {};
    setFormData({
      name: api.name || '',
      description: api.description || '',
      url: api.url || '',
      method: api.method || 'POST',
      headers: headers,
      body_template: api.body_template || '',
      is_active: api.is_active !== undefined ? api.is_active : true
    });
    setDialogOpen(true);
  };

  const addHeader = () => {
    if (headerKey && headerValue) {
      const newHeaders = { ...(formData.headers || {}), [headerKey]: headerValue };
      setFormData(prev => ({ ...prev, headers: newHeaders }));
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData({ ...formData, headers: newHeaders });
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">APIs Customizadas</h3>
          <p className="text-sm text-slate-500">
            Configure chamadas HTTP que a IA pode executar durante conversas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova API
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAPI ? 'Editar API' : 'Nova API Customizada'}</DialogTitle>
              <DialogDescription>
                Configure uma chamada HTTP que a IA poderá executar
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da API *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="verificarDisponibilidade"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Verifica a disponibilidade de horários no sistema"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>URL da API *</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://api.exemplo.com/endpoint"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método</Label>
                  <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Headers Customizados</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Chave (ex: Authorization)"
                    value={headerKey}
                    onChange={(e) => setHeaderKey(e.target.value)}
                  />
                  <Input
                    placeholder="Valor (ex: Bearer token123)"
                    value={headerValue}
                    onChange={(e) => setHeaderValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addHeader()}
                  />
                  <Button 
                    onClick={addHeader} 
                    variant="outline"
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 mt-2">
                  {Object.keys(formData.headers || {}).length === 0 ? (
                    <div className="text-xs text-slate-400 italic">Nenhum header adicionado</div>
                  ) : (
                    Object.entries(formData.headers).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                        <span className="text-sm"><strong>{key}:</strong> {value}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeHeader(key)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template do Corpo (JSON)</Label>
                <Textarea
                  value={formData.body_template}
                  onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
                  placeholder='{"data": "{{data}}", "horario": "{{horario}}"}'
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  Use {`{{variavel}}`} para valores dinâmicos que a IA irá preencher
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <p className="text-xs text-slate-500">API ativa e disponível para IA</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.url}>
                {editingAPI ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {apis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-center">
              Nenhuma API configurada ainda.<br />
              Crie sua primeira API customizada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apis.map((api) => (
            <Card key={api.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {api.name}
                      <Badge variant={api.is_active ? "default" : "secondary"}>
                        {api.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="outline">{api.method}</Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">{api.description}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(api)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(api.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-500">URL:</span>{' '}
                    <code className="bg-slate-100 px-2 py-0.5 rounded">{api.url}</code>
                  </div>
                  {Object.keys(api.headers || {}).length > 0 && (
                    <div>
                      <span className="text-slate-500">Headers:</span>{' '}
                      <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {Object.keys(api.headers).join(', ')}
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}