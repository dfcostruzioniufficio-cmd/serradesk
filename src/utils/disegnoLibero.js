/**
 * Il disegno libero di un serramento: il telaio si divide con montanti e
 * traversi messi alla misura che si vuole, e ogni vano che ne esce ha la sua
 * apertura. Serve per i serramenti che i modelli non fanno: un fisso
 * laterale da 400 accanto a un'anta da 900, due ante con sopra un vasistas
 * solo a destra, un sopraluce sopra un fisso e una porta.
 *
 * Il disegno e' un albero. Ogni nodo e' un vano oppure una divisione in due:
 *
 *   { tipo: 'vano', apertura: 'fissa' | 'battente' | 'ribalta' | 'vasistas', lato: 'left' | 'right' }
 *   { tipo: 'montante', sinistra: mm, figli: [sinistra, destra] }
 *   { tipo: 'traverso', sotto: mm, figli: [sopra, sotto] }
 *
 * La misura di un montante e' la larghezza della parte a sinistra, quella di
 * un traverso l'altezza della parte sotto: come si prendono in cantiere, il
 * traverso da terra. Le misure vanno da bordo esterno ad asse della
 * divisione, come le ante asimmetriche: sommate fanno la misura del telaio.
 *
 * `lato` e' il lato della maniglia, come handleEdge nel disegno delle ante:
 * il tratteggio dell'apertura ha il vertice da quella parte.
 *
 * Un vano si indica con il suo percorso nell'albero: '' e' il telaio intero,
 * '0-1' il secondo figlio del primo figlio.
 */

// La parte piu' piccola che una divisione puo' lasciare.
export const MINIMO_PARTE_MM = 150;

export const APERTURE_VANO = ['fissa', 'battente', 'ribalta', 'vasistas'];

export const NOMI_APERTURA = {
  fissa: 'Fisso',
  battente: 'Battente',
  ribalta: 'Anta-ribalta',
  vasistas: 'Vasistas',
};

export const vanoNuovo = (apertura = 'battente', lato = 'right') => ({ tipo: 'vano', apertura, lato });

const passiDi = (percorso) => (percorso ? String(percorso).split('-').map(Number) : []);
const percorsoDi = (passi) => passi.join('-');

/** Il nodo a quel percorso, o null. */
export function nodoA(disegno, percorso) {
  let nodo = disegno;
  for (const p of passiDi(percorso)) {
    if (!nodo?.figli?.[p]) return null;
    nodo = nodo.figli[p];
  }
  return nodo || null;
}

/** Il percorso del nodo che contiene quello indicato ('' per il telaio). */
export const percorsoPadre = (percorso) => percorsoDi(passiDi(percorso).slice(0, -1));

function sostituisci(nodo, passi, fn) {
  if (!passi.length) return fn(nodo);
  const [p, ...resto] = passi;
  return { ...nodo, figli: nodo.figli.map((f, i) => (i === p ? sostituisci(f, resto, fn) : f)) };
}

/** Un disegno che si puo' usare: senza, l'articolo torna al disegno normale. */
export function disegnoValido(nodo) {
  if (!nodo || typeof nodo !== 'object') return false;
  if (nodo.tipo === 'vano') return APERTURE_VANO.includes(nodo.apertura);
  if (nodo.tipo !== 'montante' && nodo.tipo !== 'traverso') return false;
  return Array.isArray(nodo.figli) && nodo.figli.length === 2 && nodo.figli.every(disegnoValido);
}

/**
 * Il disegno libero di un articolo, se ne ha uno che si puo' usare. Vale
 * per l'articolo del preventivo e per il modulo (rawInput), che lo tengono
 * con lo stesso nome.
 */
export function disegnoDi(item) {
  const d = item?.disegnoLibero ?? item?.rawInput?.disegnoLibero;
  return disegnoValido(d) ? d : null;
}

// La misura di una divisione dentro la parte che divide, mai sotto il minimo
// da una parte o dall'altra. Una parte troppo piccola per due minimi si
// divide a meta'.
function misuraDentro(valore, totale) {
  if (totale <= 2 * MINIMO_PARTE_MM) return totale / 2;
  // Campo svuotato mentre si riscrive la misura: intanto a meta'.
  if (valore === '' || valore == null) return totale / 2;
  const v = Number(valore);
  if (!Number.isFinite(v)) return totale / 2;
  return Math.max(MINIMO_PARTE_MM, Math.min(totale - MINIMO_PARTE_MM, v));
}

/**
 * Dove sta ogni vano e ogni divisione, in millimetri, per un telaio W x H.
 * Le coordinate partono dall'angolo in alto a sinistra, con la y verso il
 * basso come nel disegno a schermo. I vani sono in ordine di lettura: da
 * sinistra a destra e, dentro un traverso, prima quello sopra.
 *
 * Ogni vano dice anche quali lati toccano il telaio: lo spessore dei profili
 * cambia fra il bordo del telaio e una divisione.
 */
export function geometria(disegno, W, H) {
  const vani = [];
  const divisioni = [];
  const tolleranza = 0.5;
  const visita = (nodo, passi, x, y, w, h) => {
    if (!nodo) return;
    if (nodo.tipo === 'vano') {
      vani.push({
        percorso: percorsoDi(passi),
        numero: vani.length + 1,
        x, y, w, h,
        apertura: nodo.apertura,
        lato: nodo.lato === 'left' ? 'left' : 'right',
        telaio: {
          sinistra: x <= tolleranza,
          sopra: y <= tolleranza,
          destra: x + w >= W - tolleranza,
          sotto: y + h >= H - tolleranza,
        },
      });
      return;
    }
    if (nodo.tipo === 'montante') {
      const m = misuraDentro(nodo.sinistra, w);
      divisioni.push({ percorso: percorsoDi(passi), tipo: 'montante', x: x + m, y, lunghezza: h, misura: m, parte: { x, y, w, h } });
      visita(nodo.figli[0], [...passi, 0], x, y, m, h);
      visita(nodo.figli[1], [...passi, 1], x + m, y, w - m, h);
      return;
    }
    if (nodo.tipo === 'traverso') {
      const s = misuraDentro(nodo.sotto, h);
      divisioni.push({ percorso: percorsoDi(passi), tipo: 'traverso', x, y: y + h - s, lunghezza: w, misura: s, parte: { x, y, w, h } });
      visita(nodo.figli[0], [...passi, 0], x, y, w, h - s);
      visita(nodo.figli[1], [...passi, 1], x, y + h - s, w, s);
    }
  };
  visita(disegno, [], 0, 0, Number(W) || 0, Number(H) || 0);
  return { vani, divisioni };
}

/**
 * I numeri dei vani piu' piccoli del minimo. Succede quando, dopo aver
 * diviso, si stringe il serramento o si sposta un montante: le divisioni
 * restano dentro il telaio ma un vano puo' finire largo pochi centimetri.
 */
export function vaniTroppoPiccoli(disegno, W, H) {
  return geometria(disegno, W, H).vani
    .filter((v) => v.w < MINIMO_PARTE_MM - 1 || v.h < MINIMO_PARTE_MM - 1)
    .map((v) => v.numero);
}

/** "il vano 3" o "i vani 3, 4 e 5", per gli avvisi. */
export function nominaVani(numeri) {
  if (numeri.length === 1) return `il vano ${numeri[0]}`;
  return `i vani ${numeri.slice(0, -1).join(', ')} e ${numeri[numeri.length - 1]}`;
}

/** I vani nell'ordine di lettura, senza misure. */
export function vaniDi(disegno) {
  const vani = [];
  const visita = (nodo, passi) => {
    if (!nodo) return;
    if (nodo.tipo === 'vano') vani.push({ percorso: percorsoDi(passi), apertura: nodo.apertura, lato: nodo.lato === 'left' ? 'left' : 'right' });
    else (nodo.figli || []).forEach((f, i) => visita(f, [...passi, i]));
  };
  visita(disegno, []);
  return vani;
}

/**
 * Le ante come le conosce il resto del programma: quante sono e come si
 * apre ognuna. Prezzo (minimi e maggiorazioni sulle ante che si aprono),
 * descrizione e preventivi salvati leggono numAnte e paneConfigs, e cosi'
 * continuano a funzionare senza sapere niente del disegno libero.
 */
export function anteDelDisegno(disegno) {
  const vani = vaniDi(disegno);
  return {
    numAnte: Math.max(1, vani.length),
    paneConfigs: vani.map((v) => (v.apertura === 'fissa'
      ? { tipo: 'fissa', handleEdge: null }
      : { tipo: v.apertura, handleEdge: v.lato })),
  };
}

/**
 * Quanti vani stanno sul fondo del serramento, uno accanto all'altro: e'
 * il numero di ante che conta per il minimo della tapparella.
 */
export function vaniInBasso(disegno) {
  let quanti = 0;
  const visita = (nodo, inBasso) => {
    if (!nodo) return;
    if (nodo.tipo === 'vano') { if (inBasso) quanti += 1; return; }
    if (nodo.tipo === 'traverso') { visita(nodo.figli[0], false); visita(nodo.figli[1], inBasso); return; }
    (nodo.figli || []).forEach((f) => visita(f, inBasso));
  };
  visita(disegno, true);
  return Math.max(1, quanti);
}

const NOMI_DESCRIZIONE = {
  fissa: ['FISSO', 'FISSI'],
  battente: ['A BATTENTE', 'A BATTENTE'],
  ribalta: ['AD ANTA-RIBALTA', 'AD ANTA-RIBALTA'],
  vasistas: ['A VASISTAS', 'A VASISTAS'],
};

/**
 * La descrizione per il cliente: "SERRAMENTO 3 VANI: VANO 1 FISSO; VANI 2
 * E 3 AD ANTA-RIBALTA". I numeri sono quelli scritti nei vani del disegno.
 */
export function descriviDisegno(disegno) {
  const vani = vaniDi(disegno);
  if (vani.length === 1) {
    const v = vani[0];
    return v.apertura === 'fissa' ? 'SERRAMENTO FISSO' : `SERRAMENTO 1 ANTA ${NOMI_DESCRIZIONE[v.apertura][0]}`;
  }
  const gruppi = new Map();
  vani.forEach((v, i) => {
    if (!gruppi.has(v.apertura)) gruppi.set(v.apertura, []);
    gruppi.get(v.apertura).push(i + 1);
  });
  const parti = [...gruppi.entries()].map(([apertura, numeri]) => {
    const plurale = numeri.length === 1 ? 0 : 1;
    const elenco = numeri.length === 1 ? String(numeri[0]) : `${numeri.slice(0, -1).join(', ')} E ${numeri[numeri.length - 1]}`;
    return `${numeri.length === 1 ? 'VANO' : 'VANI'} ${elenco} ${NOMI_DESCRIZIONE[apertura][plurale]}`;
  });
  return `SERRAMENTO ${vani.length} VANI: ${parti.join('; ')}`;
}

/** Divide un vano in due con un montante o un traverso. */
export function dividiVano(disegno, percorso, tipo, misura) {
  return sostituisci(disegno, passiDi(percorso), (vano) => {
    if (vano?.tipo !== 'vano') return vano;
    const copia = { ...vano };
    if (tipo === 'montante') {
      // Le due parti prendono la maniglia dal lato del montante, dove si
      // incontrano: e' il caso piu' comune, due ante che aprono al centro.
      return { tipo: 'montante', sinistra: Number(misura), figli: [{ ...copia, lato: 'right' }, { ...copia, lato: 'left' }] };
    }
    // Sopra il traverso di solito c'e' un sopraluce fisso: si parte da li'.
    return { tipo: 'traverso', sotto: Number(misura), figli: [{ ...copia, apertura: 'fissa' }, copia] };
  });
}

/** Cambia apertura o lato della maniglia di un vano. */
export function cambiaVano(disegno, percorso, modifiche) {
  return sostituisci(disegno, passiDi(percorso), (vano) => (vano?.tipo === 'vano' ? { ...vano, ...modifiche } : vano));
}

/** Sposta una divisione: la nuova misura della parte a sinistra o sotto. */
export function spostaDivisione(disegno, percorso, misura) {
  return sostituisci(disegno, passiDi(percorso), (nodo) => {
    // Il campo vuoto resta vuoto, se no mentre si riscrive la misura
    // diventerebbe 0 sotto le dita.
    const valore = String(misura ?? '').trim() === '' ? '' : Number(misura);
    if (nodo?.tipo === 'montante') return { ...nodo, sinistra: valore };
    if (nodo?.tipo === 'traverso') return { ...nodo, sotto: valore };
    return nodo;
  });
}

/**
 * Toglie una divisione: le due parti tornano un vano solo, con l'apertura
 * della parte a sinistra (o di quella sotto, che di solito e' l'anta).
 * Se dentro c'erano altre divisioni spariscono anche quelle.
 */
export function togliDivisione(disegno, percorso) {
  return sostituisci(disegno, passiDi(percorso), (nodo) => {
    if (nodo?.tipo !== 'montante' && nodo?.tipo !== 'traverso') return nodo;
    const primoVano = (n) => (n.tipo === 'vano' ? n : primoVano(n.figli[0]));
    const tenuto = primoVano(nodo.tipo === 'montante' ? nodo.figli[0] : nodo.figli[1]);
    return { ...tenuto };
  });
}

/**
 * I riquadri di vetro in metri, per la Uw. Ogni vano perde la larghezza a
 * vista dei profili: dal lato del telaio quella del lato (o del fisso, se
 * il vano e' fisso), dal lato di una divisione meta' del traverso, piu'
 * l'anta se il vano si apre.
 *
 *   vista: { lato, nodo, traverso, fisso } in mm
 */
export function riquadriVetro(disegno, W, H, vista) {
  const { vani } = geometria(disegno, W, H);
  return vani.map((v) => {
    const apribile = v.apertura !== 'fissa';
    const bordo = apribile ? vista.lato : vista.fisso;
    const anta = apribile ? Math.max(0, vista.lato - vista.fisso) : 0;
    const dentro = vista.traverso / 2 + anta;
    const meno = (aTelaio) => (aTelaio ? bordo : dentro);
    const w = v.w - meno(v.telaio.sinistra) - meno(v.telaio.destra);
    const h = v.h - meno(v.telaio.sopra) - meno(v.telaio.sotto);
    return [w / 1000, h / 1000];
  });
}

/**
 * Metri di profilo per il prezzo a peso: il perimetro delle ante che si
 * aprono e la lunghezza delle divisioni, che sono profilo di telaio.
 */
export function metriDelDisegno(disegno, W, H) {
  const { vani, divisioni } = geometria(disegno, W, H);
  const anta = vani.filter((v) => v.apertura !== 'fissa').reduce((s, v) => s + 2 * (v.w + v.h), 0) / 1000;
  const divisori = divisioni.reduce((s, d) => s + d.lunghezza, 0) / 1000;
  return { anta, divisori };
}
