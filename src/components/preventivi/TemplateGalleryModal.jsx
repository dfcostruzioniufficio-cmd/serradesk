import React from 'react';
import { X } from 'lucide-react';
import WindowPreview from '../WindowPreview'; // Riusiamo l'anteprima per generare le icone!

const templates = [
  // FINESTRE (H: 1400)
  {
    category: 'Finestre',
    id: 'f_1anta', name: 'Finestra 1 Anta',
    props: { numAnte: 1, apertura: 'Battente', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 800, height: 1400 }
  },
  {
    category: 'Finestre',
    id: 'f_2ante', name: 'Finestra 2 Ante',
    props: { numAnte: 2, apertura: 'Battente', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 1200, height: 1400 }
  },
  {
    category: 'Finestre',
    id: 'f_3ante', name: 'Finestra 3 Ante',
    props: { numAnte: 3, apertura: 'Battente', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 1800, height: 1400 }
  },
  {
    category: 'Finestre',
    id: 'f_scorrevole', name: 'Scorrevole 2 Ante',
    props: { numAnte: 2, apertura: 'Scorrevole', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 2000, height: 1400 }
  },

  // PORTEFINESTRE (H: 2200)
  {
    category: 'Portefinestre (Balconi)',
    id: 'pf_1anta', name: 'Portafinestra 1 Anta',
    props: { numAnte: 1, apertura: 'Battente', hasTraverso: true, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 800, height: 2200, traversoHeight: 1000 }
  },
  {
    category: 'Portefinestre (Balconi)',
    id: 'pf_2ante', name: 'Portafinestra 2 Ante',
    props: { numAnte: 2, apertura: 'Battente', hasTraverso: true, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 1200, height: 2200, traversoHeight: 1000 }
  },
  {
    category: 'Portefinestre (Balconi)',
    id: 'pf_3ante', name: 'Portafinestra 3 Ante',
    props: { numAnte: 3, apertura: 'Battente', hasTraverso: true, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 1800, height: 2200, traversoHeight: 1000 }
  },
  {
    category: 'Portefinestre (Balconi)',
    id: 'pf_scorrevole', name: 'Scorrevole Grande',
    props: { numAnte: 2, apertura: 'Scorrevole', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 2400, height: 2200 }
  },

  // SPECIALI / CON SOPRALUCE
  {
    category: 'Speciali / Sopraluce',
    id: 'sp_1anta_sopraluce', name: '1 Anta + Sopraluce',
    props: { numAnte: 1, apertura: 'Battente', hasTraverso: false, hasSopraluce: true, anteAsimmetriche: false, antaRibalta: false, width: 800, height: 2600, sopraluceHeight: 500 }
  },
  {
    category: 'Speciali / Sopraluce',
    id: 'sp_2ante_sopraluce', name: '2 Ante + Sopraluce',
    props: { numAnte: 2, apertura: 'Battente', hasTraverso: false, hasSopraluce: true, anteAsimmetriche: false, antaRibalta: false, width: 1200, height: 2600, sopraluceHeight: 500 }
  },
  {
    category: 'Speciali / Sopraluce',
    id: 'fisso', name: 'Vetrata Fissa',
    props: { numAnte: 1, apertura: 'Fisso', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 1000, height: 1000 }
  },

  // PERSIANE / SCURI
  {
    category: 'Persiane / Scuri',
    id: 'per_1anta', name: 'Persiana 1 Anta',
    props: { numAnte: 1, apertura: 'Persiana', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 800, height: 1400 }
  },
  {
    category: 'Persiane / Scuri',
    id: 'per_2ante', name: 'Persiana 2 Ante',
    props: { numAnte: 2, apertura: 'Persiana', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 1200, height: 1400 }
  },
  {
    category: 'Persiane / Scuri',
    id: 'per_3ante', name: 'Persiana 3 Ante',
    props: { numAnte: 3, apertura: 'Persiana', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 1800, height: 1400 }
  },
  {
    category: 'Persiane / Scuri',
    id: 'per_4ante', name: 'Persiana 4 Ante',
    props: { numAnte: 4, apertura: 'Persiana', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 2400, height: 1400 }
  },

  // PORTE BLINDATE
  {
    category: 'Porte Blindate',
    id: 'pb_1anta', name: 'Porta Blindata',
    props: { numAnte: 1, apertura: 'Porta Blindata', hasTraverso: false, hasSopraluce: false, anteAsimmetriche: false, antaRibalta: false, width: 900, height: 2100 }
  }
];

export default function TemplateGalleryModal({ onSelectTemplate, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm overflow-y-auto p-4 sm:p-6" style={{ overscrollBehavior: 'contain' }}>
      <div className="bg-gray-50 rounded-2xl shadow-xl w-full max-w-4xl mx-auto my-auto flex flex-col relative" style={{ minHeight: 'min-content' }}>
        
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur-md border-b border-gray-100 rounded-t-2xl shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
              <span className="text-xl">📐</span> Libreria Modelli
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Clicca su una tipologia per auto-compilare i campi.</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-gray-100 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Griglia Modelli (Niente overflow qui, cresce in altezza) */}
        <div className="p-6">
          {Object.entries(
            templates.reduce((acc, tpl) => {
              if (!acc[tpl.category]) acc[tpl.category] = [];
              acc[tpl.category].push(tpl);
              return acc;
            }, {})
          ).map(([category, tpls]) => (
            <div key={category} className="mb-8 last:mb-0">
              <h3 className="text-sm font-bold text-gray-700 mb-3 pb-1.5 border-b border-purple-100 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-400 rounded-full"></span>
                {category}
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {tpls.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => onSelectTemplate(tpl.props)}
                    className="group flex flex-col items-center bg-white border border-gray-100 hover:border-purple-400 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    {/* Visual Preview */}
                    <div className="w-16 h-24 relative flex items-center justify-center mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="transform scale-[0.4] origin-center">
                        <WindowPreview 
                          {...tpl.props} 
                          width={tpl.props.width || 1000} 
                          height={tpl.props.height || 1400} 
                          frameColor="#e2e8f0" 
                          accessoriColore="Argento" 
                          traversoHeight={tpl.props.traversoHeight || 1000}
                          sopraluceHeight={tpl.props.sopraluceHeight || 400}
                        />
                      </div>
                    </div>
                    
                    <h3 className="text-[11px] font-bold text-gray-600 text-center group-hover:text-purple-700 transition-colors leading-tight">
                      {tpl.name}
                    </h3>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100 flex justify-end shrink-0 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
            Annulla
          </button>
        </div>

      </div>
    </div>
  );
}
