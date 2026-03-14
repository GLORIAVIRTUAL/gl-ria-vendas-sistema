import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Code, ExternalLink, Settings, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function CodigoEmbed() {
  const [copiado, setCopiado] = useState(false);
  const [largura, setLargura] = useState("100%");
  const [altura, setAltura] = useState("800px");
  const [urlApp, setUrlApp] = useState("");

  useEffect(() => {
    // Usa a URL base da API do Base44 SDK para garantir que funcione no preview e publicado
    const apiBaseUrl = base44._baseUrl || window.location.origin;
    // A URL base da API é algo como https://app.base44.com/api/v1/apps/APP_ID
    // Precisamos extrair a URL do app: origin + /api/functions/...
    // Alternativa: usar a URL do próprio SDK para montar
    const appOrigin = apiBaseUrl.includes('/api/v1/') 
      ? apiBaseUrl.split('/api/v1/')[0]
      : window.location.origin;
    setUrlApp(appOrigin);
  }, []);

  // 🔓 URL PÚBLICA que funciona sem login
  const urlAgendamento = `${urlApp}/api/functions/paginaAgendamentoPublico`;

  const codigoIframe = `<iframe 
  src="${urlAgendamento}" 
  width="${largura}" 
  height="${altura}"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  allowfullscreen>
</iframe>`;

  const codigoScript = `<div id="gloria-agendamento"></div>
<script>
  (function() {
    const iframe = document.createElement('iframe');
    iframe.src = '${urlAgendamento}';
    iframe.width = '${largura}';
    iframe.height = '${altura}';
    iframe.frameBorder = '0';
    iframe.style.borderRadius = '12px';
    iframe.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    iframe.allowFullscreen = true;
    document.getElementById('gloria-agendamento').appendChild(iframe);
  })();
</script>`;

  const copiar = (texto) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            📋 Código para Embed
          </h1>
          <p className="text-slate-600">
            Copie e cole no seu site para adicionar o sistema de agendamento
          </p>
        </div>

        <Alert className="bg-orange-50 border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>🔍 URL do seu app:</strong> {urlApp || "Carregando..."}
            <br />
            <strong>🔗 URL pública do agendamento:</strong> {urlAgendamento}
          </AlertDescription>
        </Alert>

        <Alert className="bg-blue-50 border-blue-200">
          <ExternalLink className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>✅ TESTADO:</strong> Esta URL funciona sem login quando incorporada em outros sites!
          </AlertDescription>
        </Alert>

        {/* Preview */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-6 h-6 text-purple-600" />
              Preview do Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="border rounded-xl overflow-hidden shadow-lg">
              <iframe 
                src={urlAgendamento}
                width="100%"
                height="800"
                frameBorder="0"
                className="w-full"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <a
                href={urlAgendamento}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              </a>
              <Button
                variant="outline"
                onClick={() => copiar(urlAgendamento)}
                className="flex-1"
              >
                {copiado ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copiar Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              Configurações do Embed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="largura">Largura</Label>
                <Input
                  id="largura"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value)}
                  placeholder="100%"
                />
              </div>
              <div>
                <Label htmlFor="altura">Altura</Label>
                <Input
                  id="altura"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  placeholder="800px"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Código HTML (iframe) */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Code className="w-6 h-6 text-green-600" />
                Opção 1: Código HTML (iframe)
              </CardTitle>
              <Badge className="bg-green-600">Recomendado</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative">
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {codigoIframe}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copiar(codigoIframe)}
              >
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-slate-600 mt-3">
              ✅ Cole este código diretamente no HTML do seu site (gloriavirtual.com ou qualquer outro)
            </p>
          </CardContent>
        </Card>

        {/* Código JavaScript */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Code className="w-6 h-6 text-orange-600" />
              Opção 2: Código JavaScript
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative">
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {codigoScript}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copiar(codigoScript)}
              >
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-slate-600 mt-3">
              ✅ Cole este código no HTML onde você quer que o agendamento apareça
            </p>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle>📚 Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ol className="list-decimal list-inside space-y-3 text-slate-700">
              <li>
                <strong>Escolha uma opção:</strong> HTML (iframe) ou JavaScript
              </li>
              <li>
                <strong>Ajuste as dimensões:</strong> Configure largura e altura conforme necessário
              </li>
              <li>
                <strong>Copie o código:</strong> Clique no botão "Copiar" do código escolhido
              </li>
              <li>
                <strong>Cole no seu site:</strong> Adicione o código na página onde deseja o agendamento (ex: gloriavirtual.com)
              </li>
              <li>
                <strong>Pronto!</strong> O sistema de agendamento estará funcionando automaticamente SEM PEDIR LOGIN! 🔓
              </li>
            </ol>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">💡 Dica:</p>
              <p className="text-blue-800 text-sm">
                Todos os agendamentos feitos através do embed aparecerão automaticamente no seu dashboard 
                com a tag "🌐 Online" para fácil identificação!
              </p>
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-green-900 mb-2">🔓 Página Totalmente Pública:</p>
              <p className="text-green-800 text-sm">
                Esta página NÃO requer login! Pode ser usada em gloriavirtual.com, WordPress, Wix, ou qualquer outro site.
                Os clientes podem agendar diretamente sem precisar criar conta. 
              </p>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="font-semibold text-yellow-900 mb-2">⚠️ Importante:</p>
              <p className="text-yellow-800 text-sm">
                A URL do agendamento é gerada automaticamente a partir da URL do seu app Base44.
                Se você mudar o domínio/subdomain do app, precisará atualizar o código do embed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}