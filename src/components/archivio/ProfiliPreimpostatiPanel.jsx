import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';
import { DEFAULT_PROFILES_DATA, gruppoPreimpostato, importaProfiliPreimpostati } from '../../lib/defaultProfiles';

const ORDINE_GRUPPI = [
  'Finestre in PVC', 'Finestre in alluminio', 'Vetri', 'Vetri di riferimento (senza prezzo)',
  'Persiane e scuri', 'Tapparelle', 'Cassonetti', 'Porte blindate', 'Altro',
];

/**
 * Sceglie quali profili preimpostati copiare nell'archivio. Un nuovo
 * iscritto parte con l'archivio vuoto e trova qui l'elenco: spunta le marche
 * e i prodotti che usa, e solo quelli entrano. Si puo' riaprire quando si
 * vuole per aggiungerne altri; quelli gia' in archivio sono segnati e non si
 * ricopiano.
 */
export default function ProfiliPreimpostatiPanel({ sistemi, onImportati, onChiudi, archivioVuoto = false }) {
  const presenti = useMemo(() => new Set((sistemi || []).map((s) => String(s.nome || '').trim().toLowerCase())), [sistemi]);
  const giaPresente = (p) => presenti.has(String(p.nome).trim().toLowerCase());
  const gruppi = useMemo(() => {
    const m = new Map();
    DEFAULT_PROFILES_DATA.forEach((p, i) => {
      const g = gruppoPreimpostato(p);
      if (!m.has(g)) m.set(g, []);
      m.get(g).push({ ...p, _k: i });
    });
    return ORDINE_GRUPPI.filter((g) => m.has(g)).map((g) => [g, m.get(g)]);
  }, []);
  const [scelti, setScelti] = useState(() => new Set());
  const [importando, setImportando] = useState(false);

  const cambia = (chiavi, attivo) => setScelti((prima) => {
    const nuovi = new Set(prima);
    chiavi.forEach((k) => (attivo ? nuovi.add(k) : nuovi.delete(k)));
    return nuovi;
  });

  const importa = async () => {
    const lista = DEFAULT_PROFILES_DATA.filter((_, i) => scelti.has(i));
    if (!lista.length) return;
    setImportando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const n = await importaProfiliPreimpostati(session?.user?.id, lista);
      toast.success(n ? `${n} ${n === 1 ? 'profilo aggiunto' : 'profili aggiunti'} all'archivio.` : 'Erano gia\' tutti nel tuo archivio.');
      setScelti(new Set());
      await onImportati?.();
      onChiudi?.();
    } catch (e) {
      console.error('Importazione profili preimpostati:', e);
      toast.error('Non sono riuscito ad aggiungere i profili. Riprova tra poco.');
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm p-4 mb-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">
            {archivioVuoto ? 'Il tuo archivio è vuoto: da dove partiamo?' : 'Aggiungi profili preimpostati'}
          </h3>
          <p className="text-xs text-gray-500">
            Spunta le marche e i prodotti che usi: solo questi entrano nel tuo archivio.
            I prezzi sono indicativi, poi li metti uguali al tuo listino.
            {archivioVuoto && ' Se preferisci, puoi anche saltare e inserire i tuoi profili dal modulo qui accanto.'}
          </p>
        </div>
        <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 whitespace-nowrap">
          {scelti.size} scelti
        </span>
      </div>

      <div className="max-h-[460px] overflow-y-auto divide-y border rounded-xl">
        {gruppi.map(([gruppo, lista]) => {
          const disponibili = lista.filter((p) => !giaPresente(p));
          const tutti = disponibili.length > 0 && disponibili.every((p) => scelti.has(p._k));
          return (
            <div key={gruppo} className="p-3">
              <label className="flex items-center gap-2 font-semibold text-sm text-gray-800 cursor-pointer mb-1.5">
                <input type="checkbox" disabled={!disponibili.length} checked={tutti} onChange={(e) => cambia(disponibili.map((p) => p._k), e.target.checked)} />
                {gruppo} <span className="text-xs font-normal text-gray-400">({lista.length})</span>
              </label>
              <div className="pl-6 grid sm:grid-cols-2 gap-1">
                {lista.map((p) => {
                  const gia = giaPresente(p);
                  return (
                    <label key={p._k} className={`flex items-center gap-2 text-xs ${gia ? 'text-gray-400' : 'text-gray-700 cursor-pointer'}`}>
                      <input type="checkbox" disabled={gia} checked={gia || scelti.has(p._k)} onChange={(e) => cambia([p._k], e.target.checked)} />
                      <span className="truncate">{p.nome}</span>
                      {gia
                        ? <span className="whitespace-nowrap">già in archivio</span>
                        : Number(p.base_price) > 0 && <span className="text-gray-400 whitespace-nowrap">{p.base_price} €/{p.calc_type}</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        {onChiudi && <Button variant="ghost" onClick={onChiudi} disabled={importando}>{archivioVuoto ? 'Salta' : 'Annulla'}</Button>}
        <Button onClick={importa} disabled={importando || scelti.size === 0} className="bg-blue-700 hover:bg-blue-800">
          {importando ? 'Aggiungo...' : `Aggiungi ${scelti.size || ''} all'archivio`.replace('  ', ' ')}
        </Button>
      </div>
    </div>
  );
}
