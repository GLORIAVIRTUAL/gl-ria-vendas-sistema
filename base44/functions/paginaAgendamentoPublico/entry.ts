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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background-image: url('https://media.base44.com/images/public/68f3ccc3a454aaec766ae684/cdb261cb2_generated_image.png'); background-size: cover; background-position: center; background-attachment: fixed; }
        h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.025em; }
        input, textarea { color-scheme: dark; }
    </style>
</head>
<body class="min-h-screen bg-slate-950 p-3 text-white sm:p-6">
    <div id="app" class="mx-auto max-w-3xl py-4 sm:py-8"></div>
    
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
                    <div class="rounded-2xl border border-slate-500/60 bg-slate-950/80 p-8 text-center text-white shadow-2xl backdrop-blur-xl">
                        <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span class="text-4xl">🎉</span>
                        </div>
                        <h1 class="mb-3 text-3xl font-bold text-white">
                            Reunião Agendada com Sucesso!
                        </h1>
                        <p class="mb-6 text-lg text-slate-300">
                            Enviamos um email de confirmação com todos os detalhes.
                        </p>
                        <div class="mb-6 rounded-xl border border-cyan-400/40 bg-white/10 p-6 shadow-[0_0_20px_rgba(34,211,238,0.18)]">
                            <p class="text-slate-200"><strong>Cliente:</strong> \${formData.nome_cliente}</p>
                            <p class="text-slate-200"><strong>Data:</strong> \${new Date(formData.data).toLocaleDateString('pt-BR')}</p>
                            <p class="text-slate-200"><strong>Horário:</strong> \${formData.horario}</p>
                        </div>
                        \${formData.linkReuniao ? \`
                            <a href="\${formData.linkReuniao}" target="_blank" 
                               class="inline-block rounded-lg bg-cyan-400 px-8 py-3 font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.65)] hover:bg-cyan-300">
                                🎥 Acessar Link da Reunião
                            </a>
                        \` : ''}
                    </div>
                \`;
                return;
            }

            app.innerHTML = \`
                <div class="overflow-hidden rounded-2xl border border-slate-500/60 bg-slate-950/75 text-white shadow-2xl backdrop-blur-xl">
                    <!-- Header -->
                    <div class="border-b border-slate-600/60 bg-white/5 p-6 text-left sm:p-8">
                        <p class="mb-2 text-3xl font-semibold tracking-wide text-white sm:text-4xl">GLÓRIA</p>
                        <h1 class="mb-1 text-2xl font-semibold text-white sm:text-3xl">Agende sua Reunião</h1>
                        <p class="text-sm text-slate-300 sm:text-base">Preencha os dados para marcar um horário</p>
                    </div>

                    <!-- Steps -->
                    <div class="flex items-center justify-center gap-3 border-b border-slate-600/60 bg-white/5 p-4 sm:gap-5 sm:p-6">
                        \${[1,2].map(step => \`
                            <div class="flex items-center gap-2 \${etapa >= step ? 'opacity-100' : 'opacity-40'}">
                                <div class="\${etapa >= step ? 'border-cyan-300 bg-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.75)]' : 'border-slate-500 bg-slate-900/70 text-slate-400'} flex h-9 w-9 items-center justify-center rounded-full border font-bold sm:h-10 sm:w-10">
                                    \${etapa > step ? '✓' : step}
                                </div>
                            </div>
                        \`).join('<div class="h-px w-12 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] sm:w-20"></div>')}
                    </div>

                    <!-- Form -->
                    <div class="p-5 sm:p-8">
                        <div id="erro" class="mb-4 hidden rounded-lg border border-red-400/50 bg-red-950/70 px-4 py-3 text-red-100"></div>
                        <div id="loading" class="hidden text-center py-4">
                            <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-300"></div>
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
                        <h2 class="mb-4 text-lg font-semibold text-white sm:text-xl">Seus Dados</h2>
                        <div>
                            <label class="block text-sm font-medium mb-2">Nome Completo *</label>
                            <input type="text" id="nome" value="\${formData.nome_cliente}" 
                                   class="w-full rounded-lg border border-slate-400/70 bg-slate-900/45 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.55)]" placeholder="João Silva">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Email *</label>
                            <input type="email" id="email" value="\${formData.email_cliente}"
                                   class="w-full rounded-lg border border-slate-400/70 bg-slate-900/45 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.55)]" placeholder="joao@email.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Telefone</label>
                            <input type="tel" id="telefone" value="\${formData.telefone_cliente}"
                                   class="w-full rounded-lg border border-slate-400/70 bg-slate-900/45 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.55)]" placeholder="(11) 99999-9999">
                        </div>
                        <button onclick="proximaEtapa()" 
                                class="w-full rounded-lg bg-cyan-400 py-3.5 text-base font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.65)] transition hover:bg-cyan-300">
                            Próximo: Data e Hora
                        </button>
                    </div>
                \`;
            } else if (etapa === 2) {
                content.innerHTML = \`
                    <div class="space-y-4">
                        <h2 class="mb-4 text-lg font-semibold text-white sm:text-xl">Data e Horário</h2>
                        <div>
                            <label class="block text-sm font-medium mb-2">Data *</label>
                            <input type="date" id="data" value="\${formData.data}" onchange="verificarHorarios()"
                                   min="\${new Date().toISOString().split('T')[0]}"
                                   class="w-full rounded-lg border border-slate-400/70 bg-slate-900/45 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60">
                        </div>
                        <div id="horarios-container" class="hidden">
                            <label class="block text-sm font-medium mb-2">Horário *</label>
                            <div id="horarios-grid" class="grid grid-cols-3 sm:grid-cols-4 gap-2"></div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Observações</label>
                            <textarea id="observacoes" rows="3" 
                                      class="w-full rounded-lg border border-slate-400/70 bg-slate-900/45 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60">\${formData.observacoes}</textarea>
                        </div>
                        <div class="flex flex-col sm:flex-row gap-3">
                            <button onclick="voltarEtapa()" 
                                    class="flex-1 rounded-lg border border-slate-400 bg-transparent py-3.5 text-base font-semibold text-white transition hover:bg-white/10">
                                Voltar
                            </button>
                            <button onclick="finalizarAgendamento()" 
                                    class="flex-1 rounded-lg bg-cyan-400 py-3.5 text-base font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.65)] transition hover:bg-cyan-300">
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
                            class="\${formData.horario === h ? 'border-cyan-300 bg-cyan-400/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.6)]' : 'border-slate-500 bg-slate-900/50 text-slate-200 hover:border-cyan-300/70'} rounded-lg border px-2 py-3 font-mono text-sm font-semibold transition sm:text-base">
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