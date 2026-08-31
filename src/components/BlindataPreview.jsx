import React from 'react';
import { getFrameColorHex } from '../utils/colors';

/**
 * BlindataPreview — Porta Blindata realistica in SVG
 * Renderizza una vista esterna: pannello solido, spioncino, pomolo fisso, e toppa di sicurezza.
 */
export default function BlindataPreview({
  frameColor = '#8B5A2B',
  width = 900,
  height = 2100,
  handlePosition = 'right',
  maniglioneAntipanico = false,
  maxQuoteWidth = null,
  maxQuoteHeight = null,
  isExporting = false
}) {
  const MAX_W = 160;
  const MAX_H = 200;
  const safeW = Number(width)  || 900;
  const safeH = Number(height) || 2100;
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
    dH = Math.max(60, dH);
  } else {
    if (ratio > MAX_W / MAX_H) { dW = MAX_W; dH = MAX_W / ratio; }
    else { dH = MAX_H; dW = MAX_H * ratio; }
    dW = Math.max(50, dW);
    dH = Math.max(60, dH);
  }

  dW = Math.round(dW);
  dH = Math.round(dH);

  // Spessore del telaio esterno fisso
  const FT = Math.max(6, Math.round(dW * 0.04));

  // Funzioni colori
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
  const lighten = (hex, amt) => {
    try {
      const { r, g, b } = hexToRgb(hex);
      const l = v => Math.min(255, v + amt);
      return `rgb(${l(r)},${l(g)},${l(b)})`;
    } catch { return hex; }
  };
  const darken = (hex, amt) => {
    try {
      const { r, g, b } = hexToRgb(hex);
      const d = v => Math.max(0, v - amt);
      return `rgb(${d(r)},${d(g)},${d(b)})`;
    } catch { return hex; }
  };

  // getFrameColorHex is imported from utils/colors.js

  const safeFrameColor = getFrameColorHex(frameColor);
  const frameMid = safeFrameColor;
  const frameDark = darken(safeFrameColor, 40);
  const outerFrameColor = darken(safeFrameColor, 60);

  // Dimensioni interne pannello
  const ax = FT;
  const ay = FT;
  const aw = dW - FT * 2;
  const ah = dH - FT * 2; // se ha la soglia sotto. Spesso le blindate hanno la soglia ribassata.

  const handleX = handlePosition === 'left' ? ax + 12 : ax + aw - 12;
  const handleY = ay + ah * 0.55; // Pomolo leggermente più basso del centro visivo
  const hingeX = handlePosition === 'left' ? ax + aw - 2 : ax + 2;

  return (
    <div style={{ width: dW, height: dH + 24, margin: '0 auto', filter: isExporting ? 'none' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))' }}>
      <svg
        width="100%" height="100%"
        viewBox={`0 0 ${dW} ${dH + 24}`}
        style={{ width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="metalG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff"/>
            <stop offset="50%" stopColor="#aaa"/>
            <stop offset="100%" stopColor="#666"/>
          </linearGradient>
          <linearGradient id="brassG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f9d976"/>
            <stop offset="50%" stopColor="#e2b04a"/>
            <stop offset="100%" stopColor="#a37629"/>
          </linearGradient>
        </defs>

        {/* Muro / Ombra dietro (opzionale) */}
        
        {/* TELAIO ESTERNO (Fisso al muro) */}
        <rect x="0" y="0" width={dW} height={dH} fill={outerFrameColor} />
        {/* Riflesso telaio */}
        <rect x="1" y="1" width={dW-2} height={dH-2} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
        <rect x="0" y={dH - 4} width={dW} height={4} fill="#222" /> {/* Soglia inferiore (para-spifferi) */}

        {/* ANTA BLINDATA */}
        <rect x={ax} y={ay} width={aw} height={ah} fill={frameMid} />
        {/* Bordo di battuta in alluminio/metallo scuro */}
        <rect x={ax} y={ay} width={aw} height={ah} fill="none" stroke="#333" strokeWidth="1.5" />
        
        {/* Dettaglio decorativo sul pannello (Rettangolo inciso comune nelle blindate) */}
        <rect x={ax + aw*0.15} y={ay + ah*0.1} width={aw*0.7} height={ah*0.8} rx="3" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>
        <rect x={ax + aw*0.15 + 1} y={ay + ah*0.1 + 1} width={aw*0.7 - 2} height={ah*0.8 - 2} rx="2.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>

        {/* Riflessi della luce sull'anta */}
        <rect x={ax + 1} y={ay + 1} width={aw - 2} height="2" fill="rgba(255,255,255,0.3)" />
        <rect x={ax + 1} y={ay + 1} width="2" height={ah - 2} fill="rgba(255,255,255,0.15)" />

        {/* CERNIERE (Rostri) */}
        {[ay + ah * 0.15, ay + ah * 0.5, ay + ah * 0.85].map((hy, hi) => (
          <g key={hi}>
            <rect x={handlePosition === 'left' ? hingeX - 3 : hingeX - 1} y={hy} width="4" height="12" rx="1.5" fill="url(#metalG)" />
            <circle cx={handlePosition === 'left' ? hingeX - 1 : hingeX + 1} cy={hy + 6} r="1.5" fill="#333" />
          </g>
        ))}

        {/* MANIGLIERIA (Pomolo esterno in ottone/metallo) */}
        <g>
          {/* Base rosetta */}
          <circle cx={handleX} cy={handleY} r="5" fill="url(#brassG)" stroke="rgba(0,0,0,0.5)" strokeWidth="0.5"/>
          {/* Corpo pomolo */}
          <circle cx={handleX} cy={handleY} r="3.5" fill="url(#brassG)" filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.5))"/>
          {/* Highlight pomolo */}
          <circle cx={handleX - 1} cy={handleY - 1} r="1" fill="rgba(255,255,255,0.6)"/>
        </g>

        {/* SERRATURA (Toppa con defender) */}
        <g>
          <circle cx={handleX} cy={handleY + 14} r="4" fill="url(#brassG)" stroke="rgba(0,0,0,0.5)" strokeWidth="0.5"/>
          {/* Defender */}
          <circle cx={handleX} cy={handleY + 14} r="2.5" fill="url(#metalG)" />
          {/* Buco serratura (tipo europeo) */}
          <rect x={handleX - 0.5} y={handleY + 12.5} width="1" height="3" fill="#111" />
          <circle cx={handleX} cy={handleY + 14.5} r="1" fill="#111" />
        </g>

        {/* SPIONCINO */}
        <g>
          <circle cx={ax + aw / 2} cy={ay + ah * 0.3} r="3" fill="url(#brassG)" stroke="rgba(0,0,0,0.5)" strokeWidth="0.5" />
          <circle cx={ax + aw / 2} cy={ay + ah * 0.3} r="1.5" fill="#111" />
          <circle cx={ax + aw / 2 + 0.5} cy={ay + ah * 0.3 - 0.5} r="0.5" fill="rgba(255,255,255,0.6)" />
        </g>

        {/* MANIGLIONE ANTIPANICO (Design Tecnico CISA/Savio) */}
        {maniglioneAntipanico && (() => {
          const pY = ay + ah * 0.6;
          const bracketW = Math.max(10, Math.min(18, aw * 0.1));
          const bracketH = 50;
          
          // Centriamo le basi sui montanti (o ai bordi dell'anta per la blindata)
          const bx1 = ax + 10;
          const bx2 = ax + aw - 10 - bracketW;
          
          // Estensione dei bracci proporzionale
          const armExt = Math.min(bracketW * 1.5, aw * 0.15);
          const barX1 = bx1 + bracketW + armExt;
          const barX2 = bx2 - armExt;
          const barW = Math.max(2, barX2 - barX1);
          const barH = 12;
          
          return (
            <g filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.3))">
              {/* Barra Orizzontale Centrale */}
              <rect x={barX1} y={pY - barH/2} width={barW} height={barH} fill="#f8fafc" stroke="#1e293b" strokeWidth="1"/>

              {/* Supporto Sinistro */}
              <rect x={bx1} y={pY - bracketH/2} width={bracketW} height={bracketH} fill="#475569" stroke="#1e293b" strokeWidth="1"/>
              <path d={`
                M ${bx1+bracketW} ${pY - bracketH*0.15} 
                C ${bx1+bracketW + armExt*0.6} ${pY - bracketH*0.15}, 
                  ${barX1 - armExt*0.2} ${pY - barH/2}, 
                  ${barX1} ${pY - barH/2} 
                L ${barX1} ${pY + barH/2} 
                L ${bx1+bracketW} ${pY + barH/2} 
                Z
              `} fill="#475569" stroke="#1e293b" strokeWidth="1"/>
              {/* Dettaglio serratura */}
              <rect x={bx1 + bracketW*0.2} y={pY - bracketH*0.3} width={bracketW*0.6} height={bracketW*0.6} fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="1,1"/>

              {/* Supporto Destro */}
              <rect x={bx2} y={pY - bracketH/2} width={bracketW} height={bracketH} fill="#475569" stroke="#1e293b" strokeWidth="1"/>
              <path d={`
                M ${bx2} ${pY - bracketH*0.15} 
                C ${bx2 - armExt*0.6} ${pY - bracketH*0.15}, 
                  ${barX2 + armExt*0.2} ${pY - barH/2}, 
                  ${barX2} ${pY - barH/2} 
                L ${barX2} ${pY + barH/2} 
                L ${bx2} ${pY + barH/2} 
                Z
              `} fill="#475569" stroke="#1e293b" strokeWidth="1"/>
            </g>
          );
        })()}

      </svg>
    </div>
  );
}
