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
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [parameters, setParameters] = useState({});

  // Busca templates locais cadastrados na entidade MetaTemplate
  const { data: templates = [], isLoading: loadingTemplates, refetch } = useQuery({
    queryKey: ['meta-templates'],
    queryFn: async () => {
      const result = await base44.entities.MetaTemplate.filter({ ativo: true });
      return result || [];
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const currentTemplate = templates.find(t => t.id === selectedTemplateId);

  // Extrai variáveis {{1}}, {{2}}, etc do body do template
  const getTemplateVariables = () => {
    if (!currentTemplate?.body) return [];
    const matches = currentTemplate.body.match(/\{\{(\d+)\}\}/g) || [];
    return matches.map((match, idx) => {
      const num = match.replace(/\{\{|\}\}/g, '');
      const paramName = currentTemplate.parameters?.[idx]?.name;
      return {
        key: `var_${idx}`,
        label: paramName ? `Variável ${num} (${paramName})` : `Variável ${num}`,
      };
    });
  };

  const templateVars = getTemplateVariables();

  // Substitui {{1}}, {{2}} pelos valores preenchidos
  const buildFinalMessage = () => {
    if (!currentTemplate?.body) return '';
    let msg = currentTemplate.body;
    templateVars.forEach((v, idx) => {
      const value = parameters[v.key] || '';
      msg = msg.replace(`{{${idx + 1}}}`, value);
    });
    return msg;
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      const mensagem = buildFinalMessage();
      if (!mensagem.trim()) {
        throw new Error('Mensagem vazia após preenchimento das variáveis');
      }
      const response = await base44.functions.invoke('whatsapp/sendMessage', {
        telefone: contact.phone,
        mensagem,
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Template enviado com sucesso!');
      setSelectedTemplateId('');
      setParameters({});
      onSent?.();
    },
    onError: (error) => {
      toast.error('Erro ao enviar template: ' + (error.message || 'Erro desconhecido'));
    }
  });

  const handleSend = () => {
    if (!selectedTemplateId) {
      toast.error('Selecione um template');
      return;
    }
    // Verifica se todas as variáveis foram preenchidas
    const missingVar = templateVars.find(v => !parameters[v.key]?.trim());
    if (missingVar) {
      toast.error(`Preencha a ${missingVar.label}`);
      return;
    }
    sendMutation.mutate();
  };

  return (
    <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">Enviar Template</span>
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

      <Select value={selectedTemplateId} onValueChange={(val) => {
        setSelectedTemplateId(val);
        setParameters({});
      }}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder={loadingTemplates ? "Carregando templates..." : "Escolha um template..."} />
        </SelectTrigger>
        <SelectContent>
          {templates.length === 0 && !loadingTemplates && (
            <div className="px-2 py-3 text-sm text-slate-500 text-center">
              Nenhum template ativo encontrado
            </div>
          )}
          {templates.map(t => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-2">
                <span>{t.name}</span>
                <span className="text-xs text-slate-400">({t.language || 'pt_BR'})</span>
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
              placeholder={v.label}
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
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{buildFinalMessage()}</p>
          {currentTemplate.category && (
            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              {currentTemplate.category}
            </span>
          )}
        </div>
      )}

      <Button
        onClick={handleSend}
        disabled={!selectedTemplateId || sendMutation.isPending}
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