// Le voci libere che il serramentista ha gia' scritto nei suoi preventivi
// (trasporto in cantiere, posa, smaltimento...), con l'ultimo prezzo usato.
// Il cliente piu' attivo riscriveva "Trasporto in cantiere" a ogni preventivo,
// in quattro modi diversi: ora gliele proponiamo mentre scrive.

const pulisci = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const chiaveDi = (s) => pulisci(s).replace(/[\s.,;:]+$/, '').toLowerCase();
const senzaAccenti = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// Una riga e' una voce libera scritta a mano: la riga delle tapparelle e'
// anch'essa 'custom', ma la scrive il programma (e i m² cambiano ogni volta).
const eVoceLibera = (it) =>
  it && it.type === 'custom'
  && (it.rawInput?.itemType ?? 'custom') === 'custom'
  && pulisci(it.customDescription) !== '';

/**
 * ordini: [{ items, created_at }], in qualunque ordine.
 * attuali: le righe del preventivo aperto (contano come le piu' recenti).
 * Ritorna [{ testo, prezzo, unita, volte, ultima }], le piu' usate prima.
 */
export function raccogliVociLibere(ordini = [], attuali = []) {
  const mappa = new Map();
  const aggiungi = (it, quando) => {
    if (!eVoceLibera(it)) return;
    const chiave = chiaveDi(it.customDescription);
    const prezzo = Number(it.unitPrice);
    const voce = mappa.get(chiave);
    if (!voce) {
      mappa.set(chiave, {
        testo: pulisci(it.customDescription),
        prezzo: Number.isFinite(prezzo) ? prezzo : 0,
        unita: it.unita || 'pz',
        volte: 1,
        ultima: quando,
      });
      return;
    }
    voce.volte += 1;
    if (quando >= voce.ultima) {
      voce.testo = pulisci(it.customDescription);
      voce.prezzo = Number.isFinite(prezzo) ? prezzo : 0;
      voce.unita = it.unita || 'pz';
      voce.ultima = quando;
    }
  };

  for (const o of ordini) {
    const quando = Date.parse(o?.created_at) || 0;
    if (Array.isArray(o?.items)) o.items.forEach((it) => aggiungi(it, quando));
  }
  // Il preventivo aperto puo' essere gia' salvato: le sue righe non vanno
  // contate due volte, ma il prezzo appena scritto vince.
  const ora = Date.now();
  for (const it of attuali || []) {
    if (!eVoceLibera(it)) continue;
    const voce = mappa.get(chiaveDi(it.customDescription));
    if (voce) {
      voce.prezzo = Number(it.unitPrice) || voce.prezzo;
      voce.unita = it.unita || voce.unita;
      voce.ultima = ora;
    } else {
      aggiungi(it, ora);
    }
  }

  return [...mappa.values()].sort((a, b) => b.volte - a.volte || b.ultima - a.ultima);
}

/**
 * Le voci che contengono tutte le parole scritte, in qualunque ordine
 * ("trasp cant" trova "Trasporto in cantiere"). Campo vuoto: le piu' usate.
 * Non propone la voce identica a quella gia' scritta.
 */
export function filtraVoci(voci, scritto, quante = 6) {
  const testo = senzaAccenti(pulisci(scritto).toLowerCase());
  const parole = testo.split(' ').filter(Boolean);
  const chiaveScritta = chiaveDi(scritto);
  return voci
    .filter((v) => chiaveDi(v.testo) !== chiaveScritta)
    .filter((v) => {
      const t = senzaAccenti(v.testo.toLowerCase());
      return parole.every((p) => t.includes(p));
    })
    .slice(0, quante);
}
