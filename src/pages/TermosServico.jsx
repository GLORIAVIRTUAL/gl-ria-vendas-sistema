export default function TermosServico() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto prose prose-slate">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Termos de Serviço</h1>
        <p className="text-sm text-slate-500 mb-8">Última atualização: 21 de março de 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
          <p>Ao acessar e utilizar o sistema Glória Vendas ("Plataforma"), disponível em sistema.gloriavendas.com.br, você concorda com estes Termos de Serviço. Caso não concorde, não utilize a Plataforma.</p>

          <h2 className="text-xl font-semibold">2. Descrição do Serviço</h2>
          <p>A Glória Vendas oferece uma plataforma de gestão comercial que inclui:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Sistema de agendamento de reuniões online</li>
            <li>CRM e gestão de leads/clientes</li>
            <li>Integração com WhatsApp Business para comunicação</li>
            <li>Assistente de IA para atendimento automatizado</li>
            <li>Integração com Google Calendar e Google Meet</li>
            <li>Gestão de pagamentos e assinaturas via Stripe</li>
            <li>Programa de afiliados</li>
          </ul>

          <h2 className="text-xl font-semibold">3. Cadastro e Conta</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Você é responsável por manter a confidencialidade de suas credenciais de acesso</li>
            <li>As informações fornecidas devem ser verdadeiras e atualizadas</li>
            <li>Você é responsável por todas as atividades realizadas em sua conta</li>
            <li>Notifique-nos imediatamente sobre qualquer uso não autorizado</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Planos e Pagamentos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Os valores e condições dos planos são apresentados no momento da contratação</li>
            <li>Os pagamentos são processados de forma segura via Stripe</li>
            <li>As cobranças são recorrentes conforme o plano contratado</li>
            <li>Em caso de inadimplência, o acesso pode ser suspenso após notificação</li>
          </ul>

          <h2 className="text-xl font-semibold">5. Cancelamento</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>O cancelamento pode ser solicitado a qualquer momento</li>
            <li>O acesso permanece ativo até o final do período já pago</li>
            <li>Não há reembolso proporcional por períodos parciais</li>
            <li>Seus dados serão mantidos por 30 dias após o cancelamento para eventual reativação</li>
          </ul>

          <h2 className="text-xl font-semibold">6. Uso Aceitável</h2>
          <p>Ao utilizar a Plataforma, você concorda em NÃO:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Utilizar o sistema para fins ilegais ou não autorizados</li>
            <li>Enviar spam ou mensagens em massa não solicitadas via WhatsApp</li>
            <li>Tentar acessar áreas restritas do sistema</li>
            <li>Compartilhar credenciais de acesso com terceiros</li>
            <li>Realizar engenharia reversa ou copiar funcionalidades da Plataforma</li>
          </ul>

          <h2 className="text-xl font-semibold">7. Propriedade Intelectual</h2>
          <p>Todo o conteúdo, design, código e funcionalidades da Plataforma são propriedade da Glória Vendas e protegidos por leis de propriedade intelectual. É proibida a reprodução sem autorização prévia.</p>

          <h2 className="text-xl font-semibold">8. Limitação de Responsabilidade</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>A Plataforma é fornecida "como está", sem garantias de disponibilidade ininterrupta</li>
            <li>Não nos responsabilizamos por perdas decorrentes de falhas de terceiros (Stripe, Google, Meta)</li>
            <li>Não nos responsabilizamos por dados inseridos incorretamente pelo usuário</li>
            <li>Nossa responsabilidade total está limitada ao valor pago nos últimos 12 meses</li>
          </ul>

          <h2 className="text-xl font-semibold">9. Programa de Afiliados</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>A participação no programa de afiliados está sujeita a aprovação</li>
            <li>As comissões são pagas conforme percentual acordado</li>
            <li>Reservamo-nos o direito de alterar ou encerrar o programa a qualquer momento</li>
          </ul>

          <h2 className="text-xl font-semibold">10. Alterações nos Termos</h2>
          <p>Podemos atualizar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação na Plataforma. O uso continuado após as alterações constitui aceitação dos novos termos.</p>

          <h2 className="text-xl font-semibold">11. Foro</h2>
          <p>Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de Recife/PE para dirimir quaisquer controvérsias.</p>

          <h2 className="text-xl font-semibold">12. Contato</h2>
          <p>Dúvidas sobre estes Termos podem ser enviadas para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>E-mail:</strong> contato@gloriavendas.com.br</li>
            <li><strong>WhatsApp:</strong> disponível no site</li>
          </ul>
        </section>
      </div>
    </div>
  );
}