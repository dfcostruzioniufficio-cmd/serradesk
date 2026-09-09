import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Printer, ClipboardList } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const RIGHE_PER_FOGLIO = 8;
const TIPOLOGIE = ['Battente', 'Scorrevole', 'Fisso', 'Persiana', 'Porta', 'Altro'];

// Caselle separate per ogni cifra: una misura scritta dentro riquadri
// distinti si rilegge molto meglio di un numero scritto di corsa, sia
// dall'occhio in ufficio sia da un lettore automatico più avanti.
function CasellePerCifre({ n = 4 }) {
  return (
    <div className="flex gap-[2px] justify-center">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="block w-[7mm] h-[9mm] border border-gray-400 rounded-[1px]" />
      ))}
    </div>
  );
}

export default function SchedaRilievoPage() {
  const { userSettings } = useUser();
  const [numeroFogli, setNumeroFogli] = useState(2);

  const fogli = Array.from({ length: Math.max(1, Math.min(10, Number(numeroFogli) || 1)) });

  return (
    <div className="space-y-6">
      {/* Comandi: non vanno in stampa */}
      <div className="max-w-3xl mx-auto print:hidden">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1a365d] flex items-center gap-2">
              <ClipboardList size={28} className="text-blue-600" /> Scheda di Rilievo
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Stampa queste schede e portale in cantiere: compili le misure a mano nelle caselle,
              con il tuo logo già sopra. Ogni foglio contiene {RIGHE_PER_FOGLIO} articoli — se non
              bastano, stampa più fogli e numera il totale in fondo.
            </p>
          </div>
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 px-6 shrink-0">
            <Printer size={18} /> Stampa
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <Label className="mb-2 block text-gray-700">Quanti fogli vuoi stampare</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={numeroFogli}
            onChange={(e) => setNumeroFogli(e.target.value)}
            className="h-11 max-w-[120px]"
          />
          {!userSettings?.company_name && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              Non hai ancora impostato i dati aziendali: le schede usciranno senza intestazione.
              Compilali in Impostazioni per averle col tuo nome e il tuo logo.
            </p>
          )}
        </div>
      </div>

      {/* I fogli veri e propri */}
      <div className="flex flex-col items-center gap-8 print:gap-0">
        {fogli.map((_, indiceFoglio) => (
          <div
            key={indiceFoglio}
            className="bg-white text-black shadow-sm print:shadow-none"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '12mm',
              boxSizing: 'border-box',
              pageBreakAfter: 'always',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Intestazione */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-3 mb-5">
              <div className="flex items-center gap-3">
                {userSettings?.logo_base64 && (
                  <img src={userSettings.logo_base64} alt="" className="h-12 object-contain" />
                )}
                <div>
                  <p className="font-bold text-base uppercase leading-tight">
                    {userSettings?.company_name || ''}
                  </p>
                  {userSettings?.phone && <p className="text-[10px] text-gray-600">Tel. {userSettings.phone}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg uppercase tracking-wide">Scheda di Rilievo</p>
                <p className="text-[10px] text-gray-500">Misure da compilare in cantiere</p>
              </div>
            </div>

            {/* Dati del cantiere */}
            <div className="grid grid-cols-3 gap-4 mb-5 text-[11px]">
              <div className="col-span-2">
                <span className="font-bold uppercase text-[9px] text-gray-500">Cliente</span>
                <div className="border-b border-gray-400 h-[8mm]" />
              </div>
              <div>
                <span className="font-bold uppercase text-[9px] text-gray-500">Data</span>
                <div className="border-b border-gray-400 h-[8mm]" />
              </div>
            </div>

            {/* Tabella misure */}
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="border border-gray-800 py-1.5 w-[8mm]">N°</th>
                  <th className="border border-gray-800 py-1.5 w-[34mm]">Larghezza (mm)</th>
                  <th className="border border-gray-800 py-1.5 w-[34mm]">Altezza (mm)</th>
                  <th className="border border-gray-800 py-1.5 w-[14mm]">Q.tà</th>
                  <th className="border border-gray-800 py-1.5">Tipologia</th>
                  <th className="border border-gray-800 py-1.5 w-[28mm]">Colore</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: RIGHE_PER_FOGLIO }).map((_, riga) => (
                  <tr key={riga}>
                    <td className="border border-gray-400 text-center font-bold text-gray-500 h-[16mm]">
                      {riga + 1}
                    </td>
                    <td className="border border-gray-400 px-1"><CasellePerCifre n={4} /></td>
                    <td className="border border-gray-400 px-1"><CasellePerCifre n={4} /></td>
                    <td className="border border-gray-400 px-1"><CasellePerCifre n={2} /></td>
                    <td className="border border-gray-400 px-2">
                      {/* Caselle da spuntare: niente parole scritte a mano da interpretare */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                        {TIPOLOGIE.map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 whitespace-nowrap">
                            <span className="inline-block w-[4mm] h-[4mm] border border-gray-500" />
                            <span className="text-[9px]">{t}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-400" />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Note */}
            <div className="mt-4 flex-1">
              <span className="font-bold uppercase text-[9px] text-gray-500">Note</span>
              <div className="border border-gray-400 h-[24mm] mt-1" />
            </div>

            {/* Piè di pagina */}
            <div className="mt-auto pt-3 border-t border-gray-300 flex justify-between items-end text-[9px] text-gray-500">
              <span>
                Foglio <span className="inline-block border-b border-gray-500 w-[10mm]" /> di{' '}
                <span className="inline-block border-b border-gray-500 w-[10mm] mr-1" />
                — numera i fogli se il rilievo continua
              </span>
              <span>serradesk.it</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
