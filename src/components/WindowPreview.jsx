import React from 'react';
import { getFrameColorHex, getAccessoriHex } from '../utils/colors';

/**
 * WindowPreview — Finestra PVC iper-realistica con:
 * - Profili smussati e ombre di profondità 3D
 * - Guarnizioni nere in EPDM visibili
 * - Vetro con riflessi avanzati
 * - Maniglia e cerniere metalliche 3D
 * - Frecce d'apertura e trattini ribalta (mantenute per chiarezza tecnica)
 */
export default function WindowPreview({
  numAnte = 1,
  apertura = 'Battente',
  antaRibalta = false,
  frameColor = 'Bianco',
  accessoriColore = 'Argento',
  width = 1000,
  height = 1000,
  hasTraverso = false,
  traversoHeight = 1000,
  topIsPanel = false,
  bottomIsPanel = false,
  hasSopraluce = false,
  sopraluceHeight = 400,
  handlePosition = 'right',
  paneConfigs = {},
  anteWidths = null,
  maniglioneAntipanico = false,
  maxQuoteWidth = null,
  maxQuoteHeight = null,
  isExporting = false
}) {
  const uid = React.useId().replace(/:/g, ''); 
  const frameHex = getFrameColorHex(frameColor); 
  const anteCount = Math.max(1, Math.min(6, Number(numAnte)));
  const ante = Array.from({ length: anteCount });

  const MAX_W = 160;
  const MAX_H = 200;
  const safeW = Number(width)  || 1000;
  const safeH = Number(height) || 1000;
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
    
    // Prevent elements from becoming too small
    dW = Math.max(50, dW);
    dH = Math.max(50, dH);
  } else {
    if (ratio > MAX_W / MAX_H) { dW = MAX_W; dH = MAX_W / ratio; }
    else { dH = MAX_H; dW = MAX_H * ratio; }
    dW = Math.max(60, dW);
    dH = Math.max(60, dH);
  }

  const getOpeningInfo = (i) => {
    if (apertura === 'Fisso') return { openingEdge: null, hasHandle: false };
    if (paneConfigs && paneConfigs.length > i && 'handleEdge' in paneConfigs[i]) {
      const edge = paneConfigs[i].handleEdge;
      if (edge) return { openingEdge: edge, hasHandle: true };
      if (apertura === 'Battente' || apertura === 'Vasistas' || apertura === 'Bilico') {
        if (anteCount === 1) return { openingEdge: handlePosition === 'right' ? 'right' : 'left', hasHandle: false };
        if (anteCount === 2) {
          if (i === 0) return { openingEdge: 'right', hasHandle: false };
          if (i === 1) return { openingEdge: 'left', hasHandle: false };
        }
        if (i === 0) return { openingEdge: 'right', hasHandle: false };
        if (i === anteCount - 1) return { openingEdge: 'left', hasHandle: false };
      }
      return { openingEdge: null, hasHandle: false };
    }
    if (anteCount === 1) return { openingEdge: handlePosition === 'right' ? 'right' : 'left', hasHandle: true };
    if (anteCount === 2) {
      if (i === 0) return { openingEdge: 'right', hasHandle: handlePosition === 'left' };
      else return { openingEdge: 'left', hasHandle: handlePosition === 'right' };
    }
    if (i === 0) return { openingEdge: 'right', hasHandle: handlePosition === 'left' };
    if (i === anteCount - 1) return { openingEdge: 'left', hasHandle: handlePosition === 'right' };
    return { openingEdge: null, hasHandle: false };
  };

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

  const frameLight  = lighten(frameHex, 60);
  const frameMid    = frameHex;
  const frameDark   = darken(frameHex, 40);
  const frameShadow = darken(frameHex, 70);

  // getAccessoriHex is imported from utils/colors.js
  const accHex = getAccessoriHex(accessoriColore);
  const accDark = darken(accHex, 60);
  const accLight = lighten(accHex, 40);

  dW = Math.round(dW);
  dH = Math.round(dH);

  const FT = Math.max(7, Math.round(dW * 0.055)); 
  const AT = Math.max(5, Math.round(dW * 0.042));
  
  const innerW = dW - FT * 2;
  const innerH = dH - FT * 2;
  const trY = dH - ( (Number(traversoHeight) || 1000) / safeH ) * dH;
  const slY = ( (Number(sopraluceHeight) || 400) / safeH ) * dH;
  
  const rawWidths = (anteWidths && anteWidths.length === anteCount)
    ? anteWidths.map(w => Math.max(1, Number(w) || 1))
    : Array(anteCount).fill(1);
  const totalRaw = rawWidths.reduce((s, w) => s + w, 0);
  const anteRealWidths = rawWidths.map(w => (w / totalRaw) * innerW);
  const anteXPos = anteRealWidths.reduce((acc, w, i) => {
    acc.push(FT + (i === 0 ? 0 : acc[i-1] + anteRealWidths[i-1]));
    return acc;
  }, []);

  const renderOpeningLines = (ax, ay, aw, ah, i) => {
    const { openingEdge: edge, hasHandle } = getOpeningInfo(i);
    if (!edge) return null;
    return (
      <path d={edge === 'right' ? `M${ax+aw} ${ay} L${ax+aw/2} ${ay+ah/2} L${ax+aw} ${ay+ah}` : `M${ax} ${ay} L${ax+aw/2} ${ay+ah/2} L${ax} ${ay+ah}`} fill="none" stroke={accDark} strokeWidth="1" strokeDasharray="2 2" />
    );
  };
  const renderHandle = (ax, ay, aw, ah, i) => {
    const { hasHandle } = getOpeningInfo(i);
    if (!hasHandle) return null;
    const hx = (getOpeningInfo(i).openingEdge === 'right') ? ax + aw - 5 : ax + 5;
    return <rect x={hx-2} y={ay+ah/2-10} width="4" height="20" fill={`url(#accG_${uid})`} />;
  };

  return (
    <div style={{ width: dW, height: dH + 24, margin: '0 auto', filter: isExporting ? 'none' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}>
      <svg
        width="100%" height="100%"
        style={{ width: '100%', height: '100%' }}
        viewBox={`0 0 ${dW} ${dH + 24}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`glassGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#cbebf7" stopOpacity="0.95"/>
            <stop offset="40%"  stopColor="#e3f3f9" stopOpacity="0.80"/>
            <stop offset="60%"  stopColor="#99cde3" stopOpacity="0.90"/>
            <stop offset="100%" stopColor="#75b0cc" stopOpacity="0.98"/>
          </linearGradient>
          <linearGradient id={`glassShine_${uid}`} x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.8"/>
            <stop offset="15%"  stopColor="white" stopOpacity="0.0"/>
            <stop offset="22%"  stopColor="white" stopOpacity="0.5"/>
            <stop offset="25%"  stopColor="white" stopOpacity="0.0"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id={`frameTop_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={lighten(frameHex, 80)}/>
            <stop offset="30%"  stopColor={frameLight}/>
            <stop offset="100%" stopColor={frameMid}/>
          </linearGradient>
          <linearGradient id={`frameLeft_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={lighten(frameHex, 70)}/>
            <stop offset="30%"  stopColor={frameLight}/>
            <stop offset="100%" stopColor={frameMid}/>
          </linearGradient>
          <linearGradient id={`frameRight_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={frameMid}/>
            <stop offset="70%"  stopColor={frameDark}/>
            <stop offset="100%" stopColor={darken(frameHex, 60)}/>
          </linearGradient>
          <linearGradient id={`frameBottom_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={frameMid}/>
            <stop offset="70%"  stopColor={frameDark}/>
            <stop offset="100%" stopColor={darken(frameHex, 80)}/>
          </linearGradient>

          <linearGradient id={`metalCilinder_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={accDark}/>
            <stop offset="20%"  stopColor={accLight}/>
            <stop offset="50%"  stopColor={accHex}/>
            <stop offset="80%"  stopColor={accLight}/>
            <stop offset="100%" stopColor={accDark}/>
          </linearGradient>
          <linearGradient id={`metalCilinderV_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={accDark}/>
            <stop offset="20%"  stopColor={accLight}/>
            <stop offset="50%"  stopColor={accHex}/>
            <stop offset="80%"  stopColor={accLight}/>
            <stop offset="80%"  stopColor={accLight}/>
            <stop offset="100%" stopColor={accDark}/>
          </linearGradient>

          <pattern id={`louver_${uid}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill={frameMid} />
            <line x1="0" y1="8" x2="10" y2="8" stroke={frameShadow} strokeWidth="1" />
            <line x1="0" y1="9" x2="10" y2="9" stroke={frameLight} strokeWidth="1" />
          </pattern>
        </defs>

        {/* ── TELAIO ESTERNO ── */}
        <rect x="0" y="0" width={dW} height={dH} fill={frameMid}/>
        <rect x="0" y="0" width={dW} height={FT} fill={`url(#frameTop_${uid})`}/>
        <rect x="0" y="0" width={FT} height={dH} fill={`url(#frameLeft_${uid})`}/>
        <rect x={dW-FT} y="0" width={FT} height={dH} fill={`url(#frameRight_${uid})`}/>
        <rect x="0" y={dH-FT} width={dW} height={FT} fill={`url(#frameBottom_${uid})`}/>
        
        {/* Bordo perimetrale esterno (evita che il bianco si perda nello sfondo) */}
        <rect x="0.5" y="0.5" width={dW-1} height={dH-1} fill="none" stroke="#cbd5e1" strokeWidth="1"/>
        
        {/* Smusso interno telaio fisso */}
        <rect x={FT-1} y={FT-1} width={dW-FT*2+2} height={dH-FT*2+2} fill="none" stroke={frameShadow} strokeWidth="1.5"/>
        <rect x={FT} y={FT} width={dW-FT*2} height={dH-FT*2} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="3"/>

        {/* ── SOPRALUCE ── */}
        {hasSopraluce && (() => {
          const realH = Math.max(1, safeH);
          const rawSH = Number(sopraluceHeight) || 400;
          const clampedSH = Math.min(rawSH, realH * 0.7); 
          const sSvgH = (clampedSH / realH) * dH;
          const sW = Math.max(0, dW - FT * 2);
          const sInnerH = Math.max(0, sSvgH - (FT * 1.5)); 
          
          return (
            <g>
              <rect x={0} y={sSvgH - FT/2} width={dW} height={FT} fill={frameMid}/>
              <rect x={0} y={sSvgH - FT/2} width={dW} height={2} fill={`url(#frameTop_${uid})`}/>
              <rect x={0} y={sSvgH + FT/2 - 2} width={dW} height={2} fill={`url(#frameBottom_${uid})`}/>
              
              {sW > 0 && sInnerH > 0 && (
                <g>
                   <rect x={FT} y={FT} width={sW} height={sInnerH} fill={`url(#glassGrad_${uid})`}/>
                   <rect x={FT} y={FT} width={sW} height={sInnerH} fill={`url(#glassShine_${uid})`}/>
                   <rect x={FT} y={FT} width={sW} height={sInnerH} fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round"/>
                </g>
              )}
            </g>
          );
        })()}

        {/* ── ANTE ── */}
        {ante.map((_, i) => {
          const { openingEdge: edge, hasHandle } = getOpeningInfo(i);
          const showRibalta = antaRibalta && edge && (edge === 'left' || edge === 'right') && hasHandle;
          const innerW = dW - FT * 2;

          const rawWidths = (anteWidths && anteWidths.length === anteCount)
            ? anteWidths.map(w => Math.max(1, Number(w) || 1))
            : Array(anteCount).fill(1);
          const totalRaw = rawWidths.reduce((s, w) => s + w, 0);
          const scaledWidths = rawWidths.map(w => (w / totalRaw) * innerW);
          const antaW = scaledWidths[i];
          const ax = FT + scaledWidths.slice(0, i).reduce((s, w) => s + w, 0);
          
          const realH = Math.max(1, safeH);
          const sSvgH = hasSopraluce ? ((Math.min(Number(sopraluceHeight) || 400, realH * 0.7) / realH) * dH) : 0;
          
          const ay = hasSopraluce ? sSvgH + FT/2 : FT;
          const aw = Math.max(0, antaW);
          const ah = Math.max(0, dH - FT - ay); 
          const isLast = i === anteCount - 1;
          const sepX = ax + aw;
          const paneAT = edge ? AT : 0;
          const gx = ax + paneAT, gy = ay + paneAT, gw = Math.max(0, aw - paneAT * 2), gh = Math.max(0, ah - paneAT * 2);

          const tH = Number(traversoHeight) || 1000;
          const pctTraverso = Math.max(0.1, Math.min(0.9, 1 - (tH / safeH)));
          const traversoY = ay + ah * pctTraverso;

          return (
            <g key={i}>
              {!isLast && (
                <>
                  <rect x={sepX - FT/2} y={ay} width={FT} height={ah} fill={frameMid}/>
                  <rect x={sepX - FT/2} y={ay} width={2} height={ah} fill={`url(#frameLeft_${uid})`}/>
                  <rect x={sepX + FT/2 - 2} y={ay} width={2} height={ah} fill={`url(#frameRight_${uid})`}/>
                  <rect x={sepX - FT/2 - 1} y={ay} width={FT+2} height={ah} fill="none" stroke={frameShadow} strokeWidth="1"/>
                </>
              )}

              {edge && (
                <>
                  <rect x={ax} y={ay} width={aw} height={ah} fill={frameMid}/>
                  <rect x={ax} y={ay} width={aw} height={paneAT} fill={`url(#frameTop_${uid})`}/>
                  <rect x={ax} y={ay} width={paneAT} height={ah} fill={`url(#frameLeft_${uid})`}/>
                  <rect x={ax+aw-paneAT} y={ay} width={paneAT} height={ah} fill={`url(#frameRight_${uid})`}/>
                  <rect x={ax} y={ay+ah-paneAT} width={aw} height={paneAT} fill={`url(#frameBottom_${uid})`}/>
                  <rect x={ax+paneAT-1} y={ay+paneAT-1} width={gw+2} height={gh+2} fill="none" stroke={frameShadow} strokeWidth="1.2"/>
                  {/* Ombra di profondità interna dell'anta */}
                  <rect x={ax+paneAT} y={ay+paneAT} width={gw} height={gh} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="3"/>
                </>
              )}

              {gw > 0 && gh > 0 && (
                <>
                  {hasTraverso ? (
                    <>
                      {topIsPanel ? (
                        <>
                          <rect x={gx} y={gy} width={gw} height={traversoY - gy} fill={frameMid}/>
                          <rect x={gx+3} y={gy+3} width={gw-6} height={traversoY - gy - 6} fill={frameHex}/>
                        </>
                      ) : (
                        <>
                          <rect x={gx} y={gy} width={gw} height={traversoY - gy} fill={`url(#glassGrad_${uid})`}/>
                          <rect x={gx} y={gy} width={gw} height={traversoY - gy} fill={`url(#glassShine_${uid})`}/>
                        </>
                      )}
                      
                      {bottomIsPanel ? (
                        <>
                          <rect x={gx} y={traversoY} width={gw} height={gy + gh - traversoY} fill={frameMid}/>
                          <rect x={gx+3} y={traversoY+3} width={gw-6} height={gy + gh - traversoY - 6} fill={frameHex}/>
                        </>
                      ) : (
                        <>
                          <rect x={gx} y={traversoY} width={gw} height={gy + gh - traversoY} fill={`url(#glassGrad_${uid})`}/>
                          <rect x={gx} y={traversoY} width={gw} height={gy + gh - traversoY} fill={`url(#glassShine_${uid})`}/>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {topIsPanel || apertura === 'Porta Blindata' ? (
                        <>
                          <rect x={gx} y={gy} width={gw} height={gh} fill={frameMid}/>
                          <rect x={gx+3} y={gy+3} width={gw-6} height={gh-6} fill={frameHex}/>
                        </>
                      ) : apertura === 'Persiana' ? (
                        <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#louver_${uid})`}/>
                      ) : (
                        <>
                          <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#glassGrad_${uid})`}/>
                          <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#glassShine_${uid})`}/>
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Guarnizione in EPDM Nera Iper-Realistica */}
                  <rect x={gx} y={gy} width={gw} height={gh} fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
                  <rect x={gx+1} y={gy+1} width={gw-2} height={gh-2} fill="none" stroke="#444" strokeWidth="0.5" strokeLinejoin="round" opacity="0.8"/>
                </>
              )}

              {hasTraverso && (
                <>
                  <rect x={ax} y={traversoY - FT/2} width={aw} height={FT} fill={frameMid}/>
                  <rect x={ax} y={traversoY - FT/2} width={aw} height={2} fill={`url(#frameTop_${uid})`}/>
                  <rect x={ax} y={traversoY + FT/2 - 2} width={aw} height={2} fill={`url(#frameBottom_${uid})`}/>
                  <rect x={ax} y={traversoY - FT/2} width={aw} height={FT} fill="none" stroke={frameShadow} strokeWidth="0.8"/>
                </>
              )}

              {edge && gw > 0 && gh > 0 && (() => {
                const mx = gx + gw / 2, my = gy + gh / 2;
                const cx = edge === 'right' ? gx + gw - 4 : edge === 'left' ? gx + 4 : mx;
                const cy = edge === 'bottom' ? gy + gh - 4 : edge === 'top' ? gy + 4 : my;
                const color = 'rgba(20,80,160,0.6)';
                const sw = 1.5;
                const da = '4,3';
                
                if (apertura === 'Scorrevole') {
                  const arrowColor = 'rgba(20,80,160,0.8)';
                  const aY = my;
                  const aX1 = mx - 12;
                  const aX2 = mx + 12;
                  return (
                    <g stroke={arrowColor} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <line x1={aX1} y1={aY} x2={aX2} y2={aY} />
                      <polyline points={`${aX1+4},${aY-3} ${aX1},${aY} ${aX1+4},${aY+3}`} />
                      <polyline points={`${aX2-4},${aY-3} ${aX2},${aY} ${aX2-4},${aY+3}`} />
                    </g>
                  );
                }

                let hx1, hy1, hx2, hy2;
                if (edge === 'right' || edge === 'left') {
                  const hingeX = edge === 'right' ? gx + 4 : gx + gw - 4;
                  hx1 = hingeX; hy1 = gy + 4;
                  hx2 = hingeX; hy2 = gy + gh - 4;
                } else if (edge === 'bottom') {
                  hx1 = gx + 4; hy1 = gy + 4;
                  hx2 = gx + gw - 4; hy2 = gy + 4;
                } else {
                  hx1 = gx + 4; hy1 = gy + gh - 4;
                  hx2 = gx + gw - 4; hy2 = gy + gh - 4;
                }

                return (
                  <>
                    <line x1={cx} y1={cy} x2={hx1} y2={hy1} stroke={color} strokeWidth={sw} strokeDasharray={da}/>
                    <line x1={cx} y1={cy} x2={hx2} y2={hy2} stroke={color} strokeWidth={sw} strokeDasharray={da}/>
                    {showRibalta && (
                      <>
                        <line x1={mx} y1={gy+4} x2={gx+4}    y2={gy+gh-4} stroke={color} strokeWidth={sw} strokeDasharray={da}/>
                        <line x1={mx} y1={gy+4} x2={gx+gw-4} y2={gy+gh-4} stroke={color} strokeWidth={sw} strokeDasharray={da}/>
                      </>
                    )}
                  </>
                );
              })()}

              {/* ── CERNIERE 3D ── */}
              {edge && apertura !== 'Scorrevole' && (() => {
                const hingeX = edge === 'right' ? ax + 1 : edge === 'left' ? ax + aw - 5 : null;
                if (!hingeX) return null;
                const hinge = (y) => (
                  <g key={y} filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.4))">
                    <rect x={hingeX} y={y} width={5} height={14} rx="2" fill={`url(#metalCilinder_${uid})`} stroke={darken(accHex, 80)} strokeWidth="0.5"/>
                    <rect x={hingeX+1} y={y-2} width={3} height={18} rx="1.5" fill={accLight} stroke={darken(accHex, 60)} strokeWidth="0.5"/>
                  </g>
                );
                return <>{hinge(ay + ah * 0.15)} {hinge(ay + ah * 0.80)}</>;
              })()}

              {/* ── MANIGLIA CREMONESE 3D ── */}
              {edge && hasHandle && (() => {
                const isV = edge === 'right' || edge === 'left';
                const hx = edge === 'right' ? ax + aw - AT - 2
                         : edge === 'left'  ? ax + AT - 4
                         : ax + aw / 2 - 5;
                const hy = edge === 'right' || edge === 'left'
                         ? ay + ah * 0.5 - 16
                         : edge === 'top' ? ay + AT
                         : ay + ah - AT - 4;

                if (apertura === 'Scorrevole') {
                  return (
                    <g filter="drop-shadow(2px 3px 3px rgba(0,0,0,0.4))">
                      <rect x={edge==='right'?hx-2:hx+2} y={hy-10} width={6} height={52} rx="3" fill={`url(#metalCilinder_${uid})`} stroke={darken(accHex, 70)} strokeWidth="0.5"/>
                      <line x1={edge==='right'?hx+1:hx+3} y1={hy-6} x2={edge==='right'?hx+1:hx+3} y2={hy+38} stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                    </g>
                  );
                }

                return (
                  <g filter="drop-shadow(2px 3px 3px rgba(0,0,0,0.5))">
                    {isV ? (
                      <rect x={hx-1} y={hy} width={8} height={28} rx="4"
                        fill={`url(#metalCilinder_${uid})`} stroke={darken(accHex, 80)} strokeWidth="0.5"/>
                    ) : (
                      <rect x={hx} y={hy-1} width={28} height={8} rx="4"
                        fill={`url(#metalCilinderV_${uid})`} stroke={darken(accHex, 80)} strokeWidth="0.5"/>
                    )}
                    <circle cx={hx+3} cy={hy+14} r="3.5" fill={accDark}/>
                    {isV ? (
                      <>
                        <rect x={hx-6} y={hy+11} width={16} height={6} rx="3"
                          fill={`url(#metalCilinderV_${uid})`} stroke={darken(accHex, 70)} strokeWidth="0.5"/>
                        <path d={`M ${hx-4} ${hy+12} Q ${hx} ${hy+12.5} ${hx+8} ${hy+12}`} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      </>
                    ) : (
                      <>
                        <rect x={hx+11} y={hy-6} width={6} height={16} rx="3"
                          fill={`url(#metalCilinder_${uid})`} stroke={darken(accHex, 70)} strokeWidth="0.5"/>
                        <path d={`M ${hx+12} ${hy-4} Q ${hx+12.5} ${hy} ${hx+12} ${hy+8}`} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      </>
                    )}
                  </g>
                );
              })()}

              {/* ── MANIGLIONE ANTIPANICO (Design Tecnico CISA/Savio) ── */}
              {maniglioneAntipanico && (() => {
                const pY = ay + ah * 0.6;
                const bracketW = Math.max(8, Math.min(14, aw * 0.1));
                const bracketH = 46;
                
                // Centriamo le basi sui montanti dell'anta
                const bx1 = ax + AT * 0.5 - bracketW / 2;
                const bx2 = ax + aw - AT * 0.5 - bracketW / 2;
                
                // Estensione dei bracci proporzionale
                const armExt = Math.min(bracketW * 1.5, aw * 0.15);
                const barX1 = bx1 + bracketW + armExt;
                const barX2 = bx2 - armExt;
                const barW = Math.max(2, barX2 - barX1);
                const barH = 10;
                
                return (
                  <g filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.3))">
                    {/* Barra Orizzontale Centrale */}
                    <rect x={barX1} y={pY - barH/2} width={barW} height={barH} fill="#f8fafc" stroke="#1e293b" strokeWidth="1"/>

                    {/* Supporto Sinistro (Base + Braccio curvo) */}
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

                    {/* Supporto Destro (Base + Braccio curvo) */}
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
            </g>
          );
        })}
      </svg>
    </div>
  );
}
