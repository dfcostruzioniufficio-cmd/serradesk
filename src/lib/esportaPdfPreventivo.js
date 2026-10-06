import { detectBrowserZoom } from './utils';

/** Nome del file: cliente e, se c'e', riferimento (senza caratteri vietati). */
export function nomeFilePdf(cliente, riferimento) {
  const pulisci = (t) => String(t || '').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
  const rif = pulisci(riferimento);
  return `Preventivo_${pulisci(cliente) || 'Cliente'}${rif ? '_' + rif : ''}.pdf`;
}

/**
 * Trasforma in PDF il preventivo gia' disegnato nella pagina (il template
 * nascosto con id `idWrapper`) e lo scarica. Lo usano il preventivatore e
 * l'archivio, cosi' il PDF esce identico da tutti e due.
 *
 * `html2pdf` si passa da fuori perche' si importa al momento: se il pezzo di
 * programma non si scarica (aggiornamento appena pubblicato) chi chiama
 * decide cosa fare. Se la creazione fallisce l'errore risale a chi chiama.
 */
export async function esportaPdfPreventivo({ html2pdf, element, filename, idWrapper }) {
  const opt = {
    margin: 0,
    filename,
    // scale 2 + qualità 0.92 sono già oltre la risoluzione di stampa
    // (300dpi) e non si distinguono a occhio da scale 4/quality 1, ma
    // riducono il peso del PDF di 5-8 volte (da 5-6MB a circa 1MB)
    image: { type: 'jpeg', quality: 0.92 },
    html2canvas: {
      scale: 2,
      useCORS: true, 
      letterRendering: true, 
      windowWidth: 1024,
      onclone: (clonedDoc) => {
        // Con la spaziatura fra le lettere (le etichette in maiuscolo, il
        // nome del profilo) html2canvas disegna il testo lettera per
        // lettera, e su Safari le rimette insieme con dei buchi: "ER75 0TT",
        // "MISURE TEL AIO". Solo nella copia che diventa PDF la spaziatura
        // si azzera: il testo puo' solo accorciarsi, mai andare a capo in piu'.
        const senzaSpaziatura = clonedDoc.createElement('style');
        senzaSpaziatura.textContent = `#${idWrapper}, #${idWrapper} * { letter-spacing: 0 !important; }`;
        clonedDoc.head.appendChild(senzaSpaziatura);

        const wrapper = clonedDoc.getElementById(idWrapper);
        if (wrapper) {
          wrapper.style.transform = 'none';
          wrapper.style.zoom = '1';
          
          // Remove all CSS filters to fix html2canvas clipping bugs (off-screen canvas sizing issue)
          const allElements = wrapper.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            if (allElements[i].style.filter) {
              allElements[i].style.filter = 'none';
            }
          }
          
          // Convert all SVGs to IMGs to fix html2canvas rendering bugs
          const svgs = wrapper.querySelectorAll('svg');
          svgs.forEach(svg => {
            // Gli SVG (es. anteprima finestra) hanno width/height="100%":
            // fuori dal loro contenitore originale (dentro un'immagine
            // data-URI isolata) il browser non ha più nulla a cui
            // riferire quella percentuale e sbaglia le dimensioni
            // intrinseche dell'immagine, mostrando solo un frammento
            // ritagliato invece dell'intera anteprima. Fissiamo width e
            // height numerici presi dal viewBox prima di serializzare.
            const svgClone = svg.cloneNode(true);
            const viewBox = svgClone.getAttribute('viewBox');
            if (viewBox) {
              const parts = viewBox.split(/\s+/).map(Number);
              if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                svgClone.setAttribute('width', parts[2]);
                svgClone.setAttribute('height', parts[3]);
              }
            }

            const xml = new XMLSerializer().serializeToString(svgClone);
            const svg64 = btoa(unescape(encodeURIComponent(xml)));
            const b64Start = 'data:image/svg+xml;base64,';
            const image64 = b64Start + svg64;

            const img = clonedDoc.createElement('img');
            img.src = image64;

            // Copy essential dimensions and styles (dimensione di
            // visualizzazione nella pagina, separata da quella intrinseca)
            img.style.width = svg.style.width || svg.getAttribute('width') || '100%';
            img.style.height = svg.style.height || svg.getAttribute('height') || '100%';
            if (svg.getAttribute('class')) img.setAttribute('class', svg.getAttribute('class'));

            svg.parentNode.replaceChild(img, svg);
          });
        }
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  // Se il browser non è al 100% di zoom (es. Cmd+- per vedere meglio la
  // pagina), html2canvas cattura l'elemento nella sua dimensione "zoomata"
  // invece di quella reale, producendo un PDF con layout diverso.
  // Compensiamo applicando lo zoom inverso solo durante la cattura.
  const zoomFactor = detectBrowserZoom();
  const isZoomed = Math.abs(zoomFactor - 1) > 0.01;
  if (isZoomed) element.style.zoom = String(1 / zoomFactor);

  // Stesso difetto gia' corretto nella distinta: html2canvas misura dove
  // cade la base del testo con un elemento di prova appeso al body, che
  // eredita l'interlinea 1,5 del sito, e su Safari disegna tutto il testo
  // qualche pixel piu' in basso (le note finivano sotto la barra gialla).
  // Il body torna all'interlinea normale solo durante l'esportazione; il
  // preventivo tiene la sua 1,5 dal wrapper, quindi l'impaginazione
  // misurata in pagina resta valida.
  const interlineaPrima = document.body.style.lineHeight;
  document.body.style.lineHeight = 'normal';
  const ripristina = () => {
    document.body.style.lineHeight = interlineaPrima;
    if (isZoomed) element.style.zoom = '';
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } finally {
    ripristina();
  }
}
