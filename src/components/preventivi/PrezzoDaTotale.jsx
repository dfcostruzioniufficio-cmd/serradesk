import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { calculateItemMq } from '../../hooks/usePricingEngine';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const formatCurrency = (val) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

// Solo gli articoli davvero calcolati al metro quadro vengono riscalati.
// È una lista chiusa e non una lista di esclusioni: un criterio di prezzo
// che non conosciamo (al ml, al kg, a corpo) non deve finire riscalato
// per sbaglio, il suo importo viene invece sottratto dal totale.
// I complementi tengono il criterio in un campo suo: leggere `calcType`
// avrebbe restituito il residuo del serramento (che vale 'mq' di default)
// e avrebbe riscalato anche i complementi a prezzo fisso.
const siScalaSuiMq = (item) => {
  const calcType = item.type === 'complemento'
    ? (item.rawInput?.complementoCalcType || item.complementoCalcType)
    : (item.rawInput?.calcType || item.calcType);
  if (calcType && calcType !== 'mq') return false;
  return calculateItemMq(item) > 0;
};

// In Italia il totale si scrive "10.000" o "10.000,50": interpretare il
// punto come decimale trasformerebbe diecimila euro in dieci.
const leggiImporto = (valore) => {
  const s = String(valore ?? '').trim().replace(/[\s€]/g, '');
  if (!s) return 0;
  if (s.includes(',')) return Number(s.replace(/\./g, '').replace(',', '.')) || 0;
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, '')) || 0;
  return Number(s) || 0;
};

export default function PrezzoDaTotale({ items, sconto, iva, onApplica }) {
  const [totaleDesiderato, setTotaleDesiderato] = useState('');
  const [ivaInclusa, setIvaInclusa] = useState(true);

  const articoli = (items || []).filter(i => i.type !== 'metadata');
  const scalabili = articoli.filter(siScalaSuiMq);
  const fissi = articoli.filter(i => !siScalaSuiMq(i));

  const mqTotali = scalabili.reduce((acc, i) => acc + calculateItemMq(i) * (Number(i.quantity) || 1), 0);
  const importoFisso = fissi.reduce((acc, i) => acc + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1), 0);

  const target = leggiImporto(totaleDesiderato);

  // Con uno sconto del 100% (o più) il totale finale è zero qualunque
  // prezzo si metta: non esiste una soluzione, va detto invece di
  // proporre una cifra che poi non produce il totale richiesto.
  const scontoPercentuale = Number(sconto) || 0;
  const scontoImpossibile = scontoPercentuale >= 100;

  // Percorso inverso rispetto al calcolo del preventivo: dal totale finale
  // si torna indietro togliendo IVA e sconto, per arrivare all'imponibile.
  let imponibileTarget = target;
  if (ivaInclusa) imponibileTarget = imponibileTarget / (1 + (Number(iva) || 0) / 100);
  if (!scontoImpossibile) imponibileTarget = imponibileTarget / (1 - scontoPercentuale / 100);

  const daSpalmare = imponibileTarget - importoFisso;
  const prezzoAlMq = !scontoImpossibile && mqTotali > 0 && daSpalmare > 0
    ? daSpalmare / mqTotali
    : null;

  const applica = () => {
    if (!prezzoAlMq) return;
    const aggiornati = (items || []).map(item => {
      if (item.type === 'metadata' || !siScalaSuiMq(item)) return item;
      const nuovoPrezzo = Number((prezzoAlMq * calculateItemMq(item)).toFixed(2));
      const baseMq = Number(prezzoAlMq.toFixed(2));
      // isManualBasePrice dice al motore dei prezzi che questo importo è
      // stato deciso a mano: senza, riaprendo l'articolo nel configuratore
      // il prezzo verrebbe ricalcolato dal listino e questo andrebbe perso.
      return {
        ...item,
        unitPrice: nuovoPrezzo,
        isManualBasePrice: true,
        rawInput: item.rawInput
          ? { ...item.rawInput, unitPrice: nuovoPrezzo, basePrice: baseMq, isManualBasePrice: true }
          : item.rawInput
      };
    });
    onApplica(aggiornati);
    toast.success(`Prezzo aggiornato: ${formatCurrency(prezzoAlMq)} €/mq su ${scalabili.length} articol${scalabili.length === 1 ? 'o' : 'i'}.`);
  };

  if (articoli.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
        <Calculator size={18} className="text-blue-600" /> Prezzo dal totale
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Se sai già a quanto vuoi far uscire il lavoro, scrivi il totale: calcolo io il prezzo al mq.
      </p>

      <div className="flex justify-between text-sm text-gray-600 mb-3">
        <span>Metri quadri conteggiati</span>
        <span className="font-bold text-gray-800">{mqTotali.toFixed(2).replace('.', ',')} m²</span>
      </div>

      {importoFisso > 0 && (
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>Articoli a prezzo fisso (non riscalati)</span>
          <span>€ {formatCurrency(importoFisso)}</span>
        </div>
      )}

      <label className="text-xs font-bold text-gray-700 mb-1 block">Totale che vuoi ottenere</label>
      <div className="flex gap-2 mb-3">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="es. 10000"
          value={totaleDesiderato}
          onChange={(e) => setTotaleDesiderato(e.target.value)}
          className="h-11"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setIvaInclusa(true)}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${ivaInclusa ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          IVA inclusa
        </button>
        <button
          type="button"
          onClick={() => setIvaInclusa(false)}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${!ivaInclusa ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          IVA esclusa
        </button>
      </div>

      {scontoImpossibile && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Con uno sconto del {scontoPercentuale}% il totale finale resta zero qualunque prezzo si imposti.
          Riduci lo sconto per usare questo calcolo.
        </p>
      )}

      {!scontoImpossibile && target > 0 && mqTotali === 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Nessun articolo calcolato a metro quadro: non c'è nulla su cui spalmare il totale.
        </p>
      )}

      {!scontoImpossibile && target > 0 && mqTotali > 0 && daSpalmare <= 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Il totale che hai scritto è già coperto dagli articoli a prezzo fisso (€ {formatCurrency(importoFisso)}).
        </p>
      )}

      {prezzoAlMq && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-3 text-center">
            <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-1">Prezzo al mq</p>
            <p className="text-3xl font-black text-blue-800">€ {formatCurrency(prezzoAlMq)}</p>
          </div>
          <Button onClick={applica} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11">
            Applica a {scalabili.length} articol{scalabili.length === 1 ? 'o' : 'i'}
          </Button>
        </>
      )}
    </div>
  );
}
