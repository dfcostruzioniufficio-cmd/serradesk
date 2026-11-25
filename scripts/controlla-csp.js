// Le regole di sicurezza in vercel.json ammettono solo gli script scritti
// dentro index.html di cui conoscono l'impronta. Se qualcuno ne cambia uno
// (anche di una virgola) il browser lo bloccherebbe in silenzio: meglio che
// si fermi la build, qui, con l'impronta nuova da copiare.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const html = readFileSync('dist/index.html', 'utf8');
const regole = JSON.parse(readFileSync('vercel.json', 'utf8')).headers
  .flatMap((r) => r.headers)
  .filter((h) => h.key === 'Content-Security-Policy')
  .map((h) => h.value);

const mancanti = [];
for (const [, attributi, corpo] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (/\ssrc=/.test(attributi)) continue;
  const impronta = `'sha256-${createHash('sha256').update(corpo).digest('base64')}'`;
  if (!regole.length || !regole.every((r) => r.includes(impronta))) mancanti.push(impronta);
}

if (mancanti.length) {
  console.error('Script in index.html non ammessi dalle regole di sicurezza di vercel.json.');
  console.error('Aggiorna script-src in entrambe le regole con:', mancanti.join(' '));
  process.exit(1);
}
console.log('Regole di sicurezza allineate agli script della pagina.');
