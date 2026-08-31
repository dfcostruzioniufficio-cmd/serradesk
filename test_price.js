const fs = require('fs');
// Mock calculateWindowPrice
function calculateWindowPrice(item, sistemiCam) {
  const wM = Number(item.width) / 1000;
  const hM = Number(item.height) / 1000;
  const cType = item.calcType;

  const sysProfilo = sistemiCam.find(s => s.id === item.sistemaCamId);
  const isOverride = item.isManualBasePrice;

  if (sysProfilo && !isOverride) {
    const baseProfilo = Number(sysProfilo.base_price) || 0;
    let baseVetro = 0;
    if (item.vetroId && item.vetroId !== 'custom') {
      const v = sistemiCam.find(s => s.id === item.vetroId);
      if (v) baseVetro = Number(v.base_price) || 0;
    }
    let mq = wM * hM;
    const numAnte = Number(item.numAnte) || 1;
    const isFisso = item.apertura === 'Fisso';
    
    if (!isFisso && item.apertura !== 'Cassonetto') {
      if (numAnte === 1 && mq < 1.05) mq = 1.05;
      if (numAnte >= 2 && mq < 1.08) mq = 1.08;
    }

    let costoVetro = mq * baseVetro;
    let unitPrice = ((mq * baseProfilo) + costoVetro).toFixed(2);
    return { unitPrice, basePrice: baseProfilo + baseVetro, mq };
  }
}

const sistemiCam = [
  { id: '1', base_price: 200, tipologia: 'BATTENTE' },
  { id: '2', base_price: 50, tipologia: 'VETRO' }
];

const item = {
  width: 500, height: 500, calcType: 'mq',
  sistemaCamId: '1', vetroId: '2',
  numAnte: 1, apertura: 'Battente', isManualBasePrice: false
};

console.log(calculateWindowPrice(item, sistemiCam));
