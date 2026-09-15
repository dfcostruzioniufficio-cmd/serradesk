/**
 * Distinta di taglio per persiane e scuroni.
 *
 * Una persiana non si costruisce come una finestra: non c'e' vetro, l'anta
 * e' riempita di lamelle orizzontali (persiana) o di doghe verticali
 * (scurone), e il numero di quegli elementi dipende dal passo. I cataloghi
 * danno ogni taglio come "misura meno una quota" (per esempio Sapa Scurone
 * Venezia: telaio L+28, traverso L-12, doghe H-24), quindi qui ogni pezzo e'
 * descritto dal suo codice e dalla quota da togliere. Le quote le inserisce
 * l'utente nell'Archivio copiandole dalla distinta del produttore: il
 * programma non ne inventa nessuna.
 *
 * Convenzione, uguale alle finestre: L e H sono le misure inserite nel
 * preventivo. Una detrazione negativa allunga il pezzo (L+28 -> -28).
 */

const numero = (v) => v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v));
const quota = (v) => (numero(v) ? Number(v) : 0);

/**
 * Dice se un articolo va calcolato come persiana.
 */
export function ePersiana(item, sys) {
  return String(item?.apertura || '').toLowerCase().includes('persiana')
    || String(sys?.tipologia || '').toUpperCase().startsWith('PERSIANA');
}

/**
 * Elenca i dati che mancano per poter calcolare. Senza questi il calcolo
 * uscirebbe con quote a zero, cioe' misure credibili ma sbagliate.
 */
export function datiMancantiPersiana(p) {
  const mancano = [];
  if (!p) return ['i dati di taglio della persiana (Archivio Sistemi, scheda Dati di Taglio)'];
  if (!p.anta?.codice) mancano.push('il codice del profilo anta');
  if (!numero(p.anta?.detrazione_larghezza_mm)) mancano.push('la detrazione in larghezza dell\'anta');
  if (!numero(p.anta?.detrazione_altezza_mm)) mancano.push('la detrazione in altezza dell\'anta');
  if (!p.riempimento?.codice) mancano.push('il codice di lamelle o doghe');
  if (!(Number(p.riempimento?.passo_mm) > 0)) mancano.push('il passo di lamelle o doghe');
  return mancano;
}

/**
 * Calcola i pezzi di una persiana. Restituisce null se mancano dati
 * (l'elenco va chiesto a datiMancantiPersiana).
 */
export function calcolaPersiana(item, sys) {
  const p = sys?.specs?.persiana;
  if (datiMancantiPersiana(p).length) return null;

  const L = Number(item.width) || 0;
  const H = Number(item.height) || 0;
  const numAnte = Math.max(1, Number(item.numAnte) || 1);
  const pezzi = [];
  const etichette = {};
  const avvisi = [];
  const etichetta = (codice, descrizione) => { if (codice) etichette[codice] = descrizione || codice; };

  // ── Telaio ──
  const t = p.telaio || {};
  const conTelaio = t.presente !== false && !!t.codice;
  if (conTelaio) {
    etichetta(t.codice, t.descrizione);
    pezzi.push(
      { part: 'frame_top',   profile: t.codice, mm: Math.round(L - quota(t.detrazione_larghezza_mm)) },
      { part: 'frame_left',  profile: t.codice, mm: Math.round(H - quota(t.detrazione_altezza_mm)) },
      { part: 'frame_right', profile: t.codice, mm: Math.round(H - quota(t.detrazione_altezza_mm)) },
    );
    // Molte persiane hanno il telaio su tre lati: la traversa inferiore si
    // mette solo se e' stata indicata.
    if (t.inferiore?.presente) {
      const codiceInf = t.inferiore.codice || t.codice;
      etichetta(codiceInf, t.inferiore.descrizione || t.descrizione);
      pezzi.push({ part: 'frame_bottom', profile: codiceInf, mm: Math.round(L - quota(t.inferiore.detrazione_mm)) });
    }
  }

  // ── Ante ──
  const a = p.anta;
  etichetta(a.codice, a.descrizione);
  const larghezzaTotale = L - quota(a.detrazione_larghezza_mm) - (numAnte - 1) * quota(a.detrazione_nodo_mm);
  const La = larghezzaTotale / numAnte;
  const Ha = H - quota(a.detrazione_altezza_mm);
  const LaMm = Math.round(La);
  const HaMm = Math.round(Ha);

  if (LaMm <= 0 || HaMm <= 0) {
    avvisi.push(`${L}x${H}: con queste detrazioni l'anta verrebbe ${LaMm}x${HaMm}, la persiana non e' calcolata`);
    return { pezzi: [], etichette, avvisi, frame: { width: L, height: H }, sash: null, dettaglio: null };
  }

  const tr = a.traverse || {};
  const codiceTraverse = tr.codice || a.codice;
  etichetta(codiceTraverse, tr.descrizione || a.descrizione);

  const r = p.riempimento;
  const doghe = r.tipo === 'doghe';
  etichetta(r.codice, r.descrizione || (doghe ? 'Doghe' : 'Lamelle'));

  // Traverso intermedio (fascione centrale): toglie spazio al riempimento.
  const trv = p.traverso || {};
  const conTraverso = !!item.hasTraverso && !!trv.codice;
  if (item.hasTraverso && !trv.codice) {
    avvisi.push(`${L}x${H}: e' stato chiesto il traverso ma il sistema non ha il profilo del traverso, non e' in distinta`);
  }
  if (conTraverso) etichetta(trv.codice, trv.descrizione || 'Traverso');

  // Quanti elementi entrano: lo spazio utile diviso il passo, per difetto.
  // Arrotondare per eccesso ne metterebbe uno che non ci sta.
  const passo = Number(r.passo_mm);
  const spazio = (doghe ? La : Ha) - quota(r.detrazione_conteggio_mm) - (conTraverso && !doghe ? quota(trv.ingombro_mm) : 0);
  const quanti = Math.max(0, Math.floor(spazio / passo));
  const lunghezzaRiempimento = Math.round((doghe ? Ha : La) - quota(r.detrazione_mm));
  if (quanti === 0 || lunghezzaRiempimento <= 0) {
    avvisi.push(`${L}x${H}: ${doghe ? 'doghe' : 'lamelle'} non calcolate (spazio utile ${Math.round(spazio)} mm, passo ${passo} mm)`);
  }

  const comp = p.compensatore || {};
  const asta = p.asta || {};
  if (comp.codice) etichetta(comp.codice, comp.descrizione || 'Compensatore');
  if (asta.codice) etichetta(asta.codice, asta.descrizione || 'Asta di comando');

  for (let n = 1; n <= numAnte; n++) {
    pezzi.push(
      { part: `anta_${n}_left`,   profile: a.codice,       mm: HaMm },
      { part: `anta_${n}_right`,  profile: a.codice,       mm: HaMm },
      { part: `anta_${n}_top`,    profile: codiceTraverse, mm: Math.round(La - quota(tr.detrazione_mm)) },
      { part: `anta_${n}_bottom`, profile: codiceTraverse, mm: Math.round(La - quota(tr.detrazione_mm)) },
    );
    if (conTraverso) {
      pezzi.push({ part: `traverso_anta_${n}`, profile: trv.codice, mm: Math.round(La - quota(trv.detrazione_mm)) });
    }
    if (quanti > 0 && lunghezzaRiempimento > 0) {
      // Un solo pezzo con n: nella scheda del serramento resta una riga
      // ("Lamelle anta 1 - 32 pz") invece di trentadue righe uguali.
      pezzi.push({ part: `${doghe ? 'doghe' : 'lamelle'}_${n}`, profile: r.codice, mm: lunghezzaRiempimento, n: quanti });
    }
    const quantiComp = Math.max(0, Number(comp.per_anta) || 0);
    if (comp.codice && quantiComp > 0) {
      pezzi.push({ part: `compensatore_${n}`, profile: comp.codice, mm: Math.round(Ha - quota(comp.detrazione_mm)), n: quantiComp });
    }
    const quanteAste = Math.max(0, Number(asta.per_anta) || 0);
    if (asta.codice && quanteAste > 0) {
      pezzi.push({ part: `asta_${n}`, profile: asta.codice, mm: Math.round(Ha - quota(asta.detrazione_mm)), n: quanteAste });
    }
  }

  const rip = p.riporto || {};
  if (numAnte > 1 && rip.codice) {
    etichetta(rip.codice, rip.descrizione || 'Riporto centrale');
    for (let k = 1; k < numAnte; k++) {
      pezzi.push({ part: `riporto_centrale_${k}`, profile: rip.codice, mm: Math.round(Ha - quota(rip.detrazione_mm)) });
    }
  }

  return {
    pezzi,
    etichette,
    avvisi,
    frame: { width: L, height: H },
    sash: { width: LaMm, height: HaMm },
    dettaglio: { tipo: doghe ? 'doghe' : 'lamelle', perAnta: quanti, passo, lunghezza: lunghezzaRiempimento, conTelaio },
  };
}

/**
 * Stima della ferramenta di una persiana: niente guarnizioni ne' vetro.
 */
export function ferramentaPersiana(item, numAnte, qty, conTelaio) {
  const H = Number(item.height) || 0;
  const cernierePerAnta = H > 1600 ? 3 : 2;
  return [
    { nome: 'Cardini / Cerniere persiana', qta: cernierePerAnta * numAnte * qty, unitaMisura: 'pz' },
    { nome: 'Chiusura (spagnoletta)', qta: 1 * qty, unitaMisura: 'pz' },
    { nome: 'Fermapersiana', qta: numAnte * qty, unitaMisura: 'pz' },
    { nome: 'Squadrette Angolo', qta: ((conTelaio ? 4 : 0) + 4 * numAnte) * qty, unitaMisura: 'pz' },
  ];
}
