import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export default function ClientInfoCard({
  clientName,
  setClientName,
  riferimento,
  setRiferimento,
  sconto,
  setSconto,
  iva,
  setIva,
  ivaNascosta = false,
  setIvaNascosta,
  onOpenCRM
}) {
  // Una riga sola: nome, sconto e IVA si scrivono una volta per preventivo e
  // non devono spingere il modulo degli articoli mezzo schermo piu' in giu'.
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <Label htmlFor="clientName" className="text-gray-600 font-medium">Nome Cliente / Azienda</Label>
          <Input 
            id="clientName" 
            value={clientName} 
            onChange={(e) => setClientName(e.target.value)} 
            className="mt-1 font-semibold"
          />
        </div>
        {/* Per distinguere piu' preventivi allo stesso cliente senza
            sporcarne il nome: finisce nel PDF e nell'archivio. */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="riferimento" className="text-gray-600 font-medium">Riferimento <span className="font-normal text-gray-400">(facoltativo)</span></Label>
          <Input
            id="riferimento"
            value={riferimento || ''}
            onChange={(e) => setRiferimento(e.target.value)}
            maxLength={120}
            placeholder="Es. Alluminio blindato, Cantiere via Roma"
            className="mt-1"
          />
        </div>
        <div className="w-24">
          <Label htmlFor="sconto" className="text-gray-600 font-medium">Sconto (%)</Label>
          <Input 
            id="sconto" 
            type="number"
            value={sconto} 
            onChange={(e) => setSconto(Number(e.target.value))} 
            className="mt-1 font-semibold text-orange-600"
          />
        </div>
        <div className="w-24">
          <Label htmlFor="iva" className="text-gray-600 font-medium">I.V.A. (%)</Label>
          <Input 
            id="iva" 
            type="number"
            value={iva} 
            onChange={(e) => setIva(Number(e.target.value))} 
            className="mt-1 font-semibold"
          />
        </div>
        {/* Molti clienti vogliono il preventivo con il solo imponibile: l'IVA
            resta calcolata qui, ma nel PDF non si stampa. */}
        {setIvaNascosta && (
          <label className="h-10 flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none" title="Se togli la spunta, il PDF mostra solo l'imponibile con la scritta IVA esclusa">
            <input
              type="checkbox"
              checked={!ivaNascosta}
              onChange={(e) => setIvaNascosta(!e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            IVA nel PDF
          </label>
        )}
        <Button variant="outline" onClick={onOpenCRM} className="h-10 text-blue-600 border-blue-200">
          <Users size={16} className="mr-2" /> Rubrica
        </Button>
      </div>
    </div>
  );
}
