/**
 * ═══════════════════════════════════════════════════════
 *  MOTORE CAM — Distinta di Taglio Parametrica
 * ═══════════════════════════════════════════════════════
 * Le costanti dimensionali vengono lette dal "sistema"
 * associato all'articolo (definito nell'Archivio).
 * Solo BAR_MM, KERF, END_TRIM sono costanti macchina.
 */

import { ePersiana, calcolaPersiana, datiMancantiPersiana, ferramentaPersiana } from './persianaEngine.js';

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
  // Articoli scartati perche' il loro sistema non ha i dati del profilo.
  const sistemiIncompleti = [];
  // Articoli scartati perche' la loro tipologia non ha ancora un calcolo
  // dedicato (oggi: gli scorrevoli).
  const apertureNonSupportate = [];
  // Pezzi che non si possono calcolare con le misure inserite (per esempio
  // un traverso cosi' alto o basso da non lasciare spazio al fermavetro).
  // Vanno mostrati: una distinta a cui mancano pezzi in silenzio fa
  // scoprire il problema in officina.
  const pezziNonCalcolati = [];

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

    // Uno scorrevole non si costruisce come un battente: le ante non
    // sormontano il telaio allo stesso modo, si sormontano fra loro al nodo
    // centrale, e l'altezza dipende dal binario. Applicare qui la formula del
    // battente produrrebbe misure sbagliate con l'aria di essere giuste.
    if (String(item.apertura || '').toLowerCase().includes('scorrev')) {
      apertureNonSupportate.push({
        itemId: item.id,
        apertura: item.apertura,
        descrizione: item.model || `${item.apertura} ${numAnte} ante`,
      });
      continue;
    }

    // Persiane e scuroni hanno un calcolo loro (niente vetro, lamelle o
    // doghe a passo): vedi persianaEngine.js.
    if (ePersiana(item, sys)) {
      const mancano = datiMancantiPersiana(sys?.specs?.persiana);
      if (mancano.length) {
        sistemiIncompleti.push({
          itemId: item.id,
          sistema: sys?.nome || 'Sistema senza nome',
          marca: sys?.marca || '',
          mancano,
        });
        continue;
      }
      const ris = calcolaPersiana(item, sys);
      Object.assign(profileLabels, ris.etichette);
      ris.avvisi.forEach((descrizione) => pezziNonCalcolati.push({ itemId: item.id, descrizione }));
      for (let q = 0; q < qty; q++) {
        for (const pz of ris.pezzi) {
          for (let k = 0; k < (pz.n || 1); k++) allBom.push({ ...pz, itemId: item.id, qty });
        }
      }
      itemResults.push({
        id: item.id,
        description: item.model || `${item.apertura} ${numAnte} ante`,
        width, height, qty,
        frame: ris.frame,
        sash: ris.sash,
        persiana: ris.dettaglio,
        bom: ris.pezzi,
        ferramenta: ferramentaPersiana(item, numAnte, qty, ris.dettaglio?.conTelaio),
      });
      continue;
    }

    // Senza i dati geometrici del profilo NON si producono tagli. Prima si
    // ripiegava su valori di riferimento scritti qui sotto (DEF): usciva una
    // distinta completa e credibile, calcolata pero' sulla geometria di un
    // profilo diverso da quello dell'utente. Chi tagliava, buttava i profili.
    const tsReale  = sys?.profilo_lati  || sys?.telaio_std || null;
    const antReale = sys?.profilo_anta  || sys?.anta       || null;
    const servonoAnte = !isFisso;
    if (!tsReale || (servonoAnte && !antReale)) {
      sistemiIncompleti.push({
        itemId: item.id,
        sistema: sys?.nome || 'Sistema senza nome',
        marca: sys?.marca || '',
        mancano: [
          !tsReale ? 'dati del telaio (aletta, saldatura, tolleranza)' : null,
          (servonoAnte && !antReale) ? 'dati dell\'anta (battuta, sormonto, ingombro vista)' : null,
        ].filter(Boolean),
      });
      continue;
    }

    // Un solo controllo per tutti i campi numerici facoltativi: Number.isFinite
    // da solo non basta, perche' Number(null) vale 0 e passerebbe.
    const numeroValido = (v) => v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v));

    const ts  = tsReale;
    const ti  = sys?.profilo_basso || sys?.telaio_inf || DEF.profilo_basso;
    const ant = antReale || DEF.profilo_anta;
    const rip = sys?.profilo_riporto || sys?.riporto  || sys?.specs?.riporto || DEF.profilo_riporto;
    const fv  = sys?.profilo_fermavetro || sys?.fermavetro || sys?.specs?.fermavetro || DEF.profilo_fermavetro;

    // Parametri dalla struttura
    const alettaLat  = ts.aletta_mm !== undefined ? Number(ts.aletta_mm) : 30;
    const alettaInf  = ti.aletta_mm !== undefined ? Number(ti.aletta_mm) : 0;
    const tolleranza = ts.tolleranza_mm !== undefined ? Number(ts.tolleranza_mm) : 5;
    // L'alluminio non si salda: i profili si assemblano con squadrette, quindi
    // il sovrametallo di saldatura e' sempre zero. Il valore predefinito di
    // 6 mm viene dal PVC, dove i profili si saldano davvero. Lasciarlo
    // applicare a un sistema in alluminio allunga OGNI pezzo di 6 mm.
    const materialeSistema = String(sys?.specs?.materiale || sys?.materiale || '').toLowerCase();
    const eAlluminio = materialeSistema.includes('allumin');

    const saldTel  = eAlluminio ? 0 : (ts.saldatura_mm  !== undefined ? Number(ts.saldatura_mm)  : 6);
    const saldAnta = eAlluminio ? 0 : (ant.saldatura_mm !== undefined ? Number(ant.saldatura_mm) : 6);
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
    // Non tutte le serie chiudono il telaio con quattro pezzi uguali. Nella
    // Sapa R40 la traversa inferiore (900226) e' un profilo senza aletta e si
    // taglia a L, cioe' 44 mm meno del telaio finito, e sotto va una soglia
    // (900273) tagliata dritta a tutta larghezza. Senza questi dati la
    // traversa inferiore restava lunga quanto il telaio e la soglia mancava
    // del tutto dalla distinta. Campi facoltativi: gli altri sistemi non
    // cambiano.
    // Porta balcone: un'anta con il traverso. Nei cataloghi ha una distinta
    // sua (Sapa R40 pag.120, R72TT pag.113-114): il telaio non ha soglia, la
    // traversa inferiore e' quella bassa senza aletta, il traverso dell'anta
    // e' fatto di due profili dedicati e il fermavetro si spezza sopra e
    // sotto il traverso secondo la sua altezza. I dati stanno nel sistema
    // (specs.porta_balcone); senza, il traverso resta calcolato come prima.
    const pb = (!isFisso && item.hasTraverso && !item.hasSopraluce && sys?.specs?.porta_balcone)
      ? sys.specs.porta_balcone : null;
    const detrTraversaInf = pb && numeroValido(pb.traversa_inf_detrazione_mm)
      ? Number(pb.traversa_inf_detrazione_mm)
      : (numeroValido(ti.detrazione_mm) ? Number(ti.detrazione_mm) : 0);
    const soglia = (!(pb && pb.senza_soglia) && ti.soglia && ti.soglia.codice) ? ti.soglia : null;
    if (soglia) profileLabels[soglia.codice] = soglia.descrizione || soglia.codice;
    const framepieces = [
      { part: 'frame_top',    profile: cTelStd, mm: fw + saldTel, sald: saldTel },
      { part: 'frame_bottom', profile: cTelInf, mm: fw - detrTraversaInf + saldTel, sald: saldTel },
      { part: 'frame_left',   profile: cTelStd, mm: fh + saldTel, sald: saldTel },
      { part: 'frame_right',  profile: cTelStd, mm: fh + saldTel, sald: saldTel },
      ...(soglia ? [{ part: 'frame_soglia', profile: soglia.codice,
                      mm: fw - (numeroValido(soglia.detrazione_mm) ? Number(soglia.detrazione_mm) : 0) }] : []),
    ];

    // BOM anta
    const sashPieces = [];
    let sw = 0, sh = 0;
    // Larghezza di OGNI anta. Serve anche fuori da questo blocco: fermavetri
    // e traversi interni appartengono a una singola anta, quindi devono
    // seguire la sua larghezza e non la media.
    let larghezzeAnte = [];
    // Un sistema puo' descrivere l'anta in due modi: con battuta e sormonto,
    // oppure con le detrazioni prese dalla distinta del produttore. Basta uno
    // dei due: chiedere per forza la battuta escludeva le serie caricate
    // copiando i numeri dal catalogo.
    // Un solo controllo per tutti: Number.isFinite da solo non basta, perche'
    // Number(null) vale 0 e passerebbe. Usato in due modi diversi sullo stesso
    // dato, un campo nullo attivava questo ramo ma veniva poi rifiutato piu'
    // sotto, e l'anta usciva piu' grande del telaio.

    const haDatiAnta = rebate > 0
      || numeroValido(ant.detrazione_larghezza_mm)
      || numeroValido(ant.detrazione_altezza_mm);

    if (!isFisso && haDatiAnta) {
      // Calcolo larghezza anta per multi-anta (nodo centrale)
      // Quanto costa in larghezza ogni anta oltre la prima. I sistemi si
      // comportano in modo opposto: dove le ante si sormontano fra loro si
      // guadagna larghezza, dove c'e' un riporto centrale se ne perde.
      // Il valore corretto sta nella tabella di taglio della serie: per la
      // Sapa R72TT e' 4 mm (1 anta = L-40, 2 ante = L/2-22, cioe' L-44).
      // Senza il dato si mantiene il comportamento storico, cosi' i sistemi
      // gia' caricati non cambiano di un millimetro.
      const detrazioneNodo = ant.detrazione_nodo_mm !== undefined
        ? Number(ant.detrazione_nodo_mm)
        : (giocoCentrale > 0 ? giocoCentrale : -sormonto);

      // Detrazioni prese di peso dalla distinta di taglio della serie. Sono
      // due numeri DIVERSI: i cataloghi detraggono in larghezza e in altezza
      // quantita' differenti. Sapa R40: 38 in larghezza, 52 in altezza. Nella
      // R72TT erano entrambe 40, una coincidenza che nascondeva il problema.
      // Quando non ci sono si ricavano da battuta e sormonto, come prima.
      const daBattutaESormonto = (rebate * 2) - (sormonto * 2);
      const detrLarghezza = numeroValido(ant.detrazione_larghezza_mm)
        ? Number(ant.detrazione_larghezza_mm) : daBattutaESormonto;
      const detrAltezza = numeroValido(ant.detrazione_altezza_mm)
        ? Number(ant.detrazione_altezza_mm) : daBattutaESormonto;

      const sw_totale = fw - detrLarghezza - ((numAnte - 1) * detrazioneNodo);
      // Ante asimmetriche: la larghezza totale va ripartita secondo le
      // proporzioni scelte nel preventivo, non in parti uguali. Dividendo
      // sempre a meta' si tagliavano due pezzi troppo corti e due troppo
      // lunghi, senza che l'utente avesse modo di accorgersene.
      const proporzioni = (item.anteAsimmetriche && Array.isArray(item.anteWidths)
        && item.anteWidths.length === numAnte
        && item.anteWidths.every(v => Number(v) > 0))
        ? item.anteWidths.map(Number)
        : null;
      const sommaProporzioni = proporzioni ? proporzioni.reduce((a, b) => a + b, 0) : 0;

      larghezzeAnte = Array.from({ length: numAnte }, (_, a) =>
        proporzioni && sommaProporzioni > 0
          ? sw_totale * (proporzioni[a] / sommaProporzioni)
          : sw_totale / numAnte
      );
      // sw resta la larghezza rappresentativa (la media) per il riepilogo.
      sw = sw_totale / numAnte;

      // Se c'è un sopraluce, l'altezza utile per le ante si riduce
      const effectiveFh = item.hasSopraluce ? fh - (Number(item.sopraluceHeight) || 400) : fh;
      sh = effectiveFh - detrAltezza;

      for (let a = 0; a < numAnte; a++) {
        const swA = Math.round(larghezzeAnte[a]);
        sashPieces.push(
          { part: `anta_${a+1}_top`,    profile: cAnta, mm: swA + saldAnta, sald: saldAnta },
          { part: `anta_${a+1}_bottom`, profile: cAnta, mm: swA + saldAnta, sald: saldAnta },
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
      } else if (haDatiAnta) {
         const ingombroVista = Number(ant.ingombro_vista_mm) || 70;
         // Quanto si toglie all'anta per tagliare il fermavetro. I cataloghi
         // non detraggono sempre la stessa quota nei due sensi: nella Sapa R40
         // e' La-90 in larghezza ma Ha-134 in altezza, perche' i verticali
         // vanno a battere fra i due orizzontali. Usando per tutti e due il
         // doppio dell'ingombro a vista, i verticali del R40 uscivano 44 mm
         // troppo lunghi. Senza il dato si resta al calcolo di prima.
         const detrFermavetroL = numeroValido(ant.detrazione_fermavetro_larghezza_mm)
           ? Number(ant.detrazione_fermavetro_larghezza_mm) : ingombroVista * 2;
         const detrFermavetroH = numeroValido(ant.detrazione_fermavetro_altezza_mm)
           ? Number(ant.detrazione_fermavetro_altezza_mm) : ingombroVista * 2;
         const fvH = sh - detrFermavetroH;
         // Il fermavetro appartiene a una singola anta: si misura sulla
         // larghezza di QUELLA anta. Usando la media, con ante asimmetriche
         // uscivano tutti uguali - troppo lunghi per l'anta stretta (non
         // entrano) e troppo corti per la larga (non tengono il vetro).
         const larghezzaFermavetro = (a) => {
           const base = Number.isFinite(larghezzeAnte[a]) ? larghezzeAnte[a] : sw;
           return Math.round(base) - detrFermavetroL;
         };

         if (pb) {
             // Quote della distinta del produttore. HT e' l'altezza dell'asse
             // del traverso misurata dalla linea H del catalogo, che sta
             // quota_traverso_da_fondo_mm sopra il fondo del telaio: nel
             // preventivo l'altezza del traverso si misura dal fondo.
             const htCatalogo = (Number(item.traversoHeight) || 1000) - (Number(pb.quota_traverso_da_fondo_mm) || 0);
             const fvSopra = Math.round(sh - htCatalogo - Number(pb.fermavetro?.sopra_mm || 0));
             const fvSotto = Math.round(htCatalogo - Number(pb.fermavetro?.sotto_mm || 0));
             if (!(fvSopra > 0 && fvSotto > 0)) {
               pezziNonCalcolati.push({
                 itemId: item.id,
                 descrizione: `${item.model || `${item.apertura} ${numAnte} ante`} ${width}x${height}: traverso a ${Number(item.traversoHeight) || 1000} mm troppo ${fvSopra > 0 ? 'basso' : 'alto'}, i fermavetri dell'anta non sono calcolati`,
               });
             }
             if (fvSopra > 0 && fvSotto > 0) {
               for (let a = 0; a < numAnte; a++) {
                 const fvW = larghezzaFermavetro(a);
                 if (fvW <= 0) continue;
                 fermavetroPieces.push(
                   { part: `ferm_${a+1}_top`,       profile: fv.codice, mm: fvW },
                   { part: `ferm_${a+1}_mid_top`,   profile: fv.codice, mm: fvW },
                   { part: `ferm_${a+1}_left_sup`,  profile: fv.codice, mm: fvSopra },
                   { part: `ferm_${a+1}_right_sup`, profile: fv.codice, mm: fvSopra },
                   { part: `ferm_${a+1}_mid_bot`,   profile: fv.codice, mm: fvW },
                   { part: `ferm_${a+1}_bottom`,    profile: fv.codice, mm: fvW },
                   { part: `ferm_${a+1}_left_inf`,  profile: fv.codice, mm: fvSotto },
                   { part: `ferm_${a+1}_right_inf`, profile: fv.codice, mm: fvSotto }
                 );
               }
             }
         } else if (item.hasTraverso) {
             const ingombroTraverso = 50;
             const fvH_mezzo = (fvH - ingombroTraverso) / 2;
             if (fvH_mezzo > 0) {
               for (let a = 0; a < numAnte; a++) {
                 const fvW = larghezzaFermavetro(a);
                 if (fvW <= 0) continue;
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
             if (fvH > 0) {
               for (let a = 0; a < numAnte; a++) {
                const fvW = larghezzaFermavetro(a);
                if (fvW <= 0) continue;
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
      } else if (pb && Array.isArray(pb.traverso) && pb.traverso.length) {
        // Traverso della porta balcone: ogni profilo della distinta, uno per
        // anta, tagliato alla larghezza di quell'anta meno la sua detrazione.
        pb.traverso.forEach((t) => {
          if (t.codice) profileLabels[t.codice] = t.descrizione || t.codice;
        });
        for (let a = 0; a < numAnte; a++) {
          const swA = Number.isFinite(larghezzeAnte[a]) ? Math.round(larghezzeAnte[a]) : sw;
          pb.traverso.forEach((t, k) => {
            traversoPieces.push({
              part: k === 0 ? `traverso_anta_${a+1}` : `traverso_anta_${a+1}_p${k+1}`,
              profile: t.codice || 'TRAV-GEN',
              mm: Math.round(swA - (Number(t.detrazione_mm) || 0)),
            });
          });
        }
      } else {
        // Se ci sono le ante, il traverso sta dentro ogni singola anta
        for (let a = 0; a < numAnte; a++) {
          // Anche il traverso sta dentro una singola anta: stessa ragione.
          const swA = Number.isFinite(larghezzeAnte[a]) ? Math.round(larghezzeAnte[a]) : sw;
          traversoPieces.push({ part: `traverso_anta_${a+1}`, profile: 'TRAV-GEN', mm: swA + saldAnta });
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
      sash:  !isFisso && haDatiAnta ? { width: sw, height: sh } : null,
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

  return { itemResults, nesting, ferramentaRiepilogo, sistemiIncompleti, apertureNonSupportate, pezziNonCalcolati };
}

/**
 * Calcola la stima della ferramenta per un singolo articolo
 */
function calcFerramenta(item, fw, fh, sw, sh, numAnte, isFisso, qty) {
  const lista = [];

  if (isFisso) {
    // Finestra fissa: solo guarnizione e squadrette telaio
    const perimetroTelaio = ((fw + fh) * 2) / 1000;
    lista.push({ nome: 'Guarnizione Telaio', qta: Math.round(perimetroTelaio * qty * 100) / 100, unitaMisura: 'ml' });
    lista.push({ nome: 'Squadrette Angolo Telaio', qta: 4 * qty, unitaMisura: 'pz' });
    lista.push({ nome: 'Tappi Drenaggio', qta: 2 * qty, unitaMisura: 'pz' });
    return lista;
  }

  // ─── Ante Apribili ───
  const hMm = Number(item.height) || 0;
  const cernierePerAnta = hMm > 1300 ? 3 : 2;
  const anteApribili = numAnte; // tutte le ante sono apribili nel battente standard

  // Cerniere
  lista.push({ nome: 'Cerniere', qta: cernierePerAnta * anteApribili * qty, unitaMisura: 'pz' });

  // Maniglie (1 per anta master, le altre hanno solo la cremonese)
  const numManiglie = numAnte <= 2 ? 1 : Math.ceil(numAnte / 2);
  lista.push({ nome: 'Maniglie / Cremonesi', qta: numManiglie * qty, unitaMisura: 'pz' });

  // Incontri (punti di chiusura)
  const incontriPerAnta = hMm > 1200 ? 3 : 2;
  lista.push({ nome: 'Incontri Chiusura', qta: incontriPerAnta * anteApribili * qty, unitaMisura: 'pz' });

  // Aste di chiusura (cremonese) — 1 per anta apribile
  lista.push({ nome: 'Aste Cremonese', qta: anteApribili * qty, unitaMisura: 'pz' });

  // Guarnizione Interna (perimetro anta × numero ante)
  if (sw > 0 && sh > 0) {
    const perimetroAnta = ((sw + sh) * 2) / 1000;
    lista.push({ nome: 'Guarnizione Interna (anta)', qta: Math.round(perimetroAnta * anteApribili * qty * 100) / 100, unitaMisura: 'ml' });
  }

  // Guarnizione Esterna (perimetro telaio)
  const perimetroTelaio = ((fw + fh) * 2) / 1000;
  lista.push({ nome: 'Guarnizione Esterna (telaio)', qta: Math.round(perimetroTelaio * qty * 100) / 100, unitaMisura: 'ml' });

  // Squadrette angolo (4 per telaio + 4 per ogni anta)
  lista.push({ nome: 'Squadrette Angolo', qta: (4 + 4 * anteApribili) * qty, unitaMisura: 'pz' });

  // Tappi drenaggio
  lista.push({ nome: 'Tappi Drenaggio', qta: 4 * qty, unitaMisura: 'pz' });

  // Alzante: aggiungi carrelli se scorrevole
  if (item.apertura === 'Scorrevole') {
    lista.push({ nome: 'Carrelli / Ruote Scorrevole', qta: 2 * anteApribili * qty, unitaMisura: 'pz' });
    lista.push({ nome: 'Guida Inferiore', qta: Math.round((fw / 1000) * qty * 100) / 100, unitaMisura: 'ml' });
  }

  return lista;
}
