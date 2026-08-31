import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, XCircle, LogOut, Scissors } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: 35,
    annualPrice: 350,
    stripeLinkMonthly: 'https://buy.stripe.com/28EcN533C5Wi7BXgam4c806',
    stripeLinkAnnual: 'https://buy.stripe.com/4gMcN533CckG1dzgam4c807',
    description: 'Per chi inizia e vuole professionalizzare i propri preventivi.',
    color: 'from-slate-500 to-slate-700',
    badge: null,
    features: [
      { text: 'Preventivi commerciali PDF', included: true },
      { text: 'Logo aziendale sui documenti', included: true },
      { text: 'Archivio materiali', included: true },
      { text: 'Preventivi illimitati', included: true },
      { text: 'Distinta di Taglio CAM', included: false },
    ],
  },
  {
    name: 'Pro',
    monthlyPrice: 59,
    annualPrice: 590,
    stripeLinkMonthly: 'https://buy.stripe.com/28EaEX8nWgAWf4p9LY4c802',
    stripeLinkAnnual: 'https://buy.stripe.com/eVq3cvfQo98u4pL3nA4c803',
    description: 'Per i professionisti seri. Include il potente motore CAM.',
    color: 'from-blue-600 to-indigo-700',
    badge: 'Più popolare',
    features: [
      { text: 'Preventivi commerciali PDF', included: true },
      { text: 'Logo aziendale sui documenti', included: true },
      { text: 'Archivio materiali', included: true },
      { text: 'Preventivi illimitati', included: true },
      { text: 'Distinta di Taglio CAM', included: true },
    ],
  },
];

export default function PaywallPage() {
  const { userProfile } = useUser();
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans flex flex-col items-center">
      
      {/* HEADER NAV */}
      <nav className="w-full fixed top-0 left-0 right-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SerraDesk" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-black tracking-tight">SerraDesk</span>
          </div>
          <button 
            onClick={async () => {
              localStorage.removeItem('sd_draft_preventivo');
              sessionStorage.removeItem('df_load_ordine');
              await supabase.auth.signOut();
            }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Esci dall'account
          </button>
        </div>
      </nav>

      <div className="pt-32 pb-16 px-6 max-w-5xl mx-auto w-full flex-grow flex flex-col justify-center">
        
        {/* MESSAGE */}
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-500/20 text-blue-400 font-bold px-5 py-2 rounded-full mb-6 border border-blue-500/30 animate-pulse">
            Promozione attiva: Contattaci per sbloccare il 1° mese a soli 5€!
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Scegli il tuo piano
          </h1>
          <p className="text-xl text-gray-400">
            Sblocca l'accesso completo a SerraDesk. Nessun vincolo, disdici quando vuoi.
          </p>
        </div>

        {/* TOGGLE MESE / ANNO */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/10 p-1 rounded-xl inline-flex border border-white/10 gap-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${!isAnnual ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Fatturazione Mensile
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${isAnnual ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Fatturazione Annuale <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">2 mesi GRATIS</span>
            </button>
          </div>
        </div>

        {/* PRICING TABLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan, i) => (
            <div key={i} className={`relative rounded-2xl border ${i === 1 ? 'border-blue-500/50 bg-gradient-to-b from-blue-950/50 to-[#0a0f1e] scale-105' : 'border-white/10 bg-white/5'} p-8 flex flex-col`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                
                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black">€{isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                    <span className="text-gray-400 mb-1">/{isAnnual ? 'anno' : 'mese'}</span>
                  </div>
                  {isAnnual && (
                    <div className="text-emerald-400 text-sm font-medium mt-1">
                      Risparmi €{(plan.monthlyPrice * 12) - plan.annualPrice} all'anno
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-sm">
                      {feat.included
                        ? <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                        : <XCircle size={18} className="text-gray-600 shrink-0" />
                      }
                      <span className={feat.included ? 'text-gray-200' : 'text-gray-500'}>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
                <button 
                  className={`mt-auto text-center font-bold py-4 rounded-xl transition-all ${i === 1 ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/25' : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'}`}
                  onClick={() => {
                    const baseUrl = isAnnual ? plan.stripeLinkAnnual : plan.stripeLinkMonthly;
                    // Note: If URL already has ?, we should append with & instead of ?.
                    // ma in questo caso Stripe supporta un parametro client_reference_id
                    const separator = baseUrl.includes('?') ? '&' : '?';
                    const checkoutUrl = `${baseUrl}${separator}client_reference_id=${userProfile?.user_id || ''}`;
                    window.location.href = checkoutUrl;
                  }}
                >
                  {isAnnual ? `Scegli ${plan.name} Annuale` : `Scegli ${plan.name} Mensile`}
                </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
