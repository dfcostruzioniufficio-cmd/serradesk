/**
 * Trasmittanza termica del serramento, Uw, secondo UNI EN ISO 10077-1:
 *
 *   Uw = (Ag·Ug + Af·Uf + lg·Ψg) / (Ag + Af)
 *
 *   Ag  area del vetro visibile (m²)          Ug  trasmittanza del vetro
 *   Af  area del telaio visibile (m²)         Uf  trasmittanza del telaio
 *   lg  perimetro visibile dei vetri (m)      Ψg  ponte termico del bordo vetro
 *
 * La formula usata prima (0,70·Ug + 0,30·Uf + 0,1) dava lo stesso peso al
 * vetro in una finestrella da 60x60 e in una porta finestra da 2 metri, e
 * ignorava il bordo del vetro: in una finestra piccola il telaio pesa molto di
 * piu', e il ponte termico lungo il perimetro dei vetri conta, soprattutto
 * con piu' ante o con il traverso.
 *
 * Aree e perimetri si ricavano dalla geometria dell'articolo e dalla
 * larghezza a vista dei profili, impostata nel sistema (Archivio). Senza
 * quel dato si usano valori tipici della categoria, e il risultato e'
 * dichiarato come stima.
 */

// Valori tipici se il sistema non ha le larghezze a vista. mm.
const VISTA_TIPICA = {
  pvc:        { lato: 115, nodo: 150, traverso: 90, fisso: 75 },
  alluminio:  { lato: 100, nodo: 130, traverso: 85, fisso: 65 },
  legno:      { lato: 120, nodo: 150, traverso: 90, fisso: 80 },
};

// Ψg tabellari, UNI EN ISO 10077-1 appendice E, vetrocamera basso emissivo
// con canalina in alluminio. W/(m·K).
const PSI_TIPICO = { pvc: 0.06, legno: 0.06, alluminio: 0.08 };

/** Primo numero dentro un testo ("1,09 W/m²K" -> 1.09). */
export function leggiNumero(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function categoria(sys) {
  const mat = String(sys?.specs?.materiale || sys?.materiale || '').toLowerCase();
  if (mat.includes('allumin')) return 'alluminio';
  if (mat.includes('legno')) return 'legno';
  return 'pvc';
}

/** Ug del vetro scelto: dal vetro in archivio, dal nome, o da "Ug=1,1" nel testo. */
function trovaUg(item, sistemiCam) {
  const vetri = (sistemiCam || []).filter((s) => s.tipologia === 'VETRO');
  let v = item.vetroId && item.vetroId !== 'custom' ? vetri.find((s) => s.id === item.vetroId) : null;
  if (!v && item.vetro) v = vetri.find((s) => (s.nome || '').trim().toLowerCase() === String(item.vetro).trim().toLowerCase());
  const daArchivio = leggiNumero(v?.specs?.trasmittanza);
  if (daArchivio) return daArchivio;
  const nelTesto = String(item.vetro || '').match(/U\s*g\s*[=:]?\s*(\d+[.,]?\d*)/i);
  return nelTesto ? leggiNumero(nelTesto[1]) : null;
}

/**
 * Calcola Uw per un articolo del preventivo. Restituisce { uw, ... } oppure
 * { uw: null, motivo } quando mancano i dati: meglio nessun valore che un
 * valore inventato su un documento che va al cliente.
 */
export function calcolaUw(item, sistemiCam) {
  const apertura = String(item.apertura || '').toLowerCase();
  if (['persiana', 'tapparella', 'cassonetto', 'porta blindata', 'zanzariera'].some((t) => apertura.includes(t))) {
    return { uw: null, motivo: 'non si calcola per questo tipo di articolo' };
  }
  const sys = (sistemiCam || []).find((s) => s.id === item.sistemaCamId);
  if (!sys) return { uw: null, motivo: 'scegli un profilo dall\'archivio' };

  const uf = leggiNumero(sys.specs?.trasmittanza);
  if (!uf) return { uw: null, motivo: 'il profilo non ha la trasmittanza del telaio (Uf) in archivio' };
  const ug = trovaUg(item, sistemiCam);
  if (!ug) return { uw: null, motivo: 'il vetro non ha la trasmittanza (Ug) in archivio' };

  const W = (Number(item.width) || 0) / 1000;
  const H = (Number(item.height) || 0) / 1000;
  if (W <= 0 || H <= 0) return { uw: null, motivo: 'mancano le misure' };

  const cat = categoria(sys);
  const t = VISTA_TIPICA[cat];
  const vista = sys.specs?.vista || {};
  const stimata = !leggiNumero(vista.lato_mm);
  const mm = (valore, tipico) => (leggiNumero(valore) || tipico) / 1000;
  const psi = leggiNumero(sys.specs?.psi_vetro) || PSI_TIPICO[cat];

  const fisso = apertura === 'fisso';
  const b = fisso ? mm(vista.fisso_mm, t.fisso) : mm(vista.lato_mm, t.lato);
  const nodo = mm(vista.nodo_mm, t.nodo);
  const bt = mm(vista.traverso_mm, t.traverso);
  const numAnte = fisso ? 1 : Math.max(1, Number(item.numAnte) || 1);

  // Ogni riquadro di vetro: [larghezza, altezza] in metri.
  const riquadri = [];
  let parteBassa = H;
  if (item.hasSopraluce) {
    const hs = Math.min((Number(item.sopraluceHeight) || 400) / 1000, H * 0.7);
    parteBassa = H - hs;
    // Sopraluce fisso a tutta larghezza, separato da un traverso del telaio.
    riquadri.push([W - 2 * b, hs - b - bt / 2]);
  }
  const altezzaVetriBassi = parteBassa - (item.hasSopraluce ? b + bt / 2 : 2 * b);
  const larghezzaVetri = W - 2 * b - (numAnte - 1) * nodo;
  const perAnta = larghezzaVetri / numAnte;
  for (let a = 0; a < numAnte; a++) {
    if (item.hasTraverso) {
      const h = (altezzaVetriBassi - bt) / 2;
      riquadri.push([perAnta, h], [perAnta, h]);
    } else {
      riquadri.push([perAnta, altezzaVetriBassi]);
    }
  }

  if (riquadri.some(([w, h]) => w <= 0 || h <= 0)) {
    return { uw: null, motivo: 'l\'infisso e\' troppo piccolo per i profili indicati' };
  }

  const A = W * H;
  const Ag = riquadri.reduce((s, [w, h]) => s + w * h, 0);
  const Af = A - Ag;
  const lg = riquadri.reduce((s, [w, h]) => s + 2 * (w + h), 0);
  const uw = (Ag * ug + Af * uf + lg * psi) / A;

  return {
    uw: Math.round(uw * 100) / 100,
    ug, uf, psi,
    ag: Math.round(Ag * 1000) / 1000,
    af: Math.round(Af * 1000) / 1000,
    lg: Math.round(lg * 100) / 100,
    stimata,
  };
}

/** Testo per preventivo e PDF: "1,23 W/m²K". */
export function formattaUw(uw) {
  return uw == null ? '' : `${uw.toFixed(2).replace('.', ',')} W/m²K`;
}
