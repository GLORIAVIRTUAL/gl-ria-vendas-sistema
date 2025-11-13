import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Copy, X } from "lucide-react";

export default function ConfigurarGoogleCalendar() {
  const [copiado, setCopiado] = useState(null);
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState(null);

  const copiar = (texto, id) => {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  };

  const testarCredenciais = async () => {
    setTestando(true);
    setResultadoTeste(null);
    
    try {
      const response = await base44.functions.invoke('testarGoogleCalendar');
      setResultadoTeste(response.data);
    } catch (error) {
      setResultadoTeste({
        success: false,
        error: error.message
      });
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            🔧 Configuração Google Calendar
          </h1>
          <p className="text-slate-600">
            Verificar e corrigir credenciais
          </p>
        </div>

        <Alert className="bg-orange-50 border-orange-200">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>⚠️ ATENÇÃO:</strong> Os valores devem conter APENAS o ID/Secret/Token, SEM prefixos como "client_id=" ou "refresh_token="
          </AlertDescription>
        </Alert>

        {/* Teste de Credenciais */}
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle>🧪 Testar Credenciais</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button
              onClick={testarCredenciais}
              disabled={testando}
              className="w-full"
              size="lg"
            >
              {testando ? 'Testando...' : 'Testar Configuração'}
            </Button>

            {resultadoTeste && (
              <Alert className={resultadoTeste.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                <AlertDescription className={resultadoTeste.success ? "text-green-900" : "text-red-900"}>
                  {resultadoTeste.success ? (
                    <div>
                      <p className="font-bold text-xl mb-2">✅ SUCESSO!</p>
                      <p className="text-lg">Google Calendar configurado e funcionando!</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-xl mb-2">❌ ERRO</p>
                      <pre className="text-xs mt-2 whitespace-pre-wrap bg-white p-3 rounded">
                        {JSON.stringify(resultadoTeste, null, 2)}
                      </pre>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Valores Corretos */}
        <Card className="border-4 border-green-500">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle>✅ Valores CORRETOS (copie exatamente assim)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Client ID */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-slate-900">GOOGLE_CALENDAR_CLIENT_ID</p>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex gap-2">
                <Input 
                  value="102854272333-35qlkv9ihjddd83cecbgku293rk6ik0a.apps.googleusercontent.com"
                  readOnly
                  className="font-mono text-xs bg-white border-2 border-green-300"
                />
                <Button
                  variant="outline"
                  onClick={() => copiar('102854272333-35qlkv9ihjddd83cecbgku293rk6ik0a.apps.googleusercontent.com', 'clientId')}
                >
                  {copiado === 'clientId' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-green-700 mt-1">✅ Termina com .apps.googleusercontent.com</p>
            </div>

            {/* Client Secret */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-slate-900">GOOGLE_CALENDAR_CLIENT_SECRET</p>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex gap-2">
                <Input 
                  value="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"
                  readOnly
                  className="font-mono text-xs bg-white border-2 border-green-300"
                />
                <Button
                  variant="outline"
                  onClick={() => copiar('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', 'clientSecret')}
                >
                  {copiado === 'clientSecret' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-green-700 mt-1">✅ Começa com GOCSPX-</p>
            </div>

            {/* Refresh Token */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-slate-900">GOOGLE_CALENDAR_REFRESH_TOKEN</p>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex gap-2">
                <Input 
                  value="1//047OIsI_V39HPCgYIARAAGAQSNwF-L9Ir17yCBEfodoDf1k2FWknXXW6GBtz8fQggue73-uotl4yYCmjjC4V1Op_8L3plQguIDGk"
                  readOnly
                  className="font-mono text-xs bg-white border-2 border-green-300"
                />
                <Button
                  variant="outline"
                  onClick={() => copiar('1//047OIsI_V39HPCgYIARAAGAQSNwF-L9Ir17yCBEfodoDf1k2FWknXXW6GBtz8fQggue73-uotl4yYCmjjC4V1Op_8L3plQguIDGk', 'refresh')}
                >
                  {copiado === 'refresh' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-green-700 mt-1">✅ Começa com 1//</p>
            </div>

          </CardContent>
        </Card>

        {/* Valores ERRADOS (Exemplo) */}
        <Card className="border-4 border-red-500">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <X className="w-6 h-6 text-red-600" />
              ❌ Valores ERRADOS (NÃO use assim)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="font-bold text-red-900 mb-2">❌ ERRADO:</p>
              <code className="text-xs text-red-700 break-all block mb-2">
                client_id=102854272333-35qlkv9ihjddd83cecbgku293rk6ik0a.apps.googleusercontent.com
              </code>
              <p className="text-xs text-red-700">⚠️ Tem o prefixo "client_id=" que não deveria existir!</p>
            </div>

            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="font-bold text-red-900 mb-2">❌ ERRADO:</p>
              <code className="text-xs text-red-700 break-all block mb-2">
                client_secret=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
              </code>
              <p className="text-xs text-red-700">⚠️ Tem o prefixo "client_secret=" que não deveria existir!</p>
            </div>

            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="font-bold text-red-900 mb-2">❌ ERRADO:</p>
              <code className="text-xs text-red-700 break-all block mb-2">
                refresh_token=1//047OIsI_V39HPCgYIARAAGAQSNwF-L9Ir...
              </code>
              <p className="text-xs text-red-700">⚠️ Tem o prefixo "refresh_token=" que não deveria existir!</p>
            </div>
          </CardContent>
        </Card>

        {/* Passo a Passo */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle>📝 Como Corrigir no Base44</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>Vá em <strong>Dashboard → Code → Environment Variables</strong></li>
              <li>Para cada uma das 3 variáveis (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN):</li>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Clique na variável para editar</li>
                <li>Cole o valor CORRETO (use os botões de copiar acima)</li>
                <li>Certifique-se que NÃO tem prefixos como "client_id=" ou espaços extras</li>
                <li>Clique em "Save"</li>
              </ul>
              <li>Aguarde 30-60 segundos</li>
              <li>Volte aqui e clique em "Testar Configuração"</li>
            </ol>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}