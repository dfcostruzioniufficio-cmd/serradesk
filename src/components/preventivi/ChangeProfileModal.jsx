import React, { useState } from 'react';
import { X, CopyPlus } from 'lucide-react';

export default function ChangeProfileModal({ isOpen, onClose, sistemiCam, onApply }) {
  const [selectedProfile, setSelectedProfile] = useState('');

  if (!isOpen) return null;

  const profili = sistemiCam.filter(s => s.tipologia === 'BATTENTE' || s.tipologia === 'SCORREVOLE');

  const handleApply = () => {
    if (selectedProfile) {
      if (window.confirm('Sei sicuro? Questo sostituirà il profilo di tutti gli infissi nel preventivo attuale ricalcolando i prezzi. (Vetri e accessori verranno mantenuti ove possibile).')) {
        onApply(selectedProfile);
        onClose();
      }
    } else {
      alert('Seleziona un profilo prima di procedere.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CopyPlus className="text-blue-500" />
            Variante Globale Materiale
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-gray-50/50">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Seleziona un nuovo profilo (materiale). Verrà applicato automaticamente a <strong>tutti</strong> gli infissi del preventivo corrente.
            </p>

            <label className="block text-sm font-semibold text-gray-700 mb-2">Nuovo Profilo / Sistema</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
            >
              <option value="">-- Seleziona il nuovo materiale --</option>
              {profili.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} - {p.marca} ({p.specs?.materiale || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedProfile}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Applica Variante
          </button>
        </div>
      </div>
    </div>
  );
}
