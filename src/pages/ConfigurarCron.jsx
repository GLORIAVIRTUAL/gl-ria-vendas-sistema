import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Clock, ExternalLink, AlertCircle, Globe, CheckCircle, MessageCircle, Mail } from "lucide-react";

export default function ConfigurarCron() {
  const [copiado, setCopiado] = useState(null);

  const copiar = (texto, id) => {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  };

  const baseUrl = window.location.origin;
  const cronUrlWhatsApp = `${baseUrl}/api/functions/whatsapp/processScheduled`;
  const cronUrlEmail = `${baseUrl}/api/functions/email/processScheduled`;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            ⏰ Configurar Cron Jobs
          </h1>
          <p className="text-slate-600">
            Configure disparos automáticos de lembretes via WhatsApp e Email
          </p>
        </div>

        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>🎉 Configure UMA VEZ e esqueça!</strong><br/>
            Depois de configurar os 2 Cron Jobs, você nunca mais precisa se preocupar.
            Os lembretes serão enviados automaticamente! 🚀
          </AlertDescription>
        </Alert>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>💡 O que é um Cron Job?</strong><br/>
            É um robô que chama sua URL automaticamente a cada 5 minutos, 24/7, sem você precisar fazer nada.
            Ele fica verificando se há lembretes prontos para enviar e os envia automaticamente! ⏰
          </AlertDescription>
        </Alert>

        {/* Cron Job 1: WhatsApp */}
        <Card className="shadow-lg border-0 border-l-4 border-l-green-500">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              Cron Job #1: WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                URL do Endpoint WhatsApp:
              </Label>
              <div className="flex gap-2">
                <code className="flex-1 bg-slate-100 px-4 py-3 rounded-lg text-sm font-mono font-semibold text-slate-950 overflow-x-auto">
                  {cronUrlWhatsApp}
                </code>
                <Button
                  onClick={() => copiar(cronUrlWhatsApp, 'cronWhatsApp')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {copiado === 'cronWhatsApp' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Alert className="bg-orange-50 border-orange-200">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>⚙️ Configuração:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Método: <code className="bg-orange-100 px-2 py-1 rounded">POST</code></li>
                  <li>Intervalo: <strong>5 minutos</strong> (<code>*/5 * * * *</code>)</li>
                  <li><strong>❌ NÃO precisa de autenticação HTTP</strong></li>
                  <li><strong>❌ NÃO precisa de body/payload</strong></li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Cron Job 2: Email */}
        <Card className="shadow-lg border-0 border-l-4 border-l-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              Cron Job #2: Email
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                URL do Endpoint Email:
              </Label>
              <div className="flex gap-2">
                <code className="flex-1 bg-slate-100 px-4 py-3 rounded-lg text-sm font-mono font-semibold text-slate-950 overflow-x-auto">
                  {cronUrlEmail}
                </code>
                <Button
                  onClick={() => copiar(cronUrlEmail, 'cronEmail')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {copiado === 'cronEmail' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Alert className="bg-orange-50 border-orange-200">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>⚙️ Configuração:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Método: <code className="bg-orange-100 px-2 py-1 rounded">POST</code></li>
                  <li>Intervalo: <strong>5 minutos</strong> (<code>*/5 * * * *</code>)</li>
                  <li><strong>❌ NÃO precisa de autenticação HTTP</strong></li>
                  <li><strong>❌ NÃO precisa de body/payload</strong></li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Opção 1: Cron-job.org */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-600" />
              Configuração no Cron-job.org
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Badge className="bg-green-100 text-green-700 border-green-200">
              ✅ Gratuito e Confiável (Recomendado)
            </Badge>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-900">📋 Você precisa criar 2 Cron Jobs:</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>
                  Acesse: <a href="https://cron-job.org/en/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">
                    cron-job.org <ExternalLink className="w-3 h-3 inline ml-1" />
                  </a>
                </li>
                <li>Crie uma conta gratuita</li>
                <li className="font-bold text-lg mt-4">Cron Job #1 - WhatsApp:</li>
                <ul className="ml-6 list-disc">
                  <li>Title: <code>WhatsApp Lembretes Glória</code></li>
                  <li>URL: Cole a URL do WhatsApp acima</li>
                  <li>Execution: Every 5 minutes</li>
                  <li>Method: POST</li>
                  <li>Authentication: ❌ DESATIVADO (None)</li>
                  <li>Request body: ❌ VAZIO (deixe em branco)</li>
                </ul>
                <li className="font-bold text-lg mt-4">Cron Job #2 - Email:</li>
                <ul className="ml-6 list-disc">
                  <li>Title: <code>Email Lembretes Glória</code></li>
                  <li>URL: Cole a URL do Email acima</li>
                  <li>Execution: Every 5 minutes</li>
                  <li>Method: POST</li>
                  <li>Authentication: ❌ DESATIVADO (None)</li>
                  <li>Request body: ❌ VAZIO (deixe em branco)</li>
                </ul>
                <li>Clique em <strong>"Create cronjob"</strong> para cada um.</li>
                <li>✅ Pronto! Ambos os sistemas começarão a funcionar automaticamente</li>
              </ol>
            </div>

            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>✅ O que acontece automaticamente:</strong>
                <ul className="mt-2 list-disc list-inside">
                  <li><strong>📧 Email de confirmação:</strong> Enviado IMEDIATAMENTE ao agendar</li>
                  <li><strong>📧 Email de lembrete:</strong> 2 horas antes da reunião</li>
                  <li><strong>📱 WhatsApp:</strong> 24h e 1h antes da reunião</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Adicionar seção de verificação */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              ✅ Como verificar se está funcionando?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-slate-700">
              <li>Crie um agendamento de teste para daqui a 25 horas</li>
              <li>Vá em <strong>📱 Disparos WhatsApp</strong></li>
              <li>Verifique se aparecem 2 disparos programados (24h e 1h antes)</li>
              <li><strong>Aguarde até 5 minutos</strong> (tempo do cron rodar automaticamente)</li>
              <li>Recarregue a página de Disparos WhatsApp</li>
              <li>O disparo de 24h deve aparecer como <Badge className="bg-green-100 text-green-700">Enviado</Badge></li>
            </ol>

            <Alert className="bg-amber-50 border-amber-200 mt-4">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>💡 Dica:</strong> Você pode usar o botão "🧪 Processar Agora (Teste)" na página de Disparos para testar manualmente,
                mas o Cron Job vai fazer isso automaticamente a cada 5 minutos - você NÃO precisa clicar nele!
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-50 border-green-200 mt-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>🎯 Resumo:</strong>
                <ul className="mt-2 list-disc list-inside">
                  <li>Configure os 2 Cron Jobs UMA VEZ no cron-job.org</li>
                  <li>Pronto! Tudo funciona automaticamente daqui pra frente</li>
                  <li>Você só precisa criar agendamentos normalmente</li>
                  <li>Os lembretes são enviados automaticamente nos horários programados</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              ⚠️ Se não funcionar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ol className="list-decimal list-inside space-y-2 text-slate-700">
              <li>Verifique se as URLs estão EXATAMENTE como mostrado acima (uma para WhatsApp, outra para Email)</li>
              <li>Confirme que o método é <strong>POST</strong> para AMBOS os Cron Jobs</li>
              <li>Certifique-se que <strong>autenticação está DESATIVADA</strong> para AMBOS os Cron Jobs</li>
              <li>Verifique no histórico do cron-job.org se as requisições estão retornando status 200 para AMBOS</li>
              <li>Teste manualmente na página de Disparos WhatsApp clicando em "Processar Agora"</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Label({ className, children, ...props }) {
  return <label className={className} {...props}>{children}</label>;
}