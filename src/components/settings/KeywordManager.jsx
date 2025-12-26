import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Tag, Pencil } from 'lucide-react';
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

const predefinedColors = [
  '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316'
];

export default function KeywordManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [newKeyword, setNewKeyword] = useState({
    keyword: '',
    category: '',
    color: '#3b82f6',
    auto_apply: true,
    trigger_action: 'none',
    action_config: {}
  });

  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Keyword.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast.success('Palavra-chave criada!');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Keyword.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast.success('Palavra-chave atualizada!');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Keyword.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast.success('Palavra-chave removida!');
    },
  });

  const resetForm = () => {
    setNewKeyword({
      keyword: '',
      category: '',
      color: '#3b82f6',
      auto_apply: true,
      trigger_action: 'none',
      action_config: {}
    });
    setEditingKeyword(null);
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (!newKeyword.keyword.trim()) return;
    
    if (editingKeyword) {
      updateMutation.mutate({ id: editingKeyword.id, data: newKeyword });
    } else {
      createMutation.mutate(newKeyword);
    }
  };

  const handleEdit = (keyword) => {
    setEditingKeyword(keyword);
    setNewKeyword({
      keyword: keyword.keyword,
      category: keyword.category || '',
      color: keyword.color || '#3b82f6',
      auto_apply: keyword.auto_apply ?? true,
      trigger_action: keyword.trigger_action || 'none',
      action_config: keyword.action_config || {}
    });
    setIsDialogOpen(true);
  };

  const categories = [...new Set(keywords.map(k => k.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Palavras-chave</h2>
          <p className="text-slate-500">Gerencie tags para classificar seus contatos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <Plus className="w-4 h-4 mr-2" />
              Nova Palavra-chave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingKeyword ? 'Editar Palavra-chave' : 'Nova Palavra-chave'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Palavra-chave</Label>
                <Input
                  value={newKeyword.keyword}
                  onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                  placeholder="Ex: Interessado, Urgente, VIP..."
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={newKeyword.category}
                  onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
                  placeholder="Ex: Interesse, Status, Produto..."
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewKeyword({ ...newKeyword, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newKeyword.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Aplicar automaticamente</Label>
                  <p className="text-xs text-slate-500">
                    Aplicar tag quando a palavra for detectada
                  </p>
                </div>
                <Switch
                  checked={newKeyword.auto_apply}
                  onCheckedChange={(checked) => setNewKeyword({ ...newKeyword, auto_apply: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Ação ao detectar</Label>
                <Select
                  value={newKeyword.trigger_action}
                  onValueChange={(value) => setNewKeyword({ ...newKeyword, trigger_action: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="move_pipeline">Mover no Pipeline</SelectItem>
                    <SelectItem value="notify">Notificar</SelectItem>
                    <SelectItem value="webhook">Chamar Webhook</SelectItem>
                  </SelectContent>
                </Select>
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
                  {editingKeyword ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {keywords.map((keyword) => (
          <Card key={keyword.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: keyword.color || '#3b82f6' }} 
                  />
                  <div>
                    <p className="font-medium text-slate-800">{keyword.keyword}</p>
                    {keyword.category && (
                      <p className="text-xs text-slate-500">{keyword.category}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEdit(keyword)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteMutation.mutate(keyword.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {keyword.auto_apply && (
                  <Badge variant="outline" className="text-[10px]">Auto</Badge>
                )}
                {keyword.trigger_action !== 'none' && (
                  <Badge variant="secondary" className="text-[10px]">
                    {keyword.trigger_action === 'move_pipeline' ? 'Move Pipeline' :
                     keyword.trigger_action === 'notify' ? 'Notifica' : 'Webhook'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {keywords.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma palavra-chave cadastrada</p>
          <p className="text-sm text-slate-400">Crie tags para organizar seus contatos</p>
        </div>
      )}
    </div>
  );
}