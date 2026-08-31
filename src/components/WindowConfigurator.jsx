import React, { useState } from 'react';
import { getFrameColorHex } from '../utils/colors';

const CANVAS_W = 600;
const CANVAS_H = 360;
const FRAME = 14;
const GAP = 5;
const ZONE = 26; // thickness of clickable edge zone

const EDGE_LABELS = { top: 'Alto', bottom: 'Basso', left: 'Sinistra', right: 'Destra' };

export default function WindowConfigurator({ numAnte, frameColor, paneConfigs, onChange, onClose }) {
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

  const setEdge = (paneIndex, edge) => {
    const next = [...paneConfigs];
    const current = getEdge(paneIndex);
    next[paneIndex] = { handleEdge: current === edge ? null : edge };
    onChange(next);
  };

  /* ─── Opening lines ─── */
  const openingLines = (i, px, py, pw, ph) => {
    const edge = getEdge(i);
    if (!edge) return null;
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
      </>
    );
  };

  /* ─── Handle rectangle ─── */
  const handleRect = (i, px, py, pw, ph) => {
    const edge = getEdge(i);
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
              Clicca su un bordo per posizionare la maniglia. Clicca di nuovo per rimuoverla.
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
                  {/* Opening lines */}
                  {openingLines(i, px, py, pw, ph)}
                  {/* Handle */}
                  {handleRect(i, px, py, pw, ph)}
                  {/* Clickable zones */}
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
            return (
              <div key={i} className={`rounded-lg p-2 text-center border text-xs font-semibold transition-all ${edge ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                <div className="text-[10px] font-normal opacity-70 mb-0.5">Anta {i+1}</div>
                {edge ? `↕ ${EDGE_LABELS[edge]}` : 'Fisso'}
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
