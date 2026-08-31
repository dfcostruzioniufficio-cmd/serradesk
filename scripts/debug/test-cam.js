import { runCamEngine } from './src/utils/camEngine.js';
import assert from 'node:assert/strict';

const systemParams = {
  profilo_lati:  { codice: 'TEL-Z30',     aletta_mm: 30, saldatura_mm: 6, tolleranza_mm: 5 },
  profilo_basso: { codice: 'TEL-INF-DRN', aletta_mm: 0,  saldatura_mm: 6, tolleranza_mm: 5 },
  profilo_anta:  { codice: 'ANT-T70',     rebate_mm: 64, sormonto_mm: 20, saldatura_mm: 6  },
};

function getPiece(bom, partName) {
  return bom.find(p => p.part === partName)?.mm;
}

const testCases = [
  {
    name: "1. Finestra 1 Anta 1000x1200",
    item: { id: 'W1', type: 'infisso', apertura: 'Battente', numAnte: 1, width: 1000, height: 1200, sistema_cam: systemParams },
    expected: { fw: 1050, fh: 1225, sw: 962, sh: 1137, frame_top: 1056, frame_left: 1231, anta_1_top: 968, anta_1_left: 1143 }
  },
  {
    name: "2. Finestra 1 Anta Piccola 600x800",
    item: { id: 'W2', type: 'infisso', apertura: 'Battente', numAnte: 1, width: 600, height: 800, sistema_cam: systemParams },
    expected: { fw: 650, fh: 825, sw: 562, sh: 737, frame_top: 656, frame_left: 831, anta_1_top: 568, anta_1_left: 743 }
  },
  {
    name: "3. Finestra Fisso 1000x1000 (Senza ante)",
    item: { id: 'W3', type: 'infisso', apertura: 'Fisso', numAnte: 1, width: 1000, height: 1000, sistema_cam: systemParams },
    expected: { fw: 1050, fh: 1025, sw: null, sh: null, frame_top: 1056, frame_left: 1031, anta_1_top: undefined }
  },
  {
    name: "4. Finestra 2 Ante 1200x1400",
    item: { id: 'W4', type: 'infisso', apertura: 'Battente', numAnte: 2, width: 1200, height: 1400, sistema_cam: systemParams },
    expected: { fw: 1250, fh: 1425, sw: 591, sh: 1337, frame_top: 1256, frame_left: 1431, anta_1_top: 597, anta_1_left: 1343 }
  },
  {
    name: "5. Portafinestra 1 Anta 900x2100",
    item: { id: 'W5', type: 'infisso', apertura: 'Battente', numAnte: 1, width: 900, height: 2100, sistema_cam: systemParams },
    expected: { fw: 950, fh: 2125, sw: 862, sh: 2037, frame_top: 956, frame_left: 2131, anta_1_top: 868, anta_1_left: 2043 }
  },
  {
    name: "6. Portafinestra 2 Ante 1400x2200",
    item: { id: 'W6', type: 'infisso', apertura: 'Battente', numAnte: 2, width: 1400, height: 2200, sistema_cam: systemParams },
    expected: { fw: 1450, fh: 2225, sw: 691, sh: 2137, frame_top: 1456, frame_left: 2231, anta_1_top: 697, anta_1_left: 2143 }
  },
  {
    name: "7. Finestra 3 Ante 1800x1400",
    item: { id: 'W7', type: 'infisso', apertura: 'Battente', numAnte: 3, width: 1800, height: 1400, sistema_cam: systemParams },
    expected: { fw: 1850, fh: 1425, sw: 1802 / 3, sh: 1337, frame_top: 1856, frame_left: 1431, anta_1_top: (1802/3) + 6, anta_1_left: 1343 }
  },
  {
    name: "8. Finestra 4 Ante 2400x1400",
    item: { id: 'W8', type: 'infisso', apertura: 'Battente', numAnte: 4, width: 2400, height: 1400, sistema_cam: systemParams },
    expected: { fw: 2450, fh: 1425, sw: 605.5, sh: 1337, frame_top: 2456, frame_left: 1431, anta_1_top: 611.5, anta_1_left: 1343 }
  },
  {
    name: "9. Finestra 1 Anta con Traverso 1000x1400",
    item: { id: 'W9', type: 'infisso', apertura: 'Battente', numAnte: 1, width: 1000, height: 1400, sistema_cam: systemParams, hasTraverso: true },
    expected: { fw: 1050, fh: 1425, sw: 962, sh: 1337, frame_top: 1056, frame_left: 1431, anta_1_top: 968, anta_1_left: 1343, traverso: 968 }
  },
  {
    name: "10. Finestra 2 Ante con Traverso 1200x1400",
    item: { id: 'W10', type: 'infisso', apertura: 'Battente', numAnte: 2, width: 1200, height: 1400, sistema_cam: systemParams, hasTraverso: true },
    expected: { fw: 1250, fh: 1425, sw: 591, sh: 1337, frame_top: 1256, frame_left: 1431, anta_1_top: 597, anta_1_left: 1343, traverso: 597 }
  }
];

async function runTests() {
  console.log("🛠️  Esecuzione Suite di 10 Test CAM Engine 🛠️\n");
  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`Test: ${tc.name}`);
    try {
      const { itemResults } = runCamEngine([tc.item]);
      const res = itemResults[0];

      // Verifiche Telaio
      assert.equal(res.frame.width, tc.expected.fw, `[Errore Telaio Larghezza] Atteso ${tc.expected.fw}, ottenuto ${res.frame.width}`);
      assert.equal(res.frame.height, tc.expected.fh, `[Errore Telaio Altezza] Atteso ${tc.expected.fh}, ottenuto ${res.frame.height}`);
      
      const fTop = getPiece(res.bom, 'frame_top');
      const fLeft = getPiece(res.bom, 'frame_left');
      assert.equal(fTop, tc.expected.frame_top, `[Errore Taglio Telaio Sup] Atteso ${tc.expected.frame_top}, ottenuto ${fTop}`);
      assert.equal(fLeft, tc.expected.frame_left, `[Errore Taglio Telaio Sx] Atteso ${tc.expected.frame_left}, ottenuto ${fLeft}`);

      // Verifiche Anta
      if (tc.expected.sw !== null) {
        assert.equal(res.sash.width, tc.expected.sw, `[Errore Anta Larghezza] Atteso ${tc.expected.sw}, ottenuto ${res.sash.width}`);
        assert.equal(res.sash.height, tc.expected.sh, `[Errore Anta Altezza] Atteso ${tc.expected.sh}, ottenuto ${res.sash.height}`);
        
        const aTop = getPiece(res.bom, 'anta_1_top');
        const aLeft = getPiece(res.bom, 'anta_1_left');
        assert.equal(aTop, tc.expected.anta_1_top, `[Errore Taglio Anta Sup] Atteso ${tc.expected.anta_1_top}, ottenuto ${aTop}`);
        assert.equal(aLeft, tc.expected.anta_1_left, `[Errore Taglio Anta Sx] Atteso ${tc.expected.anta_1_left}, ottenuto ${aLeft}`);
      } else {
        const aTop = getPiece(res.bom, 'anta_1_top');
        assert.equal(aTop, undefined, `[Errore Anta] L'infisso Fisso non dovrebbe avere ante!`);
      }

      if (tc.expected.traverso) {
        // Usa traverso_centrale per Fisso, e traverso_anta_1 per Battente
        const isFisso = tc.item.apertura === 'Fisso';
        const tr1 = getPiece(res.bom, isFisso ? 'traverso_centrale' : 'traverso_anta_1');
        assert.equal(tr1, tc.expected.traverso, `[Errore Traverso] Atteso ${tc.expected.traverso}, ottenuto ${tr1}`);
      }

      console.log(`✅ PASSED\n`);
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\nRisultati Finali: ${passed} Passati, ${failed} Falliti.`);
  if (failed > 0) process.exit(1);
}

runTests();
