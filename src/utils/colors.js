export const getFrameColorHex = (colorString, fallback = '#f8fafc') => {
  if (!colorString) return fallback;
  const c = colorString.toLowerCase();
  
  // Bianchi / Avorio
  if (c.includes('bianco') || c.includes('9010') || c.includes('9016') || c.includes('dec 100') || c.includes('dec100') || c.includes('dec 101') || c.includes('dec 102') || c.includes('massa')) return '#f8fafc';
  if (c.includes('avorio') || c.includes('crema') || c.includes('1013')) return '#fffff0';
  
  // Legni (Wood) e Pellicolati chiari/medi
  if (c.includes('legno') || c.includes('noce') || c.includes('ciliegio') || c.includes('rovere') || c.includes('castagno') || c.includes('golden oak') || c.includes('winchester') || c.includes('renolit') || c.includes('pellicolato')) return '#8B5A2B';
  if (c.includes('mogano') || c.includes('wenge')) return '#4A2511';
  
  // Grigi / Antracite
  if (c.includes('grigio') || c.includes('antracite') || c.includes('7016')) return '#555555';
  if (c.includes('argento') || c.includes('silver') || c.includes('9006')) return '#b0b5b9';
  
  // Neri / Marroni scuri
  if (c.includes('nero') || c.includes('9005') || c.includes('black')) return '#222222';
  if (c.includes('marrone') || c.includes('bronzo') || c.includes('8017')) return '#654321';
  
  // Vari
  if (c.includes('verde') || c.includes('6005') || c.includes('green')) return '#2e8b57';
  if (c.includes('rosso') || c.includes('3005') || c.includes('red')) return '#b22222';
  
  // Fallback se è un colore esadecimale valido
  if (/^#([0-9A-F]{3}){1,2}$/i.test(c)) return c;
  
  return fallback;
};

export const getAccessoriHex = (colorName) => {
  if (!colorName) return '#ccc'; 
  const lower = colorName.toLowerCase();
  if (lower.includes('ner') || lower.includes('antracit') || lower.includes('black')) return '#333';
  if (lower.includes('bianc') || lower.includes('avorio') || lower.includes('white')) return '#eee';
  if (lower.includes('oro') || lower.includes('otton') || lower.includes('gold')) return '#d4af37';
  if (lower.includes('bronz')) return '#8c5a24';
  if (lower.includes('marr') || lower.includes('brown')) return '#5c4033';
  return '#ccc'; 
};
