export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto prose prose-slate">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-slate-500 mb-8">Última atualização: 21 de março de 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Introdução</h2>
          <p>A Glória Vendas ("nós", "nosso") opera o sistema disponível em sistema.gloriavendas.com.br. Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais.</p>

          <h2 className="text-xl font-semibold">2. Dados Coletados</h2>
          <p>Podemos coletar os seguintes dados:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Dados de identificação:</strong> nome, e-mail, telefone, CPF/CNPJ</li>
            <li><strong>Dados empresariais:</strong> nome da empresa, endereço, ramo de atividade</li>
            <li><strong>Dados de uso:</strong> interações com o sistema, agendamentos, mensagens</li>
            <li><strong>Dados de pagamento:</strong> informações processadas via Stripe (não armazenamos dados de cartão)</li>
          </ul>

          <h2 className="text-xl font-semibold">3. Finalidade do Tratamento</h2>
          <p>Utilizamos seus dados para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gerenciar agendamentos e reuniões</li>
            <li>Enviar comunicações via e-mail e WhatsApp (confirmações, lembretes)</li>
            <li>Processar pagamentos e assinaturas</li>
            <li>Melhorar nossos serviços e atendimento</li>
            <li>Cumprir obrigações legais e regulatórias</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Compartilhamento de Dados</h2>
          <p>Seus dados podem ser compartilhados com:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Stripe:</strong> para processamento de pagamentos</li>
            <li><strong>Google:</strong> para integração com Google Calendar e Meet</li>
            <li><strong>Meta/WhatsApp:</strong> para comunicação via WhatsApp Business</li>
            <li><strong>OpenAI:</strong> para funcionalidades de inteligência artificial</li>
          </ul>
          <p>Não vendemos ou compartilhamos seus dados com terceiros para fins de marketing.</p>

          <h2 className="text-xl font-semibold">5. Armazenamento e Segurança</h2>
          <p>Seus dados são armazenados em servidores seguros com criptografia. Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou destruição.</p>

          <h2 className="text-xl font-semibold">6. Seus Direitos (LGPD)</h2>
          <p>De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Confirmar a existência de tratamento de dados</li>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão de dados desnecessários</li>
            <li>Revogar consentimento a qualquer momento</li>
            <li>Solicitar portabilidade dos dados</li>
          </ul>

          <h2 className="text-xl font-semibold">7. Cookies</h2>
          <p>Utilizamos cookies essenciais para o funcionamento do sistema, como autenticação e preferências de sessão. Não utilizamos cookies de rastreamento de terceiros.</p>

          <h2 className="text-xl font-semibold">8. Contato</h2>
          <p>Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>E-mail:</strong> contato@gloriavendas.com.br</li>
            <li><strong>WhatsApp:</strong> disponível no site</li>
          </ul>

          <h2 className="text-xl font-semibold">9. Alterações</h2>
          <p>Esta política pode ser atualizada periodicamente. Recomendamos que consulte esta página regularmente para se manter informado sobre eventuais mudanças.</p>
        </section>
      </div>
    </div>
  );
}