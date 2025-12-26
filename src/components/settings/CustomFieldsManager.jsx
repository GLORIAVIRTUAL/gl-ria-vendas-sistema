import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Pencil, X } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const fieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'date', label: 'Data' },
  { value: 'datetime', label: 'Data e Hora' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Seleção' },
  { value: 'boolean', label: 'Sim/Não' },
];

export default function CustomFieldsManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [newOption, setNewOption] = useState('');
  const [newField, setNewField] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text',
    options: [],
    is_required: false,
    ai_capture_prompt: '',
    order: 0
  });

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['customFields'],
    queryFn: () => base44.entities.CustomField.list('order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomField.create({ ...data, order: fields.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      toast.success('Campo criado!');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomField.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      toast.success('Campo atualizado!');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomField.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      toast.success('Campo removido!');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderedFields) => {
      await Promise.all(
        reorderedFields.map((field, index) =>
          base44.entities.CustomField.update(field.id, { order: index })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
    },
  });

  const resetForm = () => {
    setNewField({
      field_name: '',
      field_label: '',
      field_type: 'text',
      options: [],
      is_required: false,
      ai_capture_prompt: '',
      order: 0
    });
    setEditingField(null);
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (!newField.field_name.trim() || !newField.field_label.trim()) return;
    
    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data: newField });
    } else {
      createMutation.mutate(newField);
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setNewField({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      options: field.options || [],
      is_required: field.is_required || false,
      ai_capture_prompt: field.ai_capture_prompt || '',
      order: field.order || 0
    });
    setIsDialogOpen(true);
  };

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    setNewField({
      ...newField,
      options: [...(newField.options || []), newOption.trim()]
    });
    setNewOption('');
  };

  const handleRemoveOption = (option) => {
    setNewField({
      ...newField,
      options: (newField.options || []).filter(o => o !== option)
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const reordered = Array.from(fields);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    reorderMutation.mutate(reordered);
  };

  const generateFieldName = (label) => {
    return label.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Campos Personalizados</h2>
          <p className="text-slate-500">Configure campos para capturar dados dos clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <Plus className="w-4 h-4 mr-2" />
              Novo Campo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Editar Campo' : 'Novo Campo Personalizado'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome do Campo (Label)</Label>
                <Input
                  value={newField.field_label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setNewField({ 
                      ...newField, 
                      field_label: label,
                      field_name: editingField ? newField.field_name : generateFieldName(label)
                    });
                  }}
                  placeholder="Ex: Data do Agendamento, Interesse Principal..."
                />
              </div>

              <div className="space-y-2">
                <Label>Nome Técnico</Label>
                <Input
                  value={newField.field_name}
                  onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
                  placeholder="data_agendamento"
                  disabled={!!editingField}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  Usado internamente para identificar o campo
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Campo</Label>
                <Select
                  value={newField.field_type}
                  onValueChange={(value) => setNewField({ ...newField, field_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newField.field_type === 'select' && (
                <div className="space-y-2">
                  <Label>Opções</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(newField.options || []).map((opt, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => handleRemoveOption(opt)}
                      >
                        {opt}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Adicionar opção"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                    />
                    <Button variant="outline" onClick={handleAddOption}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Campo Obrigatório</Label>
                  <p className="text-xs text-slate-500">
                    Exigir preenchimento
                  </p>
                </div>
                <Switch
                  checked={newField.is_required}
                  onCheckedChange={(checked) => setNewField({ ...newField, is_required: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Instrução para IA capturar</Label>
                <Textarea
                  value={newField.ai_capture_prompt}
                  onChange={(e) => setNewField({ ...newField, ai_capture_prompt: e.target.value })}
                  placeholder="Ex: Quando o cliente mencionar uma data para agendamento, capture e salve neste campo..."
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  Instrua a IA sobre como identificar e capturar este dado na conversa
                </p>
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
                  {editingField ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="fields">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div {...provided.dragHandleProps} className="cursor-grab">
                          <GripVertical className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-800">{field.field_label}</p>
                            {field.is_required && (
                              <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono">{field.field_name}</p>
                        </div>
                        <Badge variant="outline">
                          {fieldTypes.find(t => t.value === field.field_type)?.label || field.field_type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(field)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteMutation.mutate(field.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {fields.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Plus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum campo personalizado</p>
          <p className="text-sm text-slate-400">Crie campos para capturar dados importantes</p>
        </div>
      )}
    </div>
  );
}