import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export default function ClientInfoCard({
  clientName,
  setClientName,
  sconto,
  setSconto,
  iva,
  setIva,
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
        <Button variant="outline" onClick={onOpenCRM} className="h-10 text-blue-600 border-blue-200">
          <Users size={16} className="mr-2" /> Rubrica
        </Button>
      </div>
    </div>
  );
}
