import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Save, Plus, Download, Lock, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function QuoteToolbar({
  clientName,
  editingOrderId,
  editingOrderStato,
  items,
  onSave,
  onClear,
  onCreateVariant,
  onExportPDF,
  onExportDistinta,
  canAccessCAM,
  isSaving,
  onChangeProfileGlobale
}) {
  const [showPdfMenu, setShowPdfMenu] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] p-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all">
      
      {/* Riepilogo Veloce a sinistra (visibile solo su schermi larghi) */}
      <div className="hidden sm:flex flex-col">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Stato Preventivo</span>
        <span className="text-sm font-bold text-slate-800">
          {items.length} Articol{items.length === 1 ? 'o' : 'i'} inseriti
        </span>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <Button
          variant="ghost"
          className="text-slate-500 hover:text-blue-600 hidden md:flex items-center gap-1 font-semibold"
          onClick={() => window.dispatchEvent(new CustomEvent('start-tour'))}
        >
          ❓ Guida
        </Button>
        {/* Pulsante Menu Secondario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-12 h-12 p-0 rounded-xl border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50">
              <MoreVertical size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-100 shadow-xl p-2">
            <DropdownMenuItem 
              onClick={() => {
                if (window.confirm("Vuoi davvero svuotare il preventivo e crearne uno nuovo? I dati non salvati andranno persi.")) {
                  onClear();
                }
              }}
              className="text-red-600 focus:text-red-700 focus:bg-red-50 p-3 rounded-lg cursor-pointer flex items-center gap-2"
            >
              <Trash2 size={16} /> Svuota / Nuovo Preventivo
            </DropdownMenuItem>
            
            {editingOrderId && (
              <DropdownMenuItem 
                onClick={onCreateVariant} 
                disabled={items.length === 0}
                className="text-blue-600 focus:text-blue-700 focus:bg-blue-50 p-3 rounded-lg cursor-pointer flex items-center gap-2 mt-1"
              >
                <Plus size={16} /> Clona Ordine (Nuovo)
              </DropdownMenuItem>
            )}

            <DropdownMenuItem 
              onClick={onChangeProfileGlobale} 
              disabled={items.length === 0}
              className="text-purple-600 focus:text-purple-700 focus:bg-purple-50 p-3 rounded-lg cursor-pointer flex items-center gap-2 mt-1 font-bold"
            >
              <Plus size={16} /> Variante Materiale Globale
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div id="tour-step-5" className="flex items-center gap-3">
          <Button 
            onClick={() => onSave()} 
            variant="outline"
            className="h-12 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold px-6 rounded-xl flex-1 sm:flex-none flex items-center justify-center gap-2" 
            disabled={items.length === 0 || isSaving}
          >
            <Save size={18} /> {editingOrderId ? 'Aggiorna' : 'Salva'}
          </Button>

          <Button 
            onClick={onExportPDF}
            className="h-12 bg-primary hover:bg-primary/90 text-white font-bold px-8 rounded-xl shadow-md shadow-primary/20 flex-1 sm:flex-none flex items-center justify-center gap-2"
            disabled={items.length === 0}
          >
            <Download size={20} /> Stampa PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
