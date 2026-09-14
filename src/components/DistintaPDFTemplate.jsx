import React from 'react';
import { PROFILE_LABELS } from '../utils/camEngine';

/**
 * Distinta di taglio per l'officina.
 *
 * L'ordine delle sezioni segue come si lavora davvero: prima cosa ordinare,
 * poi cosa tagliare profilo per profilo (si imposta la troncatrice una volta
 * sola e si scende dal pezzo piu' lungo al piu' corto), poi come disporre i
 * pezzi sulle barre, e in fondo le schede dei singoli serramenti per il
 * controllo. La versione precedente elencava pezzo per pezzo e articolo per
 * articolo: costringeva a saltare fra le pagine a ogni cambio di profilo.
 */

const PART_IT = {
  frame_top:    'Traversa SUP. Telaio',
  frame_bottom: 'Traversa INF. Telaio',
  frame_left:   'Montante SX Telaio',
  frame_right:  'Montante DX Telaio',
  traverso_1:   'Traverso Intermedio 1',
  traverso_2:   'Traverso Intermedio 2',
};

const LATI = { top: 'Traversa SUP.', bottom: 'Traversa INF.', left: 'Montante SX', right: 'Montante DX' };
const LATI_FERM = {
  top: 'Traversa SUP.', bottom: 'Traversa INF.',
  left: 'Montante SX', right: 'Montante DX',
  mid_top: 'Traversa centrale ALTA', mid_bot: 'Traversa centrale BASSA',
  left_sup: 'Montante SX superiore', right_sup: 'Montante DX superiore',
  left_inf: 'Montante SX inferiore', right_inf: 'Montante DX inferiore',
};

const partLabel = (part) => {
  if (PART_IT[part]) return PART_IT[part];

  const anta = part.match(/^anta_(\d+)_(top|bottom|left|right)$/);
  if (anta) return `Anta ${anta[1]} — ${LATI[anta[2]]}`;

  const riporto = part.match(/^riporto_centrale_(\d+)$/);
  if (riporto) return `Riporto centrale ${riporto[1]}`;

  const fermAnta = part.match(/^ferm_(\d+)_(.+)$/);
  if (fermAnta && LATI_FERM[fermAnta[2]]) return `Fermavetro Anta ${fermAnta[1]} — ${LATI_FERM[fermAnta[2]]}`;

  const fermFisso = part.match(/^ferm_fisso_(.+)$/);
  if (fermFisso && LATI_FERM[fermFisso[1]]) return `Fermavetro — ${LATI_FERM[fermFisso[1]]}`;

  const travAnta = part.match(/^traverso_anta_(\d+)$/);
  if (travAnta) return `Traverso Anta ${travAnta[1]}`;
  if (part === 'traverso_centrale') return 'Traverso centrale';
  if (part === 'traverso_sopraluce') return 'Traverso sopraluce';

  return part;
};

// Nome corto per la lista di taglio, dove la colonna e' stretta e il
// riferimento al serramento dice gia' di quale pezzo si tratta.
const partLabelCorto = (part) => partLabel(part)
  .replace(/^Anta \d+ — /, '')
  .replace(/^Fermavetro Anta \d+ — /, 'Fermav. ')
  .replace(/^Fermavetro — /, 'Fermav. ')
  .replace(/ Telaio$/, '');

// Numero d'ordine del serramento: e' il riferimento che l'operaio scrive a
// matita sul pezzo appena tagliato.
const rif = (i) => `#${String(i + 1).padStart(2, '0')}`;

/**
 * Raggruppa tutti i tagli per profilo e per misura. E' il cuore del
 * documento: alla troncatrice non serve sapere che il pezzo si chiama
 * "Anta 1 - Montante SX", serve sapere che di quel profilo servono quattro
 * pezzi da 1360.
 */
function listaDiTaglio(itemResults) {
  const perProfilo = new Map();

  itemResults.forEach((it, idx) => {
    const quante = Number(it.qty) || 1;
    for (const pezzo of it.bom) {
      if (!perProfilo.has(pezzo.profile)) perProfilo.set(pezzo.profile, new Map());
      const misure = perProfilo.get(pezzo.profile);
      const chiave = Math.round(pezzo.mm);
      if (!misure.has(chiave)) misure.set(chiave, { mm: chiave, qta: 0, da: new Map(), esempio: pezzo.part });
      const riga = misure.get(chiave);
      riga.qta += quante;
      riga.da.set(rif(idx), (riga.da.get(rif(idx)) || 0) + quante);
    }
  });

  return [...perProfilo.entries()].map(([codice, misure]) => ({
    codice,
    etichetta: PROFILE_LABELS[codice] || codice,
    righe: [...misure.values()].sort((a, b) => b.mm - a.mm),
    pezzi: [...misure.values()].reduce((s, r) => s + r.qta, 0),
  }));
}

export default function DistintaPDFTemplate({ clientName, items, camResult, userSettings, barLength }) {
  if (!camResult || !camResult.itemResults) return null;
  const { itemResults, nesting, ferramentaRiepilogo } = camResult;
  const today = new Date().toLocaleDateString('it-IT');
  const gruppi = listaDiTaglio(itemResults);
  const barreTotali = (nesting || []).reduce((s, n) => s + n.bars_required, 0);
  const barra = barLength || 6500;

  return (
    <div style={FOGLIO}>

      {/* ═══ TESTATA ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    borderBottom: `2px solid ${BLU}`, paddingBottom: '7px', marginBottom: '4px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: BLU, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {userSettings?.company_name || 'SerraDesk'}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>Distinta di taglio</div>
          <div style={{ fontSize: '8px', color: GRIGIO, marginTop: '1px' }}>
            Documento di officina — non allegare al preventivo del cliente
          </div>
        </div>
        <table style={{ borderCollapse: 'collapse', fontSize: '9px' }}>
          <tbody>
            <tr><td style={ETI}>Cliente</td><td style={VAL}>{clientName || '—'}</td></tr>
            <tr><td style={ETI}>Data</td><td style={VAL}>{today}</td></tr>
            <tr><td style={ETI}>Serramenti</td><td style={VAL}>{items.length}</td></tr>
            <tr><td style={ETI}>Barra</td><td style={VAL}>{(barra / 1000).toFixed(1)} m · kerf 4 mm</td></tr>
          </tbody>
        </table>
      </div>

      {/* ═══ 1. BARRE DA ORDINARE ═══ */}
      <Sezione n="1" titolo="Barre da ordinare" />
      <div style={{ ...BLOCCO, width: '60%' }}>
        <table style={TABELLA}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left', width: '22%' }}>Profilo</th>
              <th style={{ ...TH, textAlign: 'left' }}>Descrizione</th>
              <th style={{ ...TH, width: '11%' }}>Pezzi</th>
              <th style={{ ...TH, width: '13%' }}>Metri</th>
              <th style={{ ...TH, width: '13%' }}>Barre</th>
            </tr>
          </thead>
          <tbody>
            {(nesting || []).map((n) => (
              <tr key={n.profile_code}>
                <td style={{ ...TD, fontWeight: 700, fontFamily: MONO }}>{n.profile_code}</td>
                <td style={TD}>{n.profile_label}</td>
                <td style={{ ...TD, textAlign: 'center' }}>{n.pieces_count}</td>
                <td style={{ ...TD, textAlign: 'center' }}>{(n.total_mm_cut / 1000).toFixed(2)}</td>
                <td style={{ ...TD, textAlign: 'center', fontWeight: 800, fontSize: '12px' }}>{n.bars_required}</td>
              </tr>
            ))}
            <tr style={{ background: '#eef2f6' }}>
              <td colSpan={4} style={{ ...TD, textAlign: 'right', fontWeight: 700 }}>Totale barre da ordinare</td>
              <td style={{ ...TD, textAlign: 'center', fontWeight: 900, fontSize: '14px' }}>{barreTotali}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══ 2. LISTA DI TAGLIO ═══ */}
      <Sezione n="2" titolo="Lista di taglio"
               nota="Un profilo alla volta, dal pezzo più lungo al più corto. Il riferimento indica su quale serramento va segnato il pezzo." />
      <div style={COLONNE}>
        {gruppi.map((g) => (
          <div key={g.codice} style={{ ...BLOCCO, ...META }}>
            <div style={INTESTAZIONE_BLOCCO}>
              <span style={{ fontFamily: MONO, fontWeight: 800 }}>{g.codice}</span>
              <span style={{ color: '#5a6b7d' }}> · {g.etichetta}</span>
              <span style={{ float: 'right', color: '#5a6b7d' }}>{g.pezzi} pezzi</span>
            </div>
            <table style={TABELLA}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: '28%' }}>Misura</th>
                  <th style={{ ...TH, width: '13%' }}>Q.tà</th>
                  <th style={{ ...TH, textAlign: 'left' }}>Riferimento</th>
                </tr>
              </thead>
              <tbody>
                {g.righe.map((r) => (
                  <tr key={r.mm}>
                    <td style={{ ...TD, textAlign: 'right', fontFamily: MONO, fontWeight: 800, fontSize: '11px' }}>{r.mm} mm</td>
                    <td style={{ ...TD, textAlign: 'center', fontWeight: 700 }}>{r.qta}</td>
                    <td style={{ ...TD, fontSize: '8.5px', color: '#445' }}>
                      {[...r.da.entries()].map(([k, v]) => (v > 1 ? `${k}×${v}` : k)).join(' ')}
                      <span style={{ color: '#8a97a4' }}> · {partLabelCorto(r.esempio)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ═══ 3. PIANO DI TAGLIO ═══ */}
      <Sezione n="3" titolo="Piano di taglio"
               nota="Disposizione dei pezzi su ogni barra, calcolata per ridurre lo sfrido." />
      {(nesting || []).map((n) => (
        <div key={n.profile_code} style={{ ...BLOCCO, width: '100%' }}>
          <div style={INTESTAZIONE_BLOCCO}>
            <span style={{ fontFamily: MONO, fontWeight: 800 }}>{n.profile_code}</span>
            <span style={{ color: '#5a6b7d' }}> · {n.profile_label}</span>
            <span style={{ float: 'right', color: '#5a6b7d' }}>{n.bars_required} barre</span>
          </div>
          <div style={{ padding: '6px 8px' }}>
            {n.bars.map((bar, bi) => {
              const usati = bar.cuts_mm.reduce((s, c) => s + c, 0);
              return (
                <div key={bi} style={{ marginBottom: bi === n.bars.length - 1 ? 0 : '6px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: GRIGIO, marginBottom: '2px' }}>
                    <span><b style={{ color: '#111' }}>Barra {bi + 1}</b> di {n.bars_required}</span>
                    <span>usato {Math.round((usati / barra) * 100)}% · sfrido {bar.waste_mm} mm</span>
                  </div>
                  <div style={{ display: 'flex', width: '100%', height: '18px', border: '1px solid #94a3b8', boxSizing: 'border-box' }}>
                    {bar.cuts_mm.map((cut, ci) => (
                      <div key={ci} style={{
                        width: `${(cut / barra) * 100}%`,
                        background: ci % 2 === 0 ? '#dde5ed' : '#eef2f6',
                        borderRight: '1px solid #94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: MONO, fontSize: '8px', fontWeight: 700,
                        overflow: 'hidden', whiteSpace: 'nowrap',
                      }}>{cut}</div>
                    ))}
                    {bar.waste_mm > 0 && (
                      <div style={{
                        width: `${(bar.waste_mm / barra) * 100}%`,
                        background: 'repeating-linear-gradient(45deg,#f7f9fb,#f7f9fb 3px,#e8edf2 3px,#e8edf2 6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '7.5px', color: '#94a3b8', overflow: 'hidden', whiteSpace: 'nowrap',
                      }}>sfrido</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ═══ 4. SCHEDE SERRAMENTI ═══ */}
      <Sezione n="4" titolo="Schede serramenti"
               nota="Misure finite di ogni serramento, per il controllo prima del montaggio." />
      <div style={COLONNE}>
        {itemResults.map((it, idx) => (
          <div key={it.id} style={{ ...BLOCCO, ...META }}>
            <div style={INTESTAZIONE_BLOCCO}>
              <span style={{ fontWeight: 800 }}>{rif(idx)}</span>
              <span> · {it.description}</span>
              <span style={{ float: 'right', color: '#5a6b7d' }}>{it.qty} pz</span>
            </div>
            <div style={{ padding: '4px 8px', fontSize: '8.5px', display: 'flex', gap: '12px', flexWrap: 'wrap', borderBottom: '1px solid #e6ebf0' }}>
              <span><span style={{ color: GRIGIO }}>Inserite </span><b>{it.width}×{it.height}</b></span>
              <span><span style={{ color: GRIGIO }}>Telaio finito </span><b>{it.frame.width}×{it.frame.height}</b></span>
              {it.sash && <span><span style={{ color: GRIGIO }}>Anta finita </span><b>{it.sash.width}×{it.sash.height}</b></span>}
            </div>
            <table style={TABELLA}>
              <tbody>
                {it.bom.map((b, bi) => (
                  <tr key={bi}>
                    <td style={{ ...TD, fontSize: '8.5px' }}>{partLabel(b.part)}</td>
                    <td style={{ ...TD, fontFamily: MONO, fontSize: '8px', color: '#5a6b7d', width: '24%' }}>{b.profile}</td>
                    <td style={{ ...TD, textAlign: 'right', fontFamily: MONO, fontWeight: 700, width: '20%' }}>{b.mm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ═══ 5. FERRAMENTA ═══ */}
      {ferramentaRiepilogo?.length > 0 && (
        <>
          <Sezione n="5" titolo="Ferramenta"
                   nota="Stima automatica: verificare le quantità sulla ferramenta effettivamente usata." />
          <div style={{ ...BLOCCO, width: '48%' }}>
            <table style={TABELLA}>
              <thead>
                <tr>
                  <th style={{ ...TH, textAlign: 'left' }}>Componente</th>
                  <th style={{ ...TH, width: '28%' }}>Quantità</th>
                </tr>
              </thead>
              <tbody>
                {ferramentaRiepilogo.map((f) => (
                  <tr key={f.nome}>
                    <td style={TD}>{f.nome}</td>
                    <td style={{ ...TD, textAlign: 'center', fontWeight: 700 }}>{f.qtaTotale} {f.unitaMisura}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{ marginTop: '10px', paddingTop: '5px', borderTop: '1px solid #d8e0e8',
                    fontSize: '7.5px', color: '#8a97a4', textAlign: 'center' }}>
        Le misure derivano dai parametri del profilo impostati in archivio.
        Verificare i profilati prima di tagliare in serie. · SerraDesk · {today}
      </div>
    </div>
  );
}

function Sezione({ n, titolo, nota }) {
  return (
    // breakAfter avoid: un titolo di sezione non deve restare solo in fondo
    // a una pagina con il contenuto che comincia in quella dopo.
    <div style={{ marginTop: '13px', marginBottom: '5px', breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', borderBottom: `1px solid ${BLU}`, paddingBottom: '2px' }}>
        <span style={{ background: BLU, color: '#fff', fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '2px' }}>{n}</span>
        <span style={{ fontSize: '11.5px', fontWeight: 800, color: BLU, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{titolo}</span>
      </div>
      {nota && <div style={{ fontSize: '8px', color: GRIGIO, marginTop: '3px' }}>{nota}</div>}
    </div>
  );
}

const BLU = '#1e3a5f';
const GRIGIO = '#6b7a89';
const MONO = "'Courier New', Courier, monospace";

const FOGLIO = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '9.5px',
  color: '#111',
  padding: '10px',
  width: '281mm',
  boxSizing: 'border-box',
  margin: '0 auto',
  background: '#fff',
};

// Due colonne affiancate: su un A4 orizzontale ci stanno comode e si
// dimezzano le pagine. I blocchi non si spezzano mai a meta'.
const COLONNE = { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start' };
// 49% e non calc(50% - gap): il calcolo esatto lascia scarti di uno o due
// pixel per arrotondamento e il secondo blocco va a capo, lasciando la
// pagina a colonna singola. Il 2% di aria in meno non si nota.
const META = { width: '49%' };

const BLOCCO = {
  border: '1px solid #d8e0e8',
  borderRadius: '3px',
  overflow: 'hidden',
  marginBottom: '8px',
  breakInside: 'avoid',
  pageBreakInside: 'avoid',
  background: '#fff',
};

const INTESTAZIONE_BLOCCO = {
  background: '#eef2f6',
  borderBottom: '1px solid #d8e0e8',
  padding: '4px 8px',
  fontSize: '9.5px',
};

const TABELLA = { width: '100%', borderCollapse: 'collapse' };
const TH = { padding: '3px 7px', background: '#f7f9fb', borderBottom: '1px solid #d8e0e8',
             textAlign: 'center', fontWeight: 700, fontSize: '8px', color: '#44576b',
             textTransform: 'uppercase', letterSpacing: '0.2px' };
const TD = { padding: '2.5px 7px', borderBottom: '1px solid #eef2f6' };
const ETI = { padding: '1px 6px 1px 0', color: GRIGIO, textAlign: 'right' };
const VAL = { padding: '1px 0', fontWeight: 700 };
