import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WindowPreview from '../components/WindowPreview';
import { WebGLShader } from '../components/WebGLShader';
import { CheckCircle, XCircle, Zap, FileText, Scissors, Users, ArrowRight, Star, ShieldCheck, Clock, TrendingUp, Play, LayoutTemplate, Maximize, DoorOpen, Sun, Square, PlayCircle, Quote, Calculator } from 'lucide-react';
import SEOManager from '../components/SEOManager';

const TEMPLATES = [
  {
    id: 'finestra_base',
    name: 'Finestra Base',
    desc: '1 o 2 ante, battente classico',
    icon: <Maximize size={24} className="text-blue-400" />,
    color: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50'
  },
  {
    id: 'porta_finestra',
    name: 'Porta Finestra',
    desc: 'Fino a pavimento, con traverso',
    icon: <DoorOpen size={24} className="text-indigo-400" />,
    color: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/50'
  },
  {
    id: 'scorrevole',
    name: 'Scorrevole',
    desc: 'Alzante scorrevole o in linea',
    icon: <ArrowRight size={24} className="text-violet-400" />,
    color: 'bg-violet-500/10 border-violet-500/20 hover:border-violet-500/50'
  },
  {
    id: 'porta_blindata',
    name: 'Porta Blindata',
    desc: 'Pannello solido di sicurezza',
    icon: <ShieldCheck size={24} className="text-emerald-400" />,
    color: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50'
  },
  {
    id: 'persiana',
    name: 'Persiana',
    desc: 'Finestra o Balcone, stecche orientabili',
    icon: <Sun size={24} className="text-amber-400" />,
    color: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50'
  },
  {
    id: 'fisso',
    name: 'Vetrata Fissa',
    desc: 'Nessuna apertura, solo telaio e vetro',
    icon: <Square size={24} className="text-slate-400" />,
    color: 'bg-slate-500/10 border-slate-500/20 hover:border-slate-500/50'
  }
];

const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: 35,
    annualPrice: 350,
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
    description: 'Per i professionisti seri. Include il potente motore CAM per l\'officina.',
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

const FEATURES = [
  {
    icon: <Clock size={24} className="text-blue-400" />,
    title: 'Estrema Velocità',
    desc: 'Crea un preventivo complesso in meno di 2 minuti. Il tempo è denaro, e noi te ne facciamo risparmiare tantissimo.',
  },
  {
    icon: <Scissors size={24} className="text-violet-400" />,
    title: 'Taglio di Precisione',
    desc: 'Il motore CAM matematico elabora le distinte di taglio al millimetro in base ai tuoi profili e tolleranze.',
  },
  {
    icon: <ShieldCheck size={24} className="text-emerald-400" />,
    title: 'Zero Errori',
    desc: 'Prezzi, sconti, IVA e misure calcolati automaticamente. Dimentica gli errori dei fogli Excel.',
  },
  {
    icon: <TrendingUp size={24} className="text-amber-400" />,
    title: 'Aumenta le Vendite',
    desc: 'Presenta ai tuoi clienti preventivi visivi, eleganti e professionali che ispirano fiducia immediata.',
  },
];

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();

  const handleStartDemo = () => {
    navigate('/preventivi?demo=1');
  };

  const handleStartTemplate = (templateId) => {
    navigate(`/preventivi?template=${templateId}`);
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden">
      <SEOManager title="Software Preventivi e Distinte per Serramentisti" path="/" />

      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-emerald-600/5 rounded-full blur-[150px]" />
        {/* Subtle Grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      </div>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#070b14]/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 p-[1px] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-500">
              <div className="w-full h-full bg-[#070b14] rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="SerraDesk" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight hidden sm:block text-white">
              Serra<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Desk</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/guida" className="hidden md:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Risorse & Guide</Link>
            <Link to="/login" className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Accedi</Link>
            <Link to="/login?mode=signup" className="text-sm font-bold bg-white text-slate-900 hover:bg-slate-200 px-5 py-2.5 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Prova Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-40 pb-32 px-6 min-h-[90vh] flex flex-col justify-center items-center text-center overflow-hidden border-b border-white/5">
        
        {/* SHADER BACKGROUND */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
          <WebGLShader />
          {/* Gradient fade out at the bottom to blend with the next section */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#070b14]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 animate-fade-in-up">
            <Star size={14} fill="currentColor" /> Il software cloud per serramentisti
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight mb-8 text-white">
            Preventivi perfetti.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
              Zero stress.
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Smetti di perdere le serate sui fogli Excel. Disegna gli infissi, calcola i prezzi e genera distinte di taglio in pochi minuti.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link to="/preventivi" className="group relative flex items-center justify-center gap-3 bg-white text-slate-900 font-black px-8 py-4 rounded-full text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] w-full sm:w-auto">
              Crea il tuo primo preventivo gratis
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/guida" className="flex items-center justify-center gap-2 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all border border-white/10 hover:bg-white/5 w-full sm:w-auto">
              Guarda come funziona
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-8 mb-16 font-medium">100% Cloud • Nessuna installazione • Nessuna carta richiesta per provare</p>


        </div>
      </section>
          
      {/* PLAYGROUND & TEMPLATES SECTON (DASHBOARD) */}
      <section className="relative py-24 px-6 bg-[#070b14]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
              <Zap size={24} className="text-amber-400" /> Provalo gratis ora (nessuna registrazione richiesta)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
              <button 
                onClick={handleStartDemo}
                className="group relative flex items-center justify-between p-8 rounded-3xl bg-[#0d1424] border border-white/10 overflow-hidden transition-all hover:bg-[#131c31] hover:border-white/20 hover:scale-[1.02] text-left"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                    <Play size={24} className="text-emerald-400 ml-1" fill="currentColor" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Guarda un Progetto Demo</h3>
                  <p className="text-slate-400 font-medium">Esplora un preventivo pre-compilato con finestra e persiana.</p>
                </div>
                <ArrowRight size={32} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-2 transition-all relative z-10" />
              </button>

              <button 
                onClick={() => navigate('/preventivi')}
                className="group relative flex items-center justify-between p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-indigo-700/20 border border-blue-500/30 overflow-hidden transition-all hover:bg-blue-600/30 hover:border-blue-500/50 hover:scale-[1.02] text-left"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
                    <FileText size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Foglio Bianco</h3>
                  <p className="text-slate-400 font-medium">Inizia da zero e configura il tuo primo serramento.</p>
                </div>
                <ArrowRight size={32} className="text-blue-500/50 group-hover:text-blue-400 group-hover:translate-x-2 transition-all relative z-10" />
              </button>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-6 justify-center">
                <LayoutTemplate size={20} className="text-slate-500" />
                <h4 className="text-lg font-semibold text-slate-400">Oppure parti da una scorciatoia:</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleStartTemplate(tpl.id)}
                    className={`flex items-start gap-4 p-5 rounded-2xl border bg-[#0a101d]/80 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg text-left ${tpl.color}`}
                  >
                    <div className="shrink-0 p-3 bg-[#070b14] rounded-xl border border-white/5">
                      {tpl.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{tpl.name}</h4>
                      <p className="text-sm text-slate-400">{tpl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
        </div>
      </section>

      {/* METRICS / TRUST */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">2min</div>
              <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Tempo per preventivo</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">100%</div>
              <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Cloud Based</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">0</div>
              <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Errori di calcolo</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">10+</div>
              <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Tipologie Infissi</div>
            </div>
          </div>
        </div>
      </section>
      {/* NEW SECTION: ROI CALCULATOR */}
      <section className="py-24 px-6 relative z-10 bg-[#070b14]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              <Calculator size={14} /> Il software che si ripaga da solo
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
              Quanto ti costa <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">non usare</span> Serradesk?
            </h2>
            <p className="text-xl text-slate-400 font-light mb-8 leading-relaxed">
              In media, un serramentista perde <strong className="text-white font-bold">10 ore a settimana</strong> a fare preventivi la sera dopo il cantiere o nel weekend.
            </p>
            <ul className="space-y-4 mb-8 text-slate-300">
              <li className="flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                <span>Risparmi 40 ore di lavoro al mese</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                <span>Se il tuo tempo vale 30€/h, sono <strong className="text-white">1.200€ risparmiati</strong></span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                <span>Mandi il preventivo prima della concorrenza</span>
              </li>
            </ul>
            <button onClick={() => navigate('/login?mode=signup')} className="bg-emerald-500 text-slate-900 font-bold px-8 py-3 rounded-full hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              Inizia a risparmiare tempo
            </button>
          </div>
          <div className="flex-1 w-full max-w-sm mx-auto">
            <div className="bg-[#0a101d] rounded-3xl p-8 border border-white/5 relative shadow-2xl">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/20 rounded-full blur-[30px]"></div>
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-2 font-medium uppercase tracking-wider">Il tuo ROI stimato</div>
                <div className="text-5xl font-black text-white mb-6">+1.200€<span className="text-lg text-slate-500 font-normal">/mese</span></div>
                <div className="h-px w-full bg-white/10 mb-6"></div>
                <div className="text-sm text-slate-400">Costo di Serradesk: <strong className="text-white line-through opacity-50">1.200€</strong> <strong className="text-emerald-400">59€/mese</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: SOCIAL PROOF */}
      <section className="py-24 px-6 relative z-10 bg-gradient-to-b from-[#070b14] to-[#0a101d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              I colleghi che hanno già svoltato
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Centinaia di serramentisti e produttori hanno già abbandonato Excel.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: "Prima passavo i weekend su Excel a calcolare tolleranze e sormonti. Oggi genero i preventivi e le distinte dal furgone in 3 minuti. Mi ha svoltato la vita.", author: "Marco T.", role: "Titolare Serramenti" },
              { text: "L'ho provato per disperazione dopo un errore di calcolo da 1.500€ su una veranda. Non sbaglia un colpo, calcola IVA, sconti e profili alla perfezione.", author: "Luca S.", role: "Installatore" },
              { text: "I miei clienti sono stupiti. Mando loro un preventivo in PDF bellissimo e professionale mentre sono ancora nel loro salotto a prendere il caffè.", author: "Andrea M.", role: "Agente di Vendita" },
            ].map((review, i) => (
              <div key={i} className="bg-[#070b14] p-8 rounded-3xl border border-white/5 relative">
                <Quote size={40} className="text-blue-500/20 absolute top-6 right-6" />
                <div className="flex text-amber-400 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-slate-300 font-light mb-8 italic">"{review.text}"</p>
                <div>
                  <div className="font-bold text-white">{review.author}</div>
                  <div className="text-sm text-slate-500">{review.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DONE FOR YOU ONBOARDING */}
      <section className="py-24 px-6 relative z-10 bg-gradient-to-b from-[#070b14] to-blue-950/10">
        <div className="max-w-4xl mx-auto border border-blue-500/20 bg-blue-900/10 p-8 md:p-12 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 relative z-10">
            Non hai tempo per inserire i tuoi listini?
          </h2>
          <p className="text-xl text-slate-300 font-light mb-8 max-w-2xl mx-auto relative z-10">
            Sappiamo che la configurazione iniziale è la parte più noiosa. 
            Mettici alla prova: <strong className="text-white">mandaci il tuo listino Excel/PDF</strong> e ci pensiamo noi a configurare il tuo account chiavi in mano.
          </p>
          <a href="https://wa.me/393924911553" target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-8 py-4 rounded-full text-lg transition-all hover:scale-105 hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Scrivici su WhatsApp
          </a>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Tutto il necessario,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">senza la complessità.</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Abbiamo eliminato il superfluo per offrirti un'esperienza di lavoro fluida, intuitiva e incredibilmente veloce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="group bg-[#0a101d] border border-white/5 rounded-3xl p-8 hover:bg-[#0d1424] hover:border-white/10 transition-all duration-300">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-300">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
                <p className="text-slate-400 text-lg leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent to-blue-950/20 relative z-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Come funziona il flusso?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Un processo lineare disegnato per farti risparmiare tempo ad ogni passo.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { num: '01', title: 'Imposta i tuoi listini', desc: 'Aggiungi i tuoi sistemi di profili (battente, scorrevole) e i prezzi al metro quadro. Lo fai una volta sola.' },
              { num: '02', title: 'Disegna visivamente', desc: 'Seleziona le tipologie, inserisci le misure e configura l\'infisso. Il disegno tecnico e il prezzo si generano in tempo reale.' },
              { num: '03', title: 'Stampa e Invia', desc: 'Con un click ottieni il Preventivo Commerciale brandizzato per il cliente e la Distinta di Taglio tecnica per l\'officina.' }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 bg-[#0a101d] border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-colors">
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5 select-none">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-lg font-light leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Sblocca tutte le funzionalità.
            </h2>
            <p className="text-xl text-slate-400 max-w-xl mx-auto font-light">
              Il motore di disegno è gratis. Abbonati per aggiungere il tuo logo, salvare i clienti (CRM) e accedere alle distinte di taglio.
            </p>
          </div>

          <div className="flex justify-center mb-16">
            <div className="bg-[#0a101d] p-1.5 rounded-2xl inline-flex border border-white/5">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-8 py-3 text-sm font-bold rounded-xl transition-all ${!isAnnual ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Mensile
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-8 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${isAnnual ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Annuale <span className={`text-xs px-2 py-0.5 rounded-full font-black ${isAnnual ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'}`}>-15%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => (
              <div key={i} className={`relative rounded-3xl border ${i === 1 ? 'border-blue-500/30 bg-gradient-to-b from-blue-900/20 to-[#0a101d] md:-translate-y-4 shadow-[0_20px_50px_rgba(59,130,246,0.1)]' : 'border-white/5 bg-[#0a101d]'} p-8 flex flex-col`}>
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-xs font-black px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg shadow-blue-500/30">
                    {plan.badge}
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-8 h-10">{plan.description}</p>
                
                <div className="mb-8 pb-8 border-b border-white/5">
                  <div className="flex flex-col gap-1">
                    {!isAnnual ? (
                      <div className="flex items-baseline gap-1 mt-6">
                        <span className="text-5xl font-black text-white">€{plan.monthlyPrice}</span>
                        <span className="text-slate-500 font-medium">/ mese</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1 mt-6">
                        <span className="text-5xl font-black text-white">€{plan.annualPrice}</span>
                        <span className="text-slate-500 font-medium">/ anno</span>
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-3 text-sm font-medium">
                      {feat.included
                        ? <CheckCircle size={20} className="text-blue-400 shrink-0" />
                        : <XCircle size={20} className="text-slate-700 shrink-0" />
                      }
                      <span className={feat.included ? 'text-slate-300' : 'text-slate-600'}>{feat.text}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/login?mode=signup" className={`w-full text-center font-bold py-4 rounded-xl transition-all ${i === 1 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                  Inizia Subito
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-blue-600 to-violet-800 p-10 md:p-16 text-center relative overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)]">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Pronto a rivoluzionare<br />il tuo lavoro?
            </h2>
            <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto font-light">
              Registrati ora e crea il tuo primo preventivo professionale in meno di 5 minuti.
            </p>
            <Link to="/login?mode=signup" className="inline-flex items-center gap-2 bg-white text-slate-900 font-black px-10 py-5 rounded-full text-lg transition-all hover:scale-105 shadow-2xl">
              Crea il tuo account ora <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#04070d] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 font-black text-white text-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Scissors size={14} className="text-white" />
              </div>
              SerraDesk
            </div>
            <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} SerraDesk. Tutti i diritti riservati.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/termini" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Termini di Servizio</Link>
            <Link to="/privacy" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Privacy Policy</Link>
            <Link to="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Accedi</Link>
            <a href="mailto:info@serradesk.it" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Supporto</a>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP BUTTON */}
      <a 
        href="https://wa.me/393924911553" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform flex items-center justify-center group"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        <div className="absolute right-full mr-4 bg-white text-slate-800 text-sm font-bold py-2 px-4 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Serve aiuto? Scrivici!
        </div>
      </a>
    </main>
  );
}
