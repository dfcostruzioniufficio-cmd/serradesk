import React from 'react';
import { getFrameColorHex, getAccessoriHex } from '../utils/colors';

/**
 * ShutterPreview — Persiana con stecche orizzontali (SVG realistico)
 * Supporta: 1 anta, 2 ante, con o senza traverso centrale
 * Stile: profilo PVC/ALU con stecche a lama inclinata
 */
export default function ShutterPreview({
  numAnte = 2,
  frameColor = '#5a5a5a',
  width = 1000,
  height = 1200,
  hasTraverso = false,
  anteWidths = null,
  handlePosition = 'right',
  paneConfigs = null,
  accessoriColore = '',
  maxQuoteWidth = null,
  maxQuoteHeight = null,
  isExporting = false
}) {
  const safeFrameColor = getFrameColorHex(frameColor);
  const anteCount = Math.max(1, Math.min(4, Number(numAnte)));

  const MAX_W = 160;
  const MAX_H = 200;
  const safeW = Number(width)  || 1000;
  const safeH = Number(height) || 1200;
  const ratio = safeW / safeH;

  let dW, dH;

  if (maxQuoteWidth && maxQuoteHeight) {
    const maxSafeW = Number(maxQuoteWidth) || 1000;
    const maxSafeH = Number(maxQuoteHeight) || 1000;
    const maxRatio = maxSafeW / maxSafeH;
    
    let maxBoundingW, maxBoundingH;
    if (maxRatio > MAX_W / MAX_H) { 
      maxBoundingW = MAX_W; 
      maxBoundingH = MAX_W / maxRatio; 
    } else { 
      maxBoundingH = MAX_H; 
      maxBoundingW = MAX_H * maxRatio; 
    }

    dW = maxBoundingW * (safeW / maxSafeW);
    dH = maxBoundingH * (safeH / maxSafeH);
    
    dW = Math.max(50, dW);
    dH = Math.max(50, dH);
  } else {
    if (ratio > MAX_W / MAX_H) { dW = MAX_W; dH = MAX_W / ratio; }
    else { dH = MAX_H; dW = MAX_H * ratio; }
    dW = Math.max(50, dW);
    dH = Math.max(60, dH);
  }

  const getEdge = (i) => {
    if (paneConfigs && paneConfigs[i]) return paneConfigs[i].handleEdge || null;
    const idx = handlePosition === 'right' ? anteCount - 1 : 0;
    if (i !== idx) return null;
    if (anteCount > 1) {
      // Per 2+ ante, la maniglia di default (se non configurata) sta al centro
      return handlePosition === 'right' ? 'left' : 'right'; 
    }
    return handlePosition === 'right' ? 'right' : 'left';
  };

  // Spessore profilo telaio e stile
  const FT = Math.max(6, Math.round(dW * 0.05));  // telaio esterno
  const ST = Math.max(4, Math.round(dW * 0.035)); // stile/traverso anta

  // Colori derivati
  const hexToRgb = hex => {
    try {
      let h = (hex || '').replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error('Invalid hex');
      return { r, g, b };
    } catch {
      return { r: 90, g: 90, b: 90 };
    }
  };
  const lighten = (hex, a) => { const {r,g,b} = hexToRgb(hex); return `rgb(${Math.min(255,r+a)},${Math.min(255,g+a)},${Math.min(255,b+a)})`; };
  const darken  = (hex, a) => { const {r,g,b} = hexToRgb(hex); return `rgb(${Math.max(0,r-a)},${Math.max(0,g-a)},${Math.max(0,b-a)})`; };

  const frameLight  = lighten(safeFrameColor, 80);
  const frameMid    = safeFrameColor;
  const frameDark   = darken(safeFrameColor, 40);
  const slatLight   = lighten(safeFrameColor, 20);
  const slatDark    = darken(safeFrameColor, 50);

  const accHex = getAccessoriHex(accessoriColore);
  const accLight = lighten(accHex, 40);
  const accMid = accHex;
  const accDark = darken(accHex, 40);

  // Zona interna (dentro telaio esterno)
  const innerX = FT;
  const innerY = FT;
  const innerW = dW - FT * 2;
  const innerH = dH - FT * 2;

  // Larghezza di ogni anta (con supporto larghezze asimmetriche)
  const rawWidths = (anteWidths && anteWidths.length === anteCount)
    ? anteWidths.map(w => Math.max(1, Number(w) || 1))
    : Array(anteCount).fill(1);
  const totalRaw = rawWidths.reduce((s, w) => s + w, 0);
  const scaledWidths = rawWidths.map(w => (w / totalRaw) * (innerW - ST * (anteCount - 1)));

  dW = Math.round(dW);
  dH = Math.round(dH);

  // Numero di stecche per anta
  const slatSpacing = Math.max(4, Math.round(dH * 0.065));
  const numSlats = Math.floor(innerH / slatSpacing) - 1;

  return (
    <div style={{ width: dW, height: dH + 16, margin: '0 auto', filter: isExporting ? 'none' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.3)) drop-shadow(0 1px 3px rgba(0,0,0,0.15))' }}>
      <svg
        width="100%" height="100%"
        viewBox={`0 0 ${dW} ${dH + 16}`}
        style={{ width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="sfTopL" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={frameLight}/>
            <stop offset="100%" stopColor={frameMid}/>
          </linearGradient>
          <linearGradient id="sfLeftL" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={frameLight}/>
            <stop offset="100%" stopColor={frameMid}/>
          </linearGradient>
          <linearGradient id="sfRightL" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={frameMid}/>
            <stop offset="100%" stopColor={frameDark}/>
          </linearGradient>
          <linearGradient id="sfBotL" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={frameMid}/>
            <stop offset="100%" stopColor={frameDark}/>
          </linearGradient>
          {/* Gradiente stecca: effetto lama inclinata */}
          <linearGradient id="slatG" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={slatLight}/>
            <stop offset="45%"  stopColor={frameMid}/>
            <stop offset="100%" stopColor={slatDark}/>
          </linearGradient>
          {/* Gradiente metallo cromato maniglia */}
          <linearGradient id="handleMetalG" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={accDark}/>
            <stop offset="30%"  stopColor={accLight}/>
            <stop offset="60%"  stopColor={accMid}/>
            <stop offset="100%" stopColor={accDark}/>
          </linearGradient>
        </defs>

        {/* ── TELAIO ESTERNO ── */}
        <rect x="0" y="0" width={dW} height={dH} fill={frameMid}/>
        <rect x="0"       y="0"      width={dW}  height={FT}  fill="url(#sfTopL)"/>
        <rect x="0"       y="0"      width={FT}  height={dH}  fill="url(#sfLeftL)"/>
        <rect x={dW-FT}   y="0"      width={FT}  height={dH}  fill="url(#sfRightL)"/>
        <rect x="0"       y={dH-FT}  width={dW}  height={FT}  fill="url(#sfBotL)"/>
        {/* Bordo interno telaio */}
        <rect x={FT-1} y={FT-1} width={innerW+2} height={innerH+2}
          fill="none" stroke={darken(safeFrameColor,70)} strokeWidth="0.8"/>
        {/* Highlight superiore */}
        <rect x="1" y="1" width={dW-2} height="2" fill="rgba(255,255,255,0.3)" />
        <rect x="1" y="1" width="2" height={dH-2} fill="rgba(255,255,255,0.2)" />

        {/* ── ANTE CON STECCHE ── */}
        {Array.from({ length: anteCount }).map((_, ai) => {
          const edge = getEdge(ai);
          const aw = scaledWidths[ai];
          const ax = innerX + scaledWidths.slice(0, ai).reduce((s, w) => s + w, 0) + ai * ST;
          const ay = innerY;
          const ah = innerH;

          // Traverso intermedio (opzionale)
          const midY = ay + ah / 2;

          // Stecche
          const slats = [];
          for (let s = 0; s < numSlats; s++) {
            const sy = ay + slatSpacing * (s + 0.5);
            slats.push(sy);
          }

          return (
            <g key={ai}>
              {/* Separatore stile tra ante */}
              {ai > 0 && (
                <g>
                  <rect x={ax - ST} y={ay} width={ST} height={ah} fill={frameMid}/>
                  <rect x={ax - ST} y={ay} width={1.5} height={ah} fill={frameLight} opacity="0.7"/>
                  <rect x={ax - 1.5} y={ay} width={1.5} height={ah} fill={frameDark} opacity="0.7"/>
                </g>
              )}

              {/* Sfondo anta (pannello) */}
              <rect x={ax} y={ay} width={aw} height={ah} fill={frameMid}/>
              <rect x={ax} y={ay} width={aw} height={ah} fill="rgba(0,0,0,0.3)"/>

              {/* Bordo anta (stile perimetrale) */}
              {/* TOP stile */}
              <rect x={ax} y={ay} width={aw} height={ST} fill={frameMid}/>
              <rect x={ax} y={ay} width={aw} height={1.5} fill="rgba(255,255,255,0.25)" />
              {/* BOTTOM stile */}
              <rect x={ax} y={ay+ah-ST} width={aw} height={ST} fill={frameMid}/>
              <rect x={ax} y={ay+ah-2} width={aw} height={1.5} fill="rgba(0,0,0,0.3)" />
              {/* LEFT stile */}
              <rect x={ax} y={ay} width={ST} height={ah} fill={frameMid}/>
              <rect x={ax} y={ay} width={1.5} height={ah} fill="rgba(255,255,255,0.2)" />
              {/* RIGHT stile */}
              <rect x={ax+aw-ST} y={ay} width={ST} height={ah} fill={frameMid}/>
              <rect x={ax+aw-2} y={ay} width={1.5} height={ah} fill="rgba(0,0,0,0.3)" />

              {/* Traverso intermedio (se abilitato) */}
              {hasTraverso && (
                <>
                  <rect x={ax} y={midY - ST/2} width={aw} height={ST} fill={frameMid}/>
                  <rect x={ax} y={midY - ST/2} width={aw} height={1.5} fill="rgba(255,255,255,0.2)" />
                  <rect x={ax} y={midY + ST/2 - 1.5} width={aw} height={1.5} fill="rgba(0,0,0,0.3)" />
                </>
              )}

              {/* STECCHE (lamelle orizzontali) */}
              {slats.map((sy, si) => {
                // Stecca = rettangolo con altezza variabile (effetto lama inclinata)
                const sh = Math.max(3, slatSpacing * 0.72);
                const slatY = sy - sh * 0.3; // leggermente sopra-centrata per effetto sovrapposizione
                // Non disegnare stecche sopra stili perimetrali
                if (slatY < ay + ST + 1 || slatY + sh > ay + ah - ST - 1) return null;
                // Non sovrapporre al traverso
                if (hasTraverso && sy > midY - ST && sy < midY + ST + slatSpacing) return null;
                return (
                  <g key={si}>
                    <rect
                      x={ax + ST + 1} y={slatY}
                      width={aw - ST * 2 - 2} height={sh}
                      fill="url(#slatG)"
                      stroke="rgba(0,0,0,0.6)" strokeWidth="0.3"
                      rx="0.5"
                    />
                    {/* Ombra sotto stecca (profondità) */}
                    <rect
                      x={ax + ST + 1} y={slatY + sh - 1}
                      width={aw - ST * 2 - 2} height="1.5"
                      fill="rgba(0,0,0,0.5)"
                    />
                    {/* Highlight superiore stecca */}
                    <rect
                      x={ax + ST + 1} y={slatY}
                      width={aw - ST * 2 - 2} height="1"
                      fill="rgba(255,255,255,0.25)"
                    />
                  </g>
                );
              })}

              {/* Perno/cardine (cerniere) */}
              {[ay + ah * 0.15, ay + ah * 0.78].map((hy, hi) => {
                // Cerniere sul bordo esterno di ogni anta
                const hingeX = ai === 0 ? ax : ax + aw - ST - 1;
                return (
                  <g key={hi}>
                    <rect x={hingeX} y={hy} width={ST + 1} height={9}
                      rx="1" fill="#bbb" stroke="#888" strokeWidth="0.5"/>
                    <rect x={hingeX + 1} y={hy + 1} width={ST - 1} height={2} rx="0.5" fill="#ddd"/>
                  </g>
                );
              })}

              {/* ── MANIGLIA / CHIAVISTELLO ── */}
              {edge && (() => {
                const handleY = ay + ah * 0.5;
                const handleX = edge === 'left' ? ax + ST + 1 : ax + aw - ST - 5;

                return (
                  <g>
                    {/* Piastra di base */}
                    <rect x={handleX} y={handleY - 14} width={5} height={28} rx="1.5"
                      fill={darken(safeFrameColor, 30)} stroke={darken(safeFrameColor, 60)} strokeWidth="0.5"/>
                    {/* Rosetta centrale */}
                    <circle cx={handleX + 2.5} cy={handleY - 4} r="4"
                      fill="url(#handleMetalG)" stroke="#666" strokeWidth="0.5"/>
                    <circle cx={handleX + 2.5} cy={handleY - 4} r="1.5" fill="#444"/>
                    {/* Pomolo a leva */}
                    <rect x={handleX - 7} y={handleY - 6} width={13} height={5} rx="2"
                      fill="url(#handleMetalG)" stroke="#777" strokeWidth="0.4"/>
                    <rect x={handleX - 6} y={handleY - 5.5} width={11} height={1.5} rx="0.5"
                      fill="rgba(255,255,255,0.5)"/>
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* Bordo finale esterno */}
        <rect x="0" y="0" width={dW} height={dH} fill="none" stroke={darken(safeFrameColor,80)} strokeWidth="0.5"/>
      </svg>
    </div>
  );
}
