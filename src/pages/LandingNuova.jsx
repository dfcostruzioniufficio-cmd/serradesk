import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowRight, Check, X, PencilRuler, Euro, FileText, Archive, Smartphone, Thermometer } from 'lucide-react';
import WindowPreview from '../components/WindowPreview';
import SEOManager from '../components/SEOManager';

/**
 * Pagina iniziale "ad effetto", sul modello del sito di DF Costruzioni: il
 * preventivo si costruisce mentre si scorre (sei capitoli), poi il visitatore
 * prova da solo il disegno e il prezzo. Il disegno e' quello vero del
 * configuratore (WindowPreview), non un'immagine.
 *
 * Non tocca accessi, iscrizione, prezzi o configuratore: porta solo alle
 * pagine che esistono gia' (/preventivi, /login, /guida, /termini, /privacy).
 */

// Gli stessi piani e le stesse voci della pagina iniziale attuale.
const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: 35,
    annualPrice: 350,
    description: 'Per chi inizia e vuole preventivi professionali.',
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

const CAPITOLI = [
  { n: '01', titolo: 'Il modello', testo: 'Un tocco su "2 ante" e il serramento è già disegnato, con le aperture giuste.' },
  { n: '02', titolo: 'Le misure', testo: 'Scrivi larghezza e altezza: il disegno si adatta e le quote sono quelle vere.' },
  { n: '03', titolo: 'Profilo e colore', testo: 'Il sistema del tuo archivio, il colore, il vetro. E la trasmittanza Uw, calcolata.' },
  { n: '04', titolo: 'Il prezzo', testo: 'Esce dal tuo listino: al metro quadro, al metro o a pezzo. Niente calcolatrice.' },
  { n: '05', titolo: 'Il PDF', testo: 'Logo, numero progressivo, disegni e totale: il preventivo è pronto da mandare.' },
  { n: '06', titolo: 'Inviato', testo: 'Dal telefono, anche in cantiere. Il cliente vede il serramento prima ancora di ordinarlo.' },
];

// Scuro per i momenti "cinema" (apertura, racconto, finale): un blu vivo che
// sfuma verso il viola del logo, non nero. Chiaro per provare e scegliere.
const C = {
  notte: '#0F1838',
  notte2: '#18224A',
  bordo: '#2B3766',
  testo: '#E8ECF6',
  tenue: '#9AA3B8',
  blu: '#3B82F6',
  viola: '#8B5CF6',
};
const GRAD = `linear-gradient(90deg, ${C.blu}, ${C.viola})`;
const SCURO = 'linear-gradient(180deg, #111B42 0%, #0F1838 55%, #1A1A4A 100%)';
const L = {
  sfondo: '#F4F7FC',
  carta: '#FFFFFF',
  campo: '#F8FAFD',
  testo: '#0F1838',
  tenue: '#5B6478',
  bordo: '#E1E7F2',
};

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, t) => a + (b - a) * t;
const euro = (n) => '€ ' + n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mm = (n) => Math.round(n).toLocaleString('it-IT');

// Quanto si e' scesi dentro una sezione alta: 0 quando entra in cima, 1 quando
// la sua fine arriva in fondo allo schermo.
function useProgresso(ref) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const calcola = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const corsa = r.height - window.innerHeight;
      setP(corsa > 0 ? clamp01(-r.top / corsa) : 0);
    };
    const pianifica = () => { if (!raf) raf = requestAnimationFrame(calcola); };
    calcola();
    window.addEventListener('scroll', pianifica, { passive: true });
    window.addEventListener('resize', pianifica);
    return () => {
      window.removeEventListener('scroll', pianifica);
      window.removeEventListener('resize', pianifica);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
  return p;
}

// Comparsa morbida quando un blocco entra nello schermo.
function Compare({ children, ritardo = 0, className = '' }) {
  const ref = useRef(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisto(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisto(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`sd-compare ${visto ? 'sd-visto' : ''} ${className}`}
      style={{ transitionDelay: `${ritardo}ms` }}
    >
      {children}
    </div>
  );
}

// La finestra vera del configuratore, ingrandita: e' un SVG, resta nitida.
function Finestra({ scala, ...props }) {
  return (
    <div style={{ transform: `scale(${scala})`, transformOrigin: 'center center' }}>
      <WindowPreview isExporting {...props} />
    </div>
  );
}

function Chip({ attivo, children }) {
  return (
    <span
      className="px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-colors duration-300"
      style={attivo
        ? { background: GRAD, color: '#fff' }
        : { border: `1px solid ${C.bordo}`, background: 'rgba(255,255,255,0.04)', color: C.tenue }}
    >
      {children}
    </span>
  );
}

function Pannello({ children, style }) {
  return (
    <div
      className="rounded-2xl px-4 py-3 md:px-5 md:py-4 backdrop-blur-md"
      style={{ background: 'rgba(18,25,51,0.82)', border: `1px solid ${C.bordo}`, boxShadow: '0 20px 50px rgba(0,0,0,0.35)', ...style }}
    >
      {children}
    </div>
  );
}

// ---------- Prima schermata: il telefono che fa un preventivo da solo ----------

// Secondi dall'apertura, aggiornati a ogni fotogramma. Con "riduci movimento"
// resta fermo su un momento in cui si vede tutto.
function useOrologio(fermo = 4.6) {
  const [t, setT] = useState(fermo);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const t0 = performance.now();
    // Il primo fotogramma puo' avere un orario di poco precedente a t0.
    const giro = (ora) => { setT(Math.max(0, (ora - t0) / 1000)); raf = requestAnimationFrame(giro); };
    raf = requestAnimationFrame(giro);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

const GIRO = 11; // secondi di un preventivo
const ESEMPI = [
  { modello: '2 ante', numAnte: 2, w: 1480, h: 1540, colore: 'Antracite', prezzo: 1025.64, mq: '2,28', listino: 450, tot: '4.102,56', qta: 4 },
  { modello: 'PF 2 ante', numAnte: 2, w: 1170, h: 2200, colore: 'Bianco', prezzo: 1158.30, mq: '2,57', listino: 450, tot: '1.158,30', qta: 1 },
  { modello: '1 anta', numAnte: 1, w: 900, h: 1300, colore: 'Noce', prezzo: 526.50, mq: '1,17', listino: 450, tot: '1.053,00', qta: 2 },
];
const fase = (t, a, b) => clamp01((t - a) / (b - a));

function Onda({ attiva }) {
  if (!attiva) return null;
  return <span className="absolute inset-0 rounded-[inherit] sd-onda" />;
}

function Telefono() {
  const ora = useOrologio();
  const n = Math.floor(ora / GIRO);
  const t = ora - n * GIRO;
  const es = ESEMPI[((n % ESEMPI.length) + ESEMPI.length) % ESEMPI.length];

  const scelto = t > 0.9;
  const scriviL = Math.floor(fase(t, 1.3, 2.0) * 4);
  const scriviH = Math.floor(fase(t, 2.1, 2.8) * 4);
  const disegno = fase(t, 2.6, 3.4);
  const prezzo = lerp(0, es.prezzo, fase(t, 3.6, 4.6));
  const aggiunto = t > 5.3;
  const pdf = fase(t, 6.0, 6.7) * (1 - fase(t, 10.2, 10.8));
  const inviato = t > 8.6 && t < 10.4;
  const svanisce = 1 - fase(t, 10.6, 11);

  const L = String(es.w).slice(0, scriviL);
  const H = String(es.h).slice(0, scriviH);

  return (
    <div className="relative" style={{ opacity: Math.max(0.15, svanisce), transition: 'opacity .2s' }}>
      {/* schede che galleggiano intorno */}
      <div className="hidden lg:block absolute z-20 left-0 xl:-left-4 top-24 sd-galleggia" style={{ opacity: fase(t, 4.0, 4.6) * svanisce }}>
        <Pannello><div className="text-[11px]" style={{ color: C.tenue }}>Dal tuo listino</div><div className="font-display font-bold text-xl tabular-nums" style={{ color: C.testo }}>{euro(es.prezzo)}</div></Pannello>
      </div>
      <div className="hidden lg:block absolute z-20 right-0 xl:-right-6 top-56 sd-galleggia-2" style={{ opacity: fase(t, 3.2, 3.8) * svanisce }}>
        <Pannello><div className="text-[11px]" style={{ color: C.tenue }}>Trasmittanza</div><div className="font-display font-bold text-lg" style={{ color: C.testo }}>Uw 1,60 W/m²K</div></Pannello>
      </div>
      <div className="hidden lg:block absolute z-20 left-0 xl:-left-6 bottom-28 sd-galleggia-2" style={{ opacity: fase(t, 6.4, 7.0) * svanisce }}>
        <Pannello><div className="text-[11px]" style={{ color: C.tenue }}>PDF pronto</div><div className="font-display font-bold text-lg" style={{ color: C.testo }}>n. 19/2026</div></Pannello>
      </div>

      {/* il telefono */}
      <div className="relative w-[260px] h-[540px] md:w-[290px] md:h-[600px] rounded-[44px] p-[10px] mx-auto"
        style={{ background: 'linear-gradient(145deg,#2A3354,#121933)', boxShadow: '0 40px 90px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
        <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-[#F4F6FA] text-[#0B1020]">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-[#0B1020] z-20" />
          <div className="pt-11 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5"><img src="/logo.png" alt="" className="w-5 h-5 rounded" /><span className="text-[12px] font-bold">SerraDesk</span></div>
              <span className="text-[10px] text-gray-500">Preventivo · Rossi</span>
            </div>

            <div className="mt-4 text-[9px] font-bold uppercase tracking-wider text-gray-400">Che cos'è</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {['1 anta', '2 ante', '3 ante', 'PF 2 ante'].map((m) => {
                const on = scelto && m === es.modello;
                return (
                  <span key={m} className="relative px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                    style={on ? { background: GRAD, color: '#fff' } : { background: '#fff', border: '1px solid #E3E7F0' }}>
                    {m}<Onda attiva={m === es.modello && t > 0.75 && t < 1.25} />
                  </span>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {[['Larghezza', L, t > 1.2 && t < 2.05], ['Altezza', H, t > 2.05 && t < 2.9]].map(([lab, v, attivo]) => (
                <div key={lab}>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{lab}</div>
                  <div className="mt-1 h-8 rounded-lg bg-white px-2 flex items-center text-[13px] font-bold tabular-nums"
                    style={{ border: `1.5px solid ${attivo ? C.blu : '#E3E7F0'}` }}>
                    {v}{attivo && <span className="sd-cursore ml-px" style={{ color: C.blu }}>|</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 h-[190px] md:h-[220px] rounded-xl bg-white flex items-center justify-center overflow-hidden" style={{ border: '1px solid #E3E7F0' }}>
              <div style={{ opacity: disegno, transform: `scale(${0.75 + disegno * 0.2})` }}>
                <WindowPreview isExporting numAnte={es.numAnte} apertura="Battente" frameColor={es.colore} width={es.w} height={es.h} handlePosition="right" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-[9px] text-gray-500">{es.mq} m² × {es.listino} €/m²</div>
                <div className="text-[18px] font-extrabold tabular-nums">{euro(prezzo)}</div>
              </div>
              <span className="relative px-3 py-2 rounded-lg text-[11px] font-bold text-white" style={{ background: aggiunto ? '#16A34A' : GRAD }}>
                {aggiunto ? 'Aggiunto ✓' : 'Aggiungi'}<Onda attiva={t > 5.1 && t < 5.6} />
              </span>
            </div>
          </div>

          {/* il PDF che sale */}
          <div className="absolute inset-x-0 bottom-0 top-9 px-3 pb-3 z-10" style={{ transform: `translateY(${(1 - pdf) * 105}%)` }}>
            <div className="h-full rounded-2xl bg-white shadow-2xl p-4 flex flex-col" style={{ border: '1px solid #E3E7F0' }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-5 w-20 rounded bg-[#1F2937] text-white text-[7px] font-bold flex items-center justify-center">IL TUO LOGO</div>
                  <div className="text-[9px] font-bold mt-1">Rossi Serramenti</div>
                </div>
                <div className="text-right text-[8px] text-gray-500">Preventivo<div className="text-[11px] font-bold text-[#0B1020]">n. 19/2026</div></div>
              </div>
              <div className="h-px bg-gray-200 my-2.5" />
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                  <div style={{ transform: 'scale(0.32)' }}>
                    <WindowPreview isExporting numAnte={es.numAnte} apertura="Battente" frameColor={es.colore} width={es.w} height={es.h} handlePosition="right" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[9px] font-bold">Battente {es.modello}</div>
                  <div className="text-[8px] text-gray-500">{es.w} × {es.h} mm · {es.colore}</div>
                </div>
                <div className="text-[9px] font-bold tabular-nums">×{es.qta}</div>
              </div>
              <div className="mt-auto">
                <div className="h-px bg-gray-200 mb-2" />
                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] font-bold">TOTALE</span>
                  <span className="text-[15px] font-extrabold tabular-nums" style={{ backgroundImage: GRAD, WebkitBackgroundClip: 'text', color: 'transparent' }}>€ {es.tot}</span>
                </div>
                <div className="mt-3 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white transition-colors"
                  style={{ background: inviato ? '#16A34A' : GRAD }}>
                  {inviato ? 'Inviato al cliente ✓' : 'Invia al cliente'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lo sfondo della prima schermata: un disegno tecnico che si traccia da solo.
function DisegnoTecnico() {
  const linea = { fill: 'none', stroke: '#7C8DB5', strokeWidth: 1.2 };
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ opacity: 0.16 }}>
      <g className="sd-traccia">
        {/* telaio e ante */}
        <rect x="860" y="150" width="440" height="580" {...linea} pathLength="1" />
        <rect x="884" y="174" width="196" height="532" {...linea} pathLength="1" />
        <rect x="1080" y="174" width="196" height="532" {...linea} pathLength="1" />
        {/* aperture: vertice dal lato della maniglia */}
        <path d="M884 174 L1080 440 L884 706" {...linea} strokeDasharray="6 6" pathLength="1" />
        <path d="M1276 174 L1080 440 L1276 706" {...linea} strokeDasharray="6 6" pathLength="1" />
        {/* quote */}
        <path d="M860 780 L1300 780 M860 770 L860 790 M1300 770 L1300 790" {...linea} pathLength="1" />
        <path d="M1350 150 L1350 730 M1340 150 L1360 150 M1340 730 L1360 730" {...linea} pathLength="1" />
        {/* sezione del profilo */}
        <path d="M120 640 h90 v28 h-30 v52 h-60 z M150 668 h30 v36 h-30 z" {...linea} pathLength="1" />
        <path d="M120 760 L330 760 M120 750 L120 770 M330 750 L330 770" {...linea} pathLength="1" />
      </g>
      <g fill="#7C8DB5" fontFamily="IBM Plex Mono, monospace" fontSize="18" className="sd-quote-testo">
        <text x="1080" y="815" textAnchor="middle">1480</text>
        <text x="1385" y="445" textAnchor="middle" transform="rotate(90 1385 445)">1540</text>
        <text x="225" y="795" textAnchor="middle">ER750TT · 75</text>
      </g>
    </svg>
  );
}

// ---------- Il racconto a capitoli ----------
function Racconto() {
  const ref = useRef(null);
  const p = useProgresso(ref);
  const pos = p * CAPITOLI.length;
  const cap = Math.min(CAPITOLI.length - 1, Math.floor(pos));
  const t = clamp01(pos - cap);

  // Stato del serramento in ogni momento del racconto.
  const ante = cap === 0 && t < 0.45 ? 1 : 2;
  const misure = cap === 0 ? [1200, 1400] : cap === 1 ? [lerp(1000, 1480, t), lerp(1000, 1540, t)] : [1480, 1540];
  const colori = ['Bianco', 'Antracite', 'Noce'];
  const colore = cap < 2 ? 'Bianco' : cap === 2 ? colori[Math.min(2, Math.floor(t * 3))] : 'Antracite';
  const prezzo = cap < 3 ? 0 : cap === 3 ? lerp(0, 1025.64, Math.min(1, t * 1.4)) : 1025.64;

  // Dal capitolo 5 la finestra entra nel foglio, nel 6 il foglio parte.
  const nelFoglio = cap < 4 ? 0 : cap === 4 ? clamp01(t * 1.6) : 1;
  const parte = cap === 5 ? clamp01((t - 0.15) * 1.5) : 0;
  const rigaFoglio = (i) => (cap > 4 ? 1 : cap === 4 ? clamp01(t * 2.2 - i * 0.25) : 0);

  return (
    <section ref={ref} id="come-funziona" className="relative" style={{ height: `${CAPITOLI.length * 100 + 100}vh`, background: '#0F1838' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* griglia da tavolo da disegno */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `linear-gradient(${C.bordo} 1px, transparent 1px), linear-gradient(90deg, ${C.bordo} 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 60% 50%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 60% 50%, black 20%, transparent 75%)',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{ width: 620, height: 620, right: '8%', top: '18%', background: `radial-gradient(circle, rgba(139,92,246,0.22), transparent 65%)` }}
        />

        <div className="relative h-full max-w-6xl mx-auto px-5 md:px-8 grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 md:gap-10 items-center pt-16 md:pt-0">
          {/* indice dei capitoli (computer) / capitolo corrente (telefono) */}
          <div className="self-start md:self-center">
            <div className="md:hidden">
              <div className="flex items-baseline gap-3">
                <span className="sd-serif italic text-6xl leading-none" style={{ color: 'transparent', WebkitTextStroke: `1px ${C.tenue}` }}>{CAPITOLI[cap].n}</span>
                <span className="font-display font-bold text-3xl" style={{ color: C.testo }}>{CAPITOLI[cap].titolo}</span>
              </div>
              <p className="mt-2 text-[15px] leading-snug" style={{ color: C.tenue }}>{CAPITOLI[cap].testo}</p>
            </div>
            <ol className="hidden md:block space-y-5">
              {CAPITOLI.map((c, i) => {
                const attivo = i === cap;
                return (
                  <li key={c.n} className="transition-all duration-500" style={{ opacity: attivo ? 1 : i < cap ? 0.45 : 0.28 }}>
                    <div className="flex items-baseline gap-4">
                      <span className="sd-serif italic text-3xl w-10" style={{ color: attivo ? C.viola : C.tenue }}>{c.n}</span>
                      <span className="font-display font-bold" style={{ color: C.testo, fontSize: attivo ? 34 : 22, transition: 'font-size .4s' }}>{c.titolo}</span>
                    </div>
                    <p
                      className="ml-14 text-base leading-relaxed overflow-hidden transition-all duration-500"
                      style={{ color: C.tenue, maxHeight: attivo ? 80 : 0, opacity: attivo ? 1 : 0 }}
                    >
                      {c.testo}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* il banco: finestra, pannelli, foglio */}
          <div className="relative h-[62vh] md:h-[78vh]">
            {/* finestra grande */}
            <div
              className="absolute inset-0 pt-20 md:pt-16 flex items-center justify-center transition-[filter] duration-500"
              style={{
                opacity: 1 - nelFoglio,
                transform: `translateY(${nelFoglio * 60}px) scale(${1 - nelFoglio * 0.35})`,
                filter: cap === 0 && t < 0.2 ? 'blur(2px)' : 'none',
              }}
            >
              <div className="sd-finestra-grande">
                <Finestra scala={1} numAnte={ante} apertura="Battente" frameColor={colore} width={misure[0]} height={misure[1]} handlePosition="right" />
              </div>
            </div>

            {/* capitolo 1: i modelli */}
            <div className="absolute left-0 right-0 top-0 flex flex-wrap gap-2 transition-opacity duration-500" style={{ opacity: cap === 0 ? 1 : 0 }}>
              {['1 anta', '2 ante', '3 ante', 'PF 2 ante', 'Scorrevole'].map((m) => (
                <Chip key={m} attivo={(m === '2 ante' && ante === 2) || (m === '1 anta' && ante === 1)}>{m}</Chip>
              ))}
            </div>

            {/* capitolo 2: le misure */}
            <div className="absolute left-0 top-0 transition-opacity duration-500" style={{ opacity: cap === 1 ? 1 : 0 }}>
              <Pannello>
                <div className="flex gap-4 md:gap-6 font-display tabular-nums">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: C.tenue }}>Larghezza</div>
                    <div className="text-2xl md:text-3xl font-bold" style={{ color: C.testo }}>{mm(misure[0])} <span className="text-sm" style={{ color: C.tenue }}>mm</span></div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: C.tenue }}>Altezza</div>
                    <div className="text-2xl md:text-3xl font-bold" style={{ color: C.testo }}>{mm(misure[1])} <span className="text-sm" style={{ color: C.tenue }}>mm</span></div>
                  </div>
                </div>
              </Pannello>
            </div>

            {/* capitolo 3: profilo, colore, vetro */}
            <div className="absolute left-0 top-0 space-y-2 transition-opacity duration-500" style={{ opacity: cap === 2 ? 1 : 0 }}>
              <div className="flex flex-wrap gap-2">
                <Chip attivo>ER750TT · alluminio TT</Chip>
                {colori.map((c) => <Chip key={c} attivo={c === colore}>{c}</Chip>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip>Vetro 33.1/16/33.1 basso emissivo</Chip>
                <Chip attivo={t > 0.5}>Uw 1,60 W/m²K</Chip>
              </div>
            </div>

            {/* capitolo 4: il prezzo */}
            <div className="absolute left-0 right-0 bottom-2 md:bottom-6 flex justify-center transition-all duration-500" style={{ opacity: cap === 3 ? 1 : 0, transform: `translateY(${cap === 3 ? 0 : 20}px)` }}>
              <Pannello style={{ minWidth: 280 }}>
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <div className="text-xs font-semibold" style={{ color: C.tenue }}>Dal TUO listino</div>
                    <div className="text-xs" style={{ color: C.tenue }}>2,28 m² × 450 €/m²</div>
                  </div>
                  <div className="font-display font-bold text-3xl md:text-4xl tabular-nums" style={{ color: C.testo }}>{euro(prezzo)}</div>
                </div>
              </Pannello>
            </div>

            {/* capitoli 5-6: il foglio */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                opacity: nelFoglio * (1 - parte * 0.9),
                transform: `translate(${parte * 38}%, ${-parte * 30}%) rotate(${parte * 8}deg) scale(${lerp(0.92, 1, nelFoglio) - parte * 0.35})`,
              }}
            >
              <div className="w-[min(86%,380px)] aspect-[1/1.414] bg-white rounded-md shadow-2xl p-[6%] flex flex-col text-[#0B1020]">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="h-6 w-24 rounded bg-[#1F2937] text-white text-[9px] font-bold flex items-center justify-center">IL TUO LOGO</div>
                    <div className="text-[11px] font-bold mt-1.5">Rossi Serramenti</div>
                  </div>
                  <div className="text-right text-[9px] text-gray-500">
                    Preventivo<div className="text-[13px] font-bold text-[#0B1020]">n. 19/2026</div>
                  </div>
                </div>
                <div className="h-px bg-gray-200 my-3" />
                {[
                  ['Battente 2 ante', '1480 × 1540', '4.102,56', { numAnte: 2, width: 1480, height: 1540 }],
                  ['Portafinestra', '1170 × 2500', '1.316,26', { numAnte: 2, width: 1170, height: 2500 }],
                  ['Vasistas', '1700 × 700', '3.375,00', { numAnte: 1, width: 1700, height: 700, paneConfigs: [{ tipo: 'vasistas' }] }],
                ].map(([m, d, pz, dis], i) => (
                  <div key={m} className="flex items-center gap-2.5 mb-3 transition-all duration-300" style={{ opacity: rigaFoglio(i), transform: `translateX(${(1 - rigaFoglio(i)) * 12}px)` }}>
                    <div className="w-12 h-12 rounded-sm border border-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                      <div style={{ transform: 'scale(0.27)' }}>
                        <WindowPreview isExporting apertura="Battente" frameColor="Antracite" handlePosition="right" {...dis} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold truncate">{m}</div>
                      <div className="text-[9px] text-gray-500">{d} mm</div>
                    </div>
                    <div className="text-[10px] font-bold tabular-nums">€ {pz}</div>
                  </div>
                ))}
                <div className="mt-auto">
                  <div className="h-px bg-gray-200 mb-2" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold">TOTALE</span>
                    <span className="text-[17px] font-extrabold tabular-nums" style={{ backgroundImage: GRAD, WebkitBackgroundClip: 'text', color: 'transparent' }}>€ 8.793,82</span>
                  </div>
                </div>
              </div>
            </div>

            {/* capitolo 6: inviato */}
            <div className="absolute left-0 right-0 bottom-4 md:bottom-10 flex justify-center transition-all duration-500" style={{ opacity: parte > 0.35 ? 1 : 0, transform: `translateY(${parte > 0.35 ? 0 : 20}px)` }}>
              <div className="flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-white" style={{ background: '#16A34A', boxShadow: '0 12px 30px rgba(22,163,74,0.35)' }}>
                <Check size={18} /> Inviato al cliente
              </div>
            </div>
          </div>
        </div>

        {/* barra di avanzamento */}
        <div className="absolute left-0 right-0 bottom-0 h-[3px]" style={{ background: C.bordo }}>
          <div className="h-full" style={{ width: `${p * 100}%`, background: GRAD }} />
        </div>
      </div>
    </section>
  );
}

// ---------- Prova tu ----------
const MODELLI = [
  { id: '1', nome: '1 anta', numAnte: 1, apertura: 'Battente', w: 800, h: 1200 },
  { id: '2', nome: '2 ante', numAnte: 2, apertura: 'Battente', w: 1200, h: 1400 },
  { id: '3', nome: '3 ante', numAnte: 3, apertura: 'Battente', w: 1800, h: 1400 },
  { id: 'pf', nome: 'Portafinestra', numAnte: 2, apertura: 'Battente', w: 1200, h: 2200 },
  { id: 'sc', nome: 'Scorrevole', numAnte: 2, apertura: 'Scorrevole', w: 1800, h: 2200 },
  { id: 'fx', nome: 'Fisso', numAnte: 1, apertura: 'Fisso', w: 1000, h: 1000 },
];
const COLORI_PROVA = [['Bianco', '#f8fafc'], ['Antracite', '#555555'], ['Noce', '#8B5A2B'], ['Nero', '#222222']];

function ProvaTu() {
  const [modello, setModello] = useState(MODELLI[1]);
  const [w, setW] = useState(1200);
  const [h, setH] = useState(1400);
  const [colore, setColore] = useState('Antracite');
  const [listino, setListino] = useState(350);

  const scegli = (m) => { setModello(m); setW(m.w); setH(m.h); };
  const wOk = Math.min(4000, Math.max(300, Number(w) || 0));
  const hOk = Math.min(3200, Math.max(300, Number(h) || 0));
  const mq = (wOk * hOk) / 1e6;
  const prezzo = mq * (Number(listino) || 0);

  const campo = 'w-full rounded-xl px-4 py-3 text-lg font-bold tabular-nums outline-none focus:ring-2';
  const stileCampo = { background: L.campo, border: `1px solid ${L.bordo}`, color: L.testo };

  return (
    <section id="prova" className="relative py-20 md:py-28" style={{ background: L.sfondo }}>
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <Compare>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: C.viola }}>Adesso tocca a te</p>
          <h2 className="font-display font-bold text-4xl md:text-6xl mt-3 leading-[1.05]" style={{ color: L.testo }}>
            Provalo qui, <span className="sd-serif italic font-normal" style={{ backgroundImage: GRAD, WebkitBackgroundClip: 'text', color: 'transparent' }}>senza iscriverti.</span>
          </h2>
        </Compare>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-10 md:mt-14 items-center">
          <Compare className="space-y-6">
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: L.tenue }}>Modello</div>
              <div className="flex flex-wrap gap-2">
                {MODELLI.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => scegli(m)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    style={m.id === modello.id ? { background: GRAD, color: '#fff' } : { border: `1px solid ${L.bordo}`, color: L.testo }}
                  >
                    {m.nome}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold" style={{ color: L.tenue }}>Larghezza (mm)</span>
                <input inputMode="numeric" value={w} onChange={(e) => setW(e.target.value.replace(/\D/g, ''))} className={`${campo} mt-1.5 focus:ring-violet-500`} style={stileCampo} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold" style={{ color: L.tenue }}>Altezza (mm)</span>
                <input inputMode="numeric" value={h} onChange={(e) => setH(e.target.value.replace(/\D/g, ''))} className={`${campo} mt-1.5 focus:ring-violet-500`} style={stileCampo} />
              </label>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: L.tenue }}>Colore</div>
              <div className="flex gap-3">
                {COLORI_PROVA.map(([nome, hex]) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => setColore(nome)}
                    aria-label={nome}
                    title={nome}
                    className="w-11 h-11 rounded-xl transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    style={{ background: hex, border: colore === nome ? `3px solid ${C.viola}` : `1px solid ${L.bordo}`, transform: colore === nome ? 'scale(1.08)' : 'none' }}
                  />
                ))}
              </div>
            </div>
            <label className="block max-w-[220px]">
              <span className="text-sm font-semibold" style={{ color: L.tenue }}>Il tuo prezzo al m²</span>
              <input inputMode="decimal" value={listino} onChange={(e) => setListino(e.target.value.replace(/[^\d]/g, ''))} className={`${campo} mt-1.5 focus:ring-violet-500`} style={stileCampo} />
            </label>
          </Compare>

          <Compare ritardo={120}>
            <div className="rounded-3xl p-6 md:p-8" style={{ background: L.carta, border: `1px solid ${L.bordo}`, boxShadow: '0 30px 70px rgba(15,24,56,0.10)' }}>
              <div className="h-[300px] md:h-[360px] flex items-center justify-center">
                <div className="sd-finestra-prova">
                  <Finestra scala={1} numAnte={modello.numAnte} apertura={modello.apertura} frameColor={colore} width={wOk} height={hOk} handlePosition="right" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-4 pt-5" style={{ borderTop: `1px solid ${L.bordo}` }}>
                <div className="text-sm" style={{ color: L.tenue }}>
                  {mq.toLocaleString('it-IT', { maximumFractionDigits: 2 })} m² × {Number(listino) || 0} €/m²
                </div>
                <div className="font-display font-bold text-3xl md:text-4xl tabular-nums" style={{ color: L.testo }}>{euro(prezzo)}</div>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: L.tenue }}>
              Esempio veloce. Nel programma usi il tuo listino, i vetri, i minimi di fatturazione, tapparelle e accessori. Il PDF con il tuo logo è per gli iscritti.
            </p>
          </Compare>
        </div>

        <Compare className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link to="/preventivi" className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold text-white" style={{ background: GRAD }}>
            Continua nel configuratore completo <ArrowRight size={18} />
          </Link>
          <Link to="/login?mode=signup" className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold" style={{ border: `1px solid ${L.bordo}`, color: L.testo }}>
            Crea il tuo account
          </Link>
        </Compare>
      </div>
    </section>
  );
}

// ---------- Frase che si accende parola per parola ----------
function FraseAccesa({ testo }) {
  const ref = useRef(null);
  const p = useProgresso(ref);
  const parole = useMemo(() => testo.split(' '), [testo]);
  return (
    <section ref={ref} className="relative" style={{ height: '180vh' }}>
      <div className="sticky top-0 h-screen flex items-center">
        <p className="max-w-5xl mx-auto px-5 md:px-8 font-display font-bold text-3xl md:text-6xl leading-[1.12]">
          {parole.map((pa, i) => {
            const soglia = i / parole.length;
            const acceso = clamp01((p * 1.25 - soglia) * parole.length / 3);
            return (
              <span key={i} style={{ color: C.testo, opacity: 0.16 + acceso * 0.84, transition: 'opacity .15s' }}>
                {pa}{' '}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}

const PUNTI = [
  { icon: PencilRuler, titolo: 'Il disegno di ogni serramento', testo: 'Ante, aperture, traversi, sopraluce, persiane, blindate, scorrevoli. Il cliente vede quello che compra.' },
  { icon: Euro, titolo: 'Il prezzo dal tuo listino', testo: 'Al m², al metro o a pezzo, con i tuoi profili e i tuoi vetri. Sconto e IVA fatti da soli.' },
  { icon: FileText, titolo: 'PDF con il tuo logo', testo: 'Numero progressivo, riferimento del cantiere, note per articolo. Pronto da mandare.' },
  { icon: Archive, titolo: 'Archivio dei preventivi', testo: 'Cerca per cliente, riferimento o numero. Riscarichi il PDF senza riaprire niente.' },
  { icon: Smartphone, titolo: 'Dal telefono, in cantiere', testo: 'Funziona nel browser, su computer e cellulare. Niente da installare.' },
  { icon: Thermometer, titolo: 'Trasmittanza Uw', testo: 'Calcolata per ogni serramento con la formula della UNI EN ISO 10077-1. È un valore indicativo.' },
];

export default function LandingNuova({ anteprima = false }) {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <main className="min-h-screen font-sans antialiased" style={{ background: C.notte, color: C.testo }}>
      <SEOManager title="Software Preventivi e Distinte per Serramentisti" path="/" />
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" />
        {anteprima && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>
      <style>{`
        .sd-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .sd-compare { opacity: 0; transform: translateY(28px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); }
        .sd-visto { opacity: 1; transform: none; }
        .sd-finestra-grande { transform: scale(1.85); }
        .sd-finestra-prova { transform: scale(1.2); }
        @media (min-width: 768px) {
          .sd-finestra-grande { transform: scale(2.6); }
          .sd-finestra-prova { transform: scale(1.45); }
        }
        @keyframes sd-respiro { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,-20px); } }
        @keyframes sd-onda-k { from { box-shadow: 0 0 0 0 rgba(139,92,246,0.55); } to { box-shadow: 0 0 0 14px rgba(139,92,246,0); } }
        .sd-onda { animation: sd-onda-k .5s ease-out forwards; }
        @keyframes sd-blink { 50% { opacity: 0; } }
        .sd-cursore { animation: sd-blink .7s steps(1) infinite; }
        @keyframes sd-gall { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .sd-galleggia { animation: sd-gall 5s ease-in-out infinite; }
        .sd-galleggia-2 { animation: sd-gall 6.5s ease-in-out infinite reverse; }
        @keyframes sd-traccia-k { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        .sd-traccia > * { stroke-dasharray: 1; stroke-dashoffset: 1; animation: sd-traccia-k 2.6s cubic-bezier(.6,.1,.2,1) forwards; }
        .sd-traccia > *:nth-child(2) { animation-delay: .5s; } .sd-traccia > *:nth-child(3) { animation-delay: .7s; }
        .sd-traccia > *:nth-child(4) { animation-delay: 1.2s; } .sd-traccia > *:nth-child(5) { animation-delay: 1.3s; }
        .sd-traccia > *:nth-child(6) { animation-delay: 1.8s; } .sd-traccia > *:nth-child(7) { animation-delay: 1.9s; }
        .sd-traccia > *:nth-child(8) { animation-delay: .9s; } .sd-traccia > *:nth-child(9) { animation-delay: 1.4s; }
        @keyframes sd-appare { to { opacity: 1; } }
        .sd-quote-testo { opacity: 0; animation: sd-appare 1s ease 2.4s forwards; }
        @media (prefers-reduced-motion: reduce) {
          .sd-compare { opacity: 1; transform: none; transition: none; }
          .sd-anim { animation: none !important; }
          .sd-traccia > *, .sd-quote-testo, .sd-galleggia, .sd-galleggia-2, .sd-cursore, .sd-onda { animation: none !important; stroke-dashoffset: 0; opacity: 1; }
        }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md" style={{ background: 'rgba(15,24,56,0.95)', borderBottom: `1px solid ${C.bordo}` }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-lg">SerraDesk</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-6">
            <a href="#prezzi" className="hidden md:inline text-sm" style={{ color: C.tenue }}>Prezzi</a>
            <Link to="/guida" className="hidden md:inline text-sm" style={{ color: C.tenue }}>Guide</Link>
            <Link to="/login" className="text-sm px-2" style={{ color: C.tenue }}>Accedi</Link>
            <Link to="/preventivi" className="text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: GRAD }}>Prova gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative min-h-screen flex items-center overflow-hidden" style={{ background: SCURO }}>
        <div className="sd-anim absolute rounded-full blur-3xl" style={{ width: 720, height: 720, left: '-12%', top: '-10%', background: 'radial-gradient(circle, rgba(59,130,246,0.25), transparent 65%)', animation: 'sd-respiro 14s ease-in-out infinite' }} />
        <div className="sd-anim absolute rounded-full blur-3xl" style={{ width: 760, height: 760, right: '-15%', bottom: '-20%', background: 'radial-gradient(circle, rgba(139,92,246,0.22), transparent 65%)', animation: 'sd-respiro 18s ease-in-out infinite reverse' }} />
        <DisegnoTecnico />
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-24 pb-16 w-full grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-12 lg:gap-6 items-center">
          <div>
          <Compare>
            <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: C.tenue }}>Per serramentisti · fatto da un serramentista</p>
          </Compare>
          <Compare ritardo={100}>
            <h1 className="font-display font-bold text-[3.2rem] leading-[0.98] md:text-[5.6rem] lg:text-[6rem] mt-5 tracking-tight">
              Il preventivo,<br />
              <span className="sd-serif italic font-normal" style={{ backgroundImage: GRAD, WebkitBackgroundClip: 'text', color: 'transparent' }}>in due minuti.</span>
            </h1>
          </Compare>
          <Compare ritardo={220}>
            <p className="text-lg md:text-xl mt-7 max-w-xl leading-relaxed" style={{ color: C.tenue }}>
              Scegli il modello, scrivi le misure: il disegno è fatto, il prezzo esce dal tuo listino e il PDF con il tuo logo è pronto da mandare.
            </p>
          </Compare>
          <Compare ritardo={320} className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link to="/preventivi" className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 font-semibold text-white" style={{ background: GRAD, boxShadow: '0 16px 40px rgba(99,102,241,0.35)' }}>
              Prova il configuratore <ArrowRight size={18} />
            </Link>
            <a href="#come-funziona" className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 font-semibold" style={{ border: `1px solid ${C.bordo}`, color: C.testo }}>
              Guarda come funziona
            </a>
          </Compare>
          <p className="text-sm mt-6" style={{ color: C.tenue }}>Nessuna carta per provare · funziona nel browser, anche dal telefono</p>
          </div>
          <Compare ritardo={250}>
            <Telefono />
          </Compare>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.tenue }}>Scorri</div>
      </header>

      <Racconto />

      <FraseAccesa testo="L'ho costruito perché i preventivi li facevo la sera, dopo il cantiere. Adesso li faccio in due minuti, anche dal telefono." />

      <ProvaTu />

      {/* COSA FA */}
      <section className="py-20 md:py-28" style={{ background: L.sfondo, color: L.testo }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <Compare>
            <h2 className="font-display font-bold text-4xl md:text-5xl leading-tight max-w-3xl">
              Tutto quello che serve <span className="sd-serif italic font-normal" style={{ color: C.viola }}>al preventivo.</span>
            </h2>
          </Compare>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {PUNTI.map(({ icon: Icona, titolo, testo }, i) => (
              <Compare key={titolo} ritardo={(i % 3) * 90}>
                <div className="h-full rounded-2xl p-6" style={{ background: L.carta, border: `1px solid ${L.bordo}`, boxShadow: '0 10px 30px rgba(15,24,56,0.05)' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: GRAD }}>
                    <Icona size={20} />
                  </div>
                  <h3 className="font-display font-bold text-xl mt-5">{titolo}</h3>
                  <p className="mt-2 leading-relaxed" style={{ color: L.tenue }}>{testo}</p>
                </div>
              </Compare>
            ))}
          </div>
        </div>
      </section>

      {/* PREZZI: gli stessi della pagina attuale */}
      <section id="prezzi" className="py-20 md:py-28 scroll-mt-16" style={{ background: L.carta, color: L.testo, borderTop: `1px solid ${L.bordo}` }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <Compare className="text-center">
            <h2 className="font-display font-bold text-4xl md:text-5xl">Sblocca tutte le funzioni.</h2>
            <p className="text-lg mt-4 max-w-xl mx-auto" style={{ color: L.tenue }}>
              Il configuratore è gratis. Abbonati per il tuo logo sui documenti, l'archivio clienti e la distinta di taglio.
            </p>
          </Compare>
          <div className="flex justify-center mt-10">
            <div className="inline-flex rounded-xl p-1" style={{ border: `1px solid ${L.bordo}` }}>
              {[['Mensile', false], ['Annuale −15%', true]].map(([l, v]) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setIsAnnual(v)}
                  className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors"
                  style={isAnnual === v ? { background: GRAD, color: '#fff' } : { color: L.tenue }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto mt-10">
            {PLANS.map((plan, i) => (
              <Compare key={plan.name} ritardo={i * 100}>
                <div className="relative h-full rounded-2xl p-8 flex flex-col" style={{ background: i === 1 ? '#FBFAFF' : L.sfondo, border: `1px solid ${i === 1 ? C.viola : L.bordo}` }}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-8 text-white text-xs font-semibold px-3 py-1 rounded-full" style={{ background: GRAD }}>{plan.badge}</div>
                  )}
                  <h3 className="font-display font-bold text-2xl">{plan.name}</h3>
                  <p className="text-sm mt-1 mb-6" style={{ color: L.tenue }}>{plan.description}</p>
                  <div className="pb-6 mb-6" style={{ borderBottom: `1px solid ${L.bordo}` }}>
                    <span className="font-display font-bold text-5xl tabular-nums">€{isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                    <span style={{ color: L.tenue }}> / {isAnnual ? 'anno' : 'mese'}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-3 text-sm">
                        {f.included ? <Check size={18} className="shrink-0" style={{ color: C.viola }} /> : <X size={18} className="shrink-0" style={{ color: L.bordo }} />}
                        <span style={{ color: f.included ? L.testo : L.tenue }}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/login?mode=signup" className="w-full text-center font-semibold py-3.5 rounded-xl text-white" style={i === 1 ? { background: GRAD } : { background: L.testo }}>
                    Inizia subito
                  </Link>
                </div>
              </Compare>
            ))}
          </div>
        </div>
      </section>

      {/* CHIUSURA */}
      <section className="relative overflow-hidden py-24 md:py-32" style={{ background: SCURO }}>
        <div className="absolute rounded-full blur-3xl left-1/2 -translate-x-1/2 top-0" style={{ width: 900, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.25), transparent 65%)' }} />
        <Compare className="relative text-center max-w-3xl mx-auto px-5">
          <h2 className="font-display font-bold text-4xl md:text-6xl leading-[1.05]">
            Il prossimo preventivo, <span className="sd-serif italic font-normal" style={{ backgroundImage: GRAD, WebkitBackgroundClip: 'text', color: 'transparent' }}>fallo qui.</span>
          </h2>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/preventivi" className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 font-semibold text-white" style={{ background: GRAD }}>
              Prova il configuratore <ArrowRight size={18} />
            </Link>
            <a href="mailto:info@serradesk.it" className="inline-flex items-center justify-center rounded-xl px-8 py-4 font-semibold" style={{ border: `1px solid ${C.bordo}`, color: C.testo }}>
              Scrivici: info@serradesk.it
            </a>
          </div>
        </Compare>
      </section>

      <footer className="py-10" style={{ background: '#0C1430', borderTop: `1px solid ${C.bordo}` }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col md:flex-row gap-4 items-center justify-between text-sm" style={{ color: C.tenue }}>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="w-6 h-6 rounded-md" />
            <span>© {new Date().getFullYear()} SerraDesk</span>
          </div>
          <div className="flex flex-wrap gap-5 justify-center">
            <Link to="/guida">Guide</Link>
            <Link to="/termini">Termini di Servizio</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/login">Accedi</Link>
            <a href="mailto:info@serradesk.it">Supporto</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
