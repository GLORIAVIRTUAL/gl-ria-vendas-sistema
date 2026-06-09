// Esta function retorna uma página HTML completa e pública (v2)
Deno.serve((req) => {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agendar Reunião - Glória Vendas</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; }
    </style>
</head>
<body class="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-4">
    <div id="app" class="max-w-4xl mx-auto py-8"></div>
    
    <script>
        let etapa = 1;
        let formData = {
            nome_cliente: "",
            email_cliente: "",
            telefone_cliente: "",
            data: "",
            horario: "",
            observacoes: ""
        };
        let horariosDisponiveis = [];

        function render() {
            const app = document.getElementById('app');
            
            if (formData.sucesso) {
                app.innerHTML = \`
                    <div class="bg-white rounded-xl shadow-2xl p-8 text-center">
                        <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span class="text-4xl">🎉</span>
                        </div>
                        <h1 class="text-3xl font-bold text-slate-900 mb-3">
                            Reunião Agendada com Sucesso!
                        </h1>
                        <p class="text-lg text-slate-600 mb-6">
                            Enviamos um email de confirmação com todos os detalhes.
                        </p>
                        <div class="bg-blue-50 rounded-lg p-6 mb-6">
                            <p class="text-slate-700"><strong>Cliente:</strong> \${formData.nome_cliente}</p>
                            <p class="text-slate-700"><strong>Data:</strong> \${new Date(formData.data).toLocaleDateString('pt-BR')}</p>
                            <p class="text-slate-700"><strong>Horário:</strong> \${formData.horario}</p>
                        </div>
                        \${formData.linkReuniao ? \`
                            <a href="\${formData.linkReuniao}" target="_blank" 
                               class="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold">
                                🎥 Acessar Link da Reunião
                            </a>
                        \` : ''}
                    </div>
                \`;
                return;
            }

            app.innerHTML = \`
                <div class="bg-white rounded-xl shadow-2xl overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f3ccc3a454aaec766ae684/973791adc_Untitleddesign14.png"
                             alt="Glória" class="w-48 h-auto mx-auto mb-4">
                        <h1 class="text-3xl font-bold mb-2">Agende sua Reunião</h1>
                        <p class="opacity-90">Preencha os dados para marcar um horário</p>
                    </div>

                    <!-- Steps -->
                    <div class="flex justify-center gap-4 p-6 bg-slate-50 border-b">
                        \${[1,2].map(step => \`
                            <div class="flex items-center gap-2 \${etapa >= step ? 'opacity-100' : 'opacity-40'}">
                                <div class="\${etapa >= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'} w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                    \${etapa > step ? '✓' : step}
                                </div>
                            </div>
                        \`).join('<div class="w-12 h-1 bg-slate-200 rounded"></div>')}
                    </div>

                    <!-- Form -->
                    <div class="p-8">
                        <div id="erro" class="hidden mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded"></div>
                        <div id="loading" class="hidden text-center py-4">
                            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <div id="form-content"></div>
                    </div>
                </div>
            \`;

            renderFormContent();
        }

        function renderFormContent() {
            const content = document.getElementById('form-content');
            
            if (etapa === 1) {
                content.innerHTML = \`
                    <div class="space-y-4">
                        <h2 class="text-xl font-bold mb-4">👤 Seus Dados</h2>
                        <div>
                            <label class="block text-sm font-medium mb-2">Nome Completo *</label>
                            <input type="text" id="nome" value="\${formData.nome_cliente}" 
                                   class="w-full px-4 py-2 border rounded-lg" placeholder="João Silva">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Email *</label>
                            <input type="email" id="email" value="\${formData.email_cliente}"
                                   class="w-full px-4 py-2 border rounded-lg" placeholder="joao@email.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Telefone</label>
                            <input type="tel" id="telefone" value="\${formData.telefone_cliente}"
                                   class="w-full px-4 py-2 border rounded-lg" placeholder="(11) 99999-9999">
                        </div>
                        <button onclick="proximaEtapa()" 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
                            Próximo: Data e Hora
                        </button>
                    </div>
                \`;
            } else if (etapa === 2) {
                content.innerHTML = \`
                    <div class="space-y-4">
                        <h2 class="text-xl font-bold mb-4">📅 Data e Horário</h2>
                        <div>
                            <label class="block text-sm font-medium mb-2">Data *</label>
                            <input type="date" id="data" value="\${formData.data}" onchange="verificarHorarios()"
                                   min="\${new Date().toISOString().split('T')[0]}"
                                   class="w-full px-4 py-2 border rounded-lg">
                        </div>
                        <div id="horarios-container" class="hidden">
                            <label class="block text-sm font-medium mb-2">Horário *</label>
                            <div id="horarios-grid" class="grid grid-cols-3 gap-2"></div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Observações</label>
                            <textarea id="observacoes" rows="3" 
                                      class="w-full px-4 py-2 border rounded-lg">\${formData.observacoes}</textarea>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="voltarEtapa()" 
                                    class="flex-1 border border-slate-300 py-3 rounded-lg font-semibold">
                                Voltar
                            </button>
                            <button onclick="finalizarAgendamento()" 
                                    class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">
                                ✓ Confirmar Agendamento
                            </button>
                        </div>
                    </div>
                \`;
            }
        }

        function proximaEtapa() {
            if (etapa === 1) {
                formData.nome_cliente = document.getElementById('nome').value;
                formData.email_cliente = document.getElementById('email').value;
                formData.telefone_cliente = document.getElementById('telefone').value;
                
                if (!formData.nome_cliente || !formData.email_cliente) {
                    mostrarErro('Preencha nome e email');
                    return;
                }
            }
            
            etapa++;
            render();
        }

        function voltarEtapa() {
            etapa--;
            render();
        }

        async function verificarHorarios() {
            const data = document.getElementById('data').value;
            if (!data) return;
            
            formData.data = data;
            document.getElementById('loading').classList.remove('hidden');
            
            try {
                const response = await fetch(window.location.origin + '/api/functions/verificardisponibilidade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data, api_key: 'apiflskcjfjhsydkifms' })
                });
                
                const result = await response.json();
                horariosDisponiveis = result.horarios || [];
                
                const container = document.getElementById('horarios-container');
                const grid = document.getElementById('horarios-grid');
                
                grid.innerHTML = horariosDisponiveis.map(h => \`
                    <button onclick="selecionarHorario('\${h}')" 
                            class="\${formData.horario === h ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200'} px-4 py-2 rounded-lg font-mono font-semibold">
                        \${h}
                    </button>
                \`).join('');
                
                container.classList.remove('hidden');
            } catch (error) {
                mostrarErro('Erro ao verificar horários: ' + error.message);
            } finally {
                document.getElementById('loading').classList.add('hidden');
            }
        }

        function selecionarHorario(horario) {
            formData.horario = horario;
            renderFormContent();
        }

        async function finalizarAgendamento() {
            formData.observacoes = document.getElementById('observacoes').value;
            
            if (!formData.data || !formData.horario) {
                mostrarErro('Escolha data e horário');
                return;
            }
            
            document.getElementById('loading').classList.remove('hidden');
            
            try {
                const response = await fetch(window.location.origin + '/api/functions/agendarviachatbot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome_cliente: formData.nome_cliente,
                        email_cliente: formData.email_cliente,
                        telefone_cliente: formData.telefone_cliente,
                        data: formData.data,
                        horario: formData.horario,
                        observacoes: formData.observacoes,
                        api_key: 'apiflskcjfjhsydkifms'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    formData.sucesso = true;
                    formData.linkReuniao = result.agendamento?.link_reuniao;
                    render();
                } else {
                    mostrarErro(result.message || 'Erro ao criar agendamento');
                }
            } catch (error) {
                mostrarErro('Erro: ' + error.message);
            } finally {
                document.getElementById('loading').classList.add('hidden');
            }
        }

        function mostrarErro(mensagem) {
            const erro = document.getElementById('erro');
            erro.textContent = mensagem;
            erro.classList.remove('hidden');
            setTimeout(() => erro.classList.add('hidden'), 5000);
        }

        render();
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
});