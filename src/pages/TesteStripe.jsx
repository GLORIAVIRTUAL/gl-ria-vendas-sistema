import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, TestTube } from "lucide-react";

export default function TesteStripe() {
  const [resultado, setResultado] = useState(null);
  const [testando, setTestando] = useState(false);

  const testarConexao = async () => {
    setTestando(true);
    setResultado(null);

    try {
      const response = await base44.functions.invoke('stripe/testConnection', {});
      console.log('Resposta do teste:', response);
      setResultado(response.data);
    } catch (error) {
      console.error('Erro no teste:', error);
      setResultado({
        etapas: [{
          passo: 'Chamada da função',
          status: '❌ ERRO',
          erro: error.message
        }]
      });
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-6 h-6" />
              Diagnóstico da Conexão Stripe
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <p className="text-slate-600 mb-4">
                Este teste vai verificar se o Stripe está configurado corretamente.
              </p>
              <Button 
                onClick={testarConexao}
                disabled={testando}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {testando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Iniciar Teste
                  </>
                )}
              </Button>
            </div>

            {resultado && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Resultado do Diagnóstico:</h3>
                
                {resultado.etapas?.map((etapa, index) => (
                  <Alert 
                    key={index}
                    className={etapa.status.includes('✅') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
                  >
                    <div className="flex items-start gap-3">
                      {etapa.status.includes('✅') ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertDescription>
                          <div className="font-bold mb-1">{etapa.passo}</div>
                          <div className="text-sm">Status: {etapa.status}</div>
                          {etapa.erro && (
                            <div className="text-sm text-red-700 mt-1 font-mono bg-red-100 p-2 rounded">
                              {etapa.erro}
                            </div>
                          )}
                          {etapa.usuario && <div className="text-sm">Usuário: {etapa.usuario}</div>}
                          {etapa.primeiros_caracteres && (
                            <div className="text-sm font-mono">Chave: {etapa.primeiros_caracteres}</div>
                          )}
                          {etapa.tipo && <div className="text-sm">Tipo: {etapa.tipo}</div>}
                          {etapa.tamanho && <div className="text-sm">Tamanho: {etapa.tamanho} caracteres</div>}
                          {etapa.tipo_erro && <div className="text-sm">Tipo do erro: {etapa.tipo_erro}</div>}
                          {etapa.codigo && <div className="text-sm">Código: {etapa.codigo}</div>}
                          {etapa.charges_enabled !== undefined && (
                            <div className="text-sm">
                              <strong>Cobranças:</strong> {etapa.charges_enabled ? '✅ Habilitadas' : '❌ Desabilitadas'}
                            </div>
                          )}
                          {etapa.payouts_enabled !== undefined && (
                            <div className="text-sm">
                              <strong>Repasses:</strong> {etapa.payouts_enabled ? '✅ Habilitados' : '❌ Desabilitados'}
                            </div>
                          )}
                          {etapa.email && <div className="text-sm">Email: {etapa.email}</div>}
                          {etapa.detalhes && (
                            <div className="text-sm mt-2 p-2 bg-blue-50 rounded">
                              {etapa.detalhes}
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}

                {resultado.resultado_final && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <AlertDescription className="font-bold text-green-800">
                      {resultado.resultado_final}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}