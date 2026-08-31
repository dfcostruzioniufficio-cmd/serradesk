import React from 'react';

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
    const maxSafeW = Number(maxQuoteWidth) || 1000;
    const maxSafeH = Number(maxQuoteHeight) || 1000;
    const maxScale = Math.min(MAX_W / Math.max(1, maxSafeW), MAX_H / Math.max(1, maxSafeH));
    
    // Scale everything relative to the max object
    renderW = w * maxScale;
    renderH = h * maxScale;
    
    renderW = Math.max(50, renderW);
    renderH = Math.max(20, renderH); // Cassonetti can be very short
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
