import React, { useState } from 'react';
import { getFrameColorHex } from '../utils/colors';

const CANVAS_W = 600;
const CANVAS_H = 360;
const FRAME = 14;
const GAP = 5;
const ZONE = 26; // thickness of clickable edge zone

const EDGE_LABELS = { top: 'Alto', bottom: 'Basso', left: 'Sinistra', right: 'Destra' };

// Come si apre ogni anta. Si sceglie toccando il centro dell'anta: ogni
// tocco passa al tipo successivo. Sul battente ci sono tutte le aperture,
// sullo scorrevole solo apribile o fissa.
const TIPI = {
  battente: 'Battente',
  fissa: 'Fissa',
  ribalta: 'Anta-ribalta',
  vasistas: 'Vasistas',
  apribile: 'Apribile',
};
const CICLO = {
  Battente: ['battente', 'fissa', 'ribalta', 'vasistas'],
  Scorrevole: ['apribile', 'fissa'],
};

export default function WindowConfigurator({ numAnte, apertura, frameColor, paneConfigs, onChange, onClose, hasTraverso = false, traversoHeight = 1000, height = 1000 }) {
  const ciclo = CICLO[apertura] || null;
  // Col traverso ogni anta ha due parti, sopra e sotto, ciascuna col suo tipo
  // (la F06 degli abachi: tutto fisso tranne il vasistas in alto al centro).
  const aDueParti = !!(hasTraverso && ciclo);
  const quotaTraverso = Math.max(0.1, Math.min(0.9, 1 - (Number(traversoHeight) || 1000) / (Number(height) || 1000)));
  const safeFrameColor = getFrameColorHex(frameColor);
  const [hovered, setHovered] = useState(null); // { pane: i, edge: 'top'|'right'|... }

  const count = Math.max(1, Math.min(6, Number(numAnte)));
  const innerW = CANVAS_W - FRAME * 2;
  const innerH = CANVAS_H - FRAME * 2;
  const paneW = (innerW - GAP * (count - 1)) / count;
  const paneH = innerH;
  const getPX = (i) => FRAME + i * (paneW + GAP);
  const getPY = () => FRAME;

  const getEdge = (i) => paneConfigs[i]?.handleEdge || null;

  const getTipo = (i) => paneConfigs[i]?.tipo || null;

  // Bordo predefinito della maniglia quando un'anta torna apribile: l'ultima
  // anta ce l'ha a sinistra (dove incontra la vicina), le altre a destra.
  const bordoPredefinito = (i) => (i === count - 1 && count > 1 ? 'left' : 'right');

  // Col traverso ogni parte e' un'anta a se': maniglia e tipo suoi.
  const CHIAVI = {
    sopra: { tipo: 'tipoSopra', bordo: 'handleEdgeSopra' },
    sotto: { tipo: 'tipo', bordo: 'handleEdge' },
  };
  const edgeParte = (i, parte) => paneConfigs[i]?.[CHIAVI[parte].bordo] || null;

  // Prima volta che si tocca un'anta col traverso: tutte e due le parti
  // prendono un tipo e una maniglia propri, cosi' da li' in poi si cambiano
  // una senza l'altra.
  const separa = (i, attuale) => {
    const sotto = attuale.tipo || ciclo[0];
    const sopra = attuale.tipoSopra || sotto;
    const bordoSotto = sotto === 'fissa' ? null : (attuale.handleEdge || bordoPredefinito(i));
    const bordoSopra = sopra === 'fissa' ? null
      : (attuale.handleEdgeSopra || (attuale.tipoSopra ? bordoPredefinito(i) : bordoSotto) || bordoPredefinito(i));
    return { ...attuale, tipo: sotto, tipoSopra: sopra, handleEdge: bordoSotto, handleEdgeSopra: bordoSopra };
  };

  const setEdge = (paneIndex, edge, parte) => {
    if (aDueParti && parte) {
      const next = [...paneConfigs];
      const c = separa(paneIndex, next[paneIndex] || {});
      const k = CHIAVI[parte];
      if (c[k.tipo] === 'fissa') {
        // La maniglia su una parte fissa la rende apribile.
        c[k.tipo] = ciclo[0];
        c[k.bordo] = edge;
      } else {
        c[k.bordo] = c[k.bordo] === edge ? null : edge;
      }
      next[paneIndex] = c;
      onChange(next);
      return;
    }
    const next = [...paneConfigs];
    const attuale = next[paneIndex] || {};
    const current = getEdge(paneIndex);
    // Mettere la maniglia su un'anta fissa la rende di nuovo apribile.
    if (attuale.tipo === 'fissa') {
      next[paneIndex] = { ...attuale, tipo: ciclo ? ciclo[0] : undefined, handleEdge: edge };
    } else {
      // Il tipo scelto resta: si sposta solo la maniglia.
      next[paneIndex] = { ...attuale, handleEdge: current === edge ? null : edge };
    }
    onChange(next);
  };

  // Tocco al centro dell'anta: tipo successivo. Un'anta mai toccata vale
  // come il primo tipo del ciclo, quindi il primo tocco la rende fissa.
  const successivo = (tipo) => {
    const pos = ciclo.indexOf(tipo);
    // Un'anta mai toccata vale come il primo del ciclo (apribile): il primo
    // tocco la porta al secondo, cioe' fissa, che e' il caso piu' frequente.
    return ciclo[((pos < 0 ? 0 : pos) + 1) % ciclo.length];
  };

  // parte: 'sotto' (o l'anta intera, senza traverso) oppure 'sopra'.
  const cambiaTipo = (i, parte = 'sotto') => {
    if (!ciclo) return;
    const next = [...paneConfigs];
    const attuale = next[i] || {};
    let tipo = attuale.tipo;
    let tipoSopra = attuale.tipoSopra;
    if (!aDueParti) {
      tipo = successivo(tipo);
    } else {
      // Ogni parte e' un'anta a se': si cambia solo quella toccata.
      const c = separa(i, attuale);
      const k = CHIAVI[parte];
      const nuovo = successivo(c[k.tipo]);
      c[k.tipo] = nuovo;
      c[k.bordo] = nuovo === 'fissa' ? null : (c[k.bordo] || bordoPredefinito(i));
      next[i] = c;
      onChange(next);
      return;
    }
    const tuttaFissa = tipo === 'fissa' && (!aDueParti || tipoSopra === 'fissa');
    next[i] = {
      ...attuale,
      tipo,
      ...(aDueParti ? { tipoSopra } : {}),
      handleEdge: tuttaFissa ? null : (attuale.handleEdge || bordoPredefinito(i)),
    };
    onChange(next);
  };

  const tipoSopraDi = (i) => paneConfigs[i]?.tipoSopra || getTipo(i);

  /* ─── Opening lines ─── */
  const openingLines = (i, px, py, pw, ph, tipoZona, edgeZona) => {
    const edge = edgeZona === undefined ? getEdge(i) : edgeZona;
    const tipo = tipoZona === undefined ? getTipo(i) : tipoZona;
    if (tipo === 'fissa') return null;
    const ribalta = (tipo === 'ribalta' || tipo === 'vasistas') ? (
      <>
        <line x1={px+pw/2} y1={py} x2={px} y2={py+ph} stroke="rgba(30,60,150,0.55)" strokeDasharray="5,3" strokeWidth="1.8"/>
        <line x1={px+pw/2} y1={py} x2={px+pw} y2={py+ph} stroke="rgba(30,60,150,0.55)" strokeDasharray="5,3" strokeWidth="1.8"/>
      </>
    ) : null;
    if (tipo === 'vasistas') return ribalta;
    if (!edge) return ribalta;
    let hx, hy, c1x, c1y, c2x, c2y;
    switch (edge) {
      case 'right':  hx=px+pw; hy=py+ph/2; c1x=px; c1y=py;      c2x=px; c2y=py+ph; break;
      case 'left':   hx=px;    hy=py+ph/2; c1x=px+pw; c1y=py;   c2x=px+pw; c2y=py+ph; break;
      case 'top':    hx=px+pw/2; hy=py;    c1x=px; c1y=py+ph;   c2x=px+pw; c2y=py+ph; break;
      case 'bottom': hx=px+pw/2; hy=py+ph; c1x=px; c1y=py;      c2x=px+pw; c2y=py; break;
      default: return null;
    }
    return (
      <>
        <line x1={hx} y1={hy} x2={c1x} y2={c1y} stroke="rgba(30,60,150,0.55)" strokeDasharray="5,3" strokeWidth="1.8"/>
        <line x1={hx} y1={hy} x2={c2x} y2={c2y} stroke="rgba(30,60,150,0.55)" strokeDasharray="5,3" strokeWidth="1.8"/>
        {ribalta}
      </>
    );
  };

  /* ─── Zona centrale: tocco per cambiare tipo ─── */
  const zonaTipo = (i, px, py, pw, ph) => {
    if (!ciclo) return null;
    const zona = (chiave, y0, y1, parte) => {
      const hov = hovered?.pane === i && hovered?.edge === chiave;
      return (
        <rect
          key={chiave}
          x={px+ZONE} y={y0} width={Math.max(0, pw-ZONE*2)} height={Math.max(0, y1-y0)}
          fill={hov ? 'rgba(59,130,246,0.08)' : 'transparent'}
          rx="4"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHovered({ pane: i, edge: chiave })}
          onMouseLeave={() => setHovered(null)}
          onClick={() => cambiaTipo(i, parte)}
        />
      );
    };
    if (!aDueParti) return zona('centro', py+ZONE, py+ph-ZONE, 'sotto');
    const yT = py + ph * quotaTraverso;
    return (
      <>
        {zona('sopra', py+ZONE, yT-4, 'sopra')}
        {zona('sotto', yT+4, py+ph-ZONE, 'sotto')}
      </>
    );
  };

  /* ─── Handle rectangle ─── */
  const handleRect = (i, px, py, pw, ph, edgeZona) => {
    const edge = edgeZona === undefined ? getEdge(i) : edgeZona;
    if (!edge) return null;
    const hl = Math.min(ph, pw) * 0.28;
    const ht = 6;
    let rx, ry, rw, rh;
    switch (edge) {
      case 'right':  rw=ht; rh=hl; rx=px+pw-ht;  ry=py+ph/2-hl/2; break;
      case 'left':   rw=ht; rh=hl; rx=px;         ry=py+ph/2-hl/2; break;
      case 'top':    rw=hl; rh=ht; rx=px+pw/2-hl/2; ry=py;         break;
      case 'bottom': rw=hl; rh=ht; rx=px+pw/2-hl/2; ry=py+ph-ht;  break;
      default: return null;
    }
    return <rect x={rx} y={ry} width={rw} height={rh} fill="#9ca3af" stroke="#374151" strokeWidth="1" rx="1.5"/>;
  };

  /* ─── Clickable edge zones ─── */
  const edgeZones = (i, px, py, pw, ph) => {
    if (aDueParti) {
      // Col traverso: bordo sinistro e destro di ciascuna parte.
      const yT = py + ph * quotaTraverso;
      const parti = [['sopra', py + ZONE / 2, yT - 4], ['sotto', yT + 4, py + ph - ZONE / 2]];
      return parti.flatMap(([parte, y0, y1]) => ['left', 'right'].map((edge) => {
        const chiave = `${parte}-${edge}`;
        const sel = edgeParte(i, parte) === edge;
        const hov = hovered?.pane === i && hovered?.edge === chiave;
        return (
          <rect
            key={chiave}
            x={edge === 'left' ? px : px + pw - ZONE} y={y0} width={ZONE} height={Math.max(0, y1 - y0)}
            fill={sel ? 'rgba(59,130,246,0.32)' : hov ? 'rgba(59,130,246,0.14)' : 'transparent'}
            stroke={sel ? 'rgba(59,130,246,0.75)' : hov ? 'rgba(59,130,246,0.4)' : 'transparent'}
            strokeWidth="1.5"
            rx="3"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered({ pane: i, edge: chiave })}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setEdge(i, edge, parte)}
          />
        );
      }));
    }
    const zones = [
      { edge: 'top',    x: px+ZONE,    y: py,         w: pw-ZONE*2, h: ZONE },
      { edge: 'bottom', x: px+ZONE,    y: py+ph-ZONE, w: pw-ZONE*2, h: ZONE },
      { edge: 'left',   x: px,         y: py+ZONE,    w: ZONE,      h: ph-ZONE*2 },
      { edge: 'right',  x: px+pw-ZONE, y: py+ZONE,    w: ZONE,      h: ph-ZONE*2 },
    ];
    const current = getEdge(i);
    return zones.map(z => {
      const sel = current === z.edge;
      const hov = hovered?.pane === i && hovered?.edge === z.edge;
      return (
        <rect
          key={z.edge}
          x={z.x} y={z.y} width={z.w} height={z.h}
          fill={sel ? 'rgba(59,130,246,0.32)' : hov ? 'rgba(59,130,246,0.14)' : 'transparent'}
          stroke={sel ? 'rgba(59,130,246,0.75)' : hov ? 'rgba(59,130,246,0.4)' : 'transparent'}
          strokeWidth="1.5"
          rx="3"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHovered({ pane: i, edge: z.edge })}
          onMouseLeave={() => setHovered(null)}
          onClick={() => setEdge(i, z.edge)}
        />
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">🖱️ Configuratore Visivo Infisso</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {ciclo
                ? (aDueParti
                  ? 'Col traverso ogni anta ha due parti: tocca la parte sopra o quella sotto per scegliere come si apre. Tocca un bordo per spostare la maniglia.'
                  : 'Tocca il centro di un\'anta per scegliere come si apre (anche fissa). Tocca un bordo per spostare la maniglia.')
                : 'Clicca su un bordo per posizionare la maniglia. Clicca di nuovo per rimuoverla.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl font-light leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {/* Canvas */}
        <div className="px-6 pt-4 pb-2 bg-gray-50">
          <svg
            width="100%"
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            style={{ display: 'block', maxHeight: '340px', borderRadius: '12px', overflow: 'visible' }}
          >
            {/* Frame */}
            <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill={safeFrameColor} rx="6"/>

            {Array.from({ length: count }).map((_, i) => {
              const px = getPX(i), py = getPY(), pw = paneW, ph = paneH;
              return (
                <g key={i}>
                  {/* Glass */}
                  <rect x={px} y={py} width={pw} height={ph} fill="#d6eff5" stroke={safeFrameColor} strokeWidth="3"/>
                  {/* Inner border */}
                  <rect x={px+9} y={py+9} width={pw-18} height={ph-18} fill="none" stroke="rgba(100,150,170,0.35)" strokeWidth="1"/>
                  {aDueParti ? (() => {
                    // Traverso e due parti, ognuna con linee e nome suoi.
                    const yT = py + ph * quotaTraverso;
                    const scritta = (tipo, y) => tipo && (
                      <text x={px+pw/2} y={y} textAnchor="middle" fontSize={count > 4 ? 12 : 15} fill="rgba(30,60,150,0.7)" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                        {TIPI[tipo]}
                      </text>
                    );
                    return (
                      <>
                        {openingLines(i, px, py, pw, yT - py, tipoSopraDi(i) || null, paneConfigs[i]?.tipoSopra ? edgeParte(i, 'sopra') : getEdge(i))}
                        {openingLines(i, px, yT, pw, py + ph - yT, getTipo(i) || null, getEdge(i))}
                        {tipoSopraDi(i) !== 'vasistas' && handleRect(i, px, py, pw, yT - py, paneConfigs[i]?.tipoSopra ? edgeParte(i, 'sopra') : getEdge(i))}
                        {getTipo(i) !== 'vasistas' && handleRect(i, px, yT, pw, py + ph - yT, getEdge(i))}
                        <rect x={px} y={yT - 4} width={pw} height={8} fill={safeFrameColor} stroke="rgba(0,0,0,0.25)" strokeWidth="1"/>
                        {scritta(tipoSopraDi(i), py + (yT - py) / 2 + 5)}
                        {scritta(getTipo(i), yT + (py + ph - yT) / 2 + 5)}
                      </>
                    );
                  })() : (
                    <>
                      {/* Opening lines */}
                      {openingLines(i, px, py, pw, ph)}
                      {/* Handle */}
                      {handleRect(i, px, py, pw, ph)}
                      {/* Tipo dell'anta, scritto in grande nel vetro */}
                      {getTipo(i) && (
                        <text x={px+pw/2} y={py+ph/2+6} textAnchor="middle" fontSize={count > 4 ? 13 : 16} fill="rgba(30,60,150,0.7)" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                          {TIPI[getTipo(i)]}
                        </text>
                      )}
                    </>
                  )}
                  {/* Clickable zones */}
                  {zonaTipo(i, px, py, pw, ph)}
                  {edgeZones(i, px, py, pw, ph)}
                  {/* Pane label */}
                  <text x={px+pw/2} y={py+ph-7} textAnchor="middle" fontSize="13" fill="rgba(0,0,0,0.2)" fontWeight="bold">{i+1}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="px-6 py-2 flex gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-blue-400 opacity-60"></span> Zona cliccabile (bordo)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-blue-600"></span> Maniglia posizionata
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-1 bg-blue-600 opacity-60" style={{borderTop:'2px dashed'}}></span> Direzione apertura
          </span>
        </div>

        {/* Pane summary chips */}
        <div className="px-6 py-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Array.from({ length: count }).map((_, i) => {
            const edge = getEdge(i);
            const tipo = getTipo(i);
            const fissa = tipo === 'fissa';
            // Un'anta mai toccata senza maniglia non e' fissa: si apre come
            // anta secondaria e nel prezzo conta come apribile.
            const sopra = aDueParti ? tipoSopraDi(i) : null;
            const lato = (e) => (e ? ` ${e === 'left' ? 'sx' : 'dx'}` : '');
            const testo = aDueParti && paneConfigs[i]?.tipoSopra
              ? `Sopra: ${TIPI[sopra]}${sopra !== 'fissa' && sopra !== 'vasistas' ? lato(edgeParte(i, 'sopra')) : ''} · Sotto: ${TIPI[tipo || ciclo[0]]}${tipo !== 'fissa' && tipo !== 'vasistas' ? lato(edge) : ''}`
              : tipo
                ? `${TIPI[tipo]}${!fissa && edge ? ` · ${EDGE_LABELS[edge]}` : ''}`
                : (edge ? `↕ ${EDGE_LABELS[edge]}` : 'Senza maniglia');
            return (
              <div key={i} className={`rounded-lg p-2 text-center border text-xs font-semibold transition-all ${fissa ? 'bg-gray-100 border-gray-300 text-gray-600' : (edge || tipo) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                <div className="text-[10px] font-normal opacity-70 mb-0.5">Anta {i+1}</div>
                {testo}
              </div>
            );
          })}
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium text-sm">
            Annulla
          </button>
          <button onClick={onClose} className="px-7 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow">
            ✓ Conferma
          </button>
        </div>
      </div>
    </div>
  );
}
