/**
 * usePricingEngine.js
 * Motore di calcolo prezzi estratto da PreventiviPage.
 * Gestisce: mq, ml, fisso, kg + vetro + trasmittanza.
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
    const numAnte = Number(item.numAnte) || 1;
    const isFisso = item.apertura === 'Fisso';
    
    // Fatturazione Minima e maggiorazione ante
    if (!isFisso && item.apertura !== 'Cassonetto') {
      if (numAnte === 1 && mq < 1.50) mq = 1.50;
      if (numAnte >= 2 && mq < 2.00) mq = 2.00;
      if (numAnte === 3) mq += 1.50;
      if (numAnte >= 4) mq += 2.00;
    }
    
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
    const numAnte = Number(item.numAnte) || 1;
    const isFisso = item.apertura === 'Fisso';
    
    // Fatturazione Minima e maggiorazione ante
    if (!isFisso && item.apertura !== 'Cassonetto') {
      if (numAnte === 1 && mq < 1.50) mq = 1.50;
      if (numAnte >= 2 && mq < 2.00) mq = 2.00;
      if (numAnte === 3) mq += 1.50;
      if (numAnte >= 4) mq += 2.00;
    }
    
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
 * Calcola la trasmittanza termica Uw combinata (profilo + vetro).
 */
export function calculateTransmittance(item, sistemiCam) {
  const sysProfilo = sistemiCam.find(s => s.id === item.sistemaCamId);
  if (!sysProfilo) return null;

  let uf = Number(sysProfilo.specs?.trasmittanza?.replace(',', '.')) || null;
  let ug = null;

  if (item.vetroId && item.vetroId !== 'custom') {
    const v = sistemiCam.find(s => s.id === item.vetroId);
    if (v && v.specs?.trasmittanza) ug = Number(v.specs.trasmittanza.replace(',', '.')) || null;
  }

  if (uf && ug) {
    const uw = (ug * 0.70) + (uf * 0.30) + 0.1;
    return uw.toFixed(2);
  } else if (uf) {
    return uf.toString().replace('.', ',');
  }
  return null;
}

/**
 * Calcola la quadratura effettiva di un articolo, applicando i minimi fatturabili e i manualMq
 */
export function calculateItemMq(item) {
  if (item.type === 'custom') return 0;
  if (item.type === 'complemento') {
    const isFisso = item.complementoCalcType === 'fisso';
    if (isFisso) return 0;
    return ((item.width || 0) / 1000) * ((item.height || 0) / 1000);
  }

  let wM = (item.width || 0) / 1000;
  let hM = (item.height || 0) / 1000;
  let mq = wM * hM;
  const numAnte = Number(item.numAnte) || 1;
  const isFisso = item.apertura === 'Fisso';
  
  if (!isFisso && item.apertura !== 'Cassonetto') {
    if (numAnte === 1 && mq < 1.50) mq = 1.50;
    if (numAnte >= 2 && mq < 2.00) mq = 2.00;
    if (numAnte === 3) mq += 1.50;
    if (numAnte >= 4) mq += 2.00;
  }
  
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
