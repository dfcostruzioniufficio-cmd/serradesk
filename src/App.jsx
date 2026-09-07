import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Route, Routes, BrowserRouter as Router, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop';
import LandingPage from './pages/LandingPage';
import PreventiviPage from './pages/PreventiviPage';
import ArchivioPage from './pages/ArchivioPage';
import OrdiniPage from './pages/OrdiniPage';
import RubricaPage from './pages/RubricaPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import AdminPage from './pages/AdminPage';
import PaywallPage from './pages/PaywallPage';
import GuidaPage from './pages/GuidaPage';
import ArticlePage from './pages/ArticlePage';
import DistintaPage from './pages/DistintaPage';
import TerminiPage from './pages/TerminiPage';
import PrivacyPage from './pages/PrivacyPage';
import OnboardingPage from './pages/OnboardingPage';
import WidgetWebPage from './pages/WidgetWebPage';
import AppShell from './components/AppShell';
import { supabase } from './lib/supabaseClient';
import { UserProvider, useUser } from './contexts/UserContext';

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
        <Toaster />
        <Analytics />
      </Router>
    </UserProvider>
  );
}

export default App;
