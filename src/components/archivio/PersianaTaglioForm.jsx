import React, { useMemo, useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { calcolaPersiana, datiMancantiPersiana } from '../../utils/persianaEngine';

/**
 * Dati di taglio di una persiana o di uno scurone, nell'Archivio Sistemi.
 *
 * Ogni campo e' una quota della distinta del produttore scritta come
 * "misura meno X". In fondo c'e' una prova di calcolo: si mettono le misure
 * di una persiana vera e si confrontano i pezzi con quelli che si tagliano
 * in officina, prima di usare il sistema in un preventivo.
 */
export default function PersianaTaglioForm({ value, onChange }) {
  const p = value || {};
  const [prova, setProva] = useState({ width: 1200, height: 1400, numAnte: 2, hasTraverso: false });

  // Aggiorna un campo annidato, es. imposta(['anta', 'codice'], 'X').
  const imposta = (percorso, valore) => {
    const copia = JSON.parse(JSON.stringify(p));
    let nodo = copia;
    percorso.slice(0, -1).forEach((k) => { nodo[k] = nodo[k] || {}; nodo = nodo[k]; });
    nodo[percorso[percorso.length - 1]] = valore;
    onChange(copia);
  };
  const leggi = (percorso) => percorso.reduce((o, k) => (o ? o[k] : undefined), p);
  // I numeri restano stringa vuota finche' non si scrivono: una quota non
  // inserita non deve diventare zero, altrimenti il calcolo partirebbe con
  // misure credibili ma sbagliate.
  const numeroDa = (e) => (e.target.value === '' ? '' : Number(e.target.value));

  // Funzioni che restituiscono l'input, non componenti: un componente
  // dichiarato dentro il render viene ricreato a ogni battuta e il campo
  // perde il cursore dopo ogni carattere.
  const testo = (percorso, placeholder) => (
    <Input className="h-8 text-xs" value={leggi(percorso) ?? ''} placeholder={placeholder}
           onChange={(e) => imposta(percorso, e.target.value)} />
  );
  const numeroCampo = (percorso) => (
    <Input type="number" className="h-8 text-xs" value={leggi(percorso) ?? ''}
           onChange={(e) => imposta(percorso, numeroDa(e))} />
  );

  const doghe = p.riempimento?.tipo === 'doghe';
  const mancano = datiMancantiPersiana(p);
  const risultato = useMemo(() => {
    if (mancano.length) return null;
    return calcolaPersiana({ ...prova, apertura: 'Persiana' }, { specs: { persiana: p } });
  }, [p, prova, mancano.length]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-600 bg-orange-50 border border-orange-200 rounded-lg p-3">
        Copia le quote dalla distinta di taglio del produttore. <b>L</b> e <b>H</b> sono la larghezza e l&#39;altezza
        che inserisci nel preventivo. Ogni quota si toglie dalla misura: se il catalogo scrive <b>L+28</b>, inserisci <b>-28</b>.
      </p>

      <Blocco titolo="Telaio" colore="#1e3a5f"
              nota="Lascia vuoto il codice se la persiana si monta senza telaio, direttamente sui cardini a muro.">
        <Campo etichetta="Codice profilo">{testo(['telaio', 'codice'], 'es. 800427')}</Campo>
        <Campo etichetta="Descrizione">{testo(['telaio', 'descrizione'])}</Campo>
        <Campo etichetta="Traversa superiore: L meno (mm)">{numeroCampo(['telaio', 'detrazione_larghezza_mm'])}</Campo>
        <Campo etichetta="Montanti: H meno (mm)">{numeroCampo(['telaio', 'detrazione_altezza_mm'])}</Campo>
        <div className="col-span-2 flex items-center gap-2 pt-1">
          <input id="pers-inf" type="checkbox" checked={!!p.telaio?.inferiore?.presente}
                 onChange={(e) => imposta(['telaio', 'inferiore', 'presente'], e.target.checked)} />
          <Label htmlFor="pers-inf" className="text-xs">Telaio su 4 lati (con traversa inferiore)</Label>
        </div>
        {p.telaio?.inferiore?.presente && (
          <>
            <Campo etichetta="Codice traversa inferiore" suggerimento="Vuoto = stesso profilo del telaio">
              {testo(['telaio', 'inferiore', 'codice'])}
            </Campo>
            <Campo etichetta="Traversa inferiore: L meno (mm)">{numeroCampo(['telaio', 'inferiore', 'detrazione_mm'])}</Campo>
          </>
        )}
      </Blocco>

      <Blocco titolo="Anta" colore="#7b2d8b" nota="Obbligatorio. Montanti e traverse dell'anta.">
        <Campo etichetta="Codice profilo anta">{testo(['anta', 'codice'], 'es. 900672')}</Campo>
        <Campo etichetta="Descrizione">{testo(['anta', 'descrizione'])}</Campo>
        <Campo etichetta="Larghezza anta: L meno (mm)" suggerimento="Per 2 o piu' ante il resto si divide in parti uguali">
          {numeroCampo(['anta', 'detrazione_larghezza_mm'])}
        </Campo>
        <Campo etichetta="Altezza anta: H meno (mm)">{numeroCampo(['anta', 'detrazione_altezza_mm'])}</Campo>
        <Campo etichetta="Nodo fra le ante (mm)" suggerimento="Quanto si toglie in piu' per ogni anta oltre la prima">
          {numeroCampo(['anta', 'detrazione_nodo_mm'])}
        </Campo>
        <Campo etichetta="Codice traverse anta (fasce)" suggerimento="Vuoto = stesso profilo dell'anta">
          {testo(['anta', 'traverse', 'codice'], 'es. 800473')}
        </Campo>
        <Campo etichetta="Traverse anta: larghezza anta meno (mm)">{numeroCampo(['anta', 'traverse', 'detrazione_mm'])}</Campo>
      </Blocco>

      <Blocco titolo={doghe ? 'Doghe' : 'Lamelle'} colore="#d97706" nota="Obbligatorio. Il numero si calcola dal passo, arrotondando per difetto.">
        <Campo etichetta="Tipo">
          <select className="w-full h-8 border rounded-md px-2 text-xs" value={p.riempimento?.tipo || 'lamelle'}
                  onChange={(e) => imposta(['riempimento', 'tipo'], e.target.value)}>
            <option value="lamelle">Lamelle orizzontali (persiana)</option>
            <option value="doghe">Doghe verticali (scurone)</option>
          </select>
        </Campo>
        <Campo etichetta="Codice profilo">{testo(['riempimento', 'codice'], 'es. Universal 55')}</Campo>
        <Campo etichetta="Descrizione">{testo(['riempimento', 'descrizione'])}</Campo>
        <Campo etichetta="Passo (mm)" suggerimento={doghe ? 'Larghezza occupata da ogni doga' : 'Distanza fra una lamella e la successiva'}>
          {numeroCampo(['riempimento', 'passo_mm'])}
        </Campo>
        <Campo etichetta={doghe ? 'Taglio doga: altezza anta meno (mm)' : 'Taglio lamella: larghezza anta meno (mm)'}>
          {numeroCampo(['riempimento', 'detrazione_mm'])}
        </Campo>
        <Campo etichetta="Spazio da togliere prima di contare (mm)"
               suggerimento={doghe ? 'Quantita = (larghezza anta - questo) / passo' : 'Fasce sopra e sotto. Quantita = (altezza anta - questo) / passo'}>
          {numeroCampo(['riempimento', 'detrazione_conteggio_mm'])}
        </Campo>
      </Blocco>

      <Blocco titolo="Altri profili (facoltativi)" colore="#475569" nota="Compila solo quelli che la tua serie prevede.">
        <Campo etichetta="Riporto centrale: codice">{testo(['riporto', 'codice'], 'es. 900250')}</Campo>
        <Campo etichetta="Riporto: altezza anta meno (mm)">{numeroCampo(['riporto', 'detrazione_mm'])}</Campo>
        <Campo etichetta="Compensatore: codice">{testo(['compensatore', 'codice'], 'es. 800476')}</Campo>
        <Campo etichetta="Compensatore: altezza anta meno (mm)">{numeroCampo(['compensatore', 'detrazione_mm'])}</Campo>
        <Campo etichetta="Compensatori per anta">{numeroCampo(['compensatore', 'per_anta'])}</Campo>
        <div />
        <Campo etichetta="Asta di comando: codice" suggerimento="Per lamelle orientabili">{testo(['asta', 'codice'])}</Campo>
        <Campo etichetta="Asta: altezza anta meno (mm)">{numeroCampo(['asta', 'detrazione_mm'])}</Campo>
        <Campo etichetta="Aste per anta">{numeroCampo(['asta', 'per_anta'])}</Campo>
        <div />
        <Campo etichetta="Traverso centrale: codice" suggerimento="Usato quando nel preventivo attivi il traverso">
          {testo(['traverso', 'codice'])}
        </Campo>
        <Campo etichetta="Traverso: larghezza anta meno (mm)">{numeroCampo(['traverso', 'detrazione_mm'])}</Campo>
        <Campo etichetta="Traverso: ingombro in altezza (mm)" suggerimento="Spazio tolto alle lamelle">
          {numeroCampo(['traverso', 'ingombro_mm'])}
        </Campo>
      </Blocco>

      <div className="border-2 border-emerald-600 rounded-xl p-3 bg-emerald-50/40 space-y-2">
        <p className="text-sm font-bold text-emerald-800">Prova il calcolo</p>
        <p className="text-xs text-gray-600">Metti le misure di una persiana che hai gia' fatto e confronta i pezzi con quelli tagliati.</p>
        <div className="grid grid-cols-4 gap-2">
          <Campo etichetta="L (mm)"><Input type="number" className="h-8 text-xs" value={prova.width} onChange={(e) => setProva({ ...prova, width: Number(e.target.value) })} /></Campo>
          <Campo etichetta="H (mm)"><Input type="number" className="h-8 text-xs" value={prova.height} onChange={(e) => setProva({ ...prova, height: Number(e.target.value) })} /></Campo>
          <Campo etichetta="Ante"><Input type="number" min="1" className="h-8 text-xs" value={prova.numAnte} onChange={(e) => setProva({ ...prova, numAnte: Number(e.target.value) || 1 })} /></Campo>
          <div className="flex items-end gap-1 pb-1.5">
            <input id="prova-trv" type="checkbox" checked={prova.hasTraverso} onChange={(e) => setProva({ ...prova, hasTraverso: e.target.checked })} />
            <Label htmlFor="prova-trv" className="text-xs">Traverso</Label>
          </div>
        </div>
        {mancano.length > 0 ? (
          <p className="text-xs text-amber-800">Per calcolare manca: {mancano.join(', ')}.</p>
        ) : risultato && (
          <div className="text-xs space-y-1">
            {risultato.sash && (
              <p>Anta finita <b>{risultato.sash.width} × {risultato.sash.height}</b>
                {risultato.dettaglio && <> · <b>{risultato.dettaglio.perAnta}</b> {risultato.dettaglio.tipo} per anta da <b>{risultato.dettaglio.lunghezza}</b> mm</>}
              </p>
            )}
            {risultato.avvisi.map((a) => <p key={a} className="text-red-700">{a}</p>)}
            <table className="w-full border-collapse">
              <tbody>
                {riepilogo(risultato.pezzi).map((r) => (
                  <tr key={r.chiave} className="border-b border-emerald-100">
                    <td className="py-0.5 font-mono">{r.profilo}</td>
                    <td className="py-0.5 text-right font-mono font-bold">{r.mm} mm</td>
                    <td className="py-0.5 text-right">× {r.quanti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Raggruppa i pezzi della prova per profilo e misura.
function riepilogo(pezzi) {
  const m = new Map();
  pezzi.forEach((pz) => {
    const chiave = `${pz.profile}@${pz.mm}`;
    const r = m.get(chiave) || { chiave, profilo: pz.profile, mm: pz.mm, quanti: 0 };
    r.quanti += Number(pz.n) || 1;
    m.set(chiave, r);
  });
  return [...m.values()].sort((a, b) => a.profilo.localeCompare(b.profilo) || b.mm - a.mm);
}

function Blocco({ titolo, colore, nota, children }) {
  return (
    <div className="border-2 rounded-xl overflow-hidden" style={{ borderColor: colore }}>
      <div className="px-4 py-2 font-bold text-white text-sm" style={{ background: colore }}>{titolo}</div>
      <div className="p-3 bg-white">
        {nota && <p className="text-xs text-gray-500 mb-2 italic">{nota}</p>}
        <div className="grid grid-cols-2 gap-2">{children}</div>
      </div>
    </div>
  );
}

function Campo({ etichetta, suggerimento, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-700">{etichetta}</Label>
      {suggerimento && <p className="text-[10px] text-gray-400 leading-tight">{suggerimento}</p>}
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
