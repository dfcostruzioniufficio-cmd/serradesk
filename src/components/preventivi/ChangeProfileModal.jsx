import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, CopyPlus } from 'lucide-react';
import { ALTEZZA_BALCONE_MM } from '../../hooks/usePreventivo';

/**
 * Variante globale: profilo, vetri e colore su tutto il preventivo.
 * Ogni voce e' facoltativa, si cambia solo quello che si sceglie. Il vetro
 * va in due: uno per le finestre e uno per i balconi (da 2 m in su), come
 * nella sezione "Uguale per tutto il preventivo" del modulo.
 */
export default function ChangeProfileModal({ isOpen, onClose, sistemiCam, onApply }) {
  const [sistemaId, setSistemaId] = useState('');
  const [vetroFinestreId, setVetroFinestreId] = useState('');
  const [vetroBalconiId, setVetroBalconiId] = useState('');
  const [colore, setColore] = useState('');

  if (!isOpen) return null;

  // Stessa scelta dei menu dell'articolo: solo quelli tenuti nel preventivo.
  const profili = sistemiCam.filter(s => (s.tipologia === 'BATTENTE' || s.tipologia === 'SCORREVOLE') && s.specs?.nel_preventivo !== false);
  const vetri = sistemiCam.filter(s => s.tipologia === 'VETRO' && s.specs?.nel_preventivo !== false);
  const nome = (id) => sistemiCam.find(s => s.id === id)?.nome;

  const scelte = [
    sistemaId && `profilo: ${nome(sistemaId)}`,
    vetroFinestreId && `vetro finestre: ${nome(vetroFinestreId)}`,
    vetroBalconiId && `vetro balconi: ${nome(vetroBalconiId)}`,
    colore.trim() && `colore: ${colore.trim()}`,
  ].filter(Boolean);

  const chiudi = () => {
    setSistemaId(''); setVetroFinestreId(''); setVetroBalconiId(''); setColore('');
    onClose();
  };

  const handleApply = () => {
    if (!scelte.length) {
      toast.error('Scegli almeno una cosa da cambiare.');
      return;
    }
    if (!window.confirm(`Cambio su tutti i serramenti del preventivo:\n\n- ${scelte.join('\n- ')}\n\nI prezzi si ricalcolano. Vuoi procedere?`)) return;
    const n = onApply({ sistemaId, vetroFinestreId, vetroBalconiId, colore });
    toast.success(n ? `Variante applicata a ${n} ${n === 1 ? 'serramento' : 'serramenti'}.` : 'Nessun serramento da cambiare nel preventivo.');
    chiudi();
  };

  const classeSelect = 'w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CopyPlus className="text-blue-500" />
            Variante globale
          </h2>
          <button onClick={chiudi} aria-label="Chiudi" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-gray-50/50 overflow-y-auto">
          <p className="text-sm text-gray-600">
            Cambia su <strong>tutti</strong> i serramenti del preventivo solo quello che scegli qui sotto; il resto rimane com'è.
            Per tenere anche la versione di prima, usa prima "Clona ordine".
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Profilo</label>
            <select className={classeSelect} value={sistemaId} onChange={(e) => setSistemaId(e.target.value)}>
              <option value="">-- Lascia com'è --</option>
              {profili.map(p => (
                <option key={p.id} value={p.id}>{p.nome}{p.marca ? ` - ${p.marca}` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vetro delle finestre</label>
            <select className={classeSelect} value={vetroFinestreId} onChange={(e) => setVetroFinestreId(e.target.value)}>
              <option value="">-- Lascia com'è --</option>
              {vetri.map(v => <option key={v.id} value={v.id}>{v.nome} (+{v.base_price}€/mq)</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Vetro dei balconi <span className="font-normal text-gray-500">(da {ALTEZZA_BALCONE_MM / 1000} m di altezza in su)</span>
            </label>
            <select className={classeSelect} value={vetroBalconiId} onChange={(e) => setVetroBalconiId(e.target.value)}>
              <option value="">{vetroFinestreId ? '-- Uguale a quello delle finestre --' : "-- Lascia com'è --"}</option>
              {vetri.map(v => <option key={v.id} value={v.id}>{v.nome} (+{v.base_price}€/mq)</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Colore</label>
            <input
              type="text"
              value={colore}
              onChange={(e) => setColore(e.target.value)}
              placeholder="Es. RAL 7016, Grigio Raffaello, Noce..."
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            />
            <p className="mt-1.5 text-xs text-gray-500">Lascia vuoto per non cambiarlo.</p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100 bg-white">
          <button onClick={chiudi} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            Annulla
          </button>
          <button onClick={handleApply} className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            Applica variante
          </button>
        </div>
      </div>
    </div>
  );
}
