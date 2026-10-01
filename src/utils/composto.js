/**
 * Serramento composto: piu' moduli affiancati e uniti da un profilo di
 * accoppiamento, preventivati come un pezzo solo.
 *
 * Il prezzo si fa sulla misura d'ingombro, il rettangolo che contiene tutto,
 * anche dove sotto un modulo c'e' il parapetto e quindi non c'e' serramento.
 * E' la convenzione con cui fatturano i fornitori: telaio, accoppiamento e
 * montaggio si pagano lo stesso. I moduli servono al disegno e alla
 * descrizione, non al conto.
 */

export const ACCOPPIAMENTO_MM = 30;

export const moduloVuoto = () => ({
  larghezza: '', altezza: '', apertura: 'Battente', numAnte: 1, ancoraggio: 'basso',
});

export function moduliValidi(moduli) {
  return (Array.isArray(moduli) ? moduli : []).filter(
    (m) => Number(m?.larghezza) > 0 && Number(m?.altezza) > 0,
  );
}

/** Larghezza occupata dai moduli piu' i profili di accoppiamento fra loro. */
export function larghezzaModuli(moduli, accoppiamento = ACCOPPIAMENTO_MM) {
  const validi = moduliValidi(moduli);
  if (!validi.length) return 0;
  const somma = validi.reduce((s, m) => s + Number(m.larghezza), 0);
  return somma + (validi.length - 1) * (Number(accoppiamento) || 0);
}

/** Metri quadri davvero occupati dai moduli, senza il vuoto sotto. */
export function superficieModuli(moduli) {
  return moduliValidi(moduli).reduce(
    (s, m) => s + (Number(m.larghezza) * Number(m.altezza)) / 1000000, 0,
  );
}

/**
 * Un modulo che poggia a terra ed e' alto piu' di due metri e' una
 * portafinestra, non una finestra: lo dice la descrizione del fornitore e lo
 * capisce il cliente leggendo. Un modulo appoggiato in alto, con il parapetto
 * sotto, resta una finestra per quanto alto sia.
 */
function nomeModulo(m) {
  const aTerra = (m.ancoraggio || 'basso') === 'basso' && Number(m.altezza) >= 2000;
  if (m.apertura === 'Fisso') return 'FISSO';
  if (m.apertura === 'Scorrevole') return aTerra ? 'PORTAFINESTRA SCORREVOLE' : 'FINESTRA SCORREVOLE';
  return aTerra ? 'PORTAFINESTRA' : 'FINESTRA';
}

function descriviModulo(m) {
  const ante = Math.max(1, Number(m.numAnte) || 1);
  const nome = nomeModulo(m);
  if (m.apertura === 'Fisso') return `${nome} ${m.larghezza}x${m.altezza}`;
  return `${nome} A ${ante} ANT${ante > 1 ? 'E' : 'A'} ${m.larghezza}x${m.altezza}`;
}

/** "FINESTRA SCORREVOLE A 2 ANTE ... UNITA CON PROFILO DI ACCOPPIAMENTO CON ..." */
export function descriviComposto(moduli) {
  const validi = moduliValidi(moduli);
  if (!validi.length) return '';
  return validi
    .map(descriviModulo)
    .join(', UNITA CON PROFILO DI ACCOPPIAMENTO CON ');
}
