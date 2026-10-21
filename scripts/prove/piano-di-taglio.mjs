// Prova del piano di taglio (src/utils/camEngine.js, packBars).
// node scripts/prove/piano-di-taglio.mjs
//
// Per migliaia di distinte inventate, simili a quelle vere, controlla da
// fuori, senza usare il codice che controlla se stesso:
//  - ogni pezzo richiesto c'e' una volta sola, con la sua misura esatta;
//  - nessun pezzo in piu';
//  - ogni barra sta nella sua lunghezza (sbucciatura 2x20, morsa 150, lama 4
//    per pezzo) e lo sfrido scritto e' quello vero;
//  - le barre non sono mai piu' di quelle del metodo di prima;
//  - il calcolo resta veloce anche sui lavori grandi.
import { packBars } from '../../src/utils/camEngine.js';

const KERF = 4, FISSO = 40 + 150;
function vecchio(pieces, barLength) {
  const sorted = [...pieces].sort((a, b) => b - a);
  const bars = [];
  for (const piece of sorted) {
    let placed = false;
    for (const bar of bars) {
      const used = bar.reduce((s, c) => s + c + KERF, FISSO);
      if (barLength - used >= piece + KERF) { bar.push(piece); placed = true; break; }
    }
    if (!placed) bars.push([piece]);
  }
  return bars.length;
}

function controlla(pieces, barLength, nome) {
  const t0 = performance.now();
  const barre = packBars(pieces, barLength);
  const ms = performance.now() - t0;
  const errori = [];
  const conta = new Map();
  for (const p of pieces) conta.set(p, (conta.get(p) || 0) + 1);
  barre.forEach((b, i) => {
    const used = b.cuts_mm.reduce((s, c) => s + c + KERF, FISSO);
    if (used > barLength) errori.push(`barra ${i + 1} sfora di ${used - barLength} mm`);
    if (b.waste_mm !== barLength - used) errori.push(`barra ${i + 1} sfrido scritto ${b.waste_mm}, vero ${barLength - used}`);
    if (!b.cuts_mm.length) errori.push(`barra ${i + 1} vuota`);
    for (const c of b.cuts_mm) {
      if (!conta.get(c)) errori.push(`pezzo da ${c} in piu'`);
      else conta.set(c, conta.get(c) - 1);
    }
  });
  for (const [m, r] of conta) if (r > 0) errori.push(`mancano ${r} pezzi da ${m}`);
  const prima = vecchio(pieces, barLength);
  if (barre.length > prima) errori.push(`${barre.length} barre contro ${prima} di prima`);
  return { errori, barre: barre.length, prima, ms, nome };
}

// Generatore ripetibile, cosi' una prova fallita si puo' rifare uguale.
let seme = 12345;
const caso = () => ((seme = (seme * 1103515245 + 12345) % 2147483648) / 2147483648);
const tra = (a, b) => Math.floor(a + caso() * (b - a + 1));

const prove = [];
// 1. La lista del confronto con CuttingOpt.Pro.
const lista = [[2180, 4], [1540, 6], [1480, 6], [1400, 6], [1340, 8], [1180, 6], [980, 6], [880, 8], [640, 4]];
prove.push(controlla(lista.flatMap(([m, q]) => Array(q).fill(m)), 6500, 'lista confronto'));
// 2. Casi limite.
prove.push(controlla([6306], 6500, 'un pezzo lungo esatto'));
prove.push(controlla([3058, 3058], 6500, 'due meta esatte'));
prove.push(controlla([1], 6500, 'pezzo da 1 mm'));
prove.push(controlla([], 6500, 'nessun pezzo'));
prove.push(controlla(Array(500).fill(1234), 6500, '500 pezzi uguali'));
// 3. Distinte inventate come quelle vere: da 1 a 30 serramenti, misure al
// mm, barre da 6000, 6500 e 7000; telai, ante, fermavetri.
for (let n = 0; n < 5000; n++) {
  const barLength = [6000, 6500, 7000][tra(0, 2)];
  const serramenti = tra(1, 30);
  const pezzi = [];
  for (let s = 0; s < serramenti; s++) {
    const L = tra(400, 2400), H = tra(400, 2700), q = tra(1, 3);
    for (let k = 0; k < q; k++) pezzi.push(L, L, H, H, L - tra(60, 130), L - tra(60, 130), H - tra(60, 130), H - tra(60, 130));
  }
  const tagliabili = pezzi.filter((p) => p + KERF <= barLength - FISSO);
  prove.push(controlla(tagliabili, barLength, `casuale ${n}`));
}
// 4. Lavori grandi con tante misure diverse (il caso lento).
for (let n = 0; n < 30; n++) {
  const pezzi = Array.from({ length: 400 }, () => tra(300, 3000));
  prove.push(controlla(pezzi, 6500, `grande ${n}`));
}

const sbagliate = prove.filter((p) => p.errori.length);
const risparmio = prove.reduce((s, p) => s + (p.prima - p.barre), 0);
const migliorate = prove.filter((p) => p.barre < p.prima).length;
const lenta = prove.reduce((a, b) => (b.ms > a.ms ? b : a));
console.log(`prove: ${prove.length}`);
console.log(`con errori: ${sbagliate.length}`);
sbagliate.slice(0, 10).forEach((p) => console.log('  ', p.nome, p.errori.slice(0, 3).join('; ')));
console.log(`distinte con meno barre: ${migliorate}, barre risparmiate in tutto: ${risparmio}`);
console.log(`la piu' lenta: ${lenta.nome}, ${lenta.ms.toFixed(0)} ms`);
console.log(`lista confronto: ${prove[0].barre} barre (prima ${prove[0].prima})`);
process.exit(sbagliate.length ? 1 : 0);
