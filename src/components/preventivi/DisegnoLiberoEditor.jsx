import React from 'react';
import { Input } from '@/components/ui/input';
import DisegnoLiberoPreview from '../DisegnoLiberoPreview';
import {
  APERTURE_VANO, NOMI_APERTURA, MINIMO_PARTE_MM,
  geometria, nodoA, percorsoPadre, dividiVano, cambiaVano, spostaDivisione, togliDivisione, vaniTroppoPiccoli, nominaVani,
} from '../../utils/disegnoLibero';

/**
 * L'editor del disegno libero, dentro il modulo dell'articolo.
 *
 * Si tocca un vano nel disegno e si sceglie come si apre, oppure lo si
 * divide con un montante o un traverso alla misura scritta. Toccando un
 * montante o un traverso se ne cambia la misura, o lo si toglie. Ogni
 * modifica va subito nell'articolo (onChange), come i tocchi sulle ante del
 * disegno normale: prezzo e descrizione si aggiornano mentre si disegna.
 */
export default function DisegnoLiberoEditor({
  disegno, width, height, frameColor, accessoriColore, profilo, onChange, onEsci,
}) {
  const W = Number(width) || 1000;
  const H = Number(height) || 1000;
  const { vani, divisioni } = geometria(disegno, W, H);
  const [sel, setSel] = React.useState(() => (vani.length === 1 ? { tipo: 'vano', percorso: vani[0].percorso } : null));
  const [misuraMontante, setMisuraMontante] = React.useState('');
  const [misuraTraverso, setMisuraTraverso] = React.useState('');
  const [errore, setErrore] = React.useState('');

  // Il disegno prende tutta la larghezza che ha: sul telefono e' stretto,
  // sul computer si allarga fino a un massimo che resta leggibile.
  const contenitore = React.useRef(null);
  const [largo, setLargo] = React.useState(420);
  React.useLayoutEffect(() => {
    const el = contenitore.current;
    if (!el) return undefined;
    const misura = () => setLargo(Math.max(220, Math.min(520, el.clientWidth - 24)));
    misura();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(misura);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Una selezione che non esiste piu' (vano unito, divisione tolta) si lascia.
  const vano = sel?.tipo === 'vano' ? vani.find((v) => v.percorso === sel.percorso) : null;
  const divisione = sel?.tipo === 'divisione' ? divisioni.find((d) => d.percorso === sel.percorso) : null;

  const seleziona = (nuova) => {
    setSel(nuova);
    setErrore('');
    setMisuraMontante('');
    setMisuraTraverso('');
  };

  const cambia = (nuovo, nuovaSel = sel) => {
    onChange(nuovo);
    setSel(nuovaSel);
    setErrore('');
  };

  const dividi = (tipo) => {
    if (!vano) return;
    const totale = tipo === 'montante' ? vano.w : vano.h;
    const scritta = tipo === 'montante' ? misuraMontante : misuraTraverso;
    const misura = String(scritta).trim() ? Number(String(scritta).replace(',', '.')) : Math.round(totale / 2);
    if (!(misura >= MINIMO_PARTE_MM && misura <= totale - MINIMO_PARTE_MM)) {
      setErrore(totale < 2 * MINIMO_PARTE_MM
        ? `Il vano e' largo ${Math.round(totale)} mm: troppo poco per dividerlo.`
        : `La misura deve stare fra ${MINIMO_PARTE_MM} e ${Math.round(totale - MINIMO_PARTE_MM)} mm.`);
      return;
    }
    // Resta selezionata la parte nuova a sinistra, o quella sotto: e' quella
    // di cui si sceglie subito l'apertura.
    const figlio = tipo === 'montante' ? 0 : 1;
    cambia(dividiVano(disegno, vano.percorso, tipo, Math.round(misura)), {
      tipo: 'vano', percorso: vano.percorso ? `${vano.percorso}-${figlio}` : String(figlio),
    });
    setMisuraMontante('');
    setMisuraTraverso('');
  };

  const chip = (attivo) => `px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${attivo ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-700'}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-800">Disegno libero</p>
          <p className="text-xs text-gray-500">Tocca un vano per sceglierne l&#39;apertura o dividerlo. Tocca un montante o un traverso per cambiarne la misura.</p>
        </div>
        <button type="button" onClick={onEsci} className="text-xs font-semibold text-gray-500 hover:text-gray-800 underline underline-offset-2">
          Torna al disegno normale
        </button>
      </div>

      {/* Affiancati solo sugli schermi larghi: il modulo sta in una colonna
          accanto all'anteprima, e gia' su un portatile il disegno finiva
          schiacciato dal pannello. */}
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div ref={contenitore} className="min-w-0 rounded-xl border border-gray-100 bg-white p-3 flex flex-col items-center justify-center gap-2">
          <DisegnoLiberoPreview
            disegno={disegno} width={W} height={H}
            frameColor={frameColor} accessoriColore={accessoriColore} profilo={profilo}
            maxW={largo} maxH={360} isExporting
            selezionato={sel} onSeleziona={seleziona}
          />
          {(() => {
            const piccoli = vaniTroppoPiccoli(disegno, W, H);
            if (!piccoli.length) return null;
            return (
              <p className="text-xs font-medium text-amber-700">
                {(() => { const t = nominaVani(piccoli); return t[0].toUpperCase() + t.slice(1); })()} {piccoli.length === 1 ? 'è più piccolo' : 'sono più piccoli'} di {MINIMO_PARTE_MM} mm: sposta un montante o un traverso.
              </p>
            );
          })()}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4 text-sm">
          {!vano && !divisione && (
            <p className="text-gray-500">Tocca un vano nel disegno.</p>
          )}

          {vano && (
            <>
              <p className="font-bold text-gray-800">
                {vani.length > 1 ? `Vano ${vano.numero}` : 'Il serramento'}
                <span className="font-medium text-gray-500"> · {Math.round(vano.w)} × {Math.round(vano.h)} mm</span>
              </p>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Apertura</p>
                <div className="flex flex-wrap gap-1.5">
                  {APERTURE_VANO.map((a) => (
                    <button key={a} type="button" className={chip(vano.apertura === a)}
                      onClick={() => cambia(cambiaVano(disegno, vano.percorso, { apertura: a }))}>
                      {NOMI_APERTURA[a]}
                    </button>
                  ))}
                </div>
              </div>

              {(vano.apertura === 'battente' || vano.apertura === 'ribalta') && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Maniglia</p>
                  <div className="flex gap-1.5">
                    {[['left', 'A sinistra'], ['right', 'A destra']].map(([lato, nome]) => (
                      <button key={lato} type="button" className={chip(vano.lato === lato)}
                        onClick={() => cambia(cambiaVano(disegno, vano.percorso, { lato }))}>
                        {nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Dividi</p>
                <div className="flex items-center gap-2">
                  <Input type="number" inputMode="numeric" value={misuraMontante} placeholder={String(Math.round(vano.w / 2))}
                    onChange={(e) => setMisuraMontante(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); dividi('montante'); } }}
                    className="h-10 w-24 rounded-lg" aria-label="Larghezza della parte a sinistra in mm" />
                  <button type="button" onClick={() => dividi('montante')} className="min-h-10 flex-1 rounded-lg bg-blue-50 px-3 py-1.5 text-left leading-tight text-sm font-semibold text-blue-700 border border-blue-100 hover:bg-blue-100">
                    + Montante <span className="block text-[11px] font-medium text-blue-600/80">mm della parte a sinistra</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" inputMode="numeric" value={misuraTraverso} placeholder={String(Math.round(vano.h / 2))}
                    onChange={(e) => setMisuraTraverso(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); dividi('traverso'); } }}
                    className="h-10 w-24 rounded-lg" aria-label="Altezza della parte sotto in mm" />
                  <button type="button" onClick={() => dividi('traverso')} className="min-h-10 flex-1 rounded-lg bg-blue-50 px-3 py-1.5 text-left leading-tight text-sm font-semibold text-blue-700 border border-blue-100 hover:bg-blue-100">
                    + Traverso <span className="block text-[11px] font-medium text-blue-600/80">mm della parte sotto</span>
                  </button>
                </div>
                {errore && <p className="text-xs font-medium text-amber-700">{errore}</p>}
              </div>

              {vano.percorso !== '' && (
                <button type="button"
                  onClick={() => {
                    const padre = percorsoPadre(vano.percorso);
                    cambia(togliDivisione(disegno, padre), { tipo: 'vano', percorso: padre });
                  }}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 underline underline-offset-2">
                  Unisci con la parte accanto
                </button>
              )}
            </>
          )}

          {divisione && (() => {
            const montante = divisione.tipo === 'montante';
            const totale = montante ? divisione.parte.w : divisione.parte.h;
            const nodo = nodoA(disegno, divisione.percorso);
            const scritta = montante ? nodo?.sinistra : nodo?.sotto;
            return (
              <>
                <p className="font-bold text-gray-800">{montante ? 'Montante' : 'Traverso'}</p>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    {montante ? 'Larghezza della parte a sinistra' : 'Altezza della parte sotto'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Input type="number" inputMode="numeric" value={scritta ?? ''}
                      onChange={(e) => cambia(spostaDivisione(disegno, divisione.percorso, e.target.value))}
                      className="h-10 w-28 rounded-lg" />
                    <span className="text-xs text-gray-500">mm, da {MINIMO_PARTE_MM} a {Math.round(totale - MINIMO_PARTE_MM)}</span>
                  </div>
                  {Number(scritta) !== Math.round(divisione.misura) && String(scritta ?? '').trim() !== '' && (
                    <p className="mt-1 text-xs font-medium text-amber-700">Fuori misura: nel disegno resta a {Math.round(divisione.misura)} mm.</p>
                  )}
                </div>
                <button type="button"
                  onClick={() => cambia(togliDivisione(disegno, divisione.percorso), { tipo: 'vano', percorso: divisione.percorso })}
                  className="h-10 w-full rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-700 hover:bg-red-100">
                  Togli {montante ? 'il montante' : 'il traverso'}
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
