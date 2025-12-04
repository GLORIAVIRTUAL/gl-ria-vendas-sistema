import Dashboard from './pages/Dashboard';
import Agendar from './pages/Agendar';
import Agendamentos from './pages/Agendamentos';
import Negocios from './pages/Negocios';
import NovoNegocio from './pages/NovoNegocio';
import TesteStripe from './pages/TesteStripe';
import APIDocumentacao from './pages/APIDocumentacao';
import Afiliados from './pages/Afiliados';
import CriarContaAfiliado from './pages/CriarContaAfiliado';
import AgendamentoPublico from './pages/AgendamentoPublico';
import CodigoEmbed from './pages/CodigoEmbed';
import DashboardAfiliado from './pages/DashboardAfiliado';
import CRMAfiliado from './pages/CRMAfiliado';
import AgendarAfiliado from './pages/AgendarAfiliado';
import AgendamentosAfiliado from './pages/AgendamentosAfiliado';
import NovoNegocioAfiliado from './pages/NovoNegocioAfiliado';
import NegociosAfiliado from './pages/NegociosAfiliado';
import DisparosWhatsApp from './pages/DisparosWhatsApp';
import ConfigurarCron from './pages/ConfigurarCron';
import TesteWhatsApp from './pages/TesteWhatsApp';
import ImportarProdutos from './pages/ImportarProdutos';
import ConfigurarGoogleCalendar from './pages/ConfigurarGoogleCalendar';
import DisparosEmail from './pages/DisparosEmail';
import Clientes from './pages/Clientes';
import ClientesAfiliado from './pages/ClientesAfiliado';
import Agenda from './pages/Agenda';
import AgendaAfiliado from './pages/AgendaAfiliado';
import TesteWebhook from './pages/TesteWebhook';
import CRM from './pages/CRM';
import OnboardingPublico from './pages/OnboardingPublico';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Agendar": Agendar,
    "Agendamentos": Agendamentos,
    "Negocios": Negocios,
    "NovoNegocio": NovoNegocio,
    "TesteStripe": TesteStripe,
    "APIDocumentacao": APIDocumentacao,
    "Afiliados": Afiliados,
    "CriarContaAfiliado": CriarContaAfiliado,
    "AgendamentoPublico": AgendamentoPublico,
    "CodigoEmbed": CodigoEmbed,
    "DashboardAfiliado": DashboardAfiliado,
    "CRMAfiliado": CRMAfiliado,
    "AgendarAfiliado": AgendarAfiliado,
    "AgendamentosAfiliado": AgendamentosAfiliado,
    "NovoNegocioAfiliado": NovoNegocioAfiliado,
    "NegociosAfiliado": NegociosAfiliado,
    "DisparosWhatsApp": DisparosWhatsApp,
    "ConfigurarCron": ConfigurarCron,
    "TesteWhatsApp": TesteWhatsApp,
    "ImportarProdutos": ImportarProdutos,
    "ConfigurarGoogleCalendar": ConfigurarGoogleCalendar,
    "DisparosEmail": DisparosEmail,
    "Clientes": Clientes,
    "ClientesAfiliado": ClientesAfiliado,
    "Agenda": Agenda,
    "AgendaAfiliado": AgendaAfiliado,
    "TesteWebhook": TesteWebhook,
    "CRM": CRM,
    "OnboardingPublico": OnboardingPublico,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};