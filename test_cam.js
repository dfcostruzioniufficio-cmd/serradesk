import { runCamEngine } from './src/utils/camEngine.js';

const mockItems = [
  {
    id: '01',
    type: 'window',
    width: 1000,
    height: 2000,
    apertura: 'Battente',
    numAnte: 2,
    hasSopraluce: true,
    sopraluceHeight: 400,
    sistema_cam: {
      profilo_lati: { codice: 'TEL-Z', aletta_mm: 30, saldatura_mm: 6, tolleranza_mm: 5 },
      profilo_anta: { codice: 'ANT-T', rebate_mm: 64, sormonto_mm: 20, saldatura_mm: 6 }
    }
  }
];

const result = runCamEngine(mockItems);
console.log(JSON.stringify(result.itemResults[0].bom, null, 2));
