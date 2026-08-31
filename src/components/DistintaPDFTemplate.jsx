import React from 'react';
import { PROFILE_LABELS } from '../utils/camEngine';

const PART_IT = {
  frame_top:    'Traversa SUP. Telaio',
  frame_bottom: 'Traversa INF. Telaio',
  frame_left:   'Montante SX Telaio',
  frame_right:  'Montante DX Telaio',
  traverso_1:   'Traverso Intermedio 1',
  traverso_2:   'Traverso Intermedio 2',
};

const partLabel = (part) => {
  if (PART_IT[part]) return PART_IT[part];
  const m = part.match(/anta_(\d+)_(top|bottom|left|right)/);
  if (m) {
    const sides = { top: 'Traversa SUP.', bottom: 'Traversa INF.', left: 'Montante SX', right: 'Montante DX' };
    return `Anta ${m[1]} — ${sides[m[2]]}`;
  }
  return part;
};

const profileColor = (code) => {
  const colors = { 'TEL-Z30': '#1e3a5f', 'TEL-INF-DRN': '#2d6a4f', 'ANT-T70': '#7b2d8b' };
  return colors[code] || '#333';
};

export default function DistintaPDFTemplate({ clientName, items, camResult, userSettings, barLength }) {
  if (!camResult || !camResult.itemResults) return null;
  const { itemResults, nesting, ferramentaRiepilogo } = camResult;
  const today = new Date().toLocaleDateString('it-IT');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#111', padding: '20px', width: '297mm', boxSizing: 'border-box', margin: '0 auto' }}>

      {/* ─── HEADER ─── */}
      <div style={{ borderBottom: '3px solid #1e3a5f', paddingBottom: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', color: '#1e3a5f', fontWeight: 900, textTransform: 'uppercase' }}>{userSettings?.company_name || 'SISTEMI CAM SAAS'}</h1>
          {userSettings?.address && <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#444' }}>Sede Operativa: {userSettings.address}</p>}
          {userSettings?.legal_address && <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#666' }}>Sede Legale: {userSettings.legal_address}</p>}
          <h2 style={{ margin: '4px 0 0', fontSize: '13px', color: '#c0392b', fontWeight: 700, textTransform: 'uppercase' }}>
            ⚠ DISTINTA DI TAGLIO — DOCUMENTO INTERNO
          </h2>
          <p style={{ margin: '2px 0 0', color: '#888' }}>NON ALLEGARE AL PREVENTIVO CLIENTE</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}><b>Cliente:</b> {clientName || '—'}</p>
          <p style={{ margin: 0 }}><b>Data:</b> {today}</p>
          <p style={{ margin: 0 }}><b>Articoli:</b> {items.length}</p>
        </div>
      </div>

      {/* ─── COSTANTI DI PRODUZIONE ─── */}
      <div style={{ background: '#f0f4f8', border: '1px solid #ccd', borderRadius: '4px', padding: '6px 10px', marginBottom: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {[
          ['Barra grezza', `${(barLength || 6500) / 1000} m`],
          ['Kerf lama', '4 mm'],
          ['Intestazione', '20 mm/barra'],
          ['Sormonto battuta', '20 mm/lato'],
          ['Tolleranza posa', '5 mm/lato'],
        ].map(([k, v]) => (
          <div key={k}><span style={{ color: '#555' }}>{k}: </span><b>{v}</b></div>
        ))}
      </div>

      {/* ─── RIEPILOGO BARRE DA ORDINARE ─── */}
      <div style={{ background: '#fff3cd', border: '2px solid #f0a500', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 900, color: '#7d4e00', marginBottom: '10px', textTransform: 'uppercase' }}>
          📋 RIEPILOGO — BARRE DA ORDINARE (Intero Ordine)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0a500' }}>
              <th style={{ ...TH2, textAlign: 'left', color: '#fff' }}>Codice Profilo</th>
              <th style={{ ...TH2, textAlign: 'left', color: '#fff' }}>Descrizione</th>
              <th style={{ ...TH2, color: '#fff' }}>N° Pezzi Totali</th>
              <th style={{ ...TH2, color: '#fff' }}>ML Tagliati</th>
              <th style={{ ...TH2, color: '#fff', fontSize: '13px' }}>🔲 BARRE NECESSARIE</th>
            </tr>
          </thead>
          <tbody>
            {nesting.map((n, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fffdf0' : '#fff8e1', borderLeft: `4px solid ${profileColor(n.profile_code)}` }}>
                <td style={{ ...TD2, fontWeight: 900, color: profileColor(n.profile_code), fontSize: '11px' }}>{n.profile_code}</td>
                <td style={TD2}>{n.profile_label}</td>
                <td style={{ ...TD2, textAlign: 'center' }}>{n.pieces_count} pz</td>
                <td style={{ ...TD2, textAlign: 'center' }}>{(n.total_mm_cut / 1000).toFixed(2)} ml</td>
                <td style={{ ...TD2, textAlign: 'center', fontSize: '20px', fontWeight: 900, color: '#c0392b' }}>{n.bars_required}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#7d4e00' }}>
              <td colSpan={4} style={{ ...TD2, color: '#fff', fontWeight: 700, textAlign: 'right' }}>TOTALE BARRE DA ORDINARE:</td>
              <td style={{ ...TD2, textAlign: 'center', fontSize: '22px', fontWeight: 900, color: '#ffe082' }}>
                {nesting.reduce((s, n) => s + n.bars_required, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* SALTO PAGINA */}
      <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', breakBefore: 'always' }} />

      {/* ─── DETTAGLIO PER ARTICOLO ─── */}
      {itemResults.map((item, idx) => (
        <div key={item.id} style={{ marginBottom: '18px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div style={{ background: '#1e3a5f', color: '#fff', padding: '4px 10px', borderRadius: '3px 3px 0 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>#{item.id} — {item.description}</span>
            <span>Qtà: {item.qty} pz | Vano: {item.width}×{item.height} mm</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', background: '#e8f0fe', padding: '5px 10px', borderLeft: '2px solid #1e3a5f', borderRight: '2px solid #1e3a5f' }}>
            <div><b>Telaio finito:</b> {item.frame.width} × {item.frame.height} mm</div>
            {item.sash && <div><b>Anta finita:</b> {item.sash.width} × {item.sash.height} mm</div>}
            {!item.sash && <div style={{ color: '#888' }}>Fisso — nessuna anta</div>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccd', fontSize: '9.5px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <thead>
              <tr style={{ background: '#e8eaf0' }}>
                <th style={{ ...TH, textAlign: 'left' }}>Pezzo</th>
                <th style={TH}>Profilo</th>
                <th style={TH}>mm Finiti</th>
                <th style={TH}>mm Taglio (+sald.)</th>
              </tr>
            </thead>
            <tbody>
              {item.bom.map((b, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9', borderLeft: `4px solid ${profileColor(b.profile)}` }}>
                  <td style={{ ...TD, fontWeight: 600 }}>{partLabel(b.part)}</td>
                  <td style={{ ...TD, textAlign: 'center', fontWeight: 700, color: profileColor(b.profile), fontSize: '10px' }}>{b.profile}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>{b.mm - (b.sald || 0)} mm</td>
                  <td style={{ ...TD, textAlign: 'center', fontWeight: 700, color: '#c0392b' }}>{b.mm} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* SALTO PAGINA */}
      <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', breakBefore: 'always' }} />

      {/* ─── PIANO DI NESTING — STILE TECNICO B&N ─── */}
      <div style={{ marginTop: '10px' }}>
        <h3 style={{ color: '#000', borderBottom: '2px solid #000', paddingBottom: '4px', margin: '0 0 16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Arial, sans-serif' }}>
          Piano di Nesting — Ottimizzazione Barre (aggregato ordine)
        </h3>

        {nesting.map((n, ni) => {
          const BAR_TOTAL = barLength || 6500;
          const SVG_W    = 800;
          const QUOTA_H  = 20;
          const BAR_H    = 30;
          const SEQ_H    = 4;
          const SVG_H    = QUOTA_H + BAR_H + SEQ_H;
          const scale    = SVG_W / BAR_TOTAL;

          return (
            <div key={ni} style={{ marginBottom: '30px', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakBefore: ni > 0 ? 'always' : 'auto', breakBefore: ni > 0 ? 'always' : 'auto' }}>

              {/* Header profilo — nero */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#222', color: '#fff', padding: '5px 10px', fontWeight: 700, fontSize: '10px' }}>
                <span>{n.profile_code} — {n.profile_label}</span>
                <span style={{ fontWeight: 400, fontSize: '9px' }}>
                  {n.bars_required} barre × {BAR_TOTAL}mm &nbsp;·&nbsp; {n.pieces_count} pezzi &nbsp;·&nbsp; {Math.round(n.total_mm_cut / 10) / 100} m lineari
                </span>
              </div>

              {n.bars.map((bar, bi) => {
                const totalCut = bar.cuts_mm.reduce((s, c) => s + c, 0);
                const kerf     = 4 * bar.cuts_mm.length;
                const endTrim  = 20;
                const usedMm   = totalCut + kerf + endTrim;
                const wasteMm  = BAR_TOTAL - usedMm;
                const usedPct  = Math.round((usedMm / BAR_TOTAL) * 100);

                // Costruisce segmenti
                let cursor = endTrim;
                const segs = [];
                segs.push({ x: 0, w: endTrim, tipo: 'header' });
                bar.cuts_mm.forEach((cut, ci) => {
                  if (ci > 0) { segs.push({ x: cursor, w: 4, tipo: 'kerf' }); cursor += 4; }
                  segs.push({ x: cursor, w: cut, tipo: 'pezzo', idx: ci });
                  cursor += cut;
                });
                if (wasteMm > 0) segs.push({ x: cursor, w: wasteMm, tipo: 'scarto' });

                // B&N: alterna grigio scuro / grigio chiaro
                const fillPezzo = (idx) => idx % 2 === 0 ? '#444' : '#999';
                const textPezzo = (idx) => idx % 2 === 0 ? '#fff' : '#000';

                return (
                  <div key={bi} style={{ border: '1px solid #ccc', borderTop: 'none', padding: '8px 10px', background: '#fff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>

                    {/* Info riga */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '5px', color: '#333' }}>
                      <b style={{ fontSize: '10px', fontFamily: 'monospace' }}>BARRA {bi + 1} / {n.bars_required}</b>
                      <span>
                        Usato: <b>{usedPct}%</b>
                        &nbsp;·&nbsp;Scarto: <b style={{ textDecoration: wasteMm > 1200 ? 'underline' : 'none' }}>{wasteMm} mm</b>
                        &nbsp;·&nbsp;N° tagli: <b>{bar.cuts_mm.length}</b>
                      </span>
                    </div>

                    {/* SVG piano tecnico */}
                    <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
                      <defs>
                        <pattern id={`hatch${ni}_${bi}`} patternUnits="userSpaceOnUse" width="6" height="6">
                          <rect width="6" height="6" fill="#e8e8e8"/>
                          <line x1="0" y1="6" x2="6" y2="0" stroke="#aaa" strokeWidth="0.8"/>
                        </pattern>
                      </defs>

                      {segs.map((seg, si) => {
                        const sx = seg.x * scale;
                        const sw = Math.max(seg.w * scale, 0.5);
                        const by = QUOTA_H;

                        let fill, strokeCol;
                        if (seg.tipo === 'header')  { fill = '#ccc';  strokeCol = '#888'; }
                        else if (seg.tipo === 'kerf'){ fill = '#000';  strokeCol = '#000'; }
                        else if (seg.tipo === 'scarto') { fill = `url(#hatch${ni}_${bi})`; strokeCol = '#666'; }
                        else { fill = fillPezzo(seg.idx); strokeCol = '#222'; }

                        return (
                          <g key={si}>
                            <rect x={sx} y={by} width={sw} height={BAR_H}
                              fill={fill} stroke={strokeCol} strokeWidth="0.5"/>

                            {/* Testo dentro la barra */}
                            {seg.tipo === 'pezzo' && sw > 28 && (
                              <text x={sx + sw/2} y={by + BAR_H/2 + 4}
                                textAnchor="middle" fill={textPezzo(seg.idx)}
                                fontSize="8" fontWeight="bold" fontFamily="monospace">
                                {seg.w}
                              </text>
                            )}
                            {seg.tipo === 'header' && (
                              <text x={sx + sw/2} y={by + BAR_H/2 + 3}
                                textAnchor="middle" fill="#444" fontSize="6" fontFamily="monospace">IT</text>
                            )}
                            {seg.tipo === 'scarto' && sw > 50 && (
                              <text x={sx + sw/2} y={by + BAR_H/2 + 3}
                                textAnchor="middle" fill="#666" fontSize="7" fontFamily="monospace">
                                SCARTO {seg.w}mm
                              </text>
                            )}

                            {/* Quote sopra (solo pezzi con spazio) */}
                            {seg.tipo === 'pezzo' && sw > 22 && (
                              <>
                                <line x1={sx+0.5} y1={by-1} x2={sx+0.5} y2={by-QUOTA_H+5} stroke="#000" strokeWidth="0.6"/>
                                <line x1={sx+sw-0.5} y1={by-1} x2={sx+sw-0.5} y2={by-QUOTA_H+5} stroke="#000" strokeWidth="0.6"/>
                                <line x1={sx+2} y1={by-QUOTA_H+9} x2={sx+sw-2} y2={by-QUOTA_H+9} stroke="#000" strokeWidth="0.6"/>
                                {sw > 45 && (
                                  <text x={sx+sw/2} y={by-QUOTA_H+7}
                                    textAnchor="middle" fontSize="7" fontWeight="bold"
                                    fill="#000" fontFamily="monospace">
                                    {seg.w} mm
                                  </text>
                                )}
                              </>
                            )}
                          </g>
                        );
                      })}

                      {/* Bordo esterno */}
                      <rect x="0" y={QUOTA_H} width={SVG_W} height={BAR_H}
                        fill="none" stroke="#000" strokeWidth="1"/>
                    </svg>

                    {/* Sequenza tagli testuale */}
                    <div style={{ marginTop: '5px', fontSize: '8px', color: '#333', display: 'flex', flexWrap: 'wrap', gap: '3px', alignItems: 'center', fontFamily: 'monospace' }}>
                      <span style={{ fontWeight: 700, fontSize: '8px', marginRight: '2px' }}>Sequenza:</span>
                      <span style={{ background: '#ddd', padding: '1px 4px', border: '1px solid #bbb' }}>IT 20</span>
                      {bar.cuts_mm.map((cut, ci) => (
                        <React.Fragment key={ci}>
                          <span style={{ color: '#888', fontSize: '7px' }}>✂4</span>
                          <span style={{ background: ci%2===0?'#444':'#999', color: ci%2===0?'#fff':'#000', padding: '1px 5px', fontWeight: 700, border: '1px solid #333' }}>
                            {cut}
                          </span>
                        </React.Fragment>
                      ))}
                      {wasteMm > 0 && (
                        <>
                          <span style={{ color: '#888', fontSize: '7px' }}>→</span>
                          <span style={{ background: '#eee', border: '1px dashed #aaa', padding: '1px 4px', color: '#666' }}>scarto {wasteMm}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ─── STIMA FERRAMENTA ─── */}
      {ferramentaRiepilogo && ferramentaRiepilogo.length > 0 && (
        <>
          <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', breakBefore: 'always' }} />
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #000', paddingBottom: '4px', margin: '0 0 16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Arial, sans-serif' }}>
              🔩 Stima Ferramenta — Riepilogo Ordine
            </h3>
            <p style={{ fontSize: '9px', color: '#888', marginBottom: '12px', fontStyle: 'italic' }}>
              ⚠ Stima indicativa calcolata automaticamente. Verificare le quantità in base alla ferramenta specifica utilizzata (Maico, Roto, Siegenia, ecc.)
            </p>

            {/* Dettaglio per articolo */}
            {itemResults.map((item, idx) => (
              item.ferramenta && item.ferramenta.length > 0 && (
                <div key={item.id} style={{ marginBottom: '14px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ background: '#2d6a4f', color: '#fff', padding: '4px 10px', borderRadius: '3px 3px 0 0', fontSize: '10px', fontWeight: 700 }}>
                    #{item.id} — {item.description} — {item.width}×{item.height} mm × {item.qty} pz
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccd', fontSize: '9.5px' }}>
                    <thead>
                      <tr style={{ background: '#e8f0e8' }}>
                        <th style={{ ...TH, textAlign: 'left' }}>Componente</th>
                        <th style={{ ...TH, width: '100px' }}>Quantità</th>
                        <th style={{ ...TH, width: '60px' }}>U.M.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.ferramenta.map((f, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f6faf6' }}>
                          <td style={{ ...TD, fontWeight: 600 }}>{f.icona} {f.nome}</td>
                          <td style={{ ...TD, textAlign: 'center', fontWeight: 700, color: '#2d6a4f', fontSize: '11px' }}>{f.qta}</td>
                          <td style={{ ...TD, textAlign: 'center', color: '#666' }}>{f.unitaMisura}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ))}

            {/* Riepilogo Totale Ferramenta */}
            <div style={{ marginTop: '16px', background: '#e8f5e9', border: '2px solid #2d6a4f', borderRadius: '6px', padding: '12px 16px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#1b5e20', marginBottom: '10px', textTransform: 'uppercase' }}>
                📋 RIEPILOGO TOTALE FERRAMENTA (Intero Ordine)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#2d6a4f' }}>
                    <th style={{ ...TH2, textAlign: 'left', color: '#fff' }}>Componente</th>
                    <th style={{ ...TH2, color: '#fff', width: '120px' }}>Quantità Totale</th>
                    <th style={{ ...TH2, color: '#fff', width: '80px' }}>U.M.</th>
                  </tr>
                </thead>
                <tbody>
                  {ferramentaRiepilogo.map((f, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#f1f8e9' : '#e8f5e9' }}>
                      <td style={{ ...TD2, fontWeight: 700 }}>{f.icona} {f.nome}</td>
                      <td style={{ ...TD2, textAlign: 'center', fontSize: '16px', fontWeight: 900, color: '#1b5e20' }}>{f.qtaTotale}</td>
                      <td style={{ ...TD2, textAlign: 'center', color: '#555' }}>{f.unitaMisura}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── FOOTER ─── */}
      <div style={{ marginTop: '24px', borderTop: '1px solid #ccc', paddingTop: '6px', textAlign: 'center', color: '#aaa', fontSize: '8px' }}>
        {userSettings?.company_name || 'Azienda'} — Software Preventivi Interno — Documento generato automaticamente il {today}
      </div>
    </div>
  );
}

const TH  = { padding: '4px 8px', border: '1px solid #ccd', textAlign: 'center', fontWeight: 700 };
const TD  = { padding: '3px 8px', border: '1px solid #eee' };
const TH2 = { padding: '8px 10px', border: '1px solid #d48a00', fontWeight: 700 };
const TD2 = { padding: '8px 10px', border: '1px solid #f0d080' };
