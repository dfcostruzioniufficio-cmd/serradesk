import { articoliDisegnabili, titoloArticolo, nomeFileAbaco, disegnoArticolo } from './abacoDxf';
import { disegnaEntita } from './abacoPdf';
import { calcolaUw, formattaUw } from './trasmittanza';

/**
 * La scheda della trasmittanza: un PDF a parte, come l'abaco, con la Uw di
 * ogni serramento e i dati da cui viene (Ug, Uf, Psi del bordo vetro). E'
 * quella che chiedono il geometra o il CAF per le detrazioni; nel preventivo
 * per il cliente privato non serve, quindi non ci finisce dentro.
 *
 * Non e' un certificato e lo dice in prima pagina: un valore calcolato
 * scambiato per certificato puo' finire su una pratica di detrazione. I
 * dati di partenza vengono dai certificati e dalle prove dei produttori di
 * profili e vetri. Non si scrive "produttori di infissi": chi usa SerraDesk
 * l'infisso lo fa (31/10/2026).
 *
 * Le posizioni sono numerate come nell'abaco, cosi' le due tavole si
 * leggono insieme.
 */

// Una volta sola, in prima pagina, in grigio: il titolare non la voleva in
// rosso sopra e sotto, "come se stessimo commettendo un crimine" (31/10/2026).
const AVVISO = 'Valori calcolati secondo la norma UNI EN ISO 10077-1. '
  + 'Non sostituiscono i certificati e i rapporti di prova dei produttori di profili e vetri.';

const NUM = (v, cifre = 2) => (v == null ? '' : Number(v).toFixed(cifre).replace('.', ','));

// I caratteri standard di jsPDF arrivano fino al Latin-1: un "≥" o
// un'emoji nel nome di un vetro rovinava tutta la riga. Le accentate restano.
const pulito = (s) => String(s ?? '')
  .replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/[–—]/g, '-')
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/€/g, 'EUR')
  .replace(/[^\x20-\x7e\xa0-\xff]/g, '');

/** L'articolo come lo legge il calcolo: il modulo salvato, se c'e'. */
function perIlCalcolo(item) {
  const raw = item.rawInput || {};
  return {
    ...item,
    ...raw,
    sistemaCamId: raw.sistemaCamId || item.sistemaCamId || item.sistema_cam?.id || '',
    width: item.width,
    height: item.height,
  };
}

/** Le righe della scheda: una per serramento, con la Uw o il motivo per cui manca. */
export function righeTrasmittanza(items, sistemiCam) {
  return articoliDisegnabili(items)
    .map((item, i) => {
      const numero = item.id ?? i + 1;
      const sys = (sistemiCam || []).find((s) => s.id === perIlCalcolo(item).sistemaCamId);
      const base = {
        numero,
        titolo: pulito(titoloArticolo(item)),
        misure: `${Math.round(Number(item.width))} x ${Math.round(Number(item.height))}`,
        quantita: Number(item.quantity) || 1,
        profilo: pulito(sys?.nome || item.sistema_cam?.nome || ''),
        vetro: pulito(item.vetro),
        item,
      };
      // I composti mettono insieme moduli diversi: il calcolo per finestra
      // singola li tratterebbe come un serramento solo.
      if (item.composto) return { ...base, motivo: 'serramento composto: la Uw va calcolata modulo per modulo' };
      const t = calcolaUw(perIlCalcolo(item), sistemiCam);
      if (t.motivo === 'non si calcola per questo tipo di articolo') return null;
      // La Uw del preventivo e' quella del giorno in cui l'articolo e' stato
      // inserito: se poi e' cambiato l'archivio, i due documenti direbbero
      // due numeri diversi senza spiegare perche'.
      // Prima di settembre 2026 qui c'era la Uf del profilo, senza unita':
      // non e' una Uw, e confrontarla direbbe che l'archivio e' cambiato.
      const nelPreventivo = String(item.trasmittanza || '').trim();
      const diversa = nelPreventivo.includes('W/m²K') && t.uw != null && nelPreventivo !== formattaUw(t.uw);
      return { ...base, ...t, nelPreventivo: diversa ? nelPreventivo : '' };
    })
    .filter(Boolean);
}

// Colori della scheda. Il blu e' quello di SerraDesk; la scala va dal verde
// (isola di piu') al rosso (isola di meno), senza lettere di classe: una
// "classe A" farebbe pensare a un'etichetta energetica ufficiale.
const NOTTE = [15, 23, 42];
const BLU = [37, 99, 235];
const TESTO = [30, 41, 59];
const TENUE = [100, 116, 139];
const BORDO = [226, 232, 240];
const FONDO = [248, 250, 252];
const VETRO = [147, 197, 253];
const TELAIO = [148, 163, 184];
const ROSSO = [185, 28, 28];
const AMBRA = [180, 83, 9];
const SCALA = [[16, 163, 127], [234, 179, 8], [220, 38, 38]];
const SCALA_DA = 0.6;
const SCALA_A = 3.4;

// Del disegno dell'abaco servono il serramento e le quote: sigla e
// descrizione sono gia' scritte nella scheda, e la pianta (sotto i -400 mm,
// dove scende anche un pezzo dei DETTAGLI) qui non dice niente.
const LAYER_DISEGNO = ['TELAIO', 'ANTE', 'APERTURA', 'DETTAGLI', 'QUOTE'];
const SOPRA_PIANTA = -400;
const cimaEntita = (e) => (e.tipo === 'LINE' ? Math.max(e.y1, e.y2) : e.tipo === 'ARC' ? e.y + e.r : e.y);

const mescola = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const coloreScala = (t) => (t <= 0.5 ? mescola(SCALA[0], SCALA[1], t * 2) : mescola(SCALA[1], SCALA[2], (t - 0.5) * 2));
const posizioneScala = (uw) => Math.min(1, Math.max(0, (uw - SCALA_DA) / (SCALA_A - SCALA_DA)));

/** Il disegno di un serramento dentro un riquadro della pagina. */
function disegnaSerramento(doc, item, numero, box) {
  const d = disegnoArticolo(item, numero);
  const entita = d.entita.filter((e) => LAYER_DISEGNO.includes(e.layer) && cimaEntita(e) > SOPRA_PIANTA);
  if (!entita.length) return;
  const lim = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const allarga = (x, y) => {
    lim.x0 = Math.min(lim.x0, x); lim.y0 = Math.min(lim.y0, y);
    lim.x1 = Math.max(lim.x1, x); lim.y1 = Math.max(lim.y1, y);
  };
  entita.forEach((e) => {
    if (e.tipo === 'LINE') { allarga(e.x1, e.y1); allarga(e.x2, e.y2); }
    else if (e.tipo === 'ARC') { allarga(e.x - e.r, e.y - e.r); allarga(e.x + e.r, e.y + e.r); }
    else if (e.tipo === 'TEXT') { allarga(e.x - e.h, e.y - e.h); allarga(e.x + e.h, e.y + e.h); }
  });
  const largo = lim.x1 - lim.x0;
  const alto = lim.y1 - lim.y0;
  if (!(largo > 0 && alto > 0)) return;
  const k = Math.min(box.w / largo, box.h / alto);
  const ox = box.x + (box.w - largo * k) / 2;
  const oy = box.y + (box.h - alto * k) / 2;
  disegnaEntita(doc, entita, {
    X: (x) => ox + (x - lim.x0) * k,
    Y: (y) => oy + (lim.y1 - y) * k,
    k,
    xMax: lim.x1 + largo,
  });
  doc.setLineDashPattern([], 0);
}

/** Il PDF della scheda come Blob, o null se non c'e' nessun serramento. */
export async function generaSchedaTrasmittanzaPdf(items, sistemiCam, {
  azienda = '', cliente = '', numero = '', riferimento = '', firma = true,
} = {}) {
  const righe = righeTrasmittanza(items, sistemiCam);
  if (!righe.length) return null;
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 14;
  const larga = pw - 2 * m;
  const fondoUtile = ph - 16;
  const oggi = new Date().toLocaleDateString('it-IT');
  const nomeCliente = pulito(cliente).trim();

  const colore = (fn, c) => fn.call(doc, ...c);
  const testo = (t, x, y, { size = 9, stile = 'normal', c = TESTO, ...opz } = {}) => {
    doc.setFont('helvetica', stile);
    doc.setFontSize(size);
    colore(doc.setTextColor, c);
    doc.text(t, x, y, opz);
  };

  const avviso = (y) => {
    doc.setFontSize(7.5);
    const t = doc.splitTextToSize(AVVISO, larga);
    testo(t, m, y + 3, { size: 7.5, c: TENUE });
    return y + t.length * 3.4;
  };

  // Intestazione da documento tecnico: titolo, di chi e', azienda e data.
  // Una fascia scura con i riquadri dei numeri "sembrava un curriculum"
  // (31/10/2026).
  testo('Scheda della trasmittanza termica', m, 20, { size: 15, stile: 'bold', c: NOTTE });
  testo(oggi, pw - m, 20, { size: 9, c: TENUE, align: 'right' });
  const chi = [nomeCliente, pulito(riferimento), numero && `Preventivo ${numero}`].filter((t) => String(t || '').trim()).join('  ·  ');
  let yt = 27;
  if (chi) {
    doc.setFontSize(10);
    const r = doc.splitTextToSize(chi, larga).slice(0, 2);
    testo(r, m, yt, { size: 10, c: TESTO });
    yt += r.length * 4.4;
  }
  if (azienda) {
    testo(doc.splitTextToSize(pulito(azienda), larga)[0], m, yt, { size: 9, c: TENUE });
    yt += 4.4;
  }

  // Il lavoro in una riga.
  const calcolate = righe.filter((r) => r.uw != null);
  const pezzi = righe.reduce((s, r) => s + r.quantita, 0);
  const superficie = righe.reduce((s, r) => s + (Number(r.item.width) * Number(r.item.height) * r.quantita) / 1e6, 0);
  const uwMin = calcolate.length ? Math.min(...calcolate.map((r) => r.uw)) : null;
  const uwMax = calcolate.length ? Math.max(...calcolate.map((r) => r.uw)) : null;
  const sintesi = [
    `${pezzi} ${pezzi === 1 ? 'serramento' : 'serramenti'}`,
    `${NUM(superficie)} m²`,
    uwMin != null && (uwMin === uwMax ? `Uw ${NUM(uwMin)} W/m²K` : `Uw da ${NUM(uwMin)} a ${NUM(uwMax)} W/m²K`),
  ].filter(Boolean).join('  ·  ');
  colore(doc.setDrawColor, BORDO);
  doc.setLineWidth(0.3);
  doc.line(m, yt + 1, pw - m, yt + 1);
  testo(sintesi, m, yt + 7, { size: 9, stile: 'bold', c: NOTTE });
  let y = avviso(yt + 9) + 6;

  const intestaPagina = () => {
    testo('Scheda della trasmittanza termica', m, 12, { size: 9, stile: 'bold', c: NOTTE });
    if (chi) testo(doc.splitTextToSize(chi, larga * 0.6)[0], pw - m, 12, { size: 8.5, c: TENUE, align: 'right' });
    colore(doc.setDrawColor, BORDO);
    doc.setLineWidth(0.3);
    doc.line(m, 15, pw - m, 15);
    return 21;
  };

  const xd = m + 4;
  const ld = 62;
  const xr = m + ld + 10;
  const lr = larga - ld - 14;

  righe.forEach((r) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const tit = doc.splitTextToSize(String(r.titolo || 'Serramento'), lr - 18).slice(0, 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const det = doc.splitTextToSize([r.profilo, r.vetro].filter(Boolean).join('  ·  '), lr).slice(0, 2);
    const testoNota = r.uw == null ? '' : [
      r.stimata && '* Valore indicativo: larghezze a vista dei profili non indicate in archivio, usati i valori tipici del materiale.',
      r.nelPreventivo && `Nel preventivo è indicata ${r.nelPreventivo}: i dati dell'archivio sono cambiati dopo l'inserimento dell'articolo.`,
    ].filter(Boolean).join(' ');
    doc.setFontSize(7);
    const nota = testoNota ? doc.splitTextToSize(testoNota, lr) : [];
    // Le stesse misure usate qui sotto per scrivere, piu' il margine.
    const testa = 9 + tit.length * 4.6 + det.length * 3.6 + 6;
    const corpo = r.uw == null ? 15 : 47;
    const h = Math.max(70, testa + corpo + (nota.length ? 6 + nota.length * 3.2 : 0) + 6);

    if (y + h > fondoUtile) {
      doc.addPage();
      y = intestaPagina();
    }

    // La scheda del serramento.
    colore(doc.setFillColor, [255, 255, 255]);
    colore(doc.setDrawColor, BORDO);
    doc.setLineWidth(0.35);
    doc.roundedRect(m, y, larga, h, 3, 3, 'FD');
    colore(doc.setFillColor, FONDO);
    doc.roundedRect(xd, y + 4, ld, h - 8, 2, 2, 'F');
    disegnaSerramento(doc, r.item, '', { x: xd + 4, y: y + 7, w: ld - 8, h: h - 14 });

    let yy = y + 9;
    colore(doc.setFillColor, BLU);
    doc.roundedRect(xr, yy - 4, 14, 5.6, 1.2, 1.2, 'F');
    testo(`POS. ${r.numero}`, xr + 7, yy, { size: 6.5, stile: 'bold', c: [255, 255, 255], align: 'center' });
    testo(tit, xr + 17, yy, { size: 10.5, stile: 'bold', c: NOTTE });
    yy += tit.length * 4.6;
    if (det.length) { testo(det, xr, yy, { size: 8, c: TENUE }); yy += det.length * 3.6; }
    testo(`${r.quantita} ${r.quantita === 1 ? 'pezzo' : 'pezzi'}  ·  L ${r.misure.replace(' x ', ' × H ')} mm`, xr, yy, { size: 8, c: TENUE });
    yy += 6;

    if (r.uw == null) {
      colore(doc.setFillColor, [254, 242, 242]);
      doc.roundedRect(xr, yy + 1, lr, 12, 2, 2, 'F');
      doc.setFontSize(8);
      testo(doc.splitTextToSize(`Uw non calcolata: ${r.motivo}.`, lr - 8), xr + 4, yy + 6, { size: 8, stile: 'italic', c: ROSSO });
      y += h + 5;
      return;
    }

    // La Uw in grande.
    const valore = `${NUM(r.uw)}${r.stimata ? '*' : ''}`;
    testo(valore, xr, yy + 11, { size: 30, stile: 'bold', c: NOTTE });
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    const lv = doc.getTextWidth(valore);
    testo('W/m²K', xr + lv + 2, yy + 11, { size: 9, stile: 'bold', c: TENUE });
    testo('Uw', xr + lv + 2, yy + 5.5, { size: 9, stile: 'bold', c: BLU });

    // La scala: dove sta questo serramento.
    const ys = yy + 18;
    const passi = 80;
    for (let i = 0; i < passi; i++) {
      colore(doc.setFillColor, coloreScala(i / (passi - 1)));
      doc.rect(xr + (lr * i) / passi, ys, lr / passi + 0.15, 3, 'F');
    }
    const px = xr + lr * posizioneScala(r.uw);
    colore(doc.setFillColor, NOTTE);
    doc.triangle(px - 1.8, ys - 2.6, px + 1.8, ys - 2.6, px, ys - 0.2, 'F');
    colore(doc.setDrawColor, NOTTE);
    doc.setLineWidth(0.5);
    doc.line(px, ys - 0.2, px, ys + 3.6);
    testo('isola di più', xr, ys + 7, { size: 6.5, c: TENUE });
    testo('isola di meno', xr + lr, ys + 7, { size: 6.5, c: TENUE, align: 'right' });
    [1, 1.5, 2, 2.5].forEach((v) => {
      testo(NUM(v, 1), xr + lr * posizioneScala(v), ys + 7, { size: 6, c: [148, 163, 184], align: 'center' });
    });

    // Quanto e' vetro e quanto telaio.
    const yc = ys + 14;
    const area = r.ag + r.af;
    const quotaVetro = area > 0 ? r.ag / area : 0;
    colore(doc.setFillColor, VETRO);
    doc.rect(xr, yc, lr * quotaVetro, 3, 'F');
    colore(doc.setFillColor, TELAIO);
    doc.rect(xr + lr * quotaVetro, yc, lr * (1 - quotaVetro), 3, 'F');
    testo(`Vetro ${Math.round(quotaVetro * 100)}%  ·  ${NUM(r.ag)} m²  ·  Ug ${NUM(r.ug)}`, xr, yc + 7, { size: 7, stile: 'bold', c: [29, 78, 216] });
    testo(`Telaio ${100 - Math.round(quotaVetro * 100)}%  ·  ${NUM(r.af)} m²  ·  Uf ${NUM(r.uf)}`, xr + lr, yc + 7, { size: 7, stile: 'bold', c: [71, 85, 105], align: 'right' });

    // Il conto, con i numeri di questo serramento.
    const yf = yc + 14;
    colore(doc.setFillColor, FONDO);
    doc.roundedRect(xr, yf - 4, lr, 8, 1.5, 1.5, 'F');
    const conto = `Uw = (${NUM(r.ag, 3)} × ${NUM(r.ug)} + ${NUM(r.af, 3)} × ${NUM(r.uf)} + ${NUM(r.lg)} × ${NUM(r.psi, 3)}) / ${NUM(area, 3)} = ${NUM(r.uw)}`;
    testo(conto, xr + 3, yf + 1, { size: 7.5, c: TESTO });

    if (nota.length) testo(nota, xr, yf + 9, { size: 7, stile: 'italic', c: AMBRA });
    y += h + 5;
  });

  // In fondo: come si legge il conto.
  const spiegazione = [
    'Uw = (Ag × Ug + Af × Uf + lg × Psi g) / (Ag + Af), secondo UNI EN ISO 10077-1. Ag e Af: superfici di vetro e telaio a vista. lg: perimetro visibile dei vetri.',
    'Ug: trasmittanza del vetro. Uf: trasmittanza del telaio, dalla scheda del profilo. Psi g: ponte termico del bordo vetro; se non indicato nel profilo, valore tabellare della norma.',
  ];
  doc.setFontSize(7);
  const righeSpiegazione = spiegazione.flatMap((t) => doc.splitTextToSize(t, larga));
  if (y + righeSpiegazione.length * 3.2 + 6 > fondoUtile) {
    doc.addPage();
    y = intestaPagina();
  }
  testo(righeSpiegazione, m, y + 3, { size: 7, c: TENUE });

  const totale = doc.getNumberOfPages();
  for (let p = 1; p <= totale; p++) {
    doc.setPage(p);
    colore(doc.setDrawColor, BORDO);
    doc.setLineWidth(0.3);
    doc.line(m, ph - 11, pw - m, ph - 11);
    testo(`Calcolo del ${oggi}${firma ? '  ·  creato con SerraDesk' : ''}`, m, ph - 6.5, { size: 6.5, c: TENUE });
    testo(`${p} / ${totale}`, pw - m, ph - 6.5, { size: 6.5, stile: 'bold', c: TENUE, align: 'right' });
  }
  return doc.output('blob');
}

export function nomeFileTrasmittanza(cliente, numero) {
  return nomeFileAbaco(cliente, numero).replace(/^abaco/, 'trasmittanza').replace(/\.dxf$/, '.pdf');
}
