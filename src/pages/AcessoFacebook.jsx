import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AcessoFacebook() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    // Carrega o SDK do Facebook
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '1391502789229890',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v24.0'
      });
      setSdkLoaded(true);
      
      // Verifica status de login ao carregar
      window.FB.getLoginStatus(function(response) {
        setLoginStatus(response.status);
        if (response.status === 'connected') {
          fetchUserInfo();
        }
      });
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

    // Listener para Embedded Signup do WhatsApp
    const handleMessage = (event) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('📱 WhatsApp Embedded Signup:', data);
          setSessionInfo(data);
          
          // data pode conter:
          // - data.data.phone_number_id
          // - data.data.waba_id (WhatsApp Business Account ID)
          // - data.event (ex: 'FINISH', 'CANCEL', 'ERROR')
        }
      } catch (e) {
        // Ignora mensagens que não são JSON
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchUserInfo = () => {
    window.FB.api('/me', { fields: 'name,email,picture' }, function(response) {
      setUserInfo(response);
    });
  };

  const handleLogin = () => {
    setLoading(true);
    window.FB.login(function(response) {
      setLoading(false);
      setLoginStatus(response.status);
      if (response.status === 'connected') {
        fetchUserInfo();
      }
    }, { scope: 'public_profile,email,whatsapp_business_management,whatsapp_business_messaging' });
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
                <Button 
                  onClick={handleLogin}
                  disabled={!sdkLoaded || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Facebook className="w-5 h-5 mr-2" />
                  )}
                  Conectar com Facebook
                </Button>
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

            {/* Instruções */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-700 mb-2">📌 Instruções</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>1. Clique em "Conectar com Facebook"</li>
                <li>2. Autorize o acesso ao seu perfil</li>
                <li>3. Selecione a conta do WhatsApp Business</li>
                <li>4. Conceda as permissões necessárias</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}