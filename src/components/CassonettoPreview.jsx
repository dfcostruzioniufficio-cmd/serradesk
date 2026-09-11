import React from 'react';
import { dimensioniDisegno } from '../lib/scalaDisegno';

export default function CassonettoPreview({
  width = 1000,
  height = 400,
  maxQuoteWidth = null,
  maxQuoteHeight = null,
  isExporting = false
}) {
  const MAX_W = 160;
  const MAX_H = 160;
  
  const w = Number(width) || 1000;
  const h = Number(height) || 400;

  let renderW, renderH;

  if (maxQuoteWidth && maxQuoteHeight) {
    // minLato basso: un cassonetto e' per sua natura molto piu' largo che
    // alto, alzarne il lato corto lo farebbe sbordare dal riquadro.
    ({ dW: renderW, dH: renderH } = dimensioniDisegno({
      width: w, height: h, maxQuoteWidth, maxQuoteHeight,
      maxW: MAX_W, maxH: MAX_H, minLato: 16,
      larghezzaPredefinita: 1000, altezzaPredefinita: 400
    }));
  } else {
    const scale = Math.min(MAX_W / Math.max(1, w), MAX_H / Math.max(1, h));
    renderW = w * scale;
    renderH = h * scale;
  }
  
  renderW = Math.round(renderW);
  renderH = Math.round(renderH);

  return (
    <div style={{ width: renderW, height: renderH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${renderW} ${renderH}`}
        style={{ width: '100%', height: '100%' }}
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
      {/* Outer Rectangle (Cassonetto box) */}
      <rect 
        x="1" 
        y="1" 
        width={renderW - 2} 
        height={renderH - 2} 
        fill="#ffffff" 
        stroke="#333333" 
        strokeWidth="1.5" 
      />
      
      {/* Left Dot */}
      <circle 
        cx={renderW * 0.25} 
        cy={renderH * 0.5} 
        r={Math.min(renderH * 0.05, 3)} 
        fill="#888888" 
      />
      
      {/* Right Dot */}
      <circle 
        cx={renderW * 0.75} 
        cy={renderH * 0.5} 
        r={Math.min(renderH * 0.05, 3)} 
        fill="#888888" 
      />
    </svg>
    </div>
  );
}
