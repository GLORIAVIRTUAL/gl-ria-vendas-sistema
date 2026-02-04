import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Loader2, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function TemplateSelector({ contact, onSent }) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [parameters, setParameters] = useState({});

  // Busca templates diretamente do WABA conectado
  const { data: wabaData, isLoading: loadingTemplates, refetch } = useQuery({
    queryKey: ['waba-templates'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getWabaTemplates');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const templates = wabaData?.templates || [];

  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('sendTemplateMessage', {
        phone: contact.phone,
        template_name: selectedTemplate,
        parameters: parameters.filter(p => p.trim())
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Template enviado com sucesso!');
      setSelectedTemplate('');
      setParameters([]);
      onSent?.();
    },
    onError: (error) => {
      toast.error('Erro ao enviar template: ' + error.message);
    }
  });

  const currentTemplate = templates.find(t => t.name === selectedTemplate);

  const handleSend = () => {
    if (!selectedTemplate) {
      toast.error('Selecione um template');
      return;
    }
    sendMutation.mutate();
  };

  return (
    <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-900">Enviar Template Aprovado</span>
      </div>

      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="Escolha um template..." />
        </SelectTrigger>
        <SelectContent>
          {templates.map(t => (
            <SelectItem key={t.id} value={t.name}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentTemplate && currentTemplate.parameters?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Parâmetros:</p>
          {currentTemplate.parameters.map((param, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={`${param.name} (${param.type})`}
              value={parameters[idx] || ''}
              onChange={(e) => {
                const newParams = [...parameters];
                newParams[idx] = e.target.value;
                setParameters(newParams);
              }}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          ))}
        </div>
      )}

      {currentTemplate?.body && (
        <div className="p-2 bg-white rounded border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Preview:</p>
          <p className="text-sm text-slate-700">{currentTemplate.body}</p>
        </div>
      )}

      <Button
        onClick={handleSend}
        disabled={!selectedTemplate || sendMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="sm"
      >
        {sendMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Enviar Template
          </>
        )}
      </Button>
    </div>
  );
}