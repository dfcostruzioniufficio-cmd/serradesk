import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { righeTapparelle, totaleTapparelle, AVVOLGIMENTO_MM } from '../../utils/tapparella';

const n2 = (v) => (Number(v) || 0).toFixed(2).replace('.', ',');

/**
 * Tapparelle di tutto il preventivo in una voce sola: prende i serramenti
 * gia' inseriti, somma i m² con avvolgimento e minimi, e l'utente mette solo
 * il prezzo al m². Inserirle una per una, riscrivendo misure che sono gia'
 * nel preventivo, e' il lavoro che questa scheda toglie di mezzo.
 *
 * Le esclusioni stanno in newItem.tapparelleEscluse (id dei serramenti senza
 * tapparella): si tengono le escluse e non le incluse, cosi' un serramento
 * aggiunto dopo entra da solo nel conto invece di essere dimenticato.
 */
export default function TapparellePreventivoPanel({ items, newItem, updateItemField, isCustomerMode }) {
  const righe = React.useMemo(() => righeTapparelle(items), [items]);
  const escluse = Array.isArray(newItem.tapparelleEscluse) ? newItem.tapparelleEscluse : [];
  const totale = totaleTapparelle(righe, escluse);
  const prezzo = Number(newItem.unitPrice) || 0;

  const cambia = (chiave, dentro) => {
    const nuove = dentro ? escluse.filter((x) => x !== chiave) : [...new Set([...escluse, chiave])];
    updateItemField('tapparelleEscluse', nuove);
  };

  if (!righe.length) {
    return (
      <div className="bg-orange-50/30 p-5 rounded-xl border border-orange-100 text-sm text-orange-900">
        <b>Prima i serramenti, poi le tapparelle.</b>
        <p className="mt-1 text-orange-800/80">
          Qui si sommano i metri quadri delle finestre gia' inserite nel preventivo. Aggiungi i serramenti
          e torna in questa scheda: i m² li calcola da solo e tu metti solo il prezzo al m².
        </p>
      </div>
    );
  }

  return (
    <div className="bg-orange-50/30 p-5 rounded-xl border border-orange-100 space-y-4">
      <div>
        <h3 className="font-bold text-gray-900">Tapparelle al m² su tutto il preventivo</h3>
        <p className="text-xs text-gray-600 mt-0.5">
          Ogni serramento conta <b>larghezza × (altezza + {AVVOLGIMENTO_MM / 10} cm)</b>, con il minimo
          fatturabile in base alle ante. Togli la spunta a quelli che non hanno la tapparella.
        </p>
      </div>

      <div className="rounded-xl border border-orange-100 bg-white overflow-hidden">
        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
          {righe.map((r) => {
            const dentro = !escluse.includes(r.chiave);
            return (
              <label
                key={r.chiave}
                className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer ${dentro ? '' : 'opacity-45'}`}
              >
                <input type="checkbox" checked={dentro} onChange={(e) => cambia(r.chiave, e.target.checked)} />
                <span className="font-bold text-gray-400 w-6 shrink-0">{r.id}</span>
                <span className="font-semibold text-gray-800 w-32 shrink-0 tabular-nums">
                  {r.width} × {r.height}
                </span>
                <span className="text-gray-500 w-16 shrink-0">{r.numAnte} {r.numAnte === 1 ? 'anta' : 'ante'}</span>
                <span className="text-gray-500 w-10 shrink-0">× {r.quantita}</span>
                <span className="flex-1 min-w-0 flex justify-end pr-3">
                  {r.calcolo.applicatoMinimo && (
                    <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                      minimo {n2(r.calcolo.minimo)} m²
                    </span>
                  )}
                </span>
                <span className="font-bold text-gray-900 tabular-nums w-20 text-right shrink-0">{n2(r.mq)} m²</span>
              </label>
            );
          })}
        </div>
        <div className="flex items-center justify-between bg-orange-100/60 px-3 py-2.5 border-t border-orange-200">
          <span className="font-bold text-orange-900 text-sm">
            {totale.serramenti} {totale.serramenti === 1 ? 'tapparella' : 'tapparelle'}
          </span>
          <span className="font-bold text-orange-900 text-lg tabular-nums">{n2(totale.mq)} m²</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <Label className="font-semibold text-gray-700">Descrizione</Label>
          <Input
            type="text"
            value={newItem.tapparelleDescrizione ?? ''}
            onChange={(e) => updateItemField('tapparelleDescrizione', e.target.value)}
            className="mt-1.5 h-11 rounded-xl"
            placeholder="Es. Tapparelle in PVC"
          />
        </div>
        {!isCustomerMode && (
          <div>
            <Label className="font-semibold text-gray-700">Prezzo al m² (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={newItem.unitPrice ?? ''}
              onChange={(e) => updateItemField('unitPrice', e.target.value.replace(/^0+(?=\d)/, ''))}
              className="mt-1.5 h-11 rounded-xl font-bold text-orange-700 bg-orange-50"
            />
          </div>
        )}
      </div>

      {prezzo > 0 && totale.mq > 0 && (
        <p className="text-sm text-orange-900 bg-white border border-orange-100 rounded-lg px-3 py-2">
          {n2(totale.mq)} m² × {n2(prezzo)} € = <b>{n2(totale.mq * prezzo)} €</b>
          <span className="block text-xs text-orange-700/80">
            Motore, guide e cassonetto restano voci separate: aggiungile da &quot;Voce Libera&quot;.
          </span>
        </p>
      )}
    </div>
  );
}
