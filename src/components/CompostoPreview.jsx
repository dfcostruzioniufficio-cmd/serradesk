import React from 'react';
import WindowPreview from './WindowPreview';
import { getFrameColorHex } from '../utils/colors';
import { dimensioniDisegno } from '../lib/scalaDisegno';
import { moduliValidi, larghezzaModuli, ACCOPPIAMENTO_MM } from '../utils/composto';

/**
 * Disegno di un serramento composto: i moduli affiancati dentro il rettangolo
 * d'ingombro, col profilo di accoppiamento fra l'uno e l'altro.
 *
 * I moduli si allineano a terra, perche' e' come si montano: sotto uno
 * scorrevole che parte in alto resta il parapetto, cioe' il vuoto. Quel vuoto
 * si vede nel disegno ed e' l'unica cosa che distingue un composto da una
 * finestra qualsiasi della stessa misura.
 *
 * Ogni modulo lo disegna WindowPreview, che pero' si fa un riquadro suo di
 * dimensione fissa e non si adatta a quello che gli si da'. Quindi lo si
 * disegna alla sua misura naturale e lo si rimpicciolisce con una scala,
 * dentro un riquadro che taglia quello che avanza. Tutto quello che
 * WindowPreview sa fare - tipi per anta, maniglie, cerniere, traverso,
 * maniglione - continua a funzionare dentro il modulo.
 */
export default function CompostoPreview({
  width,
  height,
  moduli,
  accoppiamento = ACCOPPIAMENTO_MM,
  frameColor = 'Bianco',
  accessoriColore = 'Argento',
  maxQuoteWidth = null,
  maxQuoteHeight = null,
  // Il sistema dell'archivio, per gli spessori dei profili di ogni modulo.
  profilo = null,
  isExporting = false,
}) {
  const validi = moduliValidi(moduli);
  const W = Number(width) || 1000;
  const H = Number(height) || 1000;
  if (!validi.length) return null;

  // maxQuoteWidth e maxQuoteHeight sono i millimetri del serramento piu'
  // grande del preventivo, servono a tenere in scala fra loro i disegni e non
  // sono pixel: il riquadro si misura come per tutti gli altri disegni.
  const { dW, dH } = dimensioniDisegno({
    width: W, height: H, maxQuoteWidth, maxQuoteHeight,
    maxW: 142, maxH: 200, larghezzaPredefinita: 1000, altezzaPredefinita: 1000,
  });
  const k = dW / W; // pixel per millimetro

  // Se i moduli non arrivano alla misura d'ingombro si disegnano nella loro
  // proporzione vera, a partire da sinistra: meglio un disegno che dice "qui
  // manca qualcosa" di uno che allarga i moduli per far quadrare.
  const occupata = larghezzaModuli(validi, accoppiamento);
  const scalaX = occupata > W ? W / occupata : 1;
  const spessore = (Number(accoppiamento) || 0) * scalaX;

  const telaio = getFrameColorHex(frameColor);

  // Posizione di ogni modulo in millimetri dentro l'ingombro.
  let cursore = 0;
  const piazzati = validi.map((m) => {
    const mw = Number(m.larghezza) * scalaX;
    const mh = Math.min(Number(m.altezza), H);
    const y = (m.ancoraggio === 'alto') ? 0 : H - mh;
    const posto = { m, x: cursore, y, mw, mh };
    cursore += mw + spessore;
    return posto;
  });

  return (
    <div style={{ position: 'relative', width: `${dW}px`, height: `${dH}px` }}>
      {piazzati.map((p, i) => {
        const boxW = p.mw * k;
        const boxH = p.mh * k;
        // Misura naturale del disegno del modulo, quella che WindowPreview si
        // darebbe da solo, e di quanto va rimpicciolita per stare nel riquadro.
        const nat = dimensioniDisegno({
          width: Number(p.m.larghezza), height: p.mh,
          maxW: 142, maxH: 200, larghezzaPredefinita: 1000, altezzaPredefinita: 1000,
        });
        const s = Math.min(boxW / nat.dW, boxH / nat.dH);
        const dopo = piazzati[i + 1];
        return (
          <React.Fragment key={i}>
            <div style={{
              position: 'absolute',
              left: `${p.x * k}px`, top: `${p.y * k}px`,
              width: `${boxW}px`, height: `${boxH}px`,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${nat.dW}px`, height: `${nat.dH + 24}px`,
                transform: `scale(${s})`, transformOrigin: 'top left',
              }}>
                <WindowPreview
                  apertura={p.m.apertura}
                  numAnte={p.m.numAnte}
                  width={Number(p.m.larghezza)}
                  height={p.mh}
                  frameColor={frameColor}
                  accessoriColore={accessoriColore}
                  paneConfigs={p.m.paneConfigs || {}}
                  hasTraverso={!!p.m.hasTraverso}
                  traversoHeight={p.m.traversoHeight}
                  profilo={profilo}
                  isExporting={isExporting}
                />
              </div>
            </div>
            {dopo && spessore > 0 && (() => {
              // Il profilo copre tutta l'altezza che i due moduli occupano
              // insieme: con uno appoggiato in alto e l'altro a terra, preso
              // dall'altezza di uno solo restava mozzato.
              const y0 = Math.min(p.y, dopo.y);
              const y1 = Math.max(p.y + p.mh, dopo.y + dopo.mh);
              return (
                <div style={{
                  position: 'absolute',
                  left: `${(p.x + p.mw) * k}px`, top: `${y0 * k}px`,
                  width: `${Math.max(1, spessore * k)}px`, height: `${(y1 - y0) * k}px`,
                  background: telaio,
                  border: '0.5px solid rgba(0,0,0,0.35)',
                  boxSizing: 'border-box',
                }} />
              );
            })()}
          </React.Fragment>
        );
      })}
    </div>
  );
}
