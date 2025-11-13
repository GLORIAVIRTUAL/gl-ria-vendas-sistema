import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";

export default function CriarContaAfiliado() {
  const [copiado, setCopiado] = useState(false);

  const copiar = (texto) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🤝 Como Criar Conta de Afiliado
          </h1>
          <p className="text-slate-600">
            Siga este passo a passo para criar uma conta conectada no Stripe
          </p>
        </div>

        <Alert className="bg-orange-50 border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>⚠️ Importante:</strong> Você deve criar a conta conectada usando o <strong>modo LIVE</strong>, pois sua chave API é de produção.
          </AlertDescription>
        </Alert>

        {/* Passo 1 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle>Passo 1: Acesse o Stripe Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-slate-700">
              Acesse o painel de contas conectadas do Stripe (modo LIVE):
            </p>
            <div className="flex gap-2">
              <code className="flex-1 bg-slate-100 px-4 py-3 rounded-lg text-sm font-mono">
                https://dashboard.stripe.com/connect/accounts/overview
              </code>
              <Button
                variant="outline"
                onClick={() => window.open('https://dashboard.stripe.com/connect/accounts/overview', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Passo 2 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle>Passo 2: Criar Nova Conta</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-slate-700">
              <li>Clique no botão <strong>"+ New account"</strong></li>
              <li>Escolha o tipo: <strong>"Express"</strong> (mais rápido)</li>
              <li>Preencha os dados do afiliado:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Email do afiliado</li>
                  <li>Nome do afiliado</li>
                  <li>País: Brasil</li>
                </ul>
              </li>
              <li>Clique em <strong>"Create account"</strong></li>
            </ol>
            <Alert className="bg-blue-50 border-blue-200 mt-4">
              <AlertDescription className="text-blue-900 text-sm">
                💡 O Stripe vai enviar um email para o afiliado completar o cadastro dele. Você só precisa do <strong>Account ID</strong> agora!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Passo 3 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle>Passo 3: Copiar o Account ID</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-slate-700">
              <li>Depois de criar, você verá a lista de contas</li>
              <li>Clique na conta que acabou de criar</li>
              <li>No topo da página, copie o <strong>Account ID</strong></li>
            </ol>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700">O ID vai começar com:</p>
              <code className="block bg-white px-3 py-2 rounded border border-slate-200 text-sm font-mono">
                acct_...
              </code>
              <p className="text-xs text-slate-500">Exemplo: acct_1SKfHIP2bfS0jioX</p>
            </div>
          </CardContent>
        </Card>

        {/* Passo 4 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
            <CardTitle>Passo 4: Cadastrar no Sistema</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-slate-700">
              <li>Volte para a página de <strong>Afiliados</strong></li>
              <li>Clique em <strong>"Novo Afiliado"</strong></li>
              <li>Preencha os dados e cole o <strong>Account ID</strong> que você copiou</li>
              <li>Salve!</li>
            </ol>
            <Alert className="bg-green-50 border-green-200 mt-4">
              <AlertDescription className="text-green-900">
                <strong>✅ Pronto!</strong> Agora quando você criar um negócio e selecionar este afiliado, a comissão será automaticamente dividida pelo Stripe!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="shadow-lg border-yellow-200 bg-yellow-50">
          <CardHeader className="border-b border-yellow-200">
            <CardTitle className="text-yellow-900">🔧 Problemas Comuns</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 text-slate-700">
              <div>
                <p className="font-semibold text-yellow-900">❌ Erro: "does not have access to account"</p>
                <p className="text-sm mt-1">
                  <strong>Solução:</strong> O Account ID está errado ou pertence a outra plataforma. Crie uma NOVA conta seguindo os passos acima.
                </p>
              </div>
              <div>
                <p className="font-semibold text-yellow-900">❌ Erro: "charges_enabled: false"</p>
                <p className="text-sm mt-1">
                  <strong>Solução:</strong> O afiliado precisa completar o cadastro dele no Stripe (vai receber email) OU você pode ativar manualmente no dashboard.
                </p>
              </div>
              <div>
                <p className="font-semibold text-yellow-900">❌ Comissão não aparece no Stripe</p>
                <p className="text-sm mt-1">
                  <strong>Solução:</strong> Verifique se você está usando chave LIVE com conta LIVE (ou TEST com TEST). Não pode misturar!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}