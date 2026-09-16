/**
 * Metri quadri fatturati di una tapparella.
 *
 * Il telo non si ferma alla luce della finestra: una parte resta avvolta nel
 * cassonetto, quindi l'altezza si fattura con AVVOLGIMENTO_MM in piu'. Poi si
 * applica il minimo fatturabile, che dipende da quante ante ha il serramento
 * che la tapparella copre: una tapparella su una finestra a 2 ante non si
 * fattura mai sotto i 2 m², anche se e' piccola.
 *
 * Motore, guide e cassonetto NON sono qui: si mettono come voci separate.
 */

// Altezza aggiunta per l'avvolgimento nel cassonetto.
export const AVVOLGIMENTO_MM = 200;

// Minimo fatturabile per numero di ante del serramento: mezzo metro quadro
// in piu' per ogni anta oltre la prima, a partire da 1,5 m².
export function minimoTapparella(numAnte) {
  const ante = Math.max(1, Math.round(Number(numAnte) || 1));
  return 1.5 + 0.5 * (Math.min(ante, 4) - 1);
}

export function mqTapparella({ width, height, numAnte }) {
  const L = (Number(width) || 0) / 1000;
  const H = (Number(height) || 0) / 1000;
  const altezzaFatturata = H > 0 ? H + AVVOLGIMENTO_MM / 1000 : 0;
  const mqCalcolati = L * altezzaFatturata;
  const minimo = minimoTapparella(numAnte);
  const mqFatturati = L > 0 && H > 0 ? Math.max(mqCalcolati, minimo) : 0;
  return {
    larghezza: L,
    altezzaFatturata,
    mqCalcolati: Math.round(mqCalcolati * 100) / 100,
    minimo,
    applicatoMinimo: L > 0 && H > 0 && mqCalcolati < minimo,
    mqFatturati: Math.round(mqFatturati * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Tapparelle di tutto il preventivo, in una voce sola.
//
// In cantiere la tapparella non si preventiva pezzo per pezzo: si sommano i
// metri quadri di tutte le finestre che ne hanno una, si applica a ognuna
// l'avvolgimento e il minimo, e si mette una riga sola con il prezzo al m².
// Qui si ricava quell'elenco dagli articoli gia' inseriti nel preventivo,
// cosi' le misure non si riscrivono una seconda volta.
// ─────────────────────────────────────────────────────────────────────────

// Articoli che una tapparella non copre: un fisso o una porta blindata non
// ne hanno una, e persiane, cassonetti e tapparelle stesse non vanno
// contate due volte.
const SENZA_TAPPARELLA = ['fisso', 'porta blindata', 'persiana', 'scurone', 'tapparella', 'cassonetto', 'zanzariera'];

/** Il serramento puo' avere una tapparella davanti. */
export function copribileDaTapparella(item) {
  if (!item || item.type !== 'window') return false;
  const apertura = String(item.apertura || '').toLowerCase();
  if (SENZA_TAPPARELLA.some((t) => apertura.includes(t))) return false;
  return Number(item.width) > 0 && Number(item.height) > 0;
}

/**
 * Una riga per ogni serramento del preventivo che puo' avere la tapparella,
 * con i m² gia' maggiorati e moltiplicati per la quantita'.
 */
export function righeTapparelle(items = []) {
  return items
    .map((item, indice) => ({ item, indice }))
    .filter(({ item }) => copribileDaTapparella(item))
    .map(({ item, indice }) => {
      const numAnte = Math.max(1, Number(item.numAnte) || 1);
      const quantita = Math.max(1, Number(item.quantity) || 1);
      const calcolo = mqTapparella({ width: item.width, height: item.height, numAnte });
      return {
        // Gli id visibili (01, 02...) si rinumerano a ogni cancellazione: le
        // esclusioni si tengono sull'uid, che il serramento si porta dietro
        // per sempre. I serramenti dei preventivi vecchi non ce l'hanno e
        // ricadono sull'id, che pero' viene spostato da removeItem.
        chiave: item.uid || item.id,
        id: item.id,
        indice,
        width: Number(item.width),
        height: Number(item.height),
        numAnte,
        quantita,
        calcolo,
        mqUno: calcolo.mqFatturati,
        mq: Math.round(calcolo.mqFatturati * quantita * 100) / 100,
      };
    });
}

/**
 * Totale dei m² da fatturare. `escluse` sono le chiavi dei serramenti che
 * l'utente ha tolto (quelli senza tapparella): tenere le escluse invece
 * delle incluse fa entrare da sole nel conto le righe aggiunte dopo.
 */
export function totaleTapparelle(righe, escluse = []) {
  const fuori = new Set(escluse || []);
  const scelte = righe.filter((r) => !fuori.has(r.chiave));
  return {
    righe: scelte,
    serramenti: scelte.reduce((s, r) => s + r.quantita, 0),
    mq: Math.round(scelte.reduce((s, r) => s + r.mq, 0) * 100) / 100,
  };
}

const n2 = (v) => v.toFixed(2).replace('.', ',');

/** "1,20 × (1,40 + 0,20) = 1,92 m² → minimo 2 ante: 2,00 m²" */
export function spiegaMqTapparella(r, numAnte) {
  if (!r.mqFatturati) return '';
  const base = `${n2(r.larghezza)} × (${n2(r.altezzaFatturata - AVVOLGIMENTO_MM / 1000)} + ${n2(AVVOLGIMENTO_MM / 1000)}) = ${n2(r.mqCalcolati)} m²`;
  const ante = Math.max(1, Math.round(Number(numAnte) || 1));
  return r.applicatoMinimo
    ? `${base} → minimo ${ante === 1 ? '1 anta' : `${ante} ante`}: ${n2(r.mqFatturati)} m²`
    : base;
}
