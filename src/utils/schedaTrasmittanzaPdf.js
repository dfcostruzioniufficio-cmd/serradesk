import { articoliDisegnabili, titoloArticolo, nomeFileAbaco } from './abacoDxf';
import { calcolaUw, formattaUw } from './trasmittanza';

/**
 * La scheda della trasmittanza: un PDF a parte, come l'abaco, con la Uw di
 * ogni serramento e i dati da cui viene (Ug, Uf, Psi del bordo vetro). E'
 * quella che chiedono il geometra o il CAF per le detrazioni; nel preventivo
 * per il cliente privato non serve, quindi non ci finisce dentro.
 *
 * Non e' un certificato e lo dice in alto e in fondo: un valore calcolato
 * scambiato per certificato puo' finire su una pratica di detrazione. I
 * certificati di trasmittanza li rilasciano solo i produttori di infissi.
 *
 * Le posizioni sono numerate come nell'abaco, cosi' le due tavole si
 * leggono insieme.
 */

const AVVISO = 'Documento non certificativo. I valori sono calcolati secondo la norma UNI EN ISO 10077-1 '
  + 'e non sostituiscono in alcun modo i certificati di trasmittanza, che rilasciano solo i produttori di infissi.';

const NUM = (v, cifre = 2) => (v == null ? '' : Number(v).toFixed(cifre).replace('.', ','));

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
        titolo: titoloArticolo(item),
        misure: `${Math.round(Number(item.width))} x ${Math.round(Number(item.height))}`,
        quantita: Number(item.quantity) || 1,
        profilo: sys?.nome || item.sistema_cam?.nome || '',
        vetro: item.vetro || '',
      };
      // I composti mettono insieme moduli diversi: il calcolo per finestra
      // singola li tratterebbe come un serramento solo.
      if (item.composto) return { ...base, motivo: 'serramento composto: la Uw va calcolata modulo per modulo' };
      const t = calcolaUw(perIlCalcolo(item), sistemiCam);
      if (t.motivo === 'non si calcola per questo tipo di articolo') return null;
      // La Uw del preventivo e' quella del giorno in cui l'articolo e' stato
      // inserito: se poi e' cambiato l'archivio, i due documenti direbbero
      // due numeri diversi senza spiegare perche'.
      const nelPreventivo = String(item.trasmittanza || '').trim();
      const diversa = nelPreventivo && t.uw != null && nelPreventivo !== formattaUw(t.uw);
      return { ...base, ...t, nelPreventivo: diversa ? nelPreventivo : '' };
    })
    .filter(Boolean);
}

/** Il PDF della scheda come Blob, o null se non c'e' nessun serramento. */
export async function generaSchedaTrasmittanzaPdf(items, sistemiCam, { intestazione = '', firma = true } = {}) {
  const righe = righeTrasmittanza(items, sistemiCam);
  if (!righe.length) return null;
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 12;
  const larga = pw - 2 * m;

  const colonne = [
    { titolo: 'POS.', largo: 13 },
    { titolo: 'SERRAMENTO', largo: 0 },
    { titolo: 'L x H mm', largo: 26 },
    { titolo: "Q.TA'", largo: 13 },
    { titolo: 'Ug', largo: 15, destra: true },
    { titolo: 'Uf', largo: 15, destra: true },
    { titolo: 'Psi g', largo: 15, destra: true },
    { titolo: 'Uw W/m²K', largo: 24, destra: true },
  ];
  colonne[1].largo = larga - colonne.reduce((s, c) => s + c.largo, 0);

  const scriviAvviso = (y) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const testo = doc.splitTextToSize(AVVISO, larga - 6);
    const h = testo.length * 4 + 4;
    doc.setDrawColor(200, 35, 35);
    doc.setLineWidth(0.3);
    doc.rect(m, y, larga, h);
    doc.setTextColor(150, 20, 20);
    doc.text(testo, m + 3, y + 5);
    return y + h;
  };

  const intestaPagina = () => {
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Scheda della trasmittanza termica dei serramenti', m, m + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const sotto = doc.splitTextToSize(intestazione || '', larga);
    if (sotto.length) doc.text(sotto, m, m + 10);
    let y = m + 10 + sotto.length * 4;
    y = scriviAvviso(y + 1) + 5;
    // Intestazione della tabella.
    doc.setFillColor(238, 240, 244);
    doc.rect(m, y, larga, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    let x = m;
    colonne.forEach((c) => {
      doc.text(c.titolo, c.destra ? x + c.largo - 2 : x + 2, y + 4.7, { align: c.destra ? 'right' : 'left' });
      x += c.largo;
    });
    return y + 7;
  };

  let y = intestaPagina();
  const fondoUtile = ph - m - 8;
  let indicative = false;

  righe.forEach((r) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const dettagli = [r.profilo && `Profilo: ${r.profilo}`, r.vetro && `Vetro: ${r.vetro}`].filter(Boolean).join(' - ');
    const larghezzaTesto = colonne[1].largo - 4;
    const titolo = doc.splitTextToSize(String(r.titolo || ''), larghezzaTesto);
    const sotto = dettagli ? doc.splitTextToSize(dettagli, larghezzaTesto) : [];
    const testoNota = r.uw == null
      ? `Uw non calcolata: ${r.motivo}.`
      : [
        r.stimata && 'Valore indicativo: larghezze a vista dei profili non indicate in archivio, usati i valori tipici del materiale.',
        r.nelPreventivo && `Nel preventivo è indicata ${r.nelPreventivo}: i dati dell'archivio sono cambiati dopo l'inserimento dell'articolo.`,
      ].filter(Boolean).join(' ');
    const nota = testoNota ? doc.splitTextToSize(testoNota, larghezzaTesto) : [];
    const h = 3 + (titolo.length + sotto.length + nota.length) * 3.8 + 2;

    if (y + h > fondoUtile) {
      doc.addPage();
      y = intestaPagina();
    }

    doc.setTextColor(20, 20, 20);
    let x = m;
    const yt = y + 4.5;
    doc.setFont('helvetica', 'bold');
    doc.text(String(r.numero), x + 2, yt);
    x += colonne[0].largo;
    doc.text(titolo, x + 2, yt);
    doc.setFont('helvetica', 'normal');
    let yRiga = yt + titolo.length * 3.8;
    if (sotto.length) {
      doc.setTextColor(80, 80, 80);
      doc.text(sotto, x + 2, yRiga);
      yRiga += sotto.length * 3.8;
    }
    if (nota.length) {
      doc.setTextColor(r.uw == null ? 150 : 120, r.uw == null ? 20 : 90, 20);
      doc.setFont('helvetica', 'italic');
      doc.text(nota, x + 2, yRiga);
      doc.setFont('helvetica', 'normal');
    }
    doc.setTextColor(20, 20, 20);
    x += colonne[1].largo;
    doc.text(r.misure, x + 2, yt);
    x += colonne[2].largo;
    doc.text(String(r.quantita), x + 2, yt);
    x += colonne[3].largo;
    const valori = [NUM(r.ug), NUM(r.uf), NUM(r.psi, 3)];
    valori.forEach((v, k) => {
      doc.text(v || '-', x + colonne[4 + k].largo - 2, yt, { align: 'right' });
      x += colonne[4 + k].largo;
    });
    doc.setFont('helvetica', 'bold');
    doc.text(r.uw == null ? '-' : `${formattaUw(r.uw).replace(' W/m²K', '')}${r.stimata ? ' *' : ''}`, x + colonne[7].largo - 2, yt, { align: 'right' });
    if (r.stimata) indicative = true;

    y += h;
    doc.setDrawColor(215, 218, 224);
    doc.setLineWidth(0.15);
    doc.line(m, y, m + larga, y);
  });

  // Come si calcola, e di nuovo l'avviso: deve restare attaccato ai numeri
  // anche se qualcuno stampa solo l'ultima pagina.
  const note = [
    'Uw = (Ag x Ug + Af x Uf + lg x Psi g) / (Ag + Af), secondo UNI EN ISO 10077-1. Ag e Af sono le superfici di vetro e telaio a vista, lg il perimetro visibile dei vetri.',
    'Ug: trasmittanza del vetro. Uf: trasmittanza del telaio, dalla scheda del profilo. Psi g: ponte termico del bordo vetro; se non indicato nel profilo, valore tabellare della norma.',
    indicative ? '* Valore indicativo: mancano le larghezze a vista dei profili, sono stati usati valori tipici del materiale.' : '',
  ].filter(Boolean);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const righeNote = note.flatMap((n) => doc.splitTextToSize(n, larga));
  const altezzaChiusura = righeNote.length * 3.4 + 22;
  if (y + altezzaChiusura > ph - m) {
    doc.addPage();
    y = m;
  }
  y += 6;
  doc.setTextColor(80, 80, 80);
  doc.text(righeNote, m, y);
  y += righeNote.length * 3.4 + 2;
  scriviAvviso(y);

  const totale = doc.getNumberOfPages();
  const oggi = new Date().toLocaleDateString('it-IT');
  for (let p = 1; p <= totale; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(`Calcolo del ${oggi}${firma ? ' - creato con SerraDesk' : ''}`, m, ph - 6);
    doc.text(`Pagina ${p} di ${totale}`, pw - m, ph - 6, { align: 'right' });
  }
  return doc.output('blob');
}

export function nomeFileTrasmittanza(cliente, numero) {
  return nomeFileAbaco(cliente, numero).replace(/^abaco/, 'trasmittanza').replace(/\.dxf$/, '.pdf');
}
