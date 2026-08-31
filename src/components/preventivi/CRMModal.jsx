import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Save, Database, X } from 'lucide-react';

export default function CRMModal({
  isOpen,
  onClose,
  clientName,
  clientData,
  setClientName,
  setClientData,
  savedClients,
  onSaveClient,
  onSelectClient,
  onDeleteClient
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <h3 className="font-bold text-xl text-blue-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Rubrica Clienti
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 hover:bg-red-50 font-bold p-1 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-8">
          
          {/* Colonna Sinistra: Lista Clienti */}
          <div className="flex-1 md:border-r border-b md:border-b-0 pb-6 md:pb-0 md:pr-6">
            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">I Tuoi Clienti Salvati</h4>
            {savedClients.length === 0 ? (
              <p className="text-gray-500 text-sm italic bg-gray-50 p-4 rounded-lg text-center border">La tua rubrica è vuota.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {savedClients.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border p-3 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer" onClick={() => onSelectClient(c)}>
                    <div className="flex-1">
                      <p className="font-bold text-blue-800 text-sm">{c.name}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{c.vat ? `P.IVA: ${c.vat}` : 'Nessuna P.IVA'} {c.phone && `• Tel: ${c.phone}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-semibold bg-blue-50 px-2 py-1 rounded">Seleziona</span>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteClient(c.name); }} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-md transition-colors" title="Elimina Cliente">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colonna Destra: Modifica / Salva */}
          <div className="flex-1">
            <h4 className="font-bold text-gray-700 mb-2 border-b pb-2">Salva Nuovo Cliente</h4>
            <p className="text-xs text-gray-500 mb-5">I dati inseriti attualmente nel preventivo verranno salvati in rubrica per i prossimi utilizzi.</p>
            
            <div className="space-y-4">
              <div>
                 <Label className="text-xs text-gray-600 font-bold">Nome Azienda / Cliente</Label>
                 <Input value={clientName} placeholder="Inserisci prima il nome nel preventivo..." readOnly={!clientName} className={!clientName ? 'bg-gray-100' : 'font-bold text-blue-800 border-blue-200'} onChange={e => setClientName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <Label className="text-xs text-gray-600">P.IVA / C.F.</Label>
                   <Input placeholder="Es. 0123456789" value={clientData.vat} onChange={e => setClientData({...clientData, vat: e.target.value})} />
                </div>
                <div>
                   <Label className="text-xs text-gray-600">Telefono</Label>
                   <Input placeholder="+39 333..." value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} />
                </div>
              </div>
              <div>
                 <Label className="text-xs text-gray-600">Indirizzo completo</Label>
                 <Input placeholder="Es. Via Roma 1, Milano (MI)" value={clientData.address} onChange={e => setClientData({...clientData, address: e.target.value})} />
              </div>
              <div>
                 <Label className="text-xs text-gray-600">Email</Label>
                 <Input placeholder="cliente@email.com" value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} />
              </div>
              <Button onClick={onSaveClient} disabled={!clientName.trim()} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 shadow-md py-6 text-base">
                 <Save className="w-5 h-5 mr-2" /> {savedClients.find(c => c.name === clientName) ? 'Aggiorna Cliente' : 'Salva in Rubrica'}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
