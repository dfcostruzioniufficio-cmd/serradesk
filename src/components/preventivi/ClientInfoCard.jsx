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
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h2 className="text-lg font-bold text-gray-800">Dati Cliente</h2>
        <Button variant="outline" size="sm" onClick={onOpenCRM} className="text-blue-600 border-blue-200">
          <Users size={16} className="mr-2" /> Rubrica
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="clientName" className="text-gray-600 font-medium">Nome Cliente / Azienda</Label>
          <Input 
            id="clientName" 
            value={clientName} 
            onChange={(e) => setClientName(e.target.value)} 
            className="mt-1 font-semibold"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sconto" className="text-gray-600 font-medium">Sconto (%)</Label>
            <Input 
              id="sconto" 
              type="number"
              value={sconto} 
              onChange={(e) => setSconto(Number(e.target.value))} 
              className="mt-1 font-semibold text-orange-600"
            />
          </div>
          <div>
            <Label htmlFor="iva" className="text-gray-600 font-medium">I.V.A. (%)</Label>
            <Input 
              id="iva" 
              type="number"
              value={iva} 
              onChange={(e) => setIva(Number(e.target.value))} 
              className="mt-1 font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
