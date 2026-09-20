import { mqTapparella } from '../utils/tapparella';
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
  let apribili = 0;
  for (let i = 0; i < numAnte; i++) {
    const c = configurazione[i];
    // Il traverso puo' essere acceso o spento sulla singola anta: la P01 ha
    // la traversa solo sui due fissi laterali, non sulle ante della porta.
    const traversoAnta = c?.traverso ?? traverso;
    if (traversoAnta && c?.tipoSopra) {
      if (c.tipo !== 'fissa') apribili += 1;
      if (c.tipoSopra !== 'fissa') apribili += 1;
    } else if (c?.tipo !== 'fissa') {
      apribili += 1;
    }
  }
  return apribili;
}

/** Minimo fatturabile e maggiorazione per ante, contando solo le apribili. */
function mqConMinimiAnte(item, mq) {
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

    if (item.vetroId && item.vetroId !== 'custom') {
      const v = sistemiCam.find(s => s.id === item.vetroId);
      if (v) baseVetro = Number(v.base_price) || 0;
    }

    let baseVetroInferiore = baseVetro;
    if (item.hasTraverso && item.vetroInferioreId && item.vetroInferioreId !== 'custom') {
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
    if (item.hasTraverso) {
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
        const antaW = wM / numAnte;
        kgAnta = (antaW + hM) * 2 * numAnte * pesoAnta;
        if (numAnte > 1) {
          kgRiporto = hM * (numAnte - 1) * pesoRiporto;
        }
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
          const antaW = wM / numAnte;
          kgAnta = (antaW + hM) * 2 * numAnte * pesoAnta;
          if (numAnte > 1) {
            kgRiporto = hM * (numAnte - 1) * pesoRiporto;
          }
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
