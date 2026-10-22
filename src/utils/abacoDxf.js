import { vistaProfili } from './trasmittanza';
import { sonoSovrapposte } from './anteSovrapposte';
import { moduliValidi, larghezzaModuli, ACCOPPIAMENTO_MM } from './composto';

/**
 * L'abaco del preventivo come disegno DXF, da aprire in AutoCAD, BricsCAD,
 * LibreCAD o DraftSight. E' impaginato come la tavola dell'abaco di un
 * progetto: per ogni serramento sigla, descrizione, prospetto visto
 * dall'interno con le quote e, sotto, la pianta con il muro e l'apertura
 * delle ante; in fondo la legenda e il cartiglio. Tutto alle misure vere in
 * millimetri.
 *
 * Il disegno del PDF (WindowPreview) e' fatto per l'occhio del cliente:
 * sfumature, ombre, maniglie in rilievo, tutto in pixel. Convertirlo
 * darebbe un disegno pieno di riempimenti e fuori scala. Qui si ridisegna
 * lo stesso serramento a linee, con le stesse regole di WindowPreview per
 * capire quale anta si apre e da che parte: se le due regole si separano,
 * il DXF direbbe una cosa e il PDF un'altra.
 *
 * Formato R12 (AC1009): lo leggono tutti i programmi CAD, anche i piu'
 * vecchi. Solo testo ASCII: le lettere accentate si scrivono senza accento,
 * perche' ogni programma le leggerebbe con una codifica diversa.
 */

const ESCLUSI = ['custom', 'complemento', 'metadata', 'note'];

const LAYER = [
  { nome: 'TELAIO', colore: 7, linea: 'CONTINUOUS' },
  { nome: 'ANTE', colore: 5, linea: 'CONTINUOUS' },
  { nome: 'APERTURA', colore: 1, linea: 'DASHED' },
  { nome: 'DETTAGLI', colore: 8, linea: 'CONTINUOUS' },
  { nome: 'PIANTA', colore: 7, linea: 'CONTINUOUS' },
  { nome: 'MURO', colore: 8, linea: 'CONTINUOUS' },
  { nome: 'QUOTE', colore: 3, linea: 'CONTINUOUS' },
  { nome: 'CODICI', colore: 1, linea: 'CONTINUOUS' },
  { nome: 'TESTI', colore: 5, linea: 'CONTINUOUS' },
  { nome: 'TAVOLA', colore: 7, linea: 'CONTINUOUS' },
];

// Spazi fra un serramento e l'altro, larghezza massima di una fila.
const SPAZIO_X = 1000;
const SPAZIO_Y = 1400;
const LARGHEZZA_FILA = 16000;
const H_TESTO = 70;
// Larghezza di un carattere rispetto alla sua altezza, per impaginare.
const LARGO = 0.65;
// La pianta sta sotto il prospetto: qui passa il centro del telaio.
const PIANTA_Y = -750;

export function articoliDisegnabili(items) {
  return (items || []).filter((i) => i && !ESCLUSI.includes(i.type) && Number(i.width) > 0 && Number(i.height) > 0);
}

function testoAscii(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[×]/g, 'x').replace(/[²]/g, '2').replace(/[€]/g, 'EUR')
    .replace(/[–—]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7e]/g, '')
    .trim();
}

const n = (v) => {
  const r = Math.round(Number(v) * 1000) / 1000;
  return Number.isFinite(r) ? String(r) : '0';
};

// Raccoglie le entita' gia' spostate nella posizione giusta. Ogni
// serramento si disegna in un disegno suo, partendo da zero: cosi' se ne
// conosce l'ingombro prima di metterlo nella tavola.
function creaDisegno() {
  const entita = [];
  const lim = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const allarga = (x, y) => {
    lim.x0 = Math.min(lim.x0, x); lim.y0 = Math.min(lim.y0, y);
    lim.x1 = Math.max(lim.x1, x); lim.y1 = Math.max(lim.y1, y);
  };
  let ox = 0;
  let oy = 0;
  const d = {
    entita, lim,
    origine(x, y) { ox = x; oy = y; },
    // Disegna fn con l'origine spostata di dx, dy, poi la rimette dov'era.
    sposta(dx, dy, fn) {
      const px = ox, py = oy;
      ox += dx; oy += dy;
      try { return fn(); } finally { ox = px; oy = py; }
    },
    linea(layer, x1, y1, x2, y2) {
      if (![x1, y1, x2, y2].every(Number.isFinite)) return;
      allarga(ox + x1, oy + y1); allarga(ox + x2, oy + y2);
      entita.push({ tipo: 'LINE', layer, x1: ox + x1, y1: oy + y1, x2: ox + x2, y2: oy + y2 });
    },
    rett(layer, x, y, w, h) {
      if (!(w > 0 && h > 0)) return;
      d.linea(layer, x, y, x + w, y);
      d.linea(layer, x + w, y, x + w, y + h);
      d.linea(layer, x + w, y + h, x, y + h);
      d.linea(layer, x, y + h, x, y);
    },
    // Angoli in gradi, in senso antiorario come vuole il DXF.
    arco(layer, cx, cy, r, da, a) {
      if (!(r > 0) || ![cx, cy, da, a].every(Number.isFinite)) return;
      allarga(ox + cx - r, oy + cy - r); allarga(ox + cx + r, oy + cy + r);
      entita.push({ tipo: 'ARC', layer, x: ox + cx, y: oy + cy, r, da, a });
    },
    // Tratteggio a 45 gradi dentro un rettangolo, per il muro in pianta.
    tratteggio(layer, x, y, w, h, passo = 60) {
      for (let c = -h + passo; c < w; c += passo) {
        const t0 = Math.max(0, -c);
        const t1 = Math.min(h, w - c);
        if (t1 > t0) d.linea(layer, x + c + t0, y + t0, x + c + t1, y + t1);
      }
    },
    // allinea: 0 sinistra, 1 centro, 2 destra. Ruotato di 90 per le quote
    // verticali.
    testo(layer, x, y, altezza, contenuto, { allinea = 0, rotazione = 0 } = {}) {
      const t = testoAscii(contenuto);
      if (!t) return;
      const largo = t.length * altezza * LARGO;
      const inizio = allinea === 1 ? -largo / 2 : allinea === 2 ? -largo : 0;
      if (rotazione) {
        allarga(ox + x - altezza, oy + y + inizio); allarga(ox + x, oy + y + inizio + largo);
      } else {
        allarga(ox + x + inizio, oy + y); allarga(ox + x + inizio + largo, oy + y + altezza);
      }
      entita.push({ tipo: 'TEXT', layer, x: ox + x, y: oy + y, h: altezza, testo: t, allinea, rotazione });
    },
    // Copia dentro questo disegno un altro disegno, spostato di dx, dy.
    unisci(altro, dx, dy) {
      for (const e of altro.entita) {
        if (e.tipo === 'LINE') entita.push({ ...e, x1: e.x1 + dx, y1: e.y1 + dy, x2: e.x2 + dx, y2: e.y2 + dy });
        else entita.push({ ...e, x: e.x + dx, y: e.y + dy });
      }
      if (Number.isFinite(altro.lim.x0)) {
        allarga(altro.lim.x0 + dx, altro.lim.y0 + dy);
        allarga(altro.lim.x1 + dx, altro.lim.y1 + dy);
      }
    },
  };
  return d;
}

function righeEntita(e) {
  if (e.tipo === 'LINE') {
    return ['0', 'LINE', '8', e.layer, '10', n(e.x1), '20', n(e.y1), '30', '0', '11', n(e.x2), '21', n(e.y2), '31', '0'];
  }
  if (e.tipo === 'ARC') {
    return ['0', 'ARC', '8', e.layer, '10', n(e.x), '20', n(e.y), '30', '0', '40', n(e.r), '50', n(e.da), '51', n(e.a)];
  }
  const r = ['0', 'TEXT', '8', e.layer, '10', n(e.x), '20', n(e.y), '30', '0', '40', n(e.h), '1', e.testo];
  if (e.rotazione) r.push('50', n(e.rotazione));
  if (e.allinea) r.push('72', String(e.allinea), '11', n(e.x), '21', n(e.y), '31', '0');
  return r;
}

// Divide un testo lungo in righe di al massimo `max` caratteri.
function aCapo(testo, max) {
  const parole = testoAscii(testo).split(/\s+/).filter(Boolean);
  const righe = [];
  let riga = '';
  for (const p of parole) {
    if (riga && (riga + ' ' + p).length > max) { righe.push(riga); riga = p; }
    else riga = riga ? `${riga} ${p}` : p;
  }
  if (riga) righe.push(riga);
  return righe;
}

// Quota orizzontale fra x0 e x1 all'altezza y, con il testo sopra la linea.
function quotaOrizzontale(d, x0, x1, y, testo) {
  if (!(x1 - x0 > 0)) return;
  const t = 25;
  d.linea('QUOTE', x0, y, x1, y);
  d.linea('QUOTE', x0, y - 40, x0, y + 40);
  d.linea('QUOTE', x1, y - 40, x1, y + 40);
  d.linea('QUOTE', x0 - t, y - t, x0 + t, y + t);
  d.linea('QUOTE', x1 - t, y - t, x1 + t, y + t);
  d.testo('QUOTE', (x0 + x1) / 2, y + 25, Math.min(H_TESTO, Math.max(30, (x1 - x0) / 6)), testo, { allinea: 1 });
}

function quotaVerticale(d, y0, y1, x, testo) {
  if (!(y1 - y0 > 0)) return;
  const t = 25;
  d.linea('QUOTE', x, y0, x, y1);
  d.linea('QUOTE', x - 40, y0, x + 40, y0);
  d.linea('QUOTE', x - 40, y1, x + 40, y1);
  d.linea('QUOTE', x - t, y0 - t, x + t, y0 + t);
  d.linea('QUOTE', x - t, y1 - t, x + t, y1 + t);
  d.testo('QUOTE', x - 25, (y0 + y1) / 2, Math.min(H_TESTO, Math.max(30, (y1 - y0) / 6)), testo, { allinea: 1, rotazione: 90 });
}

/**
 * Da che parte si apre l'anta i e se ha la maniglia: la stessa regola di
 * getOpeningInfo in WindowPreview.
 */
function infoApertura(f, i) {
  const { apertura, anteCount, paneConfigs, handlePosition, sovrapposte, partiDiverse } = f;
  if (apertura === 'Fisso') return { lato: null, maniglia: false };
  const tipo = paneConfigs?.[i]?.tipo;
  if (tipo === 'fissa' && !partiDiverse(i)) return { lato: null, maniglia: false };
  if (partiDiverse(i)) return { lato: null, maniglia: false };
  const conTipi = Array.isArray(paneConfigs) && paneConfigs.slice(0, anteCount).some((c) => c && (c.tipo || c.tipoSopra));
  if (tipo || conTipi) {
    const bordo = paneConfigs?.[i]?.handleEdge;
    if (bordo) return { lato: bordo, maniglia: true };
    return { lato: i === anteCount - 1 && anteCount > 1 && !sovrapposte ? 'left' : 'right', maniglia: false };
  }
  if (paneConfigs && paneConfigs.length > i && paneConfigs[i] && typeof paneConfigs[i] === 'object' && 'handleEdge' in paneConfigs[i]) {
    const bordo = paneConfigs[i].handleEdge;
    if (bordo) return { lato: bordo, maniglia: true };
    if (apertura === 'Battente' || apertura === 'Vasistas' || apertura === 'Bilico') {
      if (sovrapposte) return { lato: 'right', maniglia: false };
      if (anteCount === 1) return { lato: handlePosition === 'right' ? 'right' : 'left', maniglia: false };
      if (anteCount === 2) return { lato: i === 0 ? 'right' : 'left', maniglia: false };
      if (i === 0) return { lato: 'right', maniglia: false };
      if (i === anteCount - 1) return { lato: 'left', maniglia: false };
    }
    return { lato: null, maniglia: false };
  }
  if (anteCount === 1) return { lato: handlePosition === 'right' ? 'right' : 'left', maniglia: true };
  if (sovrapposte) return { lato: handlePosition === 'left' ? 'left' : 'right', maniglia: true };
  if (anteCount === 2) {
    return i === 0
      ? { lato: 'right', maniglia: handlePosition === 'left' }
      : { lato: 'left', maniglia: handlePosition === 'right' };
  }
  if (i === 0) return { lato: 'right', maniglia: handlePosition === 'left' };
  if (i === anteCount - 1) return { lato: 'left', maniglia: handlePosition === 'right' };
  return { lato: null, maniglia: false };
}

// Linee di apertura dentro il vetro (x, y in basso a sinistra, y verso l'alto).
// Battente: il vertice sta dal lato della maniglia, la base sulle cerniere.
// Ribalta: vertice in alto al centro. Scorrevole: doppia freccia.
function simboloApertura(d, x, y, w, h, { lato, battente, ribalta, scorrevole }) {
  if (!(w > 0 && h > 0)) return;
  if (scorrevole) {
    const l = Math.min(w * 0.5, 500) / 2;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const p = Math.min(60, l / 3);
    d.linea('APERTURA', cx - l, cy, cx + l, cy);
    d.linea('APERTURA', cx - l, cy, cx - l + p, cy + p);
    d.linea('APERTURA', cx - l, cy, cx - l + p, cy - p);
    d.linea('APERTURA', cx + l, cy, cx + l - p, cy + p);
    d.linea('APERTURA', cx + l, cy, cx + l - p, cy - p);
    return;
  }
  if (battente && lato) {
    if (lato === 'right' || lato === 'left') {
      const vx = lato === 'right' ? x + w : x;
      const cx = lato === 'right' ? x : x + w;
      d.linea('APERTURA', vx, y + h / 2, cx, y + h);
      d.linea('APERTURA', vx, y + h / 2, cx, y);
    } else {
      // Maniglia sopra: cerniere sotto, e viceversa.
      const vy = lato === 'top' ? y + h : y;
      const cy = lato === 'top' ? y : y + h;
      d.linea('APERTURA', x + w / 2, vy, x, cy);
      d.linea('APERTURA', x + w / 2, vy, x + w, cy);
    }
  }
  if (ribalta) {
    d.linea('APERTURA', x + w / 2, y + h, x, y);
    d.linea('APERTURA', x + w / 2, y + h, x + w, y);
  }
}

// Una parte apribile sopra o sotto il traverso, con la sua anta.
function parteApribile(d, x, y, w, h, tipo, bordo, t) {
  if (!tipo || tipo === 'fissa' || w <= 2 * t || h <= 2 * t) return;
  d.rett('ANTE', x + t, y + t, w - 2 * t, h - 2 * t);
  const vas = tipo === 'vasistas';
  simboloApertura(d, x + t, y + t, w - 2 * t, h - 2 * t, {
    lato: bordo === 'left' ? 'left' : 'right',
    battente: !vas,
    ribalta: vas || tipo === 'ribalta',
  });
}

/**
 * Un serramento a ante: telaio, sopraluce, ante, traversi e aperture. Le
 * coordinate partono dall'angolo in basso a sinistra, in millimetri.
 */
function disegnaFinestra(d, a) {
  const W = Number(a.width);
  const H = Number(a.height);
  const apertura = a.apertura || 'Battente';
  const anteCount = Math.max(1, Math.min(6, Number(a.numAnte) || 1));
  const paneConfigs = a.paneConfigs || {};
  const sovrapposte = sonoSovrapposte({ anteSovrapposte: a.anteSovrapposte, apertura, numAnte: anteCount });
  const hasTraverso = !!a.hasTraverso;
  const traversoAnta = (i) => !sovrapposte && (paneConfigs?.[i]?.traverso ?? hasTraverso);
  const partiDiverse = (i) => !!(traversoAnta(i) && paneConfigs?.[i]?.tipoSopra);
  const f = { apertura, anteCount, paneConfigs, handlePosition: a.handlePosition || 'right', sovrapposte, partiDiverse };

  const vista = vistaProfili(a.profilo);
  const AT = Math.min(vista.lato * 0.75, vista.nodo / 2);
  const FT = apertura === 'Fisso' ? vista.fisso : Math.max(20, vista.lato - AT);
  const TT = vista.traverso;

  d.rett('TELAIO', 0, 0, W, H);
  if (W > 2 * FT && H > 2 * FT) d.rett('TELAIO', FT, FT, W - 2 * FT, H - 2 * FT);

  // Sopraluce: dall'alto, al massimo il 70% dell'altezza come nel PDF.
  let altoAnte = H - FT;
  if (a.hasSopraluce) {
    const sH = Math.min(Number(a.sopraluceHeight) || 400, H * 0.7);
    const yT = H - sH;
    d.linea('TELAIO', FT, yT - TT / 2, W - FT, yT - TT / 2);
    d.linea('TELAIO', FT, yT + TT / 2, W - FT, yT + TT / 2);
    const parti = Math.max(1, Math.min(6, Number(a.sopraluceDivisioni) || 1));
    const larghezza = (W - 2 * FT - FT * (parti - 1)) / parti;
    if (larghezza > 0) {
      for (let k = 0; k < parti - 1; k++) {
        const xm = FT + larghezza + k * (larghezza + FT);
        d.rett('TELAIO', xm, yT + TT / 2, FT, H - FT - yT - TT / 2);
      }
    }
    altoAnte = yT - TT / 2;
  }

  const innerW = W - 2 * FT;
  const bassoAnte = FT;
  const hAnte = altoAnte - bassoAnte;
  if (!(innerW > 0 && hAnte > 0)) return [];
  // Le ante come si vedono in pianta: dove stanno e come si aprono.
  const pianta = sovrapposte ? [{ x0: FT, x1: W - FT, lato: null, tipo: 'altro' }] : [];

  const grezze = (a.anteAsimmetriche && Array.isArray(a.anteWidths) && a.anteWidths.length === anteCount)
    ? a.anteWidths.map((w) => Math.max(1, Number(w) || 1))
    : Array(anteCount).fill(1);
  const somma = grezze.reduce((s, w) => s + w, 0);
  const larghezze = grezze.map((w) => (w / somma) * innerW);

  const info = Array.from({ length: anteCount }, (_, i) => infoApertura(f, i));
  // Fra un fisso e l'anta accanto c'e' il montante del telaio; fra due ante
  // apribili no, si chiudono una sull'altra. Senza montante il vetro fisso
  // si confondeva col telaio e il fisso sembrava mancare.
  const montante = Array.from({ length: anteCount - 1 }, (_, i) => !sovrapposte && (!info[i].lato || !info[i + 1].lato));
  const xBordo = (i) => FT + larghezze.slice(0, i).reduce((s, w) => s + w, 0);
  for (let i = 0; i < montante.length; i++) {
    if (montante[i]) d.rett('TELAIO', xBordo(i + 1) - FT / 2, bassoAnte, FT, hAnte);
  }

  for (let i = 0; i < anteCount; i++) {
    const sx = !sovrapposte && i > 0 && montante[i - 1] ? FT / 2 : 0;
    const dx = !sovrapposte && i < anteCount - 1 && montante[i] ? FT / 2 : 0;
    const ax = sovrapposte ? FT : xBordo(i) + sx;
    const aw = sovrapposte ? innerW : larghezze[i] - sx - dx;
    const ah = sovrapposte ? hAnte / anteCount : hAnte;
    // Impilate: l'anta 1 e' quella in alto.
    const ay = sovrapposte ? altoAnte - ah * (i + 1) : bassoAnte;

    const { lato, maniglia } = info[i];
    // Un fisso e' vetro nel telaio: si disegna la linea del fermavetro.
    if (lato || partiDiverse(i)) d.rett('ANTE', ax, ay, aw, ah);
    else d.rett('ANTE', ax + 20, ay + 20, aw - 40, ah - 40);

    const tipo = paneConfigs?.[i]?.tipo;
    const laterale = lato === 'left' || lato === 'right';
    const vasistas = tipo ? tipo === 'vasistas' && laterale : !!a.soloRibalta && !!lato && laterale;
    const ribalta = tipo
      ? (tipo === 'ribalta' || tipo === 'vasistas') && laterale
      : vasistas || (!!a.antaRibalta && !!lato && laterale && maniglia);

    if (!sovrapposte) {
      let tipoPianta = 'fisso';
      let latoPianta = lato;
      if (partiDiverse(i)) {
        tipoPianta = (paneConfigs[i].tipo || 'battente') === 'battente' ? 'battente' : 'altro';
        latoPianta = paneConfigs[i].handleEdge === 'left' ? 'left' : 'right';
      } else if (lato) {
        tipoPianta = apertura === 'Scorrevole' ? 'scorrevole' : (laterale && !vasistas ? 'battente' : 'altro');
      }
      pianta.push({ x0: ax, x1: ax + aw, lato: latoPianta, tipo: tipoPianta });
    }

    const sp = lato ? AT : 0;
    const gx = ax + sp, gy = ay + sp, gw = aw - 2 * sp, gh = ah - 2 * sp;
    if (lato && gw > 0 && gh > 0) d.rett('ANTE', gx, gy, gw, gh);

    if (traversoAnta(i)) {
      const tH = Number(paneConfigs?.[i]?.traversoH) || Number(a.traversoHeight) || 1000;
      const pct = Math.max(0.1, Math.min(0.9, 1 - tH / H));
      const yTr = ay + ah * (1 - pct);
      d.linea('ANTE', ax, yTr - TT / 2, ax + aw, yTr - TT / 2);
      d.linea('ANTE', ax, yTr + TT / 2, ax + aw, yTr + TT / 2);
      if (partiDiverse(i)) {
        const c = paneConfigs[i];
        const t = Math.max(15, AT * 0.8);
        parteApribile(d, ax, yTr + TT / 2, aw, ay + ah - yTr - TT / 2, c.tipoSopra, c.handleEdgeSopra, t);
        parteApribile(d, ax, ay, aw, yTr - TT / 2 - ay, c.tipo || 'battente', c.handleEdge, t);
      }
    }

    if (lato) {
      simboloApertura(d, gx, gy, gw, gh, {
        lato, battente: !vasistas, ribalta, scorrevole: apertura === 'Scorrevole',
      });
    }

    const conManiglione = paneConfigs?.[i]?.maniglione
      ?? (a.maniglioneAntipanico && (Array.isArray(a.maniglioneAnte) ? a.maniglioneAnte.includes(i) : true));
    if (conManiglione && gw > 100) {
      const yB = Math.max(ay + 60, Math.min(ay + ah - 60, Number(paneConfigs?.[i]?.maniglioneH) || 1050));
      d.rett('DETTAGLI', gx + 20, yB - 20, gw - 40, 40);
    } else if (lato && maniglia && apertura !== 'Scorrevole') {
      if (laterale) {
        const hx = lato === 'right' ? ax + aw - sp / 2 - 12 : ax + sp / 2 - 12;
        d.rett('DETTAGLI', hx, ay + ah / 2 - 70, 24, 140);
      } else {
        const hy = lato === 'top' ? ay + ah - sp / 2 - 12 : ay + sp / 2 - 12;
        d.rett('DETTAGLI', ax + aw / 2 - 70, hy, 140, 24);
      }
    }
  }
  return pianta;
}

function disegnaPersiana(d, a) {
  const W = Number(a.width);
  const H = Number(a.height);
  const anteCount = Math.max(1, Math.min(6, Number(a.numAnte) || 1));
  d.rett('TELAIO', 0, 0, W, H);
  const grezze = (a.anteAsimmetriche && Array.isArray(a.anteWidths) && a.anteWidths.length === anteCount)
    ? a.anteWidths.map((w) => Math.max(1, Number(w) || 1))
    : Array(anteCount).fill(1);
  const somma = grezze.reduce((s, w) => s + w, 0);
  let x = 0;
  const pianta = [];
  for (let i = 0; i < anteCount; i++) {
    const aw = (grezze[i] / somma) * W;
    pianta.push({ x0: x, x1: x + aw, lato: null, tipo: 'persiana' });
    if (i > 0) d.linea('ANTE', x, 0, x, H);
    const t = Math.min(70, aw / 6);
    d.rett('ANTE', x + t, t, aw - 2 * t, H - 2 * t);
    // Le stecche, ogni 80 mm.
    for (let y = t + 80; y < H - t; y += 80) d.linea('DETTAGLI', x + t, y, x + aw - t, y);
    x += aw;
  }
  return pianta;
}

function disegnaBlindata(d, a) {
  const W = Number(a.width);
  const H = Number(a.height);
  d.rett('TELAIO', 0, 0, W, H);
  const t = Math.min(80, W / 8);
  d.rett('ANTE', t, 0, W - 2 * t, H - t);
  d.rett('DETTAGLI', t + 80, 80, W - 2 * t - 160, H - t - 160);
  const sinistra = a.handlePosition === 'left';
  const hx = sinistra ? t + 40 : W - t - 64;
  d.rett('DETTAGLI', hx, 1000, 24, 160);
  // Maniglia a sinistra: cerniere a destra.
  return [{ x0: t, x1: W - t, lato: sinistra ? 'left' : 'right', tipo: 'battente' }];
}

function disegnaSemplice(d, a, nome) {
  const W = Number(a.width);
  const H = Number(a.height);
  d.rett('TELAIO', 0, 0, W, H);
  d.testo('TESTI', W / 2, H / 2 - 25, Math.min(H_TESTO, H / 3, W / 10), nome, { allinea: 1 });
  return null;
}

function disegnaComposto(d, a, moduli) {
  const W = Number(a.width);
  const H = Number(a.height);
  const acc = Number(a.accoppiamentoMm ?? a.rawInput?.accoppiamentoMm ?? ACCOPPIAMENTO_MM) || 0;
  const occupata = larghezzaModuli(moduli, acc);
  const scalaX = occupata > W ? W / occupata : 1;
  const spessore = acc * scalaX;
  let cursore = 0;
  const pianta = [];
  moduli.forEach((m, i) => {
    const mw = Number(m.larghezza) * scalaX;
    const mh = Math.min(Number(m.altezza), H);
    // I moduli si appoggiano a terra, salvo quelli ancorati in alto.
    const y = m.ancoraggio === 'alto' ? H - mh : 0;
    const ante = d.sposta(cursore, y, () => disegnaFinestra(d, {
      width: mw, height: mh, apertura: m.apertura, numAnte: m.numAnte,
      paneConfigs: m.paneConfigs || {}, hasTraverso: !!m.hasTraverso,
      traversoHeight: m.traversoHeight, profilo: a.profilo,
    }));
    pianta.push(...ante.map((p) => ({ ...p, x0: p.x0 + cursore, x1: p.x1 + cursore })));
    if (i < moduli.length - 1 && spessore > 0) {
      d.rett('TELAIO', cursore + mw, 0, spessore, H);
    }
    cursore += mw + spessore;
  });
  return pianta;
}

/**
 * La pianta sotto il prospetto: muro tratteggiato ai lati, telaio, vetro e
 * apertura delle ante. Il lato interno e' in basso, cosi' destra e sinistra
 * sono le stesse del prospetto visto dall'interno.
 */
function disegnaPianta(d, W, ante) {
  const M = 300;
  const P = 70;
  const yInt = PIANTA_Y - P / 2;
  d.rett('MURO', -250, PIANTA_Y - M / 2, 250, M);
  d.tratteggio('MURO', -250, PIANTA_Y - M / 2, 250, M);
  d.rett('MURO', W, PIANTA_Y - M / 2, 250, M);
  d.tratteggio('MURO', W, PIANTA_Y - M / 2, 250, M);
  d.rett('PIANTA', 0, yInt, W, P);
  ante.forEach((a, k) => {
    const w = a.x1 - a.x0;
    if (!(w > 0)) return;
    if (k > 0) d.linea('PIANTA', a.x0, yInt, a.x0, yInt + P);
    d.linea('DETTAGLI', a.x0, PIANTA_Y, a.x1, PIANTA_Y);
    if (a.tipo === 'battente') {
      // L'anta aperta a 90 gradi verso l'interno, e l'arco che percorre.
      const cerniera = a.lato === 'left' ? a.x1 : a.x0;
      d.linea('PIANTA', cerniera, yInt, cerniera, yInt - w);
      if (a.lato === 'left') d.arco('PIANTA', cerniera, yInt, w, 180, 270);
      else d.arco('PIANTA', cerniera, yInt, w, 270, 360);
    } else if (a.tipo === 'scorrevole') {
      const y = yInt - 120;
      const l = Math.min(w * 0.6, 600) / 2;
      const c = (a.x0 + a.x1) / 2;
      d.linea('PIANTA', c - l, y, c + l, y);
      d.linea('PIANTA', c - l, y, c - l + 50, y + 40);
      d.linea('PIANTA', c - l, y, c - l + 50, y - 40);
      d.linea('PIANTA', c + l, y, c + l - 50, y + 40);
      d.linea('PIANTA', c + l, y, c + l - 50, y - 40);
    }
  });
}

// Come titoloArticolo del PDF: il cassonetto non ha ante.
function titoloArticolo(item) {
  const t = (item.description2 || `${item.apertura || ''} ${item.numAnte ? item.numAnte + ' ante' : ''}`.trim())
    .replace(/^.*?\d+ ANT[AE]: (?=ANT[AE] \d)/, '');
  return item.apertura === 'Cassonetto' ? t.replace(/\s+\d+\s+ANT[AE]\b/i, '') : t;
}

function descrizioneArticolo(item) {
  const q = Number(item.quantity) || 1;
  return `N. ${q} - ${titoloArticolo(item)}`;
}

function misureArticolo(item) {
  return `L ${Math.round(Number(item.width))} x H ${Math.round(Number(item.height))} mm`;
}

function disegnaArticolo(d, item, numero) {
  const W = Number(item.width);
  const H = Number(item.height);
  const apertura = item.apertura || '';
  const moduli = item.composto ? moduliValidi(item.moduli || item.rawInput?.moduli) : [];
  const a = { ...item, profilo: item.sistema_cam };

  let ante;
  if (moduli.length) ante = disegnaComposto(d, a, moduli);
  else if (apertura === 'Persiana' || apertura === 'Persiana Balcone') ante = disegnaPersiana(d, a);
  else if (apertura.toLowerCase() === 'porta blindata') ante = disegnaBlindata(d, a);
  else if (apertura === 'Cassonetto') ante = disegnaSemplice(d, a, 'CASSONETTO');
  else if (apertura.toLowerCase() === 'tapparella') ante = disegnaSemplice(d, a, 'TAPPARELLA');
  else ante = disegnaFinestra(d, a);

  // Quote: larghezza sotto, altezza a sinistra; le ante diverse fra loro
  // hanno la loro quota, come nel PDF.
  quotaOrizzontale(d, 0, W, -280, Math.round(W));
  quotaVerticale(d, 0, H, -300, Math.round(H));
  const anteCount = Number(item.numAnte) || 1;
  const mm = Array.isArray(item.anteWidths) ? item.anteWidths.map((w) => Number(w) || 0) : [];
  if (!moduli.length && item.anteAsimmetriche && !sonoSovrapposte(item) && anteCount > 1 && mm.length === anteCount
      && mm.every((w) => w > 0) && !mm.every((w) => w === mm[0]) && Math.abs(mm.reduce((s, w) => s + w, 0) - W) <= 5) {
    let x = 0;
    mm.forEach((w) => { quotaOrizzontale(d, x, x + w, -130, Math.round(w)); x += w; });
  }
  if (item.hasSopraluce && !moduli.length) {
    const sH = Math.min(Number(item.sopraluceHeight) || 400, H * 0.7);
    quotaVerticale(d, H - sH, H, W + 200, Math.round(sH));
  }

  if (ante?.length) disegnaPianta(d, W, ante);

  // Sopra il prospetto: sigla in rosso, descrizione e misure sottolineate.
  const hT = 95;
  const passo = hT * 1.6;
  const max = Math.max(28, Math.floor(Math.max(W, 2400) / (hT * LARGO)));
  const righe = [...aCapo(descrizioneArticolo(item), max), `dimensioni ${misureArticolo(item)}`];
  let y = H + 220;
  for (let k = righe.length - 1; k >= 0; k--) {
    d.testo('TESTI', 0, y, hT, righe[k]);
    y += passo;
  }
  const larga = Math.max(...righe.map((r) => r.length)) * hT * LARGO;
  d.linea('TESTI', 0, H + 180, larga, H + 180);
  d.testo('CODICI', 0, y + 30, 150, `Pos. ${numero}:`);
}

// Legenda in fondo alla tavola: una riga per posizione.
function disegnaLegenda(d, celle, x0, yAlto) {
  const colonne = [
    { titolo: 'POS.', largo: 1300 },
    { titolo: 'DESCRIZIONE', largo: 8800 },
    { titolo: 'DIMENSIONI', largo: 3000 },
    { titolo: "Q.TA'", largo: 1400 },
  ];
  const hRiga = 380;
  const hT = 120;
  const larga = colonne.reduce((s, c) => s + c.largo, 0);
  d.testo('TAVOLA', x0, yAlto + 120, 150, 'LEGENDA SERRAMENTI');
  const righe = [colonne.map((c) => c.titolo), ...celle.map(({ item, numero }) => [
    String(numero),
    titoloArticolo(item),
    misureArticolo(item),
    String(Number(item.quantity) || 1),
  ])];
  righe.forEach((valori, r) => {
    const y = yAlto - (r + 1) * hRiga;
    d.linea('TAVOLA', x0, y, x0 + larga, y);
    let x = x0;
    valori.forEach((v, c) => {
      const maxCar = Math.floor((colonne[c].largo - 160) / (hT * LARGO));
      const t = testoAscii(v);
      d.testo(r === 0 ? 'CODICI' : 'TAVOLA', x + 80, y + (hRiga - hT) / 2, hT, t.length > maxCar ? `${t.slice(0, maxCar - 3)}...` : t);
      x += colonne[c].largo;
    });
  });
  const yBasso = yAlto - righe.length * hRiga;
  d.linea('TAVOLA', x0, yAlto, x0 + larga, yAlto);
  let x = x0;
  [0, ...colonne.map((c) => c.largo)].forEach((l) => { x += l; d.linea('TAVOLA', x, yAlto, x, yBasso); });
  return { yBasso, larga };
}

function disegnaCartiglio(d, xDestra, yBasso, intestazione, firma) {
  const W = 6500;
  const H = 1500;
  const x = xDestra - W;
  d.rett('TAVOLA', x, yBasso, W, H);
  d.linea('TAVOLA', x, yBasso + 900, x + W, yBasso + 900);
  d.testo('TAVOLA', x + 200, yBasso + 1100, 220, 'ABACO SERRAMENTI');
  const righe = aCapo(intestazione || '', Math.floor((W - 400) / (110 * LARGO))).slice(0, 2);
  righe.forEach((r, k) => d.testo('TAVOLA', x + 200, yBasso + 650 - k * 180, 110, r));
  d.testo('TAVOLA', x + 200, yBasso + 150, 85, `Misure in mm${firma ? ' - creato con SerraDesk' : ''}`);
}

/**
 * La tavola dell'abaco: i serramenti a file, con legenda, cartiglio e
 * cornice, in millimetri. La stessa tavola diventa il DXF qui sotto e il PDF
 * (abacoPdf.js). Null se non c'e' niente da disegnare.
 */
export function costruisciTavola(items, { intestazione = '', firma = true } = {}) {
  const articoli = articoliDisegnabili(items);
  if (!articoli.length) return null;

  // Ogni serramento nel suo disegno, per conoscerne l'ingombro.
  const celle = articoli.map((item, i) => {
    const c = creaDisegno();
    const numero = item.id ?? i + 1;
    disegnaArticolo(c, item, numero);
    return { c, item, numero };
  });

  // A file, allineati sul pavimento del prospetto.
  const file = [];
  let fila = [];
  let x = 0;
  celle.forEach((cella) => {
    const largo = cella.c.lim.x1 - cella.c.lim.x0;
    if (fila.length && x + largo > LARGHEZZA_FILA) { file.push(fila); fila = []; x = 0; }
    fila.push({ ...cella, dx: x - cella.c.lim.x0 });
    x += largo + SPAZIO_X;
  });
  if (fila.length) file.push(fila);

  const d = creaDisegno();
  let fondo = 0;
  file.forEach((f, k) => {
    const sopra = Math.max(...f.map((c) => c.c.lim.y1));
    const sotto = Math.min(...f.map((c) => c.c.lim.y0));
    const base = k === 0 ? -sopra : fondo - SPAZIO_Y - sopra;
    f.forEach((c) => d.unisci(c.c, c.dx, base));
    fondo = base + sotto;
  });

  const sinistra = d.lim.x0;
  const titolo = testoAscii(intestazione);
  // Il titolo va a capo dentro la larghezza dei disegni (o della legenda, se
  // e' piu' larga): con un'intestazione lunga e pochi serramenti usciva dal
  // foglio. Il conto dei caratteri e' largo apposta, perche' le maiuscole nel
  // PDF occupano piu' della stima usata per impaginare il resto.
  const H_TITOLO = 260;
  const spazioTitolo = Math.max(d.lim.x1 - sinistra, 14500);
  const righeTitolo = aCapo(titolo ? `ABACO SERRAMENTI - ${titolo}` : 'ABACO SERRAMENTI',
    Math.max(20, Math.floor(spazioTitolo / (H_TITOLO * 0.95))));
  const yTitolo = d.lim.y1 + 500;
  righeTitolo.forEach((riga, i) => {
    d.testo('TAVOLA', sinistra, yTitolo + (righeTitolo.length - 1 - i) * H_TITOLO * 1.6, H_TITOLO, riga);
  });

  const legenda = disegnaLegenda(d, celle, sinistra, d.lim.y0 - 1000);
  const destra = Math.max(d.lim.x1, sinistra + legenda.larga);
  disegnaCartiglio(d, destra, legenda.yBasso - 2000, titolo, firma);

  // Cornice della tavola.
  const m = 700;
  const { x0: cx0, y0: cy0, x1: cx1, y1: cy1 } = d.lim;
  d.rett('TAVOLA', cx0 - m, cy0 - m, cx1 - cx0 + 2 * m, cy1 - cy0 + 2 * m);
  return d;
}

/** Il file DXF dell'abaco, o null se non c'e' niente da disegnare. */
export function generaAbacoDxf(items, opzioni = {}) {
  const d = costruisciTavola(items, opzioni);
  if (!d) return null;

  const { x0, y0, x1, y1 } = d.lim;
  const out = [];
  const g = (...v) => out.push(...v);
  g('0', 'SECTION', '2', 'HEADER',
    '9', '$ACADVER', '1', 'AC1009',
    '9', '$INSBASE', '10', '0', '20', '0', '30', '0',
    '9', '$EXTMIN', '10', n(x0), '20', n(y0), '30', '0',
    '9', '$EXTMAX', '10', n(x1), '20', n(y1), '30', '0',
    '9', '$LIMMIN', '10', n(x0), '20', n(y0),
    '9', '$LIMMAX', '10', n(x1), '20', n(y1),
    '9', '$LTSCALE', '40', '1',
    '0', 'ENDSEC');
  g('0', 'SECTION', '2', 'TABLES');
  // La vista d'apertura inquadra tutta la tavola: senza, alcuni programmi
  // aprivano il file sul primo serramento.
  const alto = (y1 - y0) * 1.05;
  g('0', 'TABLE', '2', 'VPORT', '70', '1',
    '0', 'VPORT', '2', '*ACTIVE', '70', '0',
    '10', '0', '20', '0', '11', '1', '21', '1',
    '12', n((x0 + x1) / 2), '22', n((y0 + y1) / 2),
    '13', '0', '23', '0', '14', '10', '24', '10', '15', '10', '25', '10',
    '16', '0', '26', '0', '36', '1', '17', '0', '27', '0', '37', '0',
    '40', n(alto), '41', n(Math.max(0.5, (x1 - x0) / Math.max(1, y1 - y0))), '42', '50', '43', '0', '44', '0',
    '50', '0', '51', '0', '71', '0', '72', '100', '73', '1', '74', '3', '75', '0', '76', '0', '77', '0', '78', '0',
    '0', 'ENDTAB');
  g('0', 'TABLE', '2', 'LTYPE', '70', '2',
    '0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0',
    '0', 'LTYPE', '2', 'DASHED', '70', '0', '3', '__ __ __', '72', '65', '73', '2', '40', '60', '49', '40', '49', '-20',
    '0', 'ENDTAB');
  g('0', 'TABLE', '2', 'LAYER', '70', String(LAYER.length));
  LAYER.forEach((l) => g('0', 'LAYER', '2', l.nome, '70', '0', '62', String(l.colore), '6', l.linea));
  g('0', 'ENDTAB');
  g('0', 'TABLE', '2', 'STYLE', '70', '1',
    '0', 'STYLE', '2', 'STANDARD', '70', '0', '40', '0', '41', '1', '50', '0', '71', '0', '42', '70', '3', 'txt', '4', '',
    '0', 'ENDTAB');
  g('0', 'ENDSEC');
  g('0', 'SECTION', '2', 'ENTITIES');
  d.entita.forEach((e) => g(...righeEntita(e)));
  g('0', 'ENDSEC', '0', 'EOF');
  return out.join('\r\n') + '\r\n';
}

export function nomeFileAbaco(cliente, numero) {
  const parti = ['abaco', cliente, numero]
    .map((p) => testoAscii(p).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean);
  return `${parti.join('-')}.dxf`;
}
