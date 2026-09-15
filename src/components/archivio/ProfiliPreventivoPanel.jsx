import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';

/**
 * Sceglie quali profili compaiono nel menu "Sistema / Profilo" del
 * preventivo. L'archivio parte con una trentina di profili di mercato: chi
 * lavora quasi solo una marca non deve scorrerli tutti ogni volta.
 *
 * Il profilo nascosto resta in archivio con i suoi dati e i preventivi gia'
 * fatti non cambiano: e' solo tolto dal menu. Il valore sta in
 * specs.nel_preventivo (assente = visibile, cosi' nessun account esistente
 * perde profili dal menu senza averlo chiesto).
 */
export const visibileNelPreventivo = (s) => s?.specs?.nel_preventivo !== false;

export default function ProfiliPreventivoPanel({ sistemi, onSalvato, onChiudi }) {
  const profili = useMemo(() => sistemi.filter((s) => s.tipologia !== 'VETRO'), [sistemi]);
  const [scelti, setScelti] = useState(() => new Set(profili.filter(visibileNelPreventivo).map((s) => s.id)));
  const [salvataggio, setSalvataggio] = useState(false);

  const perMarca = useMemo(() => {
    const m = new Map();
    profili.forEach((s) => {
      const marca = (s.marca || 'Senza marca').trim();
      if (!m.has(marca)) m.set(marca, []);
      m.get(marca).push(s);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [profili]);

  const cambia = (ids, attivo) => setScelti((prima) => {
    const nuovi = new Set(prima);
    ids.forEach((id) => (attivo ? nuovi.add(id) : nuovi.delete(id)));
    return nuovi;
  });
  const soloMarca = (marca) => setScelti(new Set(profili.filter((s) => (s.marca || 'Senza marca').trim() === marca).map((s) => s.id)));

  const salva = async () => {
    const daAggiornare = profili.filter((s) => visibileNelPreventivo(s) !== scelti.has(s.id));
    if (!daAggiornare.length) { onChiudi(); return; }
    setSalvataggio(true);
    const aggiornati = [];
    for (const s of daAggiornare) {
      const specs = { ...(s.specs || {}), nel_preventivo: scelti.has(s.id) };
      const { error } = await supabase.from('sistemi_cam').update({ specs }).eq('id', s.id);
      if (error) {
        console.error('Errore aggiornamento profilo', s.id, error);
        toast.error(`Non sono riuscito a salvare "${s.nome}". Riprova.`);
        break;
      }
      aggiornati.push({ ...s, specs });
    }
    setSalvataggio(false);
    if (aggiornati.length) {
      onSalvato(aggiornati);
      if (aggiornati.length === daAggiornare.length) {
        toast.success(`Menu del preventivo aggiornato: ${scelti.size} profili visibili.`);
        onChiudi();
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm p-4 mb-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">Profili nel preventivo</h3>
          <p className="text-xs text-gray-500">
            Spunta quelli che usi: solo questi compariranno nella scelta del profilo.
            Gli altri restano in archivio e puoi rimetterli quando vuoi.
          </p>
        </div>
        <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 whitespace-nowrap">
          {scelti.size} di {profili.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => cambia(profili.map((s) => s.id), true)}>Tutti</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setScelti(new Set())}>Nessuno</Button>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y border rounded-xl">
        {perMarca.map(([marca, lista]) => {
          const tutti = lista.every((s) => scelti.has(s.id));
          return (
            <div key={marca} className="p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="flex items-center gap-2 font-semibold text-sm text-gray-800 cursor-pointer">
                  <input type="checkbox" checked={tutti} onChange={(e) => cambia(lista.map((s) => s.id), e.target.checked)} />
                  {marca} <span className="text-xs font-normal text-gray-400">({lista.length})</span>
                </label>
                <button type="button" onClick={() => soloMarca(marca)} className="text-xs text-blue-700 hover:underline">
                  Solo {marca}
                </button>
              </div>
              <div className="pl-6 grid sm:grid-cols-2 gap-1">
                {lista.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={scelti.has(s.id)} onChange={(e) => cambia([s.id], e.target.checked)} />
                    <span className="truncate">{s.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onChiudi} disabled={salvataggio}>Annulla</Button>
        <Button onClick={salva} disabled={salvataggio} className="bg-blue-700 hover:bg-blue-800">
          {salvataggio ? 'Salvataggio...' : 'Salva'}
        </Button>
      </div>
    </div>
  );
}
