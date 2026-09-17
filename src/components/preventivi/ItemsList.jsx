import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings2, Trash2 } from 'lucide-react';
import { righeTapparelle, totaleTapparelle } from '../../utils/tapparella';

export default function ItemsList({
  items,
  onEdit,
  onRemove,
  editingIndex,
  isCustomerMode
}) {
  const righe = React.useMemo(() => righeTapparelle(items), [items]);

  // I m² delle tapparelle sono una fotografia del preventivo al momento in cui
  // sono state inserite: se dopo si aggiunge o si toglie un serramento, quella
  // riga resta indietro. Non la cambiamo da soli (i prezzi gia' mandati non si
  // toccano), ma va detto, se no il cliente paga per una finestra che non c'e'.
  const tapparelleDaRifare = (item) => {
    if (item.rawInput?.itemType !== 'tapparelle') return null;
    const attuali = totaleTapparelle(righe, item.rawInput.tapparelleEscluse).mq;
    return Math.abs(attuali - (Number(item.quantity) || 0)) > 0.005 ? attuali : null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Lista Articoli ({items.length})</h2>
      
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Nessun articolo aggiunto. Inizia configurando un serramento.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const isEditing = index === editingIndex;
            return (
              <div 
                key={index} 
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-xl transition-all ${isEditing ? 'border-l-4 border-l-primary bg-blue-50/50 shadow-sm' : 'hover:shadow-sm hover:border-blue-100'}`}
              >
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold shrink-0 ${isEditing ? 'bg-primary text-white' : 'bg-blue-100 text-blue-800'}`}>
                    {item.id}
                  </div>
                  <div>
                    {item.type === 'custom' ? (
                      <>
                        <p className="font-bold text-gray-800 line-clamp-1">{item.titolo || item.customDescription || 'Voce Libera'}</p>
                        <p className="text-sm text-gray-500">
                          {item.titolo ? item.customDescription : `Voce Libera | Qtà: ${Number(item.quantity).toLocaleString('it-IT', { maximumFractionDigits: 2 })}${item.unita ? ` ${item.unita}` : ''}`}
                        </p>
                        {(() => {
                          const attuali = tapparelleDaRifare(item);
                          return attuali === null ? null : (
                            <button
                              type="button"
                              onClick={() => onEdit(index)}
                              className="mt-1 text-xs font-semibold text-orange-800 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1 text-left hover:bg-orange-100"
                            >
                              Il preventivo è cambiato: ora sarebbero {attuali.toFixed(2).replace('.', ',')} m². Apri e risalva per aggiornare.
                            </button>
                          );
                        })()}
                      </>
                    ) : item.type === 'complemento' ? (
                      <>
                        <p className="font-bold text-gray-800">{item.model}</p>
                        <p className="text-sm text-gray-500">
                          {item.description2} | Qtà: {item.quantity}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-gray-800">{item.model}</p>
                        <p className="text-sm text-gray-500">
                          {item.width} x {item.height} mm | Qtà: {item.quantity}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 ml-14 md:ml-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Totale</p>
                    <p className="font-bold text-lg text-gray-900">
                      €{new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-blue-600 hover:bg-blue-100 hover:text-blue-800" 
                      onClick={() => onEdit(index)}
                    >
                      <Settings2 size={20} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:bg-red-50 hover:text-red-700" 
                      onClick={() => {
                        if (window.confirm("Sei sicuro di voler eliminare questo articolo?")) {
                          onRemove(index);
                        }
                      }}
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
