import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, PlusCircle, BarChart3, Megaphone } from "lucide-react";
import CampaignResearch from "@/components/trafego/CampaignResearch";
import CampaignCreator from "@/components/trafego/CampaignCreator";
import CampaignResults from "@/components/trafego/CampaignResults";

export default function Trafego() {
  const [tab, setTab] = useState("research");
  const [prefill, setPrefill] = useState(null);

  const usarEstrategia = (estrategia) => {
    setPrefill(estrategia);
    setTab("create");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Megaphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tráfego Pago — Meta Ads</h1>
          <p className="text-sm text-slate-500">Crie e publique campanhas no Facebook e Instagram</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="research"><Search className="w-4 h-4 mr-2" /> Pesquisar</TabsTrigger>
          <TabsTrigger value="create"><PlusCircle className="w-4 h-4 mr-2" /> Criar</TabsTrigger>
          <TabsTrigger value="results"><BarChart3 className="w-4 h-4 mr-2" /> Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="research">
          <CampaignResearch onUseStrategy={usarEstrategia} />
        </TabsContent>
        <TabsContent value="create">
          <CampaignCreator prefill={prefill} />
        </TabsContent>
        <TabsContent value="results">
          <CampaignResults />
        </TabsContent>
      </Tabs>
    </div>
  );
}