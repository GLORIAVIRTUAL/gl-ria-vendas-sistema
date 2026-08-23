import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { converterProspectsQuentes } from "@/functions/converterProspectsQuentes";
import { useToast } from "@/components/ui/use-toast";

export default function ConverterQuentesButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data } = await converterProspectsQuentes({});
      toast({
        title: "Conversão concluída",
        description: `${data.convertidos} prospect(s) enviados ao CRM de ${data.elegiveis} elegíveis (score ${data.score_minimo}+).`
      });
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      queryClient.invalidateQueries({ queryKey: ["leads-motor"] });
    } catch (error) {
      toast({ title: "Erro na conversão", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Convertendo..." : "Converter quentes em leads"}
    </Button>
  );
}