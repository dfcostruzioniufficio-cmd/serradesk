import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Route, Routes, BrowserRouter as Router, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop';

// Le due porte d'ingresso restano caricate subito: sono le prime cose
// che vede chi arriva, un caricamento intermedio qui si noterebbe.
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Tutto il resto viene scaricato solo quando si apre davvero quella
// pagina: prima il browser si portava dietro anche pannello admin,
// grafici e importatore PDF a chiunque aprisse il configuratore.
const PreventiviPage = lazy(caricaPagina(() => import('./pages/PreventiviPage')));
const ArchivioPage = lazy(caricaPagina(() => import('./pages/ArchivioPage')));
const OrdiniPage = lazy(caricaPagina(() => import('./pages/OrdiniPage')));
const RubricaPage = lazy(caricaPagina(() => import('./pages/RubricaPage')));
const DashboardPage = lazy(caricaPagina(() => import('./pages/DashboardPage')));
const SettingsPage = lazy(caricaPagina(() => import('./pages/SettingsPage')));
const UpdatePasswordPage = lazy(caricaPagina(() => import('./pages/UpdatePasswordPage')));
const AdminPage = lazy(caricaPagina(() => import('./pages/AdminPage')));
const PaywallPage = lazy(caricaPagina(() => import('./pages/PaywallPage')));
const GuidaPage = lazy(caricaPagina(() => import('./pages/GuidaPage')));
const ArticlePage = lazy(caricaPagina(() => import('./pages/ArticlePage')));
const DistintaPage = lazy(caricaPagina(() => import('./pages/DistintaPage')));
const SchedaRilievoPage = lazy(caricaPagina(() => import('./pages/SchedaRilievoPage')));
const TerminiPage = lazy(caricaPagina(() => import('./pages/TerminiPage')));
const PrivacyPage = lazy(caricaPagina(() => import('./pages/PrivacyPage')));
const OnboardingPage = lazy(caricaPagina(() => import('./pages/OnboardingPage')));
const WidgetWebPage = lazy(caricaPagina(() => import('./pages/WidgetWebPage')));

import AppShell from './components/AppShell';
import { supabase } from './lib/supabaseClient';
import { UserProvider, useUser } from './contexts/UserContext';
import { caricaPagina } from './lib/caricaPagina';

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}

// Un componente wrapper per proteggere le rotte SaaS
function ProtectedRoute({ children }) {
  const { userProfile, needsPayment, isLoadingSettings } = useUser();

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Se l'utente non ha un piano attivo a pagamento -> Paywall
  if (needsPayment) {
    return <PaywallPage />;
  }

  return children;
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Traccia chi arriva dal link della campagna di lancio, cosi' al momento
    // del checkout gli si puo' pre-applicare lo sconto senza che debba
    // scrivere manualmente il codice - vedi PaywallPage.jsx
    const params = new URLSearchParams(window.location.search);
    if (params.get('promo') === 'lancio') {
      localStorage.setItem('sd_promo_lancio', '1');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // Se l'evento è un reset della password, porta forzatamente l'utente sulla pagina di update
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/update-password';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <UserProvider session={session}>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing Page pubblica */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/termini" element={<TerminiPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/preventivatore/:userId" element={<WidgetWebPage />} />

          {/* Autenticazione */}
          <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/preventivi" />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/onboarding" element={session ? <OnboardingPage /> : <Navigate to="/login" />} />

          {/* Il Configuratore è Pubblico (AppShell + PreventiviPage) */}
          <Route path="/preventivi" element={<AppShell><PreventiviPage /></AppShell>} />

          {/* App SaaS — protetta da login e paywall */}
          <Route path="/dashboard"  element={session ? <ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>  : <Navigate to="/login" />} />
          <Route path="/archivio"   element={session ? <ProtectedRoute><AppShell><ArchivioPage /></AppShell></ProtectedRoute>   : <Navigate to="/login" />} />
          <Route path="/rubrica"    element={session ? <ProtectedRoute><AppShell><RubricaPage /></AppShell></ProtectedRoute>    : <Navigate to="/login" />} />
          <Route path="/ordini"     element={session ? <ProtectedRoute><AppShell><OrdiniPage /></AppShell></ProtectedRoute>     : <Navigate to="/login" />} />
          <Route path="/distinta"   element={session ? <ProtectedRoute><AppShell><DistintaPage /></AppShell></ProtectedRoute>   : <Navigate to="/login" />} />
          <Route path="/scheda-rilievo" element={session ? <ProtectedRoute><AppShell><SchedaRilievoPage /></AppShell></ProtectedRoute> : <Navigate to="/login" />} />
          <Route path="/settings"   element={session ? <ProtectedRoute><AppShell><SettingsPage /></AppShell></ProtectedRoute>   : <Navigate to="/login" />} />
          <Route path="/admin"      element={session ? <AppShell><AdminPage /></AppShell>      : <Navigate to="/login" />} />
          <Route path="/guida"      element={<GuidaPage />} />
          <Route path="/guida/:slug" element={<ArticlePage />} />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] text-white">
              <div className="text-center">
                <h1 className="text-6xl font-black mb-4">404</h1>
                <p className="text-xl text-gray-400 mb-8">Pagina non trovata</p>
                <a href="/" className="text-blue-400 hover:underline">Torna alla home</a>
              </div>
            </div>
          } />
        </Routes>
        </Suspense>
        <Toaster />
        <Analytics />
      </Router>
    </UserProvider>
  );
}

export default App;
