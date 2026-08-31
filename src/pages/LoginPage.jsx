import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, ArrowLeft, Scissors } from 'lucide-react';

export default function LoginPage() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(() => {
    return new URLSearchParams(location.search).get('mode') === 'signup';
  });
  const [isReset, setIsReset] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isReset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        setMessage('Controlla la tua email per il link di recupero della password.');
      } else if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Registrazione completata! Controlla la tua email per confermare l\'account (se richiesto) oppure fai il login.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // The App component will catch the auth state change and re-render
      }
    } catch (err) {
      setError(err.message || 'Si è verificato un errore.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')", backgroundBlendMode: 'overlay', backgroundColor: 'rgba(255,255,255,0.9)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          {/* Logo SerraDesk */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/logo.png" alt="SerraDesk" className="w-10 h-10 rounded-xl shadow-lg" />
            <span className="text-2xl font-black tracking-tight text-gray-900">SerraDesk</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {isReset ? 'Recupera Password' : isSignUp ? 'Crea il tuo account' : 'Bentornato!'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isReset ? 'Inserisci la tua email e ti invieremo un link per creare una nuova password.' : isSignUp ? 'Crea il tuo account in pochi secondi.' : 'Accedi per continuare a lavorare.'}
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-12 bg-gray-50 px-3"
                  placeholder="tuo@indirizzo.com"
                />
              </div>
            </div>
            
            {!isReset && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-12 bg-gray-50 px-3"
                  placeholder="••••••••"
                />
              </div>
              
              
              {!isSignUp && (
                <div className="flex items-center justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => { setIsReset(true); setError(null); setMessage(null); }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
                  >
                    Hai dimenticato la password?
                  </button>
                </div>
              )}
            </div>
            )}
            
            {isSignUp && (
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700">
                    Accetto le condizioni legali
                  </label>
                  <p className="text-gray-500 text-xs mt-1">
                    Creando un account, dichiaro di aver letto e accettato i{' '}
                    <Link to="/termini" className="text-blue-600 hover:underline" target="_blank">Termini di Servizio</Link>{' '}
                    e la{' '}
                    <Link to="/privacy" className="text-blue-600 hover:underline" target="_blank">Privacy Policy</Link>.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {message && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                <p className="text-sm text-green-700">{message}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || (isSignUp && !acceptedTerms)}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    {isReset ? 'Invia Link' : isSignUp ? 'Registrati' : 'Accedi'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                if (isReset) { setIsReset(false); }
                else { setIsSignUp(!isSignUp); }
                setError(null);
                setMessage(null);
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
            >
              {isReset ? 'Torna al Login' : isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati gratuitamente'}
            </button>
          </div>
        </div>
        {/* Link torna alla homepage */}
        <div className="text-center mt-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={14} /> Torna alla homepage
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          &copy; {new Date().getFullYear()} SerraDesk. Tutti i diritti riservati.
        </p>
      </div>
    </div>
  );
}
