/**
 * Dimensioni in pixel del disegno di un articolo dentro il riquadro del PDF.
 *
 * I disegni sono in scala fra loro: l'articolo piu' grande del preventivo
 * riempie il riquadro, gli altri sono proporzionalmente piu' piccoli, cosi'
 * il cliente vede a colpo d'occhio quale finestra e' piu' grande.
 *
 * Il calcolo stava copiato in quattro componenti con soglie diverse in
 * ognuno, e aveva due difetti:
 *
 * 1. Un articolo molto piu' piccolo degli altri diventava un francobollo
 *    perso in mezzo al bianco (una 600x900 usciva a 48x72 pixel).
 * 2. Il minimo era applicato ai due lati separatamente: quando scattava su
 *    uno solo, il disegno si deformava e mostrava al cliente una finestra
 *    con proporzioni diverse da quelle che ha ordinato.
 *
 * Qui la scala viene compressa invece che troncata, e ogni correzione e'
 * applicata a entrambi i lati insieme: le proporzioni reali non cambiano mai.
 */

// Quanto deve riempire il riquadro, come minimo, l'articolo piu' piccolo.
const OCCUPAZIONE_MINIMA = 0.55;

export function dimensioniDisegno({
  width,
  height,
  maxQuoteWidth = null,
  maxQuoteHeight = null,
  maxW = 160,
  maxH = 200,
  minLato = 44,
  larghezzaPredefinita = 1000,
  altezzaPredefinita = 1000
}) {
  const w = Number(width) || larghezzaPredefinita;
  const h = Number(height) || altezzaPredefinita;
  const rapporto = w / h;

  let dW;
  let dH;

  if (maxQuoteWidth && maxQuoteHeight) {
    const maxSafeW = Number(maxQuoteWidth) || larghezzaPredefinita;
    const maxSafeH = Number(maxQuoteHeight) || altezzaPredefinita;
    const maxRapporto = maxSafeW / maxSafeH;

    // Riquadro che occuperebbe l'articolo piu' grande del preventivo.
    let boundingW;
    let boundingH;
    if (maxRapporto > maxW / maxH) {
      boundingW = maxW;
      boundingH = maxW / maxRapporto;
    } else {
      boundingH = maxH;
      boundingW = maxH * maxRapporto;
    }

    dW = boundingW * (w / maxSafeW);
    dH = boundingH * (h / maxSafeH);

    // Quanto questo articolo riempie quel riquadro: 1 e' il piu' grande.
    const occupazione = Math.max(dW / boundingW, dH / boundingH);
    if (occupazione > 0 && occupazione < 1) {
      const compressa = OCCUPAZIONE_MINIMA + (1 - OCCUPAZIONE_MINIMA) * occupazione;
      const fattore = compressa / occupazione;
      dW *= fattore;
      dH *= fattore;
    }
  } else {
    // Nessun riferimento: l'articolo riempie il riquadro da solo.
    if (rapporto > maxW / maxH) {
      dW = maxW;
      dH = maxW / rapporto;
    } else {
      dH = maxH;
      dW = maxH * rapporto;
    }
  }

  // Minimo assoluto, su entrambi i lati insieme per non deformare nulla.
  const latoCorto = Math.min(dW, dH);
  if (latoCorto > 0 && latoCorto < minLato) {
    const fattore = minLato / latoCorto;
    dW *= fattore;
    dH *= fattore;
  }

  // Il riquadro ha comunque la precedenza: se il minimo ha fatto sbordare il
  // disegno, si rientra riducendo entrambi i lati nella stessa misura.
  const eccesso = Math.max(dW / maxW, dH / maxH, 1);
  dW /= eccesso;
  dH /= eccesso;

  return { dW: Math.round(dW), dH: Math.round(dH) };
}
