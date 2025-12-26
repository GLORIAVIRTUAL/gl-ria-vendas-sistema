import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Tag, Settings2, Webhook, Database } from 'lucide-react';
import AIPromptEditor from '../components/settings/AIPromptEditor';
import KeywordManager from '../components/settings/KeywordManager';
import CustomFieldsManager from '../components/settings/CustomFieldsManager';
import WebhookManager from '../components/settings/WebhookManager';
import CustomAPIManager from '../components/settings/CustomAPIManager';

export default function ConfiguracoesIA() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Configurações da IA</h1>
        <p className="text-slate-500">Configure o comportamento da IA e do sistema</p>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
          <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            <Bot className="w-4 h-4" />
            Inteligência Artificial
          </TabsTrigger>
          <TabsTrigger value="keywords" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            <Tag className="w-4 h-4" />
            Palavras-chave
          </TabsTrigger>
          <TabsTrigger value="fields" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            <Database className="w-4 h-4" />
            Campos Personalizados
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="apis" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            <Settings2 className="w-4 h-4" />
            APIs HTTP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <AIPromptEditor />
        </TabsContent>

        <TabsContent value="keywords">
          <KeywordManager />
        </TabsContent>

        <TabsContent value="fields">
          <CustomFieldsManager />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookManager />
        </TabsContent>

        <TabsContent value="apis">
          <CustomAPIManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}