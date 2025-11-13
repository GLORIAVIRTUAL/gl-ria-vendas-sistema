
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw, TestTube } from "lucide-react";

export default function TesteWhatsApp() {
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("Olá! Esta é uma mensagem de teste do sistema Glória Vendas. 🚀");
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [logs, setLogs] = useState([]);
  const [debugConfig, setDebugConfig] = useState(null);
  const [carregandoDebug, setCarregandoDebug] = useState(false);

  const [testandoDireto, setTestandoDireto] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState(null);

  const [testandoFormulario, setTestandoFormulario] = useState(false);
  const [resultadoFormulario, setResultadoFormulario] = useState(null);

  const addLog = (log) => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message: log }]);
  };

  const verificarConfig = async () => {
    setCarregandoDebug(true);
    try {
      const response = await base44.functions.invoke('whatsapp_debugEnv');
      setDebugConfig(response.data);
    } catch (error) {
      setDebugConfig({ error: error.message });
    } finally {
      setCarregandoDebug(false);
    }
  };

  useEffect(() => {
    verificarConfig();
  }, []);

  const testarDireto = async () => {
    setTestandoDireto(true);
    setResultadoTeste(null);
    try {
      const response = await base44.functions.invoke('whatsapp/testZapi');
      setResultadoTeste(response.data);
    } catch (error) {
      setResultadoTeste({ error: error.message });
    } finally {
      setTestandoDireto(false);
    }
  };

  const testarEnvio = async () => {
    setTestando(true);
    setResultado(null);
    setLogs([]);

    try {
      addLog('📤 Iniciando teste de envio...');
      addLog(`📱 Telefone: ${telefone}`);
      addLog(`💬 Mensagem: ${mensagem.substring(0, 50)}...`);

      const response = await base44.functions.invoke('whatsapp/sendMessage', { // Changed 'whatsapp_sendMessage' to 'whatsapp/sendMessage'
        telefone,
        mensagem
      });

      addLog('✅ Resposta recebida da função');
      addLog(`Status: ${response.status}`);
      addLog(`Data: ${JSON.stringify(response.data, null, 2)}`);

      if (response.status === 200 && response.data.success) {
        setResultado({
          tipo: 'sucesso',
          mensagem: 'Mensagem enviada com sucesso!',
          detalhes: response.data
        });
      } else {
        setResultado({
          tipo: 'erro',
          mensagem: 'Erro ao enviar mensagem',
          detalhes: response.data
        });
      }
    } catch (error) {
      addLog('❌ Erro capturado');
      addLog(`Mensagem: ${error.message}`);
      
      if (error.response) {
        addLog(`Status HTTP: ${error.response.status}`);
        addLog(`Dados do erro: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      
      addLog(`Stack: ${error.stack}`);

      setResultado({
        tipo: 'erro',
        mensagem: error.message,
        detalhes: error.response?.data || { 
          message: error.message,
          stack: error.stack 
        }
      });
    } finally {
      setTestando(false);
    }
  };

  const testarSubmitOnboarding = async () => {
    setTestandoFormulario(true);
    setResultadoFormulario(null);
    try {
      const dadosTeste = {
        email: 'teste@example.com',
        nome_empresa: 'Empresa Teste',
        ramos_atividade: 'Tecnologia',
        produtos_servicos: 'Software',
        horario_funcionamento: '9h-18h',
        email_comercial: 'comercial@teste.com',
        telefone_whatsapp: '11999999999',
        pais: 'Brasil',
        estado: 'SP',
        cidade: 'São Paulo',
        cep: '01234-567',
        bairro: 'Centro',
        rua: 'Rua Teste',
        numero: '123',
        logotipo_url: 'https://via.placeholder.com/150',
        outros_arquivos_urls: []
      };

      const response = await base44.functions.invoke('submitOnboarding', dadosTeste);
      setResultadoFormulario({
        success: true,
        data: response.data
      });
    } catch (error) {
      setResultadoFormulario({
        success: false,
        error: error.message,
        details: error.response?.data
      });
    } finally {
      setTestandoFormulario(false);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            🧪 Teste de WhatsApp (ZAPI)
          </h1>
          <p className="text-slate-600">
            Teste a integração com o ZAPI e envio de mensagens
          </p>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>💡 Dica:</strong> Use seu próprio número para testar o envio de mensagens.
            Formato: (11) 99999-9999 ou 11999999999
          </AlertDescription>
        </Alert>

        {/* Debug Config */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-purple-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                🔍 Status das Variáveis de Ambiente
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={verificarConfig}
                disabled={carregandoDebug}
              >
                {carregandoDebug ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {carregandoDebug ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              </div>
            ) : debugConfig ? (
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {JSON.stringify(debugConfig, null, 2)}
              </pre>
            ) : (
              <Alert className="bg-red-50 border-red-200 mt-4">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>❌ Erro ao carregar configurações de debug.</strong><br/>
                  Tente novamente ou verifique os logs do console.
                </AlertDescription>
              </Alert>
            )}
            
            {debugConfig && !debugConfig.config?.ZAPI_CLIENT_TOKEN?.configurado && (
              <Alert className="bg-red-50 border-red-200 mt-4">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>❌ ZAPI_CLIENT_TOKEN não está configurado!</strong><br/>
                  Vá em: Dashboard → Code → Environment Variables<br/>
                  Adicione: <code className="bg-red-100 px-2 py-1 rounded">ZAPI_CLIENT_TOKEN = D7CF569A1200C994A03C24E4</code>
                </AlertDescription>
              </Alert>
            )}

            {debugConfig && !debugConfig.config?.WHATSAPP_INSTANCE_ID?.configurado && (
              <Alert className="bg-red-50 border-red-200 mt-4">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>❌ WHATSAPP_INSTANCE_ID não está configurado!</strong><br/>
                  Vá em: Dashboard → Code → Environment Variables<br/>
                  Adicione: <code className="bg-red-100 px-2 py-1 rounded">WHATSAPP_INSTANCE_ID = 3E751CE408B2902AAA951209B086BFBE</code>
                </AlertDescription>
              </Alert>
            )}

            {debugConfig && debugConfig.config?.ZAPI_CLIENT_TOKEN?.configurado && debugConfig.config?.WHATSAPP_INSTANCE_ID?.configurado && (
              <Alert className="bg-green-50 border-green-200 mt-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>✅ Todas as variáveis estão configuradas!</strong><br/>
                  Você pode fazer o teste de envio agora. <strong>Lembre-se de recarregar a página (F5) após qualquer alteração nas variáveis.</strong>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Teste Direto ZAPI */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-yellow-50 border-b">
            <CardTitle>🧪 Teste Direto ZAPI</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button
              onClick={testarDireto}
              disabled={testandoDireto}
              className="w-full h-12 bg-yellow-600 hover:bg-yellow-700"
            >
              {testandoDireto ? 'Testando...' : '🔬 Testar Conexão Direta'}
            </Button>

            {resultadoTeste && (
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(resultadoTeste, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle>Enviar Mensagem de Teste</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="telefone">Telefone (com DDD)</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={testarEnvio}
              disabled={!telefone || !mensagem || testando}
              className="w-full h-12 bg-green-600 hover:bg-green-700"
            >
              {testando ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Teste'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        {resultado && (
          <Card className="shadow-lg border-0">
            <CardHeader className={`border-b ${resultado.tipo === 'sucesso' ? 'bg-green-50' : 'bg-red-50'}`}>
              <CardTitle className="flex items-center gap-2">
                {resultado.tipo === 'sucesso' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-900">Sucesso!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-900">Erro</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="font-semibold mb-2">{resultado.mensagem}</p>
              <pre className="bg-slate-100 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(resultado.detalhes, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle>Logs de Execução</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i}>
                    <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ADICIONAR ANTES DO ÚLTIMO CARD */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-6 h-6 text-purple-600" />
              🧪 Testar Função submitOnboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-slate-600">
              Testa se a função de envio do formulário está funcionando
            </p>
            <Button
              onClick={testarSubmitOnboarding}
              disabled={testandoFormulario}
              className="w-full h-12 bg-purple-600 hover:bg-purple-700"
            >
              {testandoFormulario ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                '🧪 Testar submitOnboarding'
              )}
            </Button>

            {resultadoFormulario && (
              <div className={`p-4 rounded-lg ${resultadoFormulario.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(resultadoFormulario, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-orange-50 border-b">
            <CardTitle>📋 Checklist de Configuração</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
              <p>Vá em <strong>Dashboard → Code → Environment Variables</strong></p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">2</div>
              <p>Adicione as variáveis:</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded ml-8 space-y-2">
              <div>
                <code className="bg-yellow-100 px-2 py-1 rounded text-sm">ZAPI_CLIENT_TOKEN</code>
                <span className="ml-2">=</span>
                <code className="bg-yellow-100 px-2 py-1 rounded text-sm ml-2">D7CF569A1200C994A03C24E4</code>
              </div>
              <div>
                <code className="bg-yellow-100 px-2 py-1 rounded text-sm">WHATSAPP_INSTANCE_ID</code>
                <span className="ml-2">=</span>
                <code className="bg-yellow-100 px-2 py-1 rounded text-sm ml-2">3E751CE408B2902AAA951209B086BFBE</code>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">3</div>
              <p>Clique em <strong>Save</strong></p>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">4</div>
              <p><strong>Recarregue esta página</strong> (F5 ou Ctrl+R)</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">5</div>
              <p>Clique no botão de atualizar acima para verificar se as variáveis foram carregadas.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">6</div>
              <p>Sua instância do ZAPI está conectada? Verifique em <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.z-api.io</a></p>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">7</div>
              <p>O número para o qual você está enviando a mensagem tem WhatsApp ativo?</p>
            </div>

            <Alert className="bg-red-50 border-red-200 mt-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <strong>⚠️ IMPORTANTE:</strong> Depois de salvar as variáveis, você PRECISA recarregar a página para que as funções sejam reiniciadas com as novas configurações!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
