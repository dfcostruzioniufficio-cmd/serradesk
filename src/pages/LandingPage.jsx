import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WindowPreview from '../components/WindowPreview';
import { CheckCircle, XCircle, ArrowRight, ArrowUpRight, ShieldCheck, Clock, TrendingUp, LayoutTemplate, Maximize, DoorOpen, Sun, Square, Calculator, Menu, X } from 'lucide-react';
import SEOManager from '../components/SEOManager';

const TEMPLATES = [
  { id: 'finestra_base', name: 'Finestra Base', desc: '1 o 2 ante, battente classico', icon: <Maximize size={20} /> },
  { id: 'porta_finestra', name: 'Porta Finestra', desc: 'Fino a pavimento, con traverso', icon: <DoorOpen size={20} /> },
  { id: 'scorrevole', name: 'Scorrevole', desc: 'Alzante scorrevole o in linea', icon: <ArrowRight size={20} /> },
  { id: 'porta_blindata', name: 'Porta Blindata', desc: 'Pannello solido di sicurezza', icon: <ShieldCheck size={20} /> },
  { id: 'persiana', name: 'Persiana', desc: 'Finestra o Balcone, stecche orientabili', icon: <Sun size={20} /> },
  { id: 'fisso', name: 'Vetrata Fissa', desc: 'Nessuna apertura, solo telaio e vetro', icon: <Square size={20} /> },
];

const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: 35,
    annualPrice: 350,
    description: "Per chi inizia e vuole preventivi professionali.",
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
    description: "Per chi lavora anche l'officina. Include il motore CAM.",
    badge: 'Più scelto',
    features: [
      { text: 'Preventivi commerciali PDF', included: true },
      { text: 'Logo aziendale sui documenti', included: true },
      { text: 'Archivio materiali', included: true },
      { text: 'Preventivi illimitati', included: true },
      { text: 'Distinta di Taglio CAM', included: true },
    ],
  },
];

const FEATURES = [
  { icon: <Clock size={20} />, title: 'Estrema velocità', desc: 'Un preventivo completo in meno di 2 minuti, tolleranze e sormonti già calcolati.' },
  { icon: <ShieldCheck size={20} />, title: 'Zero errori', desc: 'Prezzi, sconti e IVA calcolati in automatico. Niente più refusi da foglio Excel.' },
  { icon: <TrendingUp size={20} />, title: 'Un disegno, non un numero', desc: 'Il cliente vede l’infisso prima ancora di ordinarlo — decide più in fretta.' },
];

function DimensionLabel({ value, orientation = 'horizontal', className = '' }) {
  const isH = orientation === 'horizontal';
  return (
    <div className={`flex items-center ${isH ? 'flex-row gap-2' : 'flex-col gap-2'} text-[#5b6a67] ${className}`}>
      {isH ? (
        <>
          <span className="w-2 h-2 border-l border-t border-[#9fb0ac] -rotate-45" />
          <span className="flex-1 border-t border-dashed border-[#c3cfcc]" />
          <span className="font-mono text-xs tracking-wide whitespace-nowrap">{value}</span>
          <span className="flex-1 border-t border-dashed border-[#c3cfcc]" />
          <span className="w-2 h-2 border-r border-b border-[#9fb0ac] -rotate-45" />
        </>
      ) : (
        <>
          <span className="w-2 h-2 border-l border-t border-[#9fb0ac] rotate-45" />
          <span className="flex-1 border-l border-dashed border-[#c3cfcc]" />
          <span className="font-mono text-xs tracking-wide [writing-mode:vertical-rl] rotate-180">{value}</span>
          <span className="flex-1 border-l border-dashed border-[#c3cfcc]" />
          <span className="w-2 h-2 border-r border-b border-[#9fb0ac] rotate-45" />
        </>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleStartDemo = () => navigate('/preventivi?demo=1');
  const handleStartTemplate = (templateId) => navigate(`/preventivi?template=${templateId}`);

  return (
    <main className="min-h-screen bg-[#f4f6f5] text-[#14181b] font-sans selection:bg-[#0e6e66]/20">
      <SEOManager title="Software Preventivi e Distinte per Serramentisti" path="/" />

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-[#f4f6f5]/90 backdrop-blur-sm border-b border-[#d7ddda]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="SerraDesk" className="w-8 h-8 rounded object-cover" />
            <span className="font-display font-bold text-lg tracking-tight">SerraDesk</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/guida" className="text-sm text-[#4b5563] hover:text-[#14181b] transition-colors">Guide</Link>
            <Link to="/preventivi" className="text-sm text-[#4b5563] hover:text-[#14181b] transition-colors">Prova il configuratore</Link>
            <Link to="/login" className="text-sm text-[#4b5563] hover:text-[#14181b] transition-colors">Accedi</Link>
            <Link to="/login?mode=signup" className="text-sm font-semibold bg-[#14181b] text-white px-4 py-2 rounded hover:bg-[#0e6e66] transition-colors">
              Prova gratis
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 -mr-2">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#d7ddda] px-6 py-4 flex flex-col gap-4 bg-[#f4f6f5]">
            <Link to="/guida" className="text-sm text-[#4b5563]">Guide</Link>
            <Link to="/preventivi" className="text-sm text-[#4b5563]">Prova il configuratore</Link>
            <Link to="/login" className="text-sm text-[#4b5563]">Accedi</Link>
            <Link to="/login?mode=signup" className="text-sm font-semibold bg-[#14181b] text-white px-4 py-2.5 rounded text-center">Prova gratis</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="font-display font-bold text-[2.75rem] leading-[1.05] tracking-tight mb-6 md:text-6xl">
              Il preventivo si vede,<br />non si legge.
            </h1>
            <p className="text-lg text-[#4b5563] leading-relaxed mb-8 max-w-md">
              Disegni l'infisso, il cliente lo vede com'è davvero, e la distinta di taglio esce pronta per l'officina. Niente più serate su Excel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/preventivi" className="inline-flex items-center justify-center gap-2 bg-[#14181b] text-white font-semibold px-6 py-3.5 rounded hover:bg-[#0e6e66] transition-colors">
                Crea il primo preventivo gratis
                <ArrowRight size={18} />
              </Link>
              <Link to="/guida" className="inline-flex items-center justify-center gap-2 border border-[#c3cfcc] text-[#14181b] font-semibold px-6 py-3.5 rounded hover:border-[#0e6e66] hover:text-[#0e6e66] transition-colors">
                Guarda come funziona
              </Link>
            </div>
            <p className="text-sm text-[#6b7573] mt-6">Nessuna carta richiesta per provare · funziona nel browser</p>
          </div>

          <div className="relative">
            <div className="bg-white border border-[#d7ddda] rounded-sm p-8 md:p-10">
              <DimensionLabel value="1200 mm" orientation="horizontal" className="mb-4" />
              <div className="flex gap-4">
                <div className="flex-1 flex justify-center">
                  <WindowPreview
                    numAnte={2}
                    apertura="Battente"
                    frameColor="Antracite"
                    width={1200}
                    height={1400}
                    handlePosition="right"
                    isExporting={true}
                  />
                </div>
                <DimensionLabel value="1400 mm" orientation="vertical" />
              </div>
            </div>
            <p className="font-mono text-xs text-[#6b7573] mt-3 text-center">Disegno generato dal vero configuratore SerraDesk — non un rendering finto</p>
          </div>
        </div>
      </section>

      {/* TRY IT */}
      <section className="border-y border-[#d7ddda] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-display font-bold text-2xl mb-1">Provalo adesso</h2>
          <p className="text-[#6b7573] mb-8">Nessuna registrazione richiesta.</p>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            <button
              onClick={handleStartDemo}
              className="group flex items-center justify-between p-6 rounded-sm border border-[#d7ddda] hover:border-[#0e6e66] transition-colors text-left"
            >
              <div>
                <h3 className="font-semibold mb-1">Progetto demo</h3>
                <p className="text-sm text-[#6b7573]">Un preventivo già pronto con finestra e persiana, da esplorare.</p>
              </div>
              <ArrowUpRight size={20} className="text-[#9fb0ac] group-hover:text-[#0e6e66] shrink-0 ml-4" />
            </button>
            <button
              onClick={() => navigate('/preventivi')}
              className="group flex items-center justify-between p-6 rounded-sm border border-[#14181b] bg-[#14181b] text-white hover:bg-[#0e6e66] transition-colors text-left"
            >
              <div>
                <h3 className="font-semibold mb-1">Foglio bianco</h3>
                <p className="text-sm text-white/70">Parti da zero e configura il tuo primo serramento.</p>
              </div>
              <ArrowUpRight size={20} className="text-white/60 shrink-0 ml-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4 text-[#6b7573]">
            <LayoutTemplate size={16} />
            <h4 className="text-sm font-semibold uppercase tracking-wide">Oppure parti da una scorciatoia</h4>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleStartTemplate(tpl.id)}
                className="flex items-start gap-3 p-4 rounded-sm border border-[#d7ddda] hover:border-[#0e6e66] transition-colors text-left"
              >
                <span className="shrink-0 text-[#0e6e66] mt-0.5">{tpl.icon}</span>
                <div>
                  <h4 className="font-semibold text-sm mb-0.5">{tpl.name}</h4>
                  <p className="text-xs text-[#6b7573]">{tpl.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#d7ddda] border-y border-[#d7ddda]">
          {[
            ['2 min', 'Tempo per preventivo'],
            ['100%', 'Cloud, nessuna installazione'],
            ['0', 'Errori di calcolo'],
            ['10+', 'Tipologie di infisso'],
          ].map(([n, l], i) => (
            <div key={i} className="text-center py-8 px-2">
              <div className="font-display font-bold text-3xl md:text-4xl mb-1 tabular-nums">{n}</div>
              <div className="text-xs uppercase tracking-wide text-[#6b7573]">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROI */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] uppercase text-[#0e6e66] mb-6">
              <Calculator size={14} /> Il conto, in chiaro
            </span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-5">
              Quanto costa continuare<br />a fare i preventivi su Excel?
            </h2>
            <p className="text-lg text-[#4b5563] leading-relaxed mb-6">
              Un serramentista che rifà a mano tolleranze e sormonti perde in media diverse ore alla settimana, spesso la sera dopo il cantiere.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3 text-[#374151]">
                <CheckCircle size={18} className="text-[#0e6e66] shrink-0 mt-0.5" />
                <span>Recuperi quel tempo per il cantiere o per la famiglia</span>
              </li>
              <li className="flex items-start gap-3 text-[#374151]">
                <CheckCircle size={18} className="text-[#0e6e66] shrink-0 mt-0.5" />
                <span>Mandi il preventivo mentre il cliente è ancora in casa tua</span>
              </li>
              <li className="flex items-start gap-3 text-[#374151]">
                <CheckCircle size={18} className="text-[#0e6e66] shrink-0 mt-0.5" />
                <span>Zero errori di calcolo che ti costano margine</span>
              </li>
            </ul>
            <button onClick={() => navigate('/login?mode=signup')} className="inline-flex items-center gap-2 bg-[#14181b] text-white font-semibold px-6 py-3.5 rounded hover:bg-[#0e6e66] transition-colors">
              Provalo sul tuo prossimo preventivo
            </button>
          </div>

          <div className="bg-white border border-[#d7ddda] rounded-sm p-8">
            <div className="font-mono text-xs uppercase tracking-wide text-[#6b7573] mb-2">Piano Pro</div>
            <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-[#d7ddda]">
              <span className="font-display font-bold text-4xl">€59</span>
              <span className="text-[#9fb0ac]">/ mese</span>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-[#6b7573]">Preventivi generati</span><span className="font-mono">illimitati</span></div>
              <div className="flex justify-between"><span className="text-[#6b7573]">Distinta di taglio inclusa</span><span className="font-mono">sì</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* CONCIERGE ONBOARDING */}
      <section className="border-y border-[#d7ddda] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-4">Non hai tempo di inserire i tuoi listini?</h2>
          <p className="text-[#4b5563] leading-relaxed mb-8 max-w-2xl mx-auto">
            Mandaci il tuo listino Excel o PDF e ti configuriamo l'account chiavi in mano — è la parte più noiosa, ce ne occupiamo noi.
          </p>
          <a
            href="https://wa.me/393924911553"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3.5 rounded hover:bg-[#20bd5a] transition-colors"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Scrivici su WhatsApp
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <h2 className="font-display font-bold text-3xl md:text-4xl mb-12 max-w-xl">
          Tutto il necessario, senza il resto.
        </h2>
        <div className="grid md:grid-cols-3 gap-px bg-[#d7ddda] border border-[#d7ddda]">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white p-8">
              <span className="text-[#0e6e66] mb-4 inline-block">{f.icon}</span>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-[#6b7573] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="border-t border-[#d7ddda] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-12">Il flusso, in tre passaggi.</h2>
          <div className="divide-y divide-[#d7ddda] border-y border-[#d7ddda]">
            {[
              { num: '01', title: 'Imposta i tuoi listini', desc: 'Aggiungi i profili (battente, scorrevole…) e i prezzi al metro quadro. Una volta sola.' },
              { num: '02', title: 'Disegna visivamente', desc: "Scegli la tipologia, inserisci le misure: il disegno tecnico e il prezzo si aggiornano subito." },
              { num: '03', title: 'Stampa e invia', desc: 'Un click per il preventivo commerciale col tuo logo e la distinta di taglio per l’officina.' },
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-10 py-8">
                <div className="font-mono text-sm text-[#9fb0ac] md:w-12 shrink-0">{step.num}</div>
                <h3 className="font-semibold text-lg md:w-64 shrink-0">{step.title}</h3>
                <p className="text-[#6b7573] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">Sblocca tutte le funzioni.</h2>
          <p className="text-lg text-[#6b7573] max-w-xl mx-auto">
            Il configuratore è gratis. Abbonati per il tuo logo sui documenti, l'archivio clienti e la distinta di taglio.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex border border-[#d7ddda] rounded-sm p-1 bg-white">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 text-sm font-semibold rounded-sm transition-colors ${!isAnnual ? 'bg-[#14181b] text-white' : 'text-[#6b7573]'}`}
            >
              Mensile
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 text-sm font-semibold rounded-sm transition-colors flex items-center gap-2 ${isAnnual ? 'bg-[#14181b] text-white' : 'text-[#6b7573]'}`}
            >
              Annuale <span className="text-xs font-mono">−15%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan, i) => (
            <div key={i} className={`relative rounded-sm border p-8 flex flex-col ${i === 1 ? 'border-[#0e6e66] bg-white' : 'border-[#d7ddda] bg-white'}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-8 bg-[#0e6e66] text-white text-xs font-semibold px-3 py-1 rounded-sm">
                  {plan.badge}
                </div>
              )}
              <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
              <p className="text-[#6b7573] text-sm mb-6 h-10">{plan.description}</p>
              <div className="mb-6 pb-6 border-b border-[#d7ddda]">
                <span className="font-display font-bold text-4xl tabular-nums">€{isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                <span className="text-[#6b7573]"> / {isAnnual ? 'anno' : 'mese'}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat, fi) => (
                  <li key={fi} className="flex items-start gap-3 text-sm">
                    {feat.included ? <CheckCircle size={18} className="text-[#0e6e66] shrink-0" /> : <XCircle size={18} className="text-[#c3cfcc] shrink-0" />}
                    <span className={feat.included ? 'text-[#374151]' : 'text-[#9fb0ac]'}>{feat.text}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/login?mode=signup"
                className={`w-full text-center font-semibold py-3.5 rounded-sm transition-colors ${i === 1 ? 'bg-[#0e6e66] hover:bg-[#094a44] text-white' : 'bg-[#14181b] hover:bg-[#0e6e66] text-white'}`}
              >
                Inizia subito
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#14181b] text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-5">
            Il prossimo preventivo, disegnato in 2 minuti.
          </h2>
          <p className="text-white/60 text-lg mb-9 max-w-xl mx-auto">
            Registrati e provalo sul primo cliente vero.
          </p>
          <Link to="/login?mode=signup" className="inline-flex items-center gap-2 bg-white text-[#14181b] font-semibold px-8 py-4 rounded hover:bg-[#dceeec] transition-colors">
            Crea il tuo account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#f4f6f5] border-t border-[#d7ddda]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SerraDesk" className="w-6 h-6 rounded object-cover" />
            <span className="font-display font-bold">SerraDesk</span>
            <span className="text-[#9fb0ac] text-sm ml-2">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#6b7573]">
            <Link to="/termini" className="hover:text-[#14181b] transition-colors">Termini di Servizio</Link>
            <Link to="/privacy" className="hover:text-[#14181b] transition-colors">Privacy Policy</Link>
            <Link to="/login" className="hover:text-[#14181b] transition-colors">Accedi</Link>
            <a href="mailto:info@serradesk.it" className="hover:text-[#14181b] transition-colors">Supporto</a>
          </div>
        </div>
      </footer>

      {/* WHATSAPP FLOATING BUTTON */}
      <a
        href="https://wa.me/393924911553"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        aria-label="Scrivici su WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
      </a>
    </main>
  );
}
