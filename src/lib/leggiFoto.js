// La foto di un articolo finisce dentro il preventivo salvato: si accettano
// solo immagini vere e quelle grandi si rimpiccioliscono prima di salvarle.
// Una foto da telefono pesa diversi MB e appesantiva ogni apertura
// dell'archivio e il PDF.

const TIPI_AMMESSI = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE = 20 * 1024 * 1024; // oltre non si apre nemmeno
const GIA_LEGGERA = 400 * 1024;    // sotto questa soglia resta com'e'
const LATO_MAX = 1600;             // in pagina la foto e' alta 240 px

const comeDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Non riesco a leggere la foto.'));
  reader.readAsDataURL(file);
});

const comeImmagine = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Il file non è un\'immagine valida.'));
  img.src = src;
});

export async function leggiFoto(file) {
  if (!TIPI_AMMESSI.includes(file.type)) {
    throw new Error('Formato non ammesso: carica una foto JPG, PNG o WEBP.');
  }
  if (file.size > MAX_FILE) {
    throw new Error('Foto troppo pesante: massimo 20 MB.');
  }

  const originale = await comeDataUrl(file);
  const img = await comeImmagine(originale);
  const scala = Math.min(1, LATO_MAX / Math.max(img.width, img.height));
  if (file.size <= GIA_LEGGERA && scala === 1) return originale;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scala));
  canvas.height = Math.max(1, Math.round(img.height * scala));
  const ctx = canvas.getContext('2d');
  // Il JPEG non ha trasparenza: senza fondo bianco le zone vuote vengono nere.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const ridotta = canvas.toDataURL('image/jpeg', 0.85);
  return ridotta.length < originale.length ? ridotta : originale;
}
