import React from 'react';
import { getFrameColorHex, getAccessoriHex } from '../utils/colors';
import { dimensioniDisegno } from '../lib/scalaDisegno';
import { vistaProfili } from '../utils/trasmittanza';
import { geometria } from '../utils/disegnoLibero';

/**
 * Il disegno di un serramento fatto col disegno libero (utils/disegnoLibero),
 * con lo stesso aspetto di WindowPreview: telaio con le sfumature, vetro con
 * il riflesso, ante con guarnizione, cerniere e maniglia, tratteggio
 * d'apertura col vertice dal lato della maniglia.
 *
 * Nel PDF sta nella cella di 142x200 come gli altri disegni. Nel modulo si
 * disegna piu' grande e si tocca: un vano o una divisione si selezionano
 * (onSeleziona) e si modificano dal pannello accanto.
 *
 * Sotto il disegno le larghezze dei vani che stanno in basso, a destra le
 * altezze di quelli sul lato destro: il cliente deve vedere quale vano e'
 * quello da 400.
 */
export default function DisegnoLiberoPreview({
  disegno,
  width = 1000,
  height = 1000,
  frameColor = 'Bianco',
  accessoriColore = 'Argento',
  profilo = null,
  maxQuoteWidth = null,
  maxQuoteHeight = null,
  maxW = 142,
  maxH = 200,
  isExporting = false,
  selezionato = null,
  onSeleziona = null,
}) {
  const uid = React.useId().replace(/:/g, '');
  const W = Number(width) || 1000;
  const H = Number(height) || 1000;
  const { vani, divisioni } = geometria(disegno, W, H);

  const vaniBasso = vani.filter((v) => v.telaio.sotto).sort((a, b) => a.x - b.x);
  const vaniDestra = vani.filter((v) => v.telaio.destra).sort((a, b) => a.y - b.y);
  const quoteSotto = vaniBasso.length > 1;
  const quoteDestra = vaniDestra.length > 1;
  const interattivo = typeof onSeleziona === 'function';
  // La striscia delle quote, in proporzione al disegno: nel modulo, dove il
  // disegno e' grande, le misure si leggono senza avvicinarsi.
  const STRISCIA = interattivo ? 30 : 24;
  const RS = quoteDestra ? (interattivo ? 34 : 18) : 0;

  const { dW, dH } = dimensioniDisegno({
    width: W, height: H, maxQuoteWidth, maxQuoteHeight,
    maxW: maxW - RS, maxH,
    larghezzaPredefinita: 1000, altezzaPredefinita: 1000,
  });
  const k = Math.min(dW / W, dH / H);

  const frameHex = getFrameColorHex(frameColor);
  const accHex = getAccessoriHex(accessoriColore);
  const rgb = (hex) => {
    let h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return n.some(Number.isNaN) ? [90, 90, 90] : n;
  };
  const schiarisci = (hex, a) => `rgb(${rgb(hex).map((v) => Math.min(255, v + a)).join(',')})`;
  const scurisci = (hex, a) => `rgb(${rgb(hex).map((v) => Math.max(0, v - a)).join(',')})`;
  const frameMid = frameHex;
  const frameLight = schiarisci(frameHex, 60);
  const frameDark = scurisci(frameHex, 40);
  const frameShadow = scurisci(frameHex, 70);
  const accDark = scurisci(accHex, 60);
  const accLight = schiarisci(accHex, 40);

  // Spessori dei profili nella scala vera, come in WindowPreview: lato del
  // telaio, anta, e divisioni (montanti e traversi del telaio).
  const vista = vistaProfili(profilo);
  const latoPx = vista.lato * k;
  const AT = Math.max(2.5, Math.min(latoPx * 0.75, (vista.nodo / 2) * k));
  const FT = Math.max(2.5, latoPx - AT);
  const TT = Math.max(2.5, vista.traverso * k);
  const scalaFerramenta = (aw, ah) => Math.max(0.35, Math.min(1, ah / 110, aw / 55));

  const colore = 'rgba(20,80,160,0.6)';
  const coloreQuote = '#475569';
  const blu = '#2563eb';

  const e = (sel, tipo, percorso) => sel && sel.tipo === tipo && sel.percorso === percorso;

  return (
    <div style={{ width: dW + RS, height: dH + STRISCIA, margin: '0 auto', filter: isExporting ? 'none' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}>
      <svg width="100%" height="100%" style={{ width: '100%', height: '100%', overflow: 'visible' }} viewBox={`0 0 ${dW + RS} ${dH + STRISCIA}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`vetro_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbebf7" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#e3f3f9" stopOpacity="0.80" />
            <stop offset="60%" stopColor="#99cde3" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#75b0cc" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id={`riflesso_${uid}`} x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="15%" stopColor="white" stopOpacity="0" />
            <stop offset="22%" stopColor="white" stopOpacity="0.5" />
            <stop offset="25%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`alto_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={schiarisci(frameHex, 80)} />
            <stop offset="30%" stopColor={frameLight} />
            <stop offset="100%" stopColor={frameMid} />
          </linearGradient>
          <linearGradient id={`sinistra_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={schiarisci(frameHex, 70)} />
            <stop offset="30%" stopColor={frameLight} />
            <stop offset="100%" stopColor={frameMid} />
          </linearGradient>
          <linearGradient id={`destra_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={frameMid} />
            <stop offset="70%" stopColor={frameDark} />
            <stop offset="100%" stopColor={scurisci(frameHex, 60)} />
          </linearGradient>
          <linearGradient id={`basso_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={frameMid} />
            <stop offset="70%" stopColor={frameDark} />
            <stop offset="100%" stopColor={scurisci(frameHex, 80)} />
          </linearGradient>
          <linearGradient id={`metallo_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accDark} />
            <stop offset="20%" stopColor={accLight} />
            <stop offset="50%" stopColor={accHex} />
            <stop offset="80%" stopColor={accLight} />
            <stop offset="100%" stopColor={accDark} />
          </linearGradient>
          <linearGradient id={`metalloV_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={accDark} />
            <stop offset="20%" stopColor={accLight} />
            <stop offset="50%" stopColor={accHex} />
            <stop offset="80%" stopColor={accLight} />
            <stop offset="100%" stopColor={accDark} />
          </linearGradient>
        </defs>

        {/* ── TELAIO ── */}
        <rect x="0" y="0" width={dW} height={dH} fill={frameMid} />
        <rect x="0" y="0" width={dW} height={FT} fill={`url(#alto_${uid})`} />
        <rect x="0" y="0" width={FT} height={dH} fill={`url(#sinistra_${uid})`} />
        <rect x={dW - FT} y="0" width={FT} height={dH} fill={`url(#destra_${uid})`} />
        <rect x="0" y={dH - FT} width={dW} height={FT} fill={`url(#basso_${uid})`} />
        <rect x="0.5" y="0.5" width={dW - 1} height={dH - 1} fill="none" stroke="#cbd5e1" strokeWidth="1" />

        {/* ── VANI ── */}
        {vani.map((v) => {
          // La luce del vano: meno il telaio sui lati esterni, meno meta'
          // divisione sui lati interni.
          const sx = v.telaio.sinistra ? FT : TT / 2;
          const dx = v.telaio.destra ? FT : TT / 2;
          const su = v.telaio.sopra ? FT : TT / 2;
          const giu = v.telaio.sotto ? FT : TT / 2;
          const ax = v.x * k + sx;
          const ay = v.y * k + su;
          const aw = Math.max(0, v.w * k - sx - dx);
          const ah = Math.max(0, v.h * k - su - giu);
          const apribile = v.apertura !== 'fissa';
          const t = apribile ? AT : 0;
          const gx = ax + t;
          const gy = ay + t;
          const gw = Math.max(0, aw - 2 * t);
          const gh = Math.max(0, ah - 2 * t);
          const kTratto = Math.max(0.4, Math.min(1, gw / 55));
          const vas = v.apertura === 'vasistas';
          const rib = vas || v.apertura === 'ribalta';
          const destra = v.lato !== 'left';
          const kF = scalaFerramenta(aw, ah);
          return (
            <g key={v.percorso || 'telaio'}>
              <rect x={ax - 1} y={ay - 1} width={aw + 2} height={ah + 2} fill="none" stroke={frameShadow} strokeWidth="1.2" />
              {apribile && aw > 0 && ah > 0 && (
                <>
                  <rect x={ax} y={ay} width={aw} height={ah} fill={frameMid} />
                  <rect x={ax} y={ay} width={aw} height={t} fill={`url(#alto_${uid})`} />
                  <rect x={ax} y={ay} width={t} height={ah} fill={`url(#sinistra_${uid})`} />
                  <rect x={ax + aw - t} y={ay} width={t} height={ah} fill={`url(#destra_${uid})`} />
                  <rect x={ax} y={ay + ah - t} width={aw} height={t} fill={`url(#basso_${uid})`} />
                  <rect x={gx - 1} y={gy - 1} width={gw + 2} height={gh + 2} fill="none" stroke={frameShadow} strokeWidth={1.2 * kTratto} />
                </>
              )}
              {gw > 0 && gh > 0 && (
                <>
                  <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#vetro_${uid})`} />
                  <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#riflesso_${uid})`} />
                  <rect x={gx} y={gy} width={gw} height={gh} fill="none" stroke="#1a1a1a" strokeWidth={2.5 * kTratto} strokeLinejoin="round" />
                </>
              )}

              {/* Tratteggio: battente col vertice dal lato della maniglia,
                  ribalta col vertice in alto, vasistas solo la ribalta. */}
              {apribile && gw > 8 && gh > 8 && (
                <g stroke={colore} strokeWidth="1.5" strokeDasharray="4,3" fill="none">
                  {!vas && (
                    <>
                      <line x1={destra ? gx + gw - 4 : gx + 4} y1={gy + gh / 2} x2={destra ? gx + 4 : gx + gw - 4} y2={gy + 4} />
                      <line x1={destra ? gx + gw - 4 : gx + 4} y1={gy + gh / 2} x2={destra ? gx + 4 : gx + gw - 4} y2={gy + gh - 4} />
                    </>
                  )}
                  {rib && (
                    <>
                      <line x1={gx + gw / 2} y1={gy + 4} x2={gx + 4} y2={gy + gh - 4} />
                      <line x1={gx + gw / 2} y1={gy + 4} x2={gx + gw - 4} y2={gy + gh - 4} />
                    </>
                  )}
                </g>
              )}

              {/* Cerniere: di lato sul battente, in basso sul vasistas. */}
              {apribile && aw > 8 && ah > 8 && (vas
                ? [ax + aw * 0.18, ax + aw * 0.72].map((cx) => (
                  <rect key={cx} x={cx} y={ay + ah - 5} width={14 * kF} height={4} rx="1.5" fill={`url(#metalloV_${uid})`} stroke={scurisci(accHex, 80)} strokeWidth="0.4" />
                ))
                // Oltre i due metri l'anta ha la terza cerniera, come in
                // WindowPreview.
                : (v.h >= 2000 ? [0.10, 0.46, 0.82] : [0.15, 0.80]).map((p) => ay + ah * p).map((cy) => (
                  <rect key={cy} x={destra ? ax + 1 : ax + aw - 5} y={cy} width={4} height={14 * kF} rx="1.5" fill={`url(#metallo_${uid})`} stroke={scurisci(accHex, 80)} strokeWidth="0.4" />
                )))}

              {/* Maniglia: sul lato del vertice, in alto al centro sul vasistas. */}
              {apribile && aw > 8 && ah > 8 && (vas ? (
                <rect x={ax + aw / 2 - 12 * kF} y={ay + Math.max(1, t / 2 - 3)} width={24 * kF} height={6 * kF} rx="3" fill={`url(#metalloV_${uid})`} stroke={scurisci(accHex, 70)} strokeWidth="0.5" />
              ) : (
                <rect x={destra ? ax + aw - t / 2 - 3 * kF : ax + t / 2 - 3 * kF} y={ay + ah / 2 - 12 * kF} width={6 * kF} height={24 * kF} rx="3" fill={`url(#metallo_${uid})`} stroke={scurisci(accHex, 70)} strokeWidth="0.5" />
              ))}

              {/* Il numero del vano, lo stesso della descrizione. */}
              {vani.length > 1 && gw > 14 && gh > 14 && (() => {
                const r = interattivo ? 9 : 5.5;
                return (
                  <g>
                    <circle cx={gx + r + 2} cy={gy + r + 2} r={r} fill="white" fillOpacity="0.9" stroke={coloreQuote} strokeWidth="0.6" />
                    <text x={gx + r + 2} y={gy + r + 2 + r * 0.38} textAnchor="middle" fontSize={r * 1.1} fontWeight="700" fill="#1e293b" fontFamily="sans-serif">{v.numero}</text>
                  </g>
                );
              })()}

              {interattivo && (
                <rect
                  x={v.x * k} y={v.y * k} width={v.w * k} height={v.h * k}
                  fill={e(selezionato, 'vano', v.percorso) ? 'rgba(37,99,235,0.18)' : 'transparent'}
                  stroke={e(selezionato, 'vano', v.percorso) ? blu : 'none'} strokeWidth="2.5"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSeleziona({ tipo: 'vano', percorso: v.percorso })}
                />
              )}
            </g>
          );
        })}

        {/* ── MONTANTI E TRAVERSI ── */}
        {divisioni.map((d) => {
          const sel = e(selezionato, 'divisione', d.percorso);
          if (d.tipo === 'montante') {
            const x = d.x * k - TT / 2;
            const y0 = d.parte.y * k + (d.parte.y <= 0.5 ? FT : 0);
            const y1 = (d.parte.y + d.parte.h) * k - ((d.parte.y + d.parte.h) >= H - 0.5 ? FT : 0);
            return (
              <g key={`d${d.percorso}`}>
                <rect x={x} y={y0} width={TT} height={Math.max(0, y1 - y0)} fill={frameMid} stroke={frameShadow} strokeWidth="0.8" />
                <rect x={x} y={y0} width={2} height={Math.max(0, y1 - y0)} fill={`url(#sinistra_${uid})`} />
                <rect x={x + TT - 2} y={y0} width={2} height={Math.max(0, y1 - y0)} fill={`url(#destra_${uid})`} />
                {interattivo && (
                  <rect x={x - 6} y={y0} width={TT + 12} height={Math.max(0, y1 - y0)}
                    fill={sel ? 'rgba(234,88,12,0.35)' : 'transparent'} stroke={sel ? '#ea580c' : 'none'} strokeWidth="2"
                    style={{ cursor: 'ew-resize' }}
                    onClick={(ev) => { ev.stopPropagation(); onSeleziona({ tipo: 'divisione', percorso: d.percorso }); }} />
                )}
              </g>
            );
          }
          const y = d.y * k - TT / 2;
          const x0 = d.parte.x * k + (d.parte.x <= 0.5 ? FT : 0);
          const x1 = (d.parte.x + d.parte.w) * k - ((d.parte.x + d.parte.w) >= W - 0.5 ? FT : 0);
          return (
            <g key={`d${d.percorso}`}>
              <rect x={x0} y={y} width={Math.max(0, x1 - x0)} height={TT} fill={frameMid} stroke={frameShadow} strokeWidth="0.8" />
              <rect x={x0} y={y} width={Math.max(0, x1 - x0)} height={2} fill={`url(#alto_${uid})`} />
              <rect x={x0} y={y + TT - 2} width={Math.max(0, x1 - x0)} height={2} fill={`url(#basso_${uid})`} />
              {interattivo && (
                <rect x={x0} y={y - 6} width={Math.max(0, x1 - x0)} height={TT + 12}
                  fill={sel ? 'rgba(234,88,12,0.35)' : 'transparent'} stroke={sel ? '#ea580c' : 'none'} strokeWidth="2"
                  style={{ cursor: 'ns-resize' }}
                  onClick={(ev) => { ev.stopPropagation(); onSeleziona({ tipo: 'divisione', percorso: d.percorso }); }} />
              )}
            </g>
          );
        })}

        {/* ── QUOTE ── */}
        {quoteSotto && (() => {
          const y = dH + (interattivo ? 9 : 7);
          return (
            <g>
              {vaniBasso.map((v) => {
                const x0 = v.x * k;
                const x1 = (v.x + v.w) * k;
                const testo = String(Math.round(v.w));
                const fs = interattivo ? 11 : Math.max(5, Math.min(8, (x1 - x0) / (testo.length * 0.62 + 0.8)));
                return (
                  <g key={`qs${v.percorso}`}>
                    <line x1={x0 + 0.5} y1={y} x2={x1 - 0.5} y2={y} stroke={coloreQuote} strokeWidth="0.6" />
                    <line x1={x0 + 0.5} y1={y - 2.5} x2={x0 + 0.5} y2={y + 2.5} stroke={coloreQuote} strokeWidth="0.6" />
                    <line x1={x1 - 0.5} y1={y - 2.5} x2={x1 - 0.5} y2={y + 2.5} stroke={coloreQuote} strokeWidth="0.6" />
                    <text x={(x0 + x1) / 2} y={y + 3 + fs} textAnchor="middle" fontSize={fs} fill={coloreQuote} fontFamily="sans-serif" fontWeight="600">{testo}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}
        {quoteDestra && (() => {
          const x = dW + (interattivo ? 8 : 5);
          return (
            <g>
              {vaniDestra.map((v) => {
                const y0 = v.y * k;
                const y1 = (v.y + v.h) * k;
                const testo = String(Math.round(v.h));
                const fs = interattivo ? 11 : Math.max(5, Math.min(8, (y1 - y0) / (testo.length * 0.62 + 0.8)));
                const cx = x + 3 + fs * 0.9;
                const cy = (y0 + y1) / 2;
                return (
                  <g key={`qd${v.percorso}`}>
                    <line x1={x} y1={y0 + 0.5} x2={x} y2={y1 - 0.5} stroke={coloreQuote} strokeWidth="0.6" />
                    <line x1={x - 2.5} y1={y0 + 0.5} x2={x + 2.5} y2={y0 + 0.5} stroke={coloreQuote} strokeWidth="0.6" />
                    <line x1={x - 2.5} y1={y1 - 0.5} x2={x + 2.5} y2={y1 - 0.5} stroke={coloreQuote} strokeWidth="0.6" />
                    <text x={cx} y={cy} transform={`rotate(-90 ${cx} ${cy})`} textAnchor="middle" fontSize={fs} fill={coloreQuote} fontFamily="sans-serif" fontWeight="600">{testo}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
