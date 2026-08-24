import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import VisualSymbolCleaner from '@/components/VisualSymbolCleaner';

// Add page imports here
import CodigoEmbed from '@/pages/CodigoEmbed';
import PoliticaPrivacidade from '@/pages/PoliticaPrivacidade';
import TermosServico from '@/pages/TermosServico';
import ClientesOpenClaw from '@/pages/ClientesOpenClaw';
import Trafego from '@/pages/Trafego';
import GerenciarUsuarios from '@/pages/GerenciarUsuarios';
import Prospeccao from '@/pages/Prospeccao';
import ICPs from '@/pages/ICPs';
import Campanhas from '@/pages/Campanhas';
import MotorComercial from '@/pages/MotorComercial';
import FilaDoDia from '@/pages/FilaDoDia';
import Metas from '@/pages/Metas';
import RelatorioComercial from '@/pages/RelatorioComercial';
import HigieneBase from '@/pages/HigieneBase';
import PlaybookObjecoes from '@/pages/PlaybookObjecoes';
import ResultadosCadencias from '@/pages/ResultadosCadencias';
import QualidadeProspeccao from '@/pages/QualidadeProspeccao';
import OnboardingPublico from '@/pages/OnboardingPublico';
import AgendamentoPublico from '@/pages/AgendamentoPublico';
import FormularioStart from '@/pages/FormularioStart';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/AgendamentoPublico" element={
      <LayoutWrapper currentPageName="AgendamentoPublico">
        <AgendamentoPublico />
      </LayoutWrapper>
    } />
    <Route path="/OnboardingPublico" element={
      <LayoutWrapper currentPageName="OnboardingPublico">
        <OnboardingPublico />
      </LayoutWrapper>
    } />
    <Route path="/FormularioStart" element={
      <LayoutWrapper currentPageName="FormularioStart">
        <FormularioStart />
      </LayoutWrapper>
    } />

    <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).filter(([path]) => !["AgendamentoPublico", "OnboardingPublico", "FormularioStart"].includes(path)).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/CodigoEmbed" element={
        <LayoutWrapper currentPageName="CodigoEmbed">
          <CodigoEmbed />
        </LayoutWrapper>
      } />
      <Route path="/ClientesOpenClaw" element={
        <LayoutWrapper currentPageName="ClientesOpenClaw">
          <ClientesOpenClaw />
        </LayoutWrapper>
      } />
      <Route path="/Trafego" element={
        <LayoutWrapper currentPageName="Trafego">
          <Trafego />
        </LayoutWrapper>
      } />
      <Route path="/GerenciarUsuarios" element={
        <LayoutWrapper currentPageName="GerenciarUsuarios">
          <GerenciarUsuarios />
        </LayoutWrapper>
      } />
      <Route path="/Prospeccao" element={
        <LayoutWrapper currentPageName="Prospeccao">
          <Prospeccao />
        </LayoutWrapper>
      } />
      <Route path="/ICPs" element={
        <LayoutWrapper currentPageName="ICPs">
          <ICPs />
        </LayoutWrapper>
      } />
      <Route path="/Campanhas" element={
        <LayoutWrapper currentPageName="Campanhas">
          <Campanhas />
        </LayoutWrapper>
      } />
      <Route path="/PlaybookObjecoes" element={
        <LayoutWrapper currentPageName="PlaybookObjecoes">
          <PlaybookObjecoes />
        </LayoutWrapper>
      } />
      <Route path="/HigieneBase" element={
        <LayoutWrapper currentPageName="HigieneBase">
          <HigieneBase />
        </LayoutWrapper>
      } />
      <Route path="/RelatorioComercial" element={
        <LayoutWrapper currentPageName="RelatorioComercial">
          <RelatorioComercial />
        </LayoutWrapper>
      } />
      <Route path="/Metas" element={
        <LayoutWrapper currentPageName="Metas">
          <Metas />
        </LayoutWrapper>
      } />
      <Route path="/FilaDoDia" element={
        <LayoutWrapper currentPageName="FilaDoDia">
          <FilaDoDia />
        </LayoutWrapper>
      } />
      <Route path="/MotorComercial" element={
        <LayoutWrapper currentPageName="MotorComercial">
          <MotorComercial />
        </LayoutWrapper>
      } />
      <Route path="/ResultadosCadencias" element={
        <LayoutWrapper currentPageName="ResultadosCadencias">
          <ResultadosCadencias />
        </LayoutWrapper>
      } />
      <Route path="/QualidadeProspeccao" element={
        <LayoutWrapper currentPageName="QualidadeProspeccao">
          <QualidadeProspeccao />
        </LayoutWrapper>
      } />
      <Route path="/PoliticaPrivacidade" element={<PoliticaPrivacidade />} />
      <Route path="/TermosServico" element={<TermosServico />} />
      <Route path="*" element={<PageNotFound />} />
    </Route>
  </Routes>
);


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <VisualSymbolCleaner />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App