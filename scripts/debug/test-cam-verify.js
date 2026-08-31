import { runCamEngine } from './src/utils/camEngine.js';

// Simuliamo un infisso a 2 ante: 1000 x 1000 mm
const items = [{
  id: '1',
  type: 'infisso',
  apertura: 'Battente',
  numAnte: 2,
  width: 1000,
  height: 1000,
  quantity: 1,
  sistema_cam: {
    profilo_lati:  { codice: 'TEL-Z30', tolleranza_mm: 5, aletta_mm: 30, saldatura_mm: 6 },
    profilo_basso: { codice: 'TEL-INF', tolleranza_mm: 5, aletta_mm: 0,  saldatura_mm: 6 },
    profilo_anta:  { codice: 'ANT-T70', rebate_mm: 64, sormonto_mm: 20, saldatura_mm: 6, ingombro_vista_mm: 70 },
    profilo_riporto: { codice: 'RIP-70', taglio_extra_mm: 0 },
    profilo_fermavetro: { codice: 'FERM-24' }
  }
}];

console.log("=== TEST CAM ENGINE: Finestra a 2 ante 1000x1000 ===\n");
const result = runCamEngine(items);

const resItem = result.itemResults[0];
console.log(`Telaio Netto Calcolato: ${resItem.frame.width} x ${resItem.frame.height} mm`);
console.log(`Anta Netta Calcolata (cad): ${resItem.sash.width} x ${resItem.sash.height} mm\n`);

console.log("BOM GENERATA:");
let tc = 0, ac = 0, rc = 0, fc = 0;
resItem.bom.forEach(p => {
  console.log(`- ${p.part.padEnd(20)} | Profilo: ${p.profile.padEnd(10)} | Taglio: ${p.mm} mm`);
  if (p.profile.includes('TEL')) tc++;
  if (p.profile.includes('ANT')) ac++;
  if (p.profile.includes('RIP')) rc++;
  if (p.profile.includes('FERM')) fc++;
});

console.log(`\nRIEPILOGO PEZZI:`);
console.log(`- Pezzi Telaio: ${tc} (atteso: 4)`);
console.log(`- Pezzi Anta: ${ac} (atteso: 8)`);
console.log(`- Pezzi Riporto: ${rc} (atteso: 1)`);
console.log(`- Pezzi Fermavetro: ${fc} (atteso: 8)`);
