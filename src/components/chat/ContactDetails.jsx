import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, Mail, Phone, Plus, 
  Trash2, Save 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const pipelineStages = [
  { value: 'novo_lead', label: 'Novo Lead', color: 'bg-blue-500' },
  { value: 'qualificado', label: 'Qualificado', color: 'bg-cyan-500' },
  { value: 'proposta', label: 'Proposta', color: 'bg-yellow-500' },
  { value: 'negociacao', label: 'Negociação', color: 'bg-orange-500' },
  { value: 'fechado_ganho', label: 'Fechado (Ganho)', color: 'bg-green-500' },
  { value: 'fechado_perdido', label: 'Fechado (Perdido)', color: 'bg-gray-500' },
];

export default function ContactDetails({ contact, onUpdate, onClose }) {
  const [editedContact, setEditedContact] = useState(contact);
  const [newKeyword, setNewKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: customFields = [] } = useQuery({
    queryKey: ['customFields'],
    queryFn: () => base44.entities.CustomField.list('order'),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list(),
  });

  useEffect(() => {
    setEditedContact(contact);
  }, [contact]);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(editedContact);
    setIsSaving(false);
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const currentKeywords = editedContact.keywords || [];
    if (!currentKeywords.includes(newKeyword.trim())) {
      setEditedContact({
        ...editedContact,
        keywords: [...currentKeywords, newKeyword.trim()]
      });
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (keyword) => {
    setEditedContact({
      ...editedContact,
      keywords: (editedContact.keywords || []).filter(k => k !== keyword)
    });
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setEditedContact({
      ...editedContact,
      custom_fields: {
        ...(editedContact.custom_fields || {}),
        [fieldName]: value
      }
    });
  };

  if (!contact) return null;

  return (
    <div className="w-80 bg-white border-l border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">Detalhes do Contato</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 border-4 border-blue-100 mb-3">
            <AvatarImage src={contact.profile_picture} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl">
              {(contact.name || contact.phone || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Input
            value={editedContact.name || ''}
            onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
            placeholder="Nome do contato"
            className="text-center font-semibold border-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <Input
              value={editedContact.phone || ''}
              onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
              placeholder="Telefone"
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <Input
              value={editedContact.email || ''}
              onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
              placeholder="Email"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-500 uppercase">Pipeline</Label>
          <Select
            value={editedContact.pipeline_stage || 'novo_lead'}
            onValueChange={(value) => setEditedContact({ ...editedContact, pipeline_stage: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelineStages.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", stage.color)} />
                    {stage.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-500 uppercase">Palavras-chave</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(editedContact.keywords || []).map((kw, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer group"
                onClick={() => handleRemoveKeyword(kw)}
              >
                {kw}
                <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Select value={newKeyword} onValueChange={setNewKeyword}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar tag..." />
              </SelectTrigger>
              <SelectContent>
                {keywords.map((kw) => (
                  <SelectItem key={kw.id} value={kw.keyword}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: kw.color || '#3b82f6' }} 
                      />
                      {kw.keyword}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="outline" onClick={handleAddKeyword}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {customFields.length > 0 && (
          <div className="space-y-3">
            <Label className="text-xs font-medium text-slate-500 uppercase">Campos Personalizados</Label>
            {customFields.map((field) => (
              <div key={field.id} className="space-y-1">
                <Label className="text-xs text-slate-600">{field.field_label}</Label>
                {field.field_type === 'select' ? (
                  <Select
                    value={editedContact.custom_fields?.[field.field_name] || ''}
                    onValueChange={(value) => handleCustomFieldChange(field.field_name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options || []).map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.field_type === 'boolean' ? (
                  <Select
                    value={editedContact.custom_fields?.[field.field_name]?.toString() || ''}
                    onValueChange={(value) => handleCustomFieldChange(field.field_name, value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.field_type === 'date' ? 'date' : field.field_type === 'datetime' ? 'datetime-local' : field.field_type === 'number' ? 'number' : 'text'}
                    value={editedContact.custom_fields?.[field.field_name] || ''}
                    onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                    placeholder={field.field_label}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-500 uppercase">Observações</Label>
          <Textarea
            value={editedContact.notes || ''}
            onChange={(e) => setEditedContact({ ...editedContact, notes: e.target.value })}
            placeholder="Adicione observações..."
            rows={3}
          />
        </div>
      </div>

      <div className="p-4 border-t border-slate-100">
        <Button 
          onClick={handleSave} 
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
}