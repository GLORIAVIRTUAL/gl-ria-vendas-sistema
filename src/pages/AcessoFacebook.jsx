import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Facebook, CheckCircle, AlertCircle, Loader2, Copy, Save } from "lucide-react";
import { toast } from "sonner";

export default function AcessoFacebook() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [authCode, setAuthCode] = useState(null);

  useEffect(() => {
    // Listener para Embedded Signup do WhatsApp (DEVE vir antes do SDK)
    const handleMessage = (event) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('📱 WA_EMBEDDED_SIGNUP event:', data);
          setSessionInfo(data);
          
          // Se o usuário finalizar o flow
          if (data.event === 'FINISH') {
            const { phone_number_id, waba_id } = data.data;
            console.log("✅ Phone number ID:", phone_number_id, "WABA ID:", waba_id);
            toast.success('WhatsApp Business cadastrado com sucesso!');
          } 
          // Se o usuário cancelar
          else if (data.event === 'CANCEL') {
            const { current_step } = data.data;
            console.warn("⚠️ Cancelado na etapa:", current_step);
            toast.warning(`Cadastro cancelado na etapa: ${current_step}`);
          } 
          // Se houver erro
          else if (data.event === 'ERROR') {
            const { error_message } = data.data;
            console.error("❌ Erro:", error_message);
            toast.error(`Erro: ${error_message}`);
          }
        }
      } catch {
        console.log('Non JSON Response:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);

    // Carrega o SDK do Facebook
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '1391502789229890',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v24.0'
      });
      setSdkLoaded(true);
      console.log('✅ Facebook SDK carregado');
    };

    // Carrega o script do SDK
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchUserInfo = () => {
    window.FB.api('/me', { fields: 'name,email,picture' }, function(response) {
      setUserInfo(response);
    });
  };

  // Callback do Facebook Login com Embedded Signup
  const fbLoginCallback = (response) => {
    setLoading(false);
    console.log('📱 FB Login Response:', response);
    
    if (response.authResponse) {
      const code = response.authResponse.code;
      console.log('🔑 Auth Code recebido:', code);
      setAuthCode(code);
      setLoginStatus('connected');
      fetchUserInfo();
      
      // O código deve ser enviado ao backend para trocar por access token
      toast.success('Login realizado! Código de autorização recebido.');
    } else {
      setLoginStatus('unknown');
      toast.error('Login cancelado ou falhou');
    }
  };

  // Lança o flow de Cadastro Incorporado do WhatsApp (formato exato da documentação)
  const launchWhatsAppSignup = () => {
    setLoading(true);
    window.FB.login(fbLoginCallback, {
      config_id: '1174321964854822',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        "version": "v3",
        "setup": {
          "business": {
            "id": null,
            "name": null,
            "email": null,
            "phone": { "code": null, "number": null },
            "website": null,
            "address": {
              "streetAddress1": null,
              "streetAddress2": null,
              "city": null,
              "state": null,
              "zipPostal": null,
              "country": null
            },
            "timezone": null
          },
          "phone": {
            "displayName": null,
            "category": null,
            "description": null
          },
          "preVerifiedPhone": { "ids": null },
          "solutionID": null,
          "whatsAppBusinessAccount": { "ids": null }
        }
      }
    });
  };

  // Login tradicional do Facebook (sem Embedded Signup)
  const handleLogin = () => {
    setLoading(true);
    window.FB.login(function(response) {
      setLoading(false);
      setLoginStatus(response.status);
      if (response.status === 'connected') {
        fetchUserInfo();
      }
    }, { 
      scope: 'public_profile,email,whatsapp_business_management,whatsapp_business_messaging'
    });
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleLogout = () => {
    setLoading(true);
    window.FB.logout(function(response) {
      setLoading(false);
      setLoginStatus('unknown');
      setUserInfo(null);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Facebook className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl">Acesso Facebook / Meta</CardTitle>
            <CardDescription>
              Conecte sua conta do Facebook para integração com WhatsApp Business
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status do SDK */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              {sdkLoaded ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700">SDK do Facebook carregado</span>
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm text-blue-700">Carregando SDK...</span>
                </>
              )}
            </div>

            {/* Status de Login */}
            {loginStatus && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                loginStatus === 'connected' ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                {loginStatus === 'connected' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">Conectado ao Facebook</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-yellow-700">Não conectado</span>
                  </>
                )}
              </div>
            )}

            {/* Informações do Usuário */}
            {userInfo && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {userInfo.picture?.data?.url && (
                    <img 
                      src={userInfo.picture.data.url} 
                      alt={userInfo.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-blue-900">{userInfo.name}</p>
                    {userInfo.email && (
                      <p className="text-sm text-blue-600">{userInfo.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col gap-3">
              {loginStatus !== 'connected' ? (
                <>
                  {/* Botão principal - Cadastro Incorporado WhatsApp */}
                  <Button 
                    onClick={launchWhatsAppSignup}
                    disabled={!sdkLoaded || loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Facebook className="w-5 h-5 mr-2" />
                    )}
                    🚀 Cadastrar WhatsApp Business
                  </Button>

                  {/* Botão secundário - Login simples */}
                  <Button 
                    onClick={handleLogin}
                    disabled={!sdkLoaded || loading}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Facebook className="w-5 h-5 mr-2" />
                    Login Simples (sem cadastro)
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleLogout}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : null}
                  Desconectar
                </Button>
              )}
            </div>

            {/* Código de Autorização */}
            {authCode && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                <h3 className="font-semibold text-blue-700">🔑 Código de Autorização</h3>
                <p className="text-xs text-blue-600">Este código deve ser trocado por um Access Token no backend.</p>
                <div className="flex gap-2">
                  <Input 
                    value={authCode} 
                    readOnly 
                    className="bg-white font-mono text-xs"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => copyToClipboard(authCode, 'Código')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Informações do Embedded Signup */}
            {sessionInfo && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
                <h3 className="font-semibold text-green-700">📱 WhatsApp Business Conectado!</h3>
                
                {sessionInfo.data?.phone_number_id && (
                  <div className="space-y-1">
                    <Label className="text-green-700">Phone Number ID</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={sessionInfo.data.phone_number_id} 
                        readOnly 
                        className="bg-white font-mono"
                      />
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => copyToClipboard(sessionInfo.data.phone_number_id, 'Phone Number ID')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {sessionInfo.data?.waba_id && (
                  <div className="space-y-1">
                    <Label className="text-green-700">WABA ID (WhatsApp Business Account)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={sessionInfo.data.waba_id} 
                        readOnly 
                        className="bg-white font-mono"
                      />
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => copyToClipboard(sessionInfo.data.waba_id, 'WABA ID')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {sessionInfo.event && (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      sessionInfo.event === 'FINISH' ? 'bg-green-200 text-green-800' :
                      sessionInfo.event === 'CANCEL' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {sessionInfo.event}
                    </span>
                  </div>
                )}

                <details className="mt-2">
                  <summary className="text-xs text-green-600 cursor-pointer">Ver dados completos</summary>
                  <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(sessionInfo, null, 2)}
                  </pre>
                </details>

                <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm text-yellow-800">
                  <strong>⚠️ Importante:</strong> Copie o <strong>Phone Number ID</strong> e atualize o secret <code>META_PHONE_NUMBER_ID</code> nas configurações do app.
                </div>
              </div>
            )}

            {/* Instruções */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-700 mb-2">📌 Instruções</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>1. Clique em "Conectar com Facebook"</li>
                <li>2. Autorize o acesso ao seu perfil</li>
                <li>3. Selecione a conta do WhatsApp Business</li>
                <li>4. Conceda as permissões necessárias</li>
                <li>5. O Phone Number ID aparecerá automaticamente</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}