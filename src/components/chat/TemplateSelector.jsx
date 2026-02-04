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
      // Extrai os parâmetros em ordem para cada componente
      const templateParams = [];
      const currentTemplate = templates.find(t => t.name === selectedTemplate);
      
      if (currentTemplate?.components) {
        currentTemplate.components.forEach(comp => {
          if (comp.type === 'BODY' && comp.example?.body_text?.[0]) {
            const bodyParams = comp.example.body_text[0].map((_, idx) => 
              parameters[`body_${idx}`] || ''
            );
            templateParams.push(...bodyParams);
          }
        });
      }

      const response = await base44.functions.invoke('sendTemplateMessage', {
        phone: contact.phone,
        template_name: selectedTemplate,
        language: currentTemplate?.language || 'pt_BR',
        parameters: templateParams.filter(p => p.trim())
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Template enviado com sucesso!');
      setSelectedTemplate('');
      setParameters({});
      onSent?.();
    },
    onError: (error) => {
      toast.error('Erro ao enviar template: ' + error.message);
    }
  });

  const currentTemplate = templates.find(t => t.name === selectedTemplate);
  
  // Extrai variáveis do template
  const getTemplateVariables = () => {
    if (!currentTemplate?.components) return [];
    
    const variables = [];
    currentTemplate.components.forEach(comp => {
      if (comp.type === 'BODY') {
        // Encontra {{1}}, {{2}}, etc no texto
        const text = comp.text || '';
        const matches = text.match(/\{\{(\d+)\}\}/g) || [];
        matches.forEach((match, idx) => {
          const num = match.replace(/\{\{|\}\}/g, '');
          variables.push({ key: `body_${idx}`, label: `Variável ${num}`, example: comp.example?.body_text?.[0]?.[idx] });
        });
      }
    });
    return variables;
  };

  const templateVars = getTemplateVariables();

  const handleSend = () => {
    if (!selectedTemplate) {
      toast.error('Selecione um template');
      return;
    }
    sendMutation.mutate();
  };

  // Extrai o texto do body do template
  const getTemplateBody = () => {
    if (!currentTemplate?.components) return '';
    const bodyComp = currentTemplate.components.find(c => c.type === 'BODY');
    return bodyComp?.text || '';
  };

  return (
    <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">Enviar Template Aprovado</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={loadingTemplates}
          className="h-7 px-2"
        >
          <RefreshCw className={`w-3 h-3 ${loadingTemplates ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Select value={selectedTemplate} onValueChange={(val) => {
        setSelectedTemplate(val);
        setParameters({});
      }}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder={loadingTemplates ? "Carregando templates..." : "Escolha um template..."} />
        </SelectTrigger>
        <SelectContent>
          {templates.length === 0 && !loadingTemplates && (
            <div className="px-2 py-3 text-sm text-slate-500 text-center">
              Nenhum template aprovado encontrado
            </div>
          )}
          {templates.map(t => (
            <SelectItem key={t.id || t.name} value={t.name}>
              <div className="flex items-center gap-2">
                <span>{t.name}</span>
                <span className="text-xs text-slate-400">({t.language})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {templateVars.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Preencha as variáveis:</p>
          {templateVars.map((v) => (
            <input
              key={v.key}
              type="text"
              placeholder={v.example ? `Ex: ${v.example}` : v.label}
              value={parameters[v.key] || ''}
              onChange={(e) => {
                setParameters(prev => ({ ...prev, [v.key]: e.target.value }));
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:border-blue-400 focus:outline-none"
            />
          ))}
        </div>
      )}

      {currentTemplate && (
        <div className="p-3 bg-white rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Preview:</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{getTemplateBody()}</p>
          {currentTemplate.category && (
            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              {currentTemplate.category}
            </span>
          )}
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