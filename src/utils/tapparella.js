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
