
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve((req) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get('lead_id');
  const email = url.searchParams.get('email');
  const agendamentoId = url.searchParams.get('agendamentoId');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formulário de Onboarding - Glória Vendas</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-4">
    <div id="app" class="max-w-4xl mx-auto py-8">
        <div class="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f3ccc3a454aaec766ae684/2f46531d6_Untitleddesign34.png"
                     alt="Glória Vendas" class="w-20 h-20 mx-auto mb-4 rounded-xl">
                <h1 class="text-3xl font-bold mb-2">Formulário Completo de Cadastro</h1>
                <p class="opacity-90">Preencha todas as informações da sua empresa</p>
            </div>

            <div id="form-container" class="p-8">
                <div id="erro" class="hidden mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                    <p id="erro-text"></p>
                    <pre id="erro-details" class="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto"></pre>
                </div>
                <div id="loading" class="hidden text-center py-8">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p class="mt-4 text-slate-600 text-lg">Enviando...</p>
                </div>
                
                <form id="onboarding-form" class="space-y-8">
                    <!-- 🎯 PRODUTOS ESCOLHIDOS -->
                    <div class="space-y-4 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                        <h2 class="text-2xl font-bold text-purple-900 border-b-2 border-purple-500 pb-2">
                            🎯 Quais produtos você contratou?
                        </h2>
                        <p class="text-sm text-purple-700 mb-4">
                            Selecione todos os produtos que você contratou (pode escolher mais de um):
                        </p>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <label class="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-purple-100 hover:border-purple-400 cursor-pointer transition-all">
                                <input type="checkbox" name="produtos_escolhidos" value="Glória Clínica" 
                                       class="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500">
                                <div>
                                    <span class="font-bold text-slate-900 block">🏥 Glória Clínica</span>
                                    <span class="text-xs text-slate-600">Gestão completa para clínicas e consultórios</span>
                                </div>
                            </label>

                            <label class="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-purple-100 hover:border-purple-400 cursor-pointer transition-all">
                                <input type="checkbox" name="produtos_escolhidos" value="Glória Vendas" 
                                       class="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500">
                                <div>
                                    <span class="font-bold text-slate-900 block">💼 Glória Vendas</span>
                                    <span class="text-xs text-slate-600">Sistema completo de gestão de vendas</span>
                                </div>
                            </label>

                            <label class="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-purple-100 hover:border-purple-400 cursor-pointer transition-all">
                                <input type="checkbox" name="produtos_escolhidos" value="Glória Atendente" 
                                       class="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500">
                                <div>
                                    <span class="font-bold text-slate-900 block">🤖 Glória Atendente (IA 24/7)</span>
                                    <span class="text-xs text-slate-600">Atendimento automático com IA</span>
                                </div>
                            </label>

                            <label class="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-purple-100 hover:border-purple-400 cursor-pointer transition-all">
                                <input type="checkbox" name="produtos_escolhidos" value="Máquina de Vídeos" 
                                       class="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500">
                                <div>
                                    <span class="font-bold text-slate-900 block">🎬 Máquina de Vídeos</span>
                                    <span class="text-xs text-slate-600">Criação automatizada de vídeos</span>
                                </div>
                            </label>

                            <label class="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-purple-100 hover:border-purple-400 cursor-pointer transition-all">
                                <input type="checkbox" name="produtos_escolhidos" value="Glória Finanças" 
                                       class="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500">
                                <div>
                                    <span class="font-bold text-slate-900 block">💰 Glória Finanças</span>
                                    <span class="text-xs text-slate-600">Gestão financeira completa</span>
                                </div>
                            </label>

                            <label class="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-purple-100 hover:border-purple-400 cursor-pointer transition-all">
                                <input type="checkbox" name="produtos_escolhidos" value="Avatar ao Vivo" 
                                       class="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500">
                                <div>
                                    <span class="font-bold text-slate-900 block">👤 Avatar ao Vivo</span>
                                    <span class="text-xs text-slate-600">Avatar digital em tempo real</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- 📋 Dados Básicos -->
                    <div class="space-y-4">
                        <h2 class="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 pb-2">📋 Dados Básicos</h2>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">E-mail <span class="text-red-500">*</span></label>
                                <input type="email" name="email" value="${email || ''}" required
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Email Comercial <span class="text-red-500">*</span></label>
                                <input type="email" name="email_comercial" required
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>

                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">Nome da Empresa <span class="text-red-500">*</span></label>
                                <input type="text" name="nome_empresa" required
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">CNPJ</label>
                                <input type="text" name="cnpj" placeholder="00.000.000/0000-00"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <!-- 📞 Contatos -->
                    <div class="space-y-4">
                        <h2 class="text-2xl font-bold text-slate-900 border-b-2 border-green-500 pb-2">📞 Contatos</h2>
                        
                        <div class="grid md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">Telefone / WhatsApp <span class="text-red-500">*</span></label>
                                <input type="tel" name="telefone_whatsapp" required placeholder="(11) 99999-9999"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Telegram</label>
                                <input type="text" name="telegram" placeholder="@usuario"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Site</label>
                                <input type="url" name="site" placeholder="https://..."
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Outros Contatos</label>
                            <textarea name="outros_contatos" rows="2" placeholder="Outros meios de contato..."
                                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                    </div>

                    <!-- 💼 Sobre a Empresa -->
                    <div class="space-y-4">
                        <h2 class="text-2xl font-bold text-slate-900 border-b-2 border-purple-500 pb-2">💼 Sobre a Empresa</h2>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Ramos de Atividade <span class="text-red-500">*</span></label>
                            <textarea name="ramos_atividade" rows="3" required
                                      placeholder="Ex: Tecnologia, Consultoria, Varejo..."
                                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Produtos ou Serviços <span class="text-red-500">*</span></label>
                            <textarea name="produtos_servicos" rows="4" required
                                      placeholder="Descreva seus principais produtos/serviços..."
                                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Portfólio</label>
                            <textarea name="portfolio" rows="4"
                                      placeholder="Descreva seus principais projetos, trabalhos realizados..."
                                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Diferenciais</label>
                            <textarea name="diferenciais" rows="3"
                                      placeholder="O que torna sua empresa única? Quais seus diferenciais?"
                                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Preços / Tabela de Valores</label>
                            <textarea name="precos" rows="4"
                                      placeholder="Descreva sua política de preços, tabelas, condições..."
                                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Profissionais / Equipe</label>
                            <textarea name="profissionais" rows="3"
                                      placeholder="Descreva sua equipe, profissionais, especialidades..."
                                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Horário de Funcionamento <span class="text-red-500">*</span></label>
                            <input type="text" name="horario_funcionamento" required placeholder="Ex: Seg-Sex 9h-18h"
                                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>

                    <!-- 📍 Endereço -->
                    <div class="space-y-4">
                        <h2 class="text-2xl font-bold text-slate-900 border-b-2 border-orange-500 pb-2">📍 Endereço</h2>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Endereço Completo da Empresa</label>
                            <input type="text" name="endereco_empresa" placeholder="Endereço completo..."
                                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div class="grid md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">País <span class="text-red-500">*</span></label>
                                <input type="text" name="pais" value="Brasil" required
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Estado <span class="text-red-500">*</span></label>
                                <input type="text" name="estado" required placeholder="SP"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Cidade <span class="text-red-500">*</span></label>
                                <input type="text" name="cidade" required placeholder="São Paulo"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>

                        <div class="grid md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">CEP <span class="text-red-500">*</span></label>
                                <input type="text" name="cep" required placeholder="00000-000"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Bairro <span class="text-red-500">*</span></label>
                                <input type="text" name="bairro" required
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Rua <span class="text-red-500">*</span></label>
                                <input type="text" name="rua" required
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Número <span class="text-red-500">*</span></label>
                                <input type="text" name="numero" required
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <!-- 🌐 Redes Sociais -->
                    <div class="space-y-4">
                        <h2 class="text-2xl font-bold text-slate-900 border-b-2 border-pink-500 pb-2">🌐 Redes Sociais</h2>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">📷 Instagram</label>
                                <input type="text" name="instagram" placeholder="@suaempresa"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">📘 Facebook</label>
                                <input type="text" name="facebook" placeholder="facebook.com/suaempresa"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>

                        <div class="grid md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">▶️ YouTube</label>
                                <input type="text" name="youtube" placeholder="youtube.com/@suaempresa"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">🎵 TikTok</label>
                                <input type="text" name="tiktok" placeholder="@suaempresa"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">✖️ X (Twitter)</label>
                                <input type="text" name="x_twitter" placeholder="@suaempresa"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <!-- 📊 Informações Adicionais -->
                    <div class="space-y-4">
                        <h2 class="text-2xl font-bold text-slate-900 border-b-2 border-indigo-500 pb-2">📊 Informações Adicionais</h2>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">🏆 Concorrentes e Referências</label>
                            <textarea name="concorrentes" rows="3"
                                      placeholder="Quem são seus principais concorrentes? Quais empresas você admira?"
                                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">🎁 Promoções Atuais</label>
                            <textarea name="promocoes" rows="3"
                                      placeholder="Descreva promoções, ofertas especiais, campanhas em andamento..."
                                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">❓ Perguntas Frequentes (FAQ)</label>
                            <textarea name="faq" rows="5"
                                      placeholder="Liste as perguntas mais frequentes dos seus clientes e as respostas..."
                                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                    </div>

                    <!-- Botão de Envio -->
                    <div class="pt-6">
                        <button type="submit" 
                                class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200">
                            ✓ Enviar Formulário Completo
                        </button>
                        <p class="text-center text-sm text-slate-500 mt-4">
                            Todos os campos marcados com <span class="text-red-500">*</span> são obrigatórios
                        </p>
                    </div>
                </form>

                <div id="sucesso" class="hidden text-center py-12">
                    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span class="text-4xl">✅</span>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-900 mb-3">
                        Formulário Enviado com Sucesso!
                    </h2>
                    <p class="text-slate-600">
                        Obrigado por preencher todas as informações. Nossa equipe entrará em contato em breve.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('onboarding-form');
        const erro = document.getElementById('erro');
        const erroText = document.getElementById('erro-text');
        const erroDetails = document.getElementById('erro-details');
        const loading = document.getElementById('loading');
        const sucesso = document.getElementById('sucesso');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            erro.classList.add('hidden');
            loading.classList.remove('hidden');
            form.classList.add('hidden');

            try {
                const formData = new FormData(form);
                const data = {
                    logotipo_url: 'https://via.placeholder.com/150',
                    outros_arquivos_urls: []
                };
                
                // Captura checkboxes de produtos
                const produtosEscolhidos = [];
                const checkboxes = document.querySelectorAll('input[name="produtos_escolhidos"]:checked');
                checkboxes.forEach(cb => produtosEscolhidos.push(cb.value));
                data.produtos_escolhidos = produtosEscolhidos;

                // Captura outros campos
                for (let [key, value] of formData.entries()) {
                    if (key !== 'produtos_escolhidos') {
                        data[key] = value;
                    }
                }

                if ("${leadId || ''}") data.lead_id = "${leadId || ''}";
                if ("${agendamentoId || ''}") data.agendamento_id = "${agendamentoId || ''}";

                let baseUrl = 'https://preview--agenda-gloria-766ae684.base44.app';
                
                const url = baseUrl + '/api/functions/submitOnboarding';
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data),
                    mode: 'cors'
                });

                const responseText = await response.text();
                const result = JSON.parse(responseText);

                if (result.success) {
                    loading.classList.add('hidden');
                    sucesso.classList.remove('hidden');
                } else {
                    throw new Error(result.message || result.error || 'Erro desconhecido');
                }

            } catch (error) {
                console.error('❌ ERRO:', error);
                loading.classList.add('hidden');
                form.classList.remove('hidden');
                erroText.textContent = error.message;
                erroDetails.textContent = JSON.stringify({
                    message: error.message,
                    stack: error.stack,
                    tipo: error.name
                }, null, 2);
                erro.classList.remove('hidden');
            }
        });
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
});
