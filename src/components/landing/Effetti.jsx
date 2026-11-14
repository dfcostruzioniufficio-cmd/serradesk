import React, { useEffect, useRef, useState } from 'react';

/**
 * Effetti della pagina iniziale: profondita' 3D, luce e movimento.
 * Solo aspetto: nessun dato, nessun prezzo. Tutto si spegne con
 * "riduci movimento", e gli effetti legati al mouse non partono sui telefoni.
 */

const fermo = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const conMouse = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

export function StileEffetti() {
  return (
    <style>{`
      .sd-tilt { position: relative; transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s; will-change: transform; }
      .sd-tilt-3d { transform-style: preserve-3d; }
      .sd-tilt-3d > .sd-salta { transform: translateZ(38px); }
      .sd-tilt-3d > .sd-salta-poco { transform: translateZ(18px); }
      .sd-tilt-luce { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0; transition: opacity .35s; background: radial-gradient(420px circle at var(--gx, 50%) var(--gy, 50%), var(--sd-glare, rgba(139,92,246,0.16)), transparent 60%); }
      .sd-tilt:hover > .sd-tilt-luce { opacity: 1; }

      .sd-luce { position: relative; overflow: hidden; transition: transform .25s cubic-bezier(.2,.7,.2,1), box-shadow .25s; }
      .sd-luce:hover { transform: translateY(-2px) scale(1.025); box-shadow: 0 22px 55px rgba(99,102,241,0.5); }
      .sd-luce::after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.38) 50%, transparent 65%); transform: translateX(-130%); animation: sd-luce-k 3.8s ease-in-out infinite; pointer-events: none; }
      @keyframes sd-luce-k { 0%, 55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }

      @property --sd-a { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
      .sd-aura { position: relative; isolation: isolate; border-radius: 1rem; }
      .sd-aura::before, .sd-aura::after { content: ''; position: absolute; inset: -2px; border-radius: 1.1rem; z-index: -1; background: conic-gradient(from var(--sd-a), #3B82F6, #8B5CF6, #22D3EE, #8B5CF6, #3B82F6); animation: sd-gira 5s linear infinite; }
      .sd-aura::after { filter: blur(22px); opacity: .55; }
      @keyframes sd-gira { to { --sd-a: 360deg; } }

      .sd-flip { display: inline-block; opacity: 0; transform: perspective(700px) rotateX(-85deg) translateY(.35em); transform-origin: 50% 100%; animation: sd-flip-k 1.1s cubic-bezier(.2,.7,.2,1) forwards; }
      @keyframes sd-flip-k { to { opacity: 1; transform: perspective(700px) rotateX(0) translateY(0); } }

      .sd-barra { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 60; transform-origin: 0 50%; transform: scaleX(0); background: linear-gradient(90deg, #3B82F6, #8B5CF6, #22D3EE); box-shadow: 0 0 12px rgba(139,92,246,0.8); pointer-events: none; }
      .sd-faro { position: fixed; top: 0; left: 0; width: 620px; height: 620px; margin: -310px 0 0 -310px; border-radius: 50%; pointer-events: none; z-index: 40; opacity: 0; transition: opacity .5s; mix-blend-mode: screen; background: radial-gradient(circle, rgba(99,102,241,0.20), rgba(139,92,246,0.08) 40%, transparent 65%); will-change: transform; }

      .sd-f3d { width: 200px; height: 258px; margin: 0 auto 56px; perspective: 1100px; }
      .sd-f3d-giro { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; animation: sd-f3d-k 10s ease-in-out infinite; }
      @keyframes sd-f3d-k { 0%, 100% { transform: rotateX(9deg) rotateY(-24deg); } 50% { transform: rotateX(4deg) rotateY(24deg); } }
      .sd-f3d-luce { position: absolute; inset: -70%; border-radius: 50%; background: radial-gradient(circle, rgba(196,181,253,0.75), rgba(99,102,241,0.35) 30%, transparent 62%); transform: translateZ(-70px) scale(.45); opacity: 0; transition: opacity 1.8s, transform 1.8s; filter: blur(12px); }
      .sd-f3d-aperta .sd-f3d-luce { opacity: 1; transform: translateZ(-70px) scale(1); }
      .sd-f3d-telaio { position: absolute; inset: 0; border: 10px solid #EEF1F8; border-radius: 6px; transform-style: preserve-3d; box-shadow: inset 0 0 0 1px #9AA3B8, 0 0 0 1px rgba(255,255,255,0.35), 0 30px 80px rgba(0,0,0,0.5); background: linear-gradient(180deg, rgba(196,181,253,0.30), rgba(59,130,246,0.10)); }
      .sd-f3d-anta { position: absolute; top: 0; bottom: 0; width: 50%; border: 8px solid #F7F9FD; box-shadow: inset 0 0 0 1px #9AA3B8, 0 0 0 1px rgba(15,24,56,0.25); background: linear-gradient(135deg, rgba(255,255,255,0.34), rgba(147,197,253,0.10) 45%, rgba(255,255,255,0.20)); transition: transform 2s cubic-bezier(.3,.7,.2,1); }
      .sd-f3d-sx { left: 0; transform-origin: 0 50%; }
      .sd-f3d-dx { right: 0; transform-origin: 100% 50%; }
      .sd-f3d-dx > i { position: absolute; left: -2px; top: 50%; width: 5px; height: 30px; margin-top: -15px; border-radius: 3px; background: #7C86A2; }
      .sd-f3d-aperta .sd-f3d-sx { transform: rotateY(-72deg); }
      .sd-f3d-aperta .sd-f3d-dx { transform: rotateY(72deg); }

      @media (prefers-reduced-motion: reduce) {
        .sd-tilt { transform: none !important; }
        .sd-luce::after, .sd-aura::before, .sd-aura::after, .sd-f3d-giro { animation: none !important; }
        .sd-flip { animation: none !important; opacity: 1; transform: none; }
        .sd-f3d-giro { transform: rotateX(6deg) rotateY(-18deg); }
        .sd-faro { display: none; }
      }
    `}</style>
  );
}

// Scheda che si inclina in 3D verso il mouse, con un riflesso che lo segue.
export function Tilt({ children, max = 9, profondo = false, riflesso, className = '', style }) {
  const ref = useRef(null);
  const muovi = (e) => {
    const el = ref.current;
    if (!el || !conMouse() || fermo()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
  };
  const esci = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return (
    <div
      ref={ref}
      onMouseMove={muovi}
      onMouseLeave={esci}
      className={`sd-tilt ${profondo ? 'sd-tilt-3d' : ''} ${className}`}
      style={riflesso ? { ...style, '--sd-glare': riflesso } : style}
    >
      {children}
      {riflesso !== false && <span className="sd-tilt-luce" aria-hidden />}
    </div>
  );
}

// Pulviscolo di luce che viene incontro, in prospettiva, e segue il mouse.
export function Spazio() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!ctx) return;
    const riduci = fermo();
    const nuovo = (z) => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z, c: Math.random() < 0.5 });
    const punti = Array.from({ length: window.innerWidth < 768 ? 55 : 130 }, () => nuovo(Math.random()));
    let w = 0, h = 0, raf = 0, prima = 0, mx = 0, my = 0, tx = 0, ty = 0, visibile = true;

    const misura = () => {
      const d = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * d; cv.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const disegna = (dt) => {
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      ctx.clearRect(0, 0, w, h);
      for (const p of punti) {
        p.z -= dt * 0.055;
        if (p.z <= 0.04) Object.assign(p, nuovo(1));
        const k = 0.45 / p.z;
        const vicino = 1 - p.z;
        const sx = w / 2 + (p.x * k - mx * vicino * 0.18) * w;
        const sy = h / 2 + (p.y * k - my * vicino * 0.18) * h;
        if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;
        const a = Math.min(1, vicino * 1.5) * Math.min(1, p.z * 7) * 0.8;
        ctx.fillStyle = p.c ? `rgba(125,180,255,${a})` : `rgba(180,155,255,${a})`;
        ctx.beginPath();
        ctx.arc(sx, sy, vicino * 2.1 + 0.3, 0, 6.2832);
        ctx.fill();
      }
    };
    const giro = (ora) => {
      const dt = prima ? Math.min(0.05, (ora - prima) / 1000) : 0.016;
      prima = ora;
      disegna(dt);
      raf = visibile ? requestAnimationFrame(giro) : 0;
    };
    const mouse = (e) => { tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; };
    const ridimensiona = () => { misura(); if (riduci) disegna(0); };

    misura();
    if (riduci) { disegna(0); } else { raf = requestAnimationFrame(giro); }
    const io = typeof IntersectionObserver !== 'undefined' && new IntersectionObserver(([e]) => {
      visibile = e.isIntersecting;
      if (visibile && !raf && !riduci) { prima = 0; raf = requestAnimationFrame(giro); }
    });
    io && io.observe(cv);
    window.addEventListener('resize', ridimensiona);
    window.addEventListener('mousemove', mouse, { passive: true });
    return () => {
      io && io.disconnect();
      window.removeEventListener('resize', ridimensiona);
      window.removeEventListener('mousemove', mouse);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <canvas ref={ref} aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// Barra in cima che avanza con la pagina, e alone di luce sotto il mouse.
export function LuciDiScena() {
  const barra = useRef(null);
  const faro = useRef(null);
  useEffect(() => {
    const scorri = () => {
      const tot = document.documentElement.scrollHeight - window.innerHeight;
      if (barra.current) barra.current.style.transform = `scaleX(${tot > 0 ? Math.min(1, window.scrollY / tot) : 0})`;
    };
    const mouse = (e) => {
      if (!faro.current) return;
      faro.current.style.opacity = 1;
      faro.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    };
    scorri();
    window.addEventListener('scroll', scorri, { passive: true });
    window.addEventListener('resize', scorri);
    const segue = conMouse() && !fermo();
    if (segue) window.addEventListener('mousemove', mouse, { passive: true });
    return () => {
      window.removeEventListener('scroll', scorri);
      window.removeEventListener('resize', scorri);
      if (segue) window.removeEventListener('mousemove', mouse);
    };
  }, []);
  return (
    <>
      <div ref={barra} className="sd-barra" aria-hidden />
      <div ref={faro} className="sd-faro" aria-hidden />
    </>
  );
}

// Una finestra a due ante in 3D: quando entra nello schermo si apre e fa luce.
export function Finestra3D() {
  const ref = useRef(null);
  const [aperta, setAperta] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setAperta(true); return; }
    const io = new IntersectionObserver(([e]) => setAperta(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`sd-f3d ${aperta ? 'sd-f3d-aperta' : ''}`} aria-hidden>
      <div className="sd-f3d-giro">
        <div className="sd-f3d-luce" />
        <div className="sd-f3d-telaio">
          <div className="sd-f3d-anta sd-f3d-sx" />
          <div className="sd-f3d-anta sd-f3d-dx"><i /></div>
        </div>
      </div>
    </div>
  );
}
