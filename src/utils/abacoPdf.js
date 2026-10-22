import { costruisciTavola } from './abacoDxf';

/**
 * La tavola dell'abaco in PDF: la stessa del DXF (costruisciTavola), per chi
 * non ha un programma CAD. Disegno vettoriale, non una foto: si ingrandisce
 * senza sgranare e le misure si leggono anche nelle finestre piccole.
 *
 * Colori come negli abachi di progetto: serramento in grigio scuro, quote e
 * sigle in rosso, descrizioni in blu.
 */

const STILE = {
  TELAIO: { colore: [30, 30, 30], spessore: 0.3 },
  ANTE: { colore: [70, 70, 70], spessore: 0.18 },
  APERTURA: { colore: [120, 120, 120], spessore: 0.12, tratteggio: [1, 0.7] },
  DETTAGLI: { colore: [150, 150, 150], spessore: 0.1 },
  PIANTA: { colore: [30, 30, 30], spessore: 0.18 },
  MURO: { colore: [150, 150, 150], spessore: 0.08 },
  QUOTE: { colore: [200, 35, 35], spessore: 0.1 },
  CODICI: { colore: [200, 35, 35], spessore: 0.15 },
  TESTI: { colore: [35, 65, 170], spessore: 0.12 },
  TAVOLA: { colore: [0, 0, 0], spessore: 0.25 },
};

// Nel DXF l'altezza del testo e' quella delle maiuscole; in Helvetica le
// maiuscole sono il 72% della dimensione del carattere.
const MAIUSCOLE = 0.72;
const PUNTI_PER_MM = 1 / 0.3528;

/** Il PDF dell'abaco come Blob, o null se non c'e' niente da disegnare. */
export async function generaAbacoPdf(items, opzioni = {}) {
  const d = costruisciTavola(items, opzioni);
  if (!d) return null;
  const { jsPDF } = await import('jspdf');

  const { x0, y0, x1, y1 } = d.lim;
  const largo = x1 - x0;
  const alto = y1 - y0;
  const doc = new jsPDF({ orientation: largo >= alto ? 'landscape' : 'portrait', unit: 'mm', format: 'a3' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margine = 8;
  const k = Math.min((pw - 2 * margine) / largo, (ph - 2 * margine) / alto);
  const ox = (pw - largo * k) / 2;
  const oy = (ph - alto * k) / 2;
  // Nel DXF la y sale, nel PDF scende.
  const X = (x) => ox + (x - x0) * k;
  const Y = (y) => oy + (y1 - y) * k;

  doc.setFont('helvetica', 'normal');
  let ultimo = null;
  const stile = (layer) => {
    if (layer === ultimo) return;
    ultimo = layer;
    const s = STILE[layer] || STILE.TAVOLA;
    doc.setDrawColor(...s.colore);
    doc.setTextColor(...s.colore);
    doc.setLineWidth(s.spessore);
    doc.setLineDashPattern(s.tratteggio || [], 0);
  };

  for (const e of d.entita) {
    stile(e.layer);
    if (e.tipo === 'LINE') {
      doc.line(X(e.x1), Y(e.y1), X(e.x2), Y(e.y2));
    } else if (e.tipo === 'ARC') {
      // L'arco a segmenti brevi: a questa scala non si distinguono.
      const fine = e.a < e.da ? e.a + 360 : e.a;
      const passi = Math.max(8, Math.ceil((fine - e.da) / 5));
      let px = null;
      let py = null;
      for (let i = 0; i <= passi; i++) {
        const t = ((e.da + ((fine - e.da) * i) / passi) * Math.PI) / 180;
        const cx = X(e.x + e.r * Math.cos(t));
        const cy = Y(e.y + e.r * Math.sin(t));
        if (px !== null) doc.line(px, py, cx, cy);
        px = cx;
        py = cy;
      }
    } else if (e.tipo === 'TEXT') {
      doc.setFontSize((e.h * k * PUNTI_PER_MM) / MAIUSCOLE);
      let w = doc.getTextWidth(e.testo);
      // Rete di sicurezza: un testo orizzontale che finirebbe oltre il bordo
      // della tavola si rimpicciolisce quanto basta per starci dentro.
      if (!e.rotazione) {
        const partenza = X(e.x) - (e.allinea === 1 ? w / 2 : e.allinea === 2 ? w : 0);
        const spazio = X(x1) - partenza;
        if (spazio > 0 && w > spazio) {
          doc.setFontSize(((e.h * k * PUNTI_PER_MM) / MAIUSCOLE) * (spazio / w));
          w = doc.getTextWidth(e.testo);
        }
      }
      const spostamento = e.allinea === 1 ? w / 2 : e.allinea === 2 ? w : 0;
      // L'allineamento lo si fa a mano: con il testo ruotato jsPDF lo
      // ignora, e la quota verticale finiva tutta sopra la sua linea.
      if (e.rotazione === 90) doc.text(e.testo, X(e.x), Y(e.y) + spostamento, { angle: 90 });
      else doc.text(e.testo, X(e.x) - spostamento, Y(e.y));
    }
  }
  return doc.output('blob');
}
