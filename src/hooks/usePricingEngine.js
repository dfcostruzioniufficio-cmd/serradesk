import { mqTapparella } from '../utils/tapparella';
import { sonoSovrapposte } from '../utils/anteSovrapposte';
import { ePersiana } from '../utils/persianaEngine';
/**
 * usePricingEngine.js
 * Motore di calcolo prezzi estratto da PreventiviPage.
 * Gestisce: mq, ml, fisso, kg + vetro. La trasmittanza sta in utils/trasmittanza.js.
 */

const COLOR_MAP = {
  'bianco': '#ffffff', 'noce': '#5c4033', 'rovere': '#8b5a2b', 'antracite': '#383e42',
  'marrone': '#5c4033', 'grigio': '#808080', 'nero': '#000000', 'avorio': '#fffff0',
  'verde': '#355e3b', 'rosso': '#8b0000', 'blu': '#00008b', 'argento': '#c0c0c0',
  'bronzo': '#cd7f32', 'oro': '#d4af37', 'ciliegio': '#9e2a2b', 'pino': '#4a5d23'
};

/**
 * Sincronizza il colore del frame in base al nome colore.
 */
export function syncFrameColor(colorName) {
  const lower = colorName.toLowerCase();
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(name)) return hex;
  }
  return null;
}

/**
 * Quante ante del serramento si aprono davvero.
 *
 * Nel disegno l'utente puo' segnare un'anta come fissa (tipo 'fissa' nella
 * sua configurazione). Un'anta fissa non ha ferramenta ne' profilo anta, e
 * non deve contare per il minimo fatturabile ne' per la maggiorazione: una
 * 5 ante con 3 fisse si fattura come una 2 ante.
 *
 * Le ante mai toccate restano apribili. I preventivi gia' fatti non hanno il
 * tipo su nessuna anta, quindi il loro prezzo non cambia.
 */
export function anteApribili(item) {
  const numAnte = Math.max(1, Number(item?.numAnte) || 1);
  const configurazione = Array.isArray(item?.paneConfigs) ? item.paneConfigs : item?.rawInput?.paneConfigs;
  if (!Array.isArray(configurazione)) return numAnte;
  // Col traverso un'anta toccata nel disegno diventa due ante indipendenti,
  // sopra (tipoSopra) e sotto (tipo): contano una per una, come si aprono.
  // Senza traverso, o su un'anta mai toccata, conta l'anta intera.
  const traverso = item?.hasTraverso ?? item?.rawInput?.hasTraverso;
  // Ante una sopra l'altra: ogni anta conta per se', la traversa dell'anta
  // li' non esiste anche se nella configurazione e' rimasta accesa.
  const sovrapposte = sonoSovrapposte(item);
  let apribili = 0;
  for (let i = 0; i < numAnte; i++) {
    const c = configurazione[i];
    // Il traverso puo' essere acceso o spento sulla singola anta: la P01 ha
    // la traversa solo sui due fissi laterali, non sulle ante della porta.
    const traversoAnta = !sovrapposte && (c?.traverso ?? traverso);
    if (traversoAnta && c?.tipoSopra) {
      if (c.tipo !== 'fissa') apribili += 1;
      if (c.tipoSopra !== 'fissa') apribili += 1;
    } else if (c?.tipo !== 'fissa') {
      apribili += 1;
    }
  }
  return apribili;
}

/**
 * Metri di profilo anta e di riporto (il nodo fra due ante) per il prezzo a
 * peso. Ante affiancate: ognuna larga L/n e alta H, i nodi sono verticali e
 * alti H. Ante una sopra l'altra: ognuna larga L e alta H/n, i nodi sono
 * orizzontali e lunghi L.
 */
export function metriAnteERiporti(item, wM, hM) {
  const numAnte = Number(item.numAnte) || 1;
  const sovrapposte = sonoSovrapposte(item);
  const [antaW, antaH, nodo] = sovrapposte ? [wM, hM / numAnte, wM] : [wM / numAnte, hM, hM];
  return { anta: (antaW + antaH) * 2 * numAnte, riporto: numAnte > 1 ? nodo * (numAnte - 1) : 0 };
}

/** Minimo fatturabile e maggiorazione per ante, contando solo le apribili. */
function mqConMinimiAnte(item, mq) {
  // Un composto si fattura sul rettangolo d'ingombro, che e' grande per
  // definizione: i minimi e le maggiorazioni per anta sono tarati su un
  // serramento singolo e qui non c'entrano niente.
  if (item.composto) return mq;
  if (item.apertura === 'Fisso' || item.apertura === 'Cassonetto') return mq;
  const apribili = anteApribili(item);
  // Tutte fisse: si fattura come un fisso, a misura, senza minimo.
  if (apribili === 0) return mq;
  if (apribili === 1 && mq < 1.50) mq = 1.50;
  if (apribili >= 2 && mq < 2.00) mq = 2.00;
  if (apribili === 3) mq += 1.50;
  if (apribili >= 4) mq += 2.00;
  return mq;
}

/**
 * Gli articoli che il vetro non ce l'hanno. Il loro vetroId pero' poteva
 * restare pieno, ereditato dalla finestra configurata prima nello stesso
 * modulo: il prezzo sommava quel vetro, e il PDF non lo scriveva. La Uw li
 * esclude gia' (utils/trasmittanza.js); il prezzo li esclude qui, cosi' vale
 * per ogni strada che ricalcola: modulo, cambio profilo, quadratura forzata.
 */
export const SENZA_VETRO = ['Persiana', 'Persiana Balcone', 'Porta Blindata', 'Cassonetto', 'Tapparella'];

/**
 * Calcola il prezzo unitario per un serramento in base al tipo di calcolo.
 */
export function calculateWindowPrice(item, sistemiCam) {
  const wM = Number(item.width) / 1000;
  const hM = Number(item.height) / 1000;
  const cType = item.calcType;

  const sysProfilo = sistemiCam.find(s => s.id === item.sistemaCamId);

  // Se l'utente ha modificato manualmente il Prezzo Base, sovrascriviamo l'uso dei listini
  const isOverride = item.isManualBasePrice;

  if (sysProfilo && !isOverride) {
    const baseProfilo = Number(sysProfilo.base_price) || 0;
    let baseVetro = 0;
    const conVetro = !SENZA_VETRO.includes(item.apertura);

    if (conVetro && item.vetroId && item.vetroId !== 'custom') {
      const v = sistemiCam.find(s => s.id === item.vetroId);
      if (v) baseVetro = Number(v.base_price) || 0;
    }

    let baseVetroInferiore = baseVetro;
    // Sulle ante una sopra l'altra il traverso non c'e', anche se la spunta
    // e' rimasta accesa nel modulo: niente vetro inferiore a parte.
    const conTraverso = !!item.hasTraverso && !sonoSovrapposte(item);
    if (conVetro && conTraverso && item.vetroInferioreId && item.vetroInferioreId !== 'custom') {
      const vInf = sistemiCam.find(s => s.id === item.vetroInferioreId);
      if (vInf) baseVetroInferiore = Number(vInf.base_price) || 0;
    }

    let mq = wM * hM;
    
    // Fatturazione Minima e maggiorazione ante
    mq = mqConMinimiAnte(item, mq);
    
    if (item.manualMq && Number(item.manualMq) > 0) {
      mq = Number(item.manualMq);
    }

    let costoVetro = 0;
    if (conTraverso) {
      const tH = Number(item.traversoHeight) || 1000;
      const hH = Math.max(0, hM - (tH / 1000));
      const bH = tH / 1000;
      const totalOriginalMq = wM * hM;
      
      if (totalOriginalMq > 0) {
        const ratioTop = (wM * hH) / totalOriginalMq;
        const ratioBot = (wM * bH) / totalOriginalMq;
        costoVetro = (mq * ratioTop * baseVetro) + (mq * ratioBot * baseVetroInferiore);
      }
    } else {
      costoVetro = mq * baseVetro;
    }

    const totalBasePrice = baseProfilo + baseVetro;

    let unitPrice;
    if (cType === 'mq')    unitPrice = ((mq * baseProfilo) + costoVetro).toFixed(2);
    if (cType === 'ml') {
      const ml = item.apertura === 'Cassonetto' ? wM : (wM + hM) * 2;
      unitPrice = ((ml * baseProfilo) + costoVetro).toFixed(2);
    }
    if (cType === 'fisso') unitPrice = (baseProfilo + costoVetro).toFixed(2);
    if (cType === 'kg') {
      const numAnte = Number(item.numAnte) || 1;
      const isFisso = item.apertura === 'Fisso';

      const pesoTelaio = Number(sysProfilo.profilo_lati?.peso_kg_ml) || 0;
      const pesoAnta = Number(sysProfilo.profilo_anta?.peso_kg_ml) || 0;
      const pesoRiporto = Number(sysProfilo.profilo_riporto?.peso_kg_ml) || 0;

      const kgTelaio = (wM + hM) * 2 * pesoTelaio;
      let kgAnta = 0;
      let kgRiporto = 0;

      if (!isFisso && numAnte > 0) {
        const metri = metriAnteERiporti(item, wM, hM);
        kgAnta = metri.anta * pesoAnta;
        kgRiporto = metri.riporto * pesoRiporto;
      }

      const totalKg = (kgTelaio + kgAnta + kgRiporto) * 1.05;
      const costoAlluminio = totalKg * baseProfilo;
      unitPrice = (costoAlluminio + costoVetro).toFixed(2);
    }

    return { unitPrice, basePrice: totalBasePrice };
  } else {
    // Configurazione Manuale (nessun profilo dall'archivio) OPPURE Prezzo sovrascritto manualmente
    const bPrice = Number(item.basePrice) || 0;
    let unitPrice;
    
    let mq = wM * hM;
    
    // Fatturazione Minima e maggiorazione ante
    mq = mqConMinimiAnte(item, mq);
    
    if (item.manualMq && Number(item.manualMq) > 0) {
      mq = Number(item.manualMq);
    }

    if (cType === 'mq')    unitPrice = (mq * bPrice).toFixed(2);
    if (cType === 'ml') {
      const ml = item.apertura === 'Cassonetto' ? wM : (wM + hM) * 2;
      unitPrice = (ml * bPrice).toFixed(2);
    }
    if (cType === 'fisso' || cType === 'pz') unitPrice = bPrice.toFixed(2);
    if (cType === 'kg') {
      if (sysProfilo) {
        // Se c'è un profilo e sovrascriviamo il prezzo al KG, ricalcoliamo i kg
        const baseProfilo = bPrice;
        const numAnte = Number(item.numAnte) || 1;
        const isFisso = item.apertura === 'Fisso';

        const pesoTelaio = Number(sysProfilo.profilo_lati?.peso_kg_ml) || 0;
        const pesoAnta = Number(sysProfilo.profilo_anta?.peso_kg_ml) || 0;
        const pesoRiporto = Number(sysProfilo.profilo_riporto?.peso_kg_ml) || 0;

        const kgTelaio = (wM + hM) * 2 * pesoTelaio;
        let kgAnta = 0;
        let kgRiporto = 0;

        if (!isFisso && numAnte > 0) {
          const metri = metriAnteERiporti(item, wM, hM);
          kgAnta = metri.anta * pesoAnta;
          kgRiporto = metri.riporto * pesoRiporto;
        }

        const totalKg = (kgTelaio + kgAnta + kgRiporto) * 1.05;
        unitPrice = (totalKg * baseProfilo).toFixed(2); // In override ignora baseVetro
      } else {
        unitPrice = ((wM + hM) * 2 * bPrice).toFixed(2);
      }
    }
    return { unitPrice, basePrice: bPrice };
  }
}

/**
 * Calcola la quadratura effettiva di un articolo, applicando i minimi fatturabili e i manualMq
 */
export function calculateItemMq(item) {
  if (item.type === 'custom') return 0;
  if (item.type === 'complemento') {
    const isFisso = item.complementoCalcType === 'fisso';
    if (isFisso) return 0;
    // Solo le tapparelle inserite con la regola nuova (hanno tapparellaAnte).
    // Quelle dei preventivi gia' salvati restano L x H: altrimenti riaprendo
    // un preventivo gia' mandato cambierebbero da sole m² e prezzi.
    if ((item.complementoType || item.model) === 'Tapparella' && Number(item.tapparellaAnte) > 0) {
      return mqTapparella({ ...item, numAnte: item.tapparellaAnte }).mqFatturati;
    }
    return ((item.width || 0) / 1000) * ((item.height || 0) / 1000);
  }

  let wM = (item.width || 0) / 1000;
  let hM = (item.height || 0) / 1000;
  let mq = wM * hM;
  mq = mqConMinimiAnte(item, mq);
  
  if (item.manualMq && Number(item.manualMq) > 0) {
    mq = Number(item.manualMq);
  }
  
  return mq;
}

/**
 * Calcola il riepilogo costi del preventivo.
 */
export function calculateQuoteSummary(items, sconto, iva) {
  const imponibile = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const scontoAmount = imponibile * (Number(sconto) || 0) / 100;
  const imponibileScontato = imponibile - scontoAmount;
  const totaleIva = imponibileScontato * (iva / 100);
  const totalePreventivo = imponibileScontato + totaleIva;

  return { imponibile, scontoAmount, imponibileScontato, totaleIva, totalePreventivo };
}

/**
 * Metri quadri e imponibile divisi per tipo: infissi, persiane, altre voci.
 * Sommare i m² di una persiana a quelli di una finestra non vuol dire niente,
 * e chi riceve il preventivo vuole vedere quanto costano gli uni e gli altri.
 * L'imponibile si somma come in calculateQuoteSummary, cosi' le parti tornano
 * col totale al centesimo. Si restituiscono solo i tipi presenti.
 */
const ALTRE_APERTURE = ['Cassonetto', 'Tapparella', 'tapparella'];
export const TIPI_RIEPILOGO = [
  { chiave: 'infissi', nome: 'Infissi' },
  { chiave: 'persiane', nome: 'Persiane' },
  { chiave: 'altro', nome: 'Altre voci' },
];
export function tipoDiRiepilogo(item) {
  if (item?.type !== 'window') return 'altro';
  if (ePersiana(item)) return 'persiane';
  if (ALTRE_APERTURE.includes(item.apertura)) return 'altro';
  return 'infissi';
}
export function riepilogoPerTipo(items) {
  const parti = Object.fromEntries(TIPI_RIEPILOGO.map((t) => [t.chiave, { ...t, mq: 0, imponibile: 0, presente: false }]));
  for (const item of items || []) {
    if (!item || item.type === 'metadata' || item.type === 'note') continue;
    const p = parti[tipoDiRiepilogo(item)];
    p.presente = true;
    p.imponibile += item.unitPrice * item.quantity;
    p.mq += calculateItemMq(item) * (item.quantity || 1);
  }
  return TIPI_RIEPILOGO.map((t) => parti[t.chiave]).filter((p) => p.presente);
}

/**
 * L'IVA di un preventivo salvato. Fino a ottobre 2026 non si salvava: si
 * ricava dal totale (salvato insieme agli articoli), purche' esca un numero
 * intero sensato. Altrimenti `predefinita`.
 */
export function ivaDelPreventivo(meta, items, totale, predefinita = 22) {
  const salvata = Number(meta?.iva);
  if (meta?.iva !== undefined && meta?.iva !== null && meta?.iva !== '' && Number.isFinite(salvata)) return salvata;
  const articoli = (items || []).filter(i => i && i.type !== 'metadata' && i.type !== 'note');
  const imponibile = articoli.reduce((acc, i) => acc + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);
  const scontato = imponibile * (1 - (Number(meta?.discount) || 0) / 100);
  const tot = Number(totale);
  if (!(scontato > 0) || !(tot > 0)) return predefinita;
  const iva = (tot / scontato - 1) * 100;
  const intera = Math.round(iva);
  return (Math.abs(iva - intera) < 0.05 && intera >= 0 && intera <= 30) ? intera : predefinita;
}
