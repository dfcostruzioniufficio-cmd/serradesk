/**
 * Ante una sopra l'altra: il finestrone alto e stretto (1100x2800) diviso in
 * ante tutte alte uguali, a tutta larghezza, ognuna col suo modo di aprirsi.
 * Vale solo sul battente con almeno due ante e fuori dai composti: la spunta
 * puo' restare accesa nel modulo dopo aver cambiato apertura o numero di
 * ante, e prezzo, disegno, descrizione e trasmittanza devono leggerla allo
 * stesso modo.
 */
export function sonoSovrapposte(item) {
  if (!item) return false;
  const acceso = item.anteSovrapposte ?? item.rawInput?.anteSovrapposte;
  return !!acceso && !item.composto && item.apertura === 'Battente' && (Number(item.numAnte) || 1) > 1;
}
