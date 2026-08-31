/**
 * ═══════════════════════════════════════════════════════
 *  MOTORE CAM — Distinta di Taglio Parametrica
 * ═══════════════════════════════════════════════════════
 * Le costanti dimensionali vengono lette dal "sistema"
 * associato all'articolo (definito nell'Archivio).
 * Solo BAR_MM, KERF, END_TRIM sono costanti macchina.
 */

const KERF     = 4;
const END_TRIM = 20;
const DOUBLE_TRIM = END_TRIM * 2; // Sbucciatura per difetti su ambo i lati
const SFRIDO_MORSA = 150; // Spazio cieco per morsa macchina

// Fallback se nessun sistema è associato all'articolo
const DEF = {
  profilo_lati:  { codice: 'TEL-Z30',     aletta_mm: 30, saldatura_mm: 6, tolleranza_mm: 5 },
  profilo_basso: { codice: 'TEL-INF-DRN', aletta_mm: 0,  saldatura_mm: 6, tolleranza_mm: 5 },
  profilo_anta:  { codice: 'ANT-T70',     rebate_mm: 64, sormonto_mm: 20, saldatura_mm: 6, ingombro_vista_mm: 70 },
  profilo_riporto: { codice: 'RIP-70',    descrizione: 'Scambio Battuta', taglio_extra_mm: 0 },
  profilo_fermavetro: { codice: 'FERM-24', descrizione: 'Fermavetro' },
};

// Export per backward compat con DistintaPDFTemplate
export const PROFILE_LABELS = {
  'TEL-Z30':     'Telaio a Z (Lati Sup./Sx./Dx.)',
  'TEL-INF-DRN': 'Telaio Inferiore con Drenaggio',
  'ANT-T70':     'Profilo Anta a T',
  'RIP-70':      'Scambio Battuta',
  'FERM-24':     'Fermavetro',
};

function packBars(pieces, barLength) {
  const sorted = [...pieces].sort((a, b) => b - a);
  const bars   = [];
  for (const piece of sorted) {
    let placed = false;
    for (const bar of bars) {
      const used = bar.cuts.reduce((s, c) => s + c + KERF, DOUBLE_TRIM + SFRIDO_MORSA);
      if (barLength - used >= piece + KERF) {
        bar.cuts.push(piece);
        placed = true;
        break;
      }
    }
    if (!placed) bars.push({ cuts: [piece] });
  }
  return bars.map(bar => {
    const used = bar.cuts.reduce((s, c) => s + c + KERF, DOUBLE_TRIM + SFRIDO_MORSA);
    return { cuts_mm: bar.cuts, waste_mm: barLength - used };
  });
}

export function runCamEngine(items, barLength = 6500) {
  const allBom      = [];
  const itemResults = [];
  const profileLabels = {};

  for (const item of items) {
    if (item.type === 'custom' || item.type === 'complemento') continue;

    const width   = Number(item.width)    || 0;
    const height  = Number(item.height)   || 0;
    const qty     = Number(item.quantity) || 1;
    const numAnte = Math.max(1, Number(item.numAnte) || 1);
    const isFisso = item.apertura === 'Fisso';
    if (!width || !height) continue;

    // Leggi il sistema dall'item (salvato al momento dell'aggiunta)
    const sys = item.sistema_cam || null;
    
    // Se non c'è un sistema CAM (inserimento manuale o legacy), non calcoliamo i tagli
    if (!sys) continue;

    const ts  = sys?.profilo_lati  || sys?.telaio_std || DEF.profilo_lati;
    const ti  = sys?.profilo_basso || sys?.telaio_inf || DEF.profilo_basso;
    const ant = sys?.profilo_anta  || sys?.anta       || DEF.profilo_anta;
    const rip = sys?.profilo_riporto || sys?.riporto  || sys?.specs?.riporto || DEF.profilo_riporto;
    const fv  = sys?.profilo_fermavetro || sys?.fermavetro || sys?.specs?.fermavetro || DEF.profilo_fermavetro;

    // Parametri dalla struttura
    const alettaLat  = ts.aletta_mm !== undefined ? Number(ts.aletta_mm) : 30;
    const alettaInf  = ti.aletta_mm !== undefined ? Number(ti.aletta_mm) : 0;
    const tolleranza = ts.tolleranza_mm !== undefined ? Number(ts.tolleranza_mm) : 5;
    const saldTel    = ts.saldatura_mm !== undefined ? Number(ts.saldatura_mm) : 6;
    const saldAnta   = ant.saldatura_mm !== undefined ? Number(ant.saldatura_mm) : 6;
    const rebate     = ant.rebate_mm !== undefined ? Number(ant.rebate_mm) : (Number(item.rebateDepth) || 64);
    const sormonto   = ant.sormonto_mm !== undefined ? Number(ant.sormonto_mm) : 20;
    const giocoCentrale = ant.gioco_centrale_mm !== undefined ? Number(ant.gioco_centrale_mm) : 0;

    // Codici e label profilo
    const cTelStd = ts.codice  || 'TEL-Z30';
    const cTelInf = ti.codice  || 'TEL-INF-DRN';
    const cAnta   = ant.codice || 'ANT-T70';
    profileLabels[cTelStd] = ts.descrizione  || cTelStd;
    profileLabels[cTelInf] = ti.descrizione  || cTelInf;
    profileLabels[cAnta]   = ant.descrizione || cAnta;
    profileLabels['TRAV-GEN'] = 'Traverso (Profilo Generico)';
    if (rip.codice) profileLabels[rip.codice] = rip.descrizione || rip.codice;
    if (fv.codice) profileLabels[fv.codice] = fv.descrizione || fv.codice;

    // Dimensioni telaio finito
    // fw: larghezza → 2 montanti laterali contribuiscono ognuno con la propria aletta
    const fw = width  - (tolleranza * 2) + (alettaLat * 2);
    // fh: altezza → tolleranza solo in alto (il davanzale appoggia a terra), traversa sup contribuisce con aletta, inf con aletta diversa
    const fh = height - tolleranza + alettaLat + alettaInf;

    // BOM telaio
    const framepieces = [
      { part: 'frame_top',    profile: cTelStd, mm: fw + saldTel, sald: saldTel },
      { part: 'frame_bottom', profile: cTelInf, mm: fw + saldTel, sald: saldTel },
      { part: 'frame_left',   profile: cTelStd, mm: fh + saldTel, sald: saldTel },
      { part: 'frame_right',  profile: cTelStd, mm: fh + saldTel, sald: saldTel },
    ];

    // BOM anta
    const sashPieces = [];
    let sw = 0, sh = 0;
    if (!isFisso && rebate > 0) {
      // Calcolo larghezza anta per multi-anta (nodo centrale)
      let sw_totale;
      if (giocoCentrale > 0) {
        // Logica a giunto aperto / gioco aria centrale
        sw_totale = fw - (rebate * 2) + (sormonto * 2) - ((numAnte - 1) * giocoCentrale);
      } else {
        // Logica standard (sormonto anche al centro)
        sw_totale = fw - (rebate * 2) + (sormonto * 2) + ((numAnte - 1) * sormonto);
      }
      sw = sw_totale / numAnte;
      
      // Se c'è un sopraluce, l'altezza utile per le ante si riduce
      const effectiveFh = item.hasSopraluce ? fh - (Number(item.sopraluceHeight) || 400) : fh;
      sh = effectiveFh - (rebate * 2) + (sormonto * 2);
      
      for (let a = 0; a < numAnte; a++) {
        sashPieces.push(
          { part: `anta_${a+1}_top`,    profile: cAnta, mm: sw + saldAnta, sald: saldAnta },
          { part: `anta_${a+1}_bottom`, profile: cAnta, mm: sw + saldAnta, sald: saldAnta },
          { part: `anta_${a+1}_left`,   profile: cAnta, mm: sh + saldAnta, sald: saldAnta },
          { part: `anta_${a+1}_right`,  profile: cAnta, mm: sh + saldAnta, sald: saldAnta },
        );
      }

      // Aggiunta Riporto Centrale (Scambio Battuta) per 2+ ante
      if (numAnte > 1 && rip.codice) {
        const taglioExtra = Number(rip.taglio_extra_mm) || 0;
        for (let r = 0; r < numAnte - 1; r++) {
          sashPieces.push({ part: `riporto_centrale_${r+1}`, profile: rip.codice, mm: sh + taglioExtra, sald: taglioExtra });
        }
      }
    }

    // BOM Fermavetri
    const fermavetroPieces = [];
    if (fv.codice) {
      if (isFisso) {
         const ingombroFisso = 50; // Stima ingombro per telaio fisso
         const fvW = fw - (ingombroFisso * 2);
         let fvH = fh - (ingombroFisso * 2);
         
         if (item.hasTraverso) {
             const ingombroTraverso = 50; // stima spessore traverso
             const fvH_mezzo = (fvH - ingombroTraverso) / 2;
             if (fvW > 0 && fvH_mezzo > 0) {
               fermavetroPieces.push(
                  { part: `ferm_fisso_top`,       profile: fv.codice, mm: fvW },
                  { part: `ferm_fisso_mid_top`,   profile: fv.codice, mm: fvW },
                  { part: `ferm_fisso_left_sup`,  profile: fv.codice, mm: fvH_mezzo },
                  { part: `ferm_fisso_right_sup`, profile: fv.codice, mm: fvH_mezzo },
                  { part: `ferm_fisso_mid_bot`,   profile: fv.codice, mm: fvW },
                  { part: `ferm_fisso_bottom`,    profile: fv.codice, mm: fvW },
                  { part: `ferm_fisso_left_inf`,  profile: fv.codice, mm: fvH_mezzo },
                  { part: `ferm_fisso_right_inf`, profile: fv.codice, mm: fvH_mezzo }
               );
             }
         } else {
             if (fvW > 0 && fvH > 0) {
               fermavetroPieces.push(
                  { part: `ferm_fisso_top`,    profile: fv.codice, mm: fvW },
                  { part: `ferm_fisso_bottom`, profile: fv.codice, mm: fvW },
                  { part: `ferm_fisso_left`,   profile: fv.codice, mm: fvH },
                  { part: `ferm_fisso_right`,  profile: fv.codice, mm: fvH }
               );
             }
         }
      } else if (rebate > 0) {
         const ingombroVista = Number(ant.ingombro_vista_mm) || 70;
         const fvW = sw - (ingombroVista * 2);
         const fvH = sh - (ingombroVista * 2);
         
         if (item.hasTraverso) {
             const ingombroTraverso = 50;
             const fvH_mezzo = (fvH - ingombroTraverso) / 2;
             if (fvW > 0 && fvH_mezzo > 0) {
               for (let a = 0; a < numAnte; a++) {
                 fermavetroPieces.push(
                   { part: `ferm_${a+1}_top`,       profile: fv.codice, mm: fvW },
                   { part: `ferm_${a+1}_mid_top`,   profile: fv.codice, mm: fvW },
                   { part: `ferm_${a+1}_left_sup`,  profile: fv.codice, mm: fvH_mezzo },
                   { part: `ferm_${a+1}_right_sup`, profile: fv.codice, mm: fvH_mezzo },
                   { part: `ferm_${a+1}_mid_bot`,   profile: fv.codice, mm: fvW },
                   { part: `ferm_${a+1}_bottom`,    profile: fv.codice, mm: fvW },
                   { part: `ferm_${a+1}_left_inf`,  profile: fv.codice, mm: fvH_mezzo },
                   { part: `ferm_${a+1}_right_inf`, profile: fv.codice, mm: fvH_mezzo }
                 );
               }
             }
         } else {
             if (fvW > 0 && fvH > 0) {
               for (let a = 0; a < numAnte; a++) {
                fermavetroPieces.push(
                  { part: `ferm_${a+1}_top`,    profile: fv.codice, mm: fvW },
                  { part: `ferm_${a+1}_bottom`, profile: fv.codice, mm: fvW },
                  { part: `ferm_${a+1}_left`,   profile: fv.codice, mm: fvH },
                  { part: `ferm_${a+1}_right`,  profile: fv.codice, mm: fvH },
                );
              }
            }
         }
      }
    }

    // BOM traverso intermedio (montante orizzontale centrale o per sopraluce)
    const traversoPieces = [];
    if (item.hasTraverso) {
      if (isFisso) {
        // Se è fisso, il traverso taglia il telaio ed è unico
        traversoPieces.push({ part: 'traverso_centrale', profile: 'TRAV-GEN', mm: fw + saldTel });
      } else {
        // Se ci sono le ante, il traverso sta dentro ogni singola anta
        for (let a = 0; a < numAnte; a++) {
          traversoPieces.push({ part: `traverso_anta_${a+1}`, profile: 'TRAV-GEN', mm: sw + saldAnta });
        }
      }
    }
    if (item.hasSopraluce) {
      traversoPieces.push(
        { part: 'traverso_sopraluce', profile: cTelStd, mm: fw + saldTel }
      );
    }

    const pieces = [...framepieces, ...traversoPieces, ...sashPieces, ...fermavetroPieces];
    for (let q = 0; q < qty; q++) {
      allBom.push(...pieces.map(p => ({ ...p, itemId: item.id, qty })));
    }

    itemResults.push({
      id:          item.id,
      description: item.model || `${item.apertura} ${item.numAnte} ante`,
      width, height, qty,
      frame: { width: fw, height: fh },
      sash:  !isFisso && rebate > 0 ? { width: sw, height: sh } : null,
      bom:   pieces,
      // Stima Ferramenta (protetto da crash)
      ferramenta: (() => { try { return calcFerramenta(item, fw, fh, sw, sh, numAnte, isFisso, qty); } catch(e) { console.error('Errore calcFerramenta:', e); return []; } })(),
    });
  }

  // Aggregazione nesting per profilo
  const byProfile = {};
  for (const entry of allBom) {
    if (!byProfile[entry.profile]) byProfile[entry.profile] = [];
    byProfile[entry.profile].push(entry.mm);
  }

  const nesting = Object.entries(byProfile).map(([code, pieces]) => {
    const bars      = packBars(pieces, barLength);
    const totalUsed = pieces.reduce((s, p) => s + p, 0);
    return {
      profile_code:  code,
      profile_label: profileLabels[code] || code,
      bars_required: bars.length,
      pieces_count:  pieces.length,
      total_mm_cut:  totalUsed,
      bars,
    };
  });

  // Aggregazione ferramenta totale
  const ferramentaTotale = {};
  for (const ir of itemResults) {
    if (!ir.ferramenta) continue;
    for (const f of ir.ferramenta) {
      if (!ferramentaTotale[f.nome]) ferramentaTotale[f.nome] = { ...f, qtaTotale: 0 };
      ferramentaTotale[f.nome].qtaTotale += f.qta;
      if (f.unitaMisura === 'ml') {
        ferramentaTotale[f.nome].qtaTotale = Math.round(ferramentaTotale[f.nome].qtaTotale * 100) / 100;
      }
    }
  }
  const ferramentaRiepilogo = Object.values(ferramentaTotale);

  return { itemResults, nesting, ferramentaRiepilogo };
}

/**
 * Calcola la stima della ferramenta per un singolo articolo
 */
function calcFerramenta(item, fw, fh, sw, sh, numAnte, isFisso, qty) {
  const lista = [];

  if (isFisso) {
    // Finestra fissa: solo guarnizione e squadrette telaio
    const perimetroTelaio = ((fw + fh) * 2) / 1000;
    lista.push({ nome: 'Guarnizione Telaio', qta: Math.round(perimetroTelaio * qty * 100) / 100, unitaMisura: 'ml', icona: '🔲' });
    lista.push({ nome: 'Squadrette Angolo Telaio', qta: 4 * qty, unitaMisura: 'pz', icona: '📐' });
    lista.push({ nome: 'Tappi Drenaggio', qta: 2 * qty, unitaMisura: 'pz', icona: '🔘' });
    return lista;
  }

  // ─── Ante Apribili ───
  const hMm = Number(item.height) || 0;
  const cernierePerAnta = hMm > 1300 ? 3 : 2;
  const anteApribili = numAnte; // tutte le ante sono apribili nel battente standard

  // Cerniere
  lista.push({ nome: 'Cerniere', qta: cernierePerAnta * anteApribili * qty, unitaMisura: 'pz', icona: '🔩' });

  // Maniglie (1 per anta master, le altre hanno solo la cremonese)
  const numManiglie = numAnte <= 2 ? 1 : Math.ceil(numAnte / 2);
  lista.push({ nome: 'Maniglie / Cremonesi', qta: numManiglie * qty, unitaMisura: 'pz', icona: '🚪' });

  // Incontri (punti di chiusura)
  const incontriPerAnta = hMm > 1200 ? 3 : 2;
  lista.push({ nome: 'Incontri Chiusura', qta: incontriPerAnta * anteApribili * qty, unitaMisura: 'pz', icona: '🔒' });

  // Aste di chiusura (cremonese) — 1 per anta apribile
  lista.push({ nome: 'Aste Cremonese', qta: anteApribili * qty, unitaMisura: 'pz', icona: '📏' });

  // Guarnizione Interna (perimetro anta × numero ante)
  if (sw > 0 && sh > 0) {
    const perimetroAnta = ((sw + sh) * 2) / 1000;
    lista.push({ nome: 'Guarnizione Interna (anta)', qta: Math.round(perimetroAnta * anteApribili * qty * 100) / 100, unitaMisura: 'ml', icona: '⬛' });
  }

  // Guarnizione Esterna (perimetro telaio)
  const perimetroTelaio = ((fw + fh) * 2) / 1000;
  lista.push({ nome: 'Guarnizione Esterna (telaio)', qta: Math.round(perimetroTelaio * qty * 100) / 100, unitaMisura: 'ml', icona: '🔲' });

  // Squadrette angolo (4 per telaio + 4 per ogni anta)
  lista.push({ nome: 'Squadrette Angolo', qta: (4 + 4 * anteApribili) * qty, unitaMisura: 'pz', icona: '📐' });

  // Tappi drenaggio
  lista.push({ nome: 'Tappi Drenaggio', qta: 4 * qty, unitaMisura: 'pz', icona: '🔘' });

  // Alzante: aggiungi carrelli se scorrevole
  if (item.apertura === 'Scorrevole') {
    lista.push({ nome: 'Carrelli / Ruote Scorrevole', qta: 2 * anteApribili * qty, unitaMisura: 'pz', icona: '🛞' });
    lista.push({ nome: 'Guida Inferiore', qta: Math.round((fw / 1000) * qty * 100) / 100, unitaMisura: 'ml', icona: '➖' });
  }

  return lista;
}
