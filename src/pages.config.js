/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import APIDocumentacao from './pages/APIDocumentacao';
import Afiliados from './pages/Afiliados';
import Agenda from './pages/Agenda';
import AgendaAfiliado from './pages/AgendaAfiliado';
import AgendamentoPublico from './pages/AgendamentoPublico';
import Agendamentos from './pages/Agendamentos';
import AgendamentosAfiliado from './pages/AgendamentosAfiliado';
import Agendar from './pages/Agendar';
import AgendarAfiliado from './pages/AgendarAfiliado';
import CRM from './pages/CRM';
import CRMAfiliado from './pages/CRMAfiliado';
import ChatIA from './pages/ChatIA';
import Clientes from './pages/Clientes';
import ClientesAfiliado from './pages/ClientesAfiliado';
import CodigoEmbed from './pages/CodigoEmbed';
import ConfiguracoesIA from './pages/ConfiguracoesIA';
import ConfigurarCron from './pages/ConfigurarCron';
import ConfigurarGoogleCalendar from './pages/ConfigurarGoogleCalendar';
import CriarContaAfiliado from './pages/CriarContaAfiliado';
import Dashboard from './pages/Dashboard';
import DashboardAfiliado from './pages/DashboardAfiliado';
import DashboardIA from './pages/DashboardIA';
import DisparosEmail from './pages/DisparosEmail';
import DisparosWhatsApp from './pages/DisparosWhatsApp';
import Emails from './pages/Emails';
import ExportarChatbot from './pages/ExportarChatbot';
import FormularioStart from './pages/FormularioStart';
import GerenciarWhatsApp from './pages/GerenciarWhatsApp';
import Home from './pages/Home';
import ImportarProdutos from './pages/ImportarProdutos';
import Negocios from './pages/Negocios';
import NegociosAfiliado from './pages/NegociosAfiliado';
import NovoNegocio from './pages/NovoNegocio';
import NovoNegocioAfiliado from './pages/NovoNegocioAfiliado';
import OnboardingPublico from './pages/OnboardingPublico';
import PipelineIA from './pages/PipelineIA';
import TesteStripe from './pages/TesteStripe';
import TesteWebhook from './pages/TesteWebhook';
import TesteWhatsApp from './pages/TesteWhatsApp';
import AcessoFacebook from './pages/AcessoFacebook';
import __Layout from './Layout.jsx';


export const PAGES = {
    "APIDocumentacao": APIDocumentacao,
    "Afiliados": Afiliados,
    "Agenda": Agenda,
    "AgendaAfiliado": AgendaAfiliado,
    "AgendamentoPublico": AgendamentoPublico,
    "Agendamentos": Agendamentos,
    "AgendamentosAfiliado": AgendamentosAfiliado,
    "Agendar": Agendar,
    "AgendarAfiliado": AgendarAfiliado,
    "CRM": CRM,
    "CRMAfiliado": CRMAfiliado,
    "ChatIA": ChatIA,
    "Clientes": Clientes,
    "ClientesAfiliado": ClientesAfiliado,
    "CodigoEmbed": CodigoEmbed,
    "ConfiguracoesIA": ConfiguracoesIA,
    "ConfigurarCron": ConfigurarCron,
    "ConfigurarGoogleCalendar": ConfigurarGoogleCalendar,
    "CriarContaAfiliado": CriarContaAfiliado,
    "Dashboard": Dashboard,
    "DashboardAfiliado": DashboardAfiliado,
    "DashboardIA": DashboardIA,
    "DisparosEmail": DisparosEmail,
    "DisparosWhatsApp": DisparosWhatsApp,
    "Emails": Emails,
    "ExportarChatbot": ExportarChatbot,
    "FormularioStart": FormularioStart,
    "GerenciarWhatsApp": GerenciarWhatsApp,
    "Home": Home,
    "ImportarProdutos": ImportarProdutos,
    "Negocios": Negocios,
    "NegociosAfiliado": NegociosAfiliado,
    "NovoNegocio": NovoNegocio,
    "NovoNegocioAfiliado": NovoNegocioAfiliado,
    "OnboardingPublico": OnboardingPublico,
    "PipelineIA": PipelineIA,
    "TesteStripe": TesteStripe,
    "TesteWebhook": TesteWebhook,
    "TesteWhatsApp": TesteWhatsApp,
    "AcessoFacebook": AcessoFacebook,
}

export const pagesConfig = {
    mainPage: "AcessoFacebook",
    Pages: PAGES,
    Layout: __Layout,
};