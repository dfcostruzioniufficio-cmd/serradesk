import React from 'react';

export default function CostSummary({
  imponibile,
  scontoAmount,
  sconto,
  imponibileScontato,
  totaleIva,
  iva,
  totalePreventivo,
  onSpalmaQuadratura
}) {
  const formatCurrency = (val) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2 }).format(val);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Riepilogo Costi</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Totale Articoli:</span>
          <span className="font-medium">€ {formatCurrency(imponibile)}</span>
        </div>
        
        {Number(sconto) > 0 && (
          <div className="flex justify-between text-orange-600 font-bold">
            <span>Sconto ({sconto}%):</span>
            <span>- € {formatCurrency(scontoAmount)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-gray-600 border-t pt-3">
          <span>Imponibile Scontato:</span>
          <span className="font-medium">€ {formatCurrency(imponibileScontato)}</span>
        </div>
        
        <div className="flex justify-between text-gray-600 border-b pb-3">
          <span>I.V.A. ({iva}%):</span>
          <span className="font-medium">€ {formatCurrency(totaleIva)}</span>
        </div>
        
        <div className="flex justify-between items-end pt-2">
          <span className="text-gray-800 font-bold">TOTALE:</span>
          <span className="text-2xl font-black text-primary">
            € {formatCurrency(totalePreventivo)}
          </span>
        </div>
      </div>
      
      {onSpalmaQuadratura && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button 
            onClick={() => {
              const res = window.prompt("Inserisci la quadratura totale desiderata (mq) su cui ricalcolare i prezzi:", "");
              if (res && !isNaN(Number(res.replace(',', '.')))) {
                onSpalmaQuadratura(Number(res.replace(',', '.')));
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-bold shadow-sm transition-all text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            Forza Quadratura Totale
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-2 leading-tight">
            Spalma automaticamente i metri quadri proporzionalmente su tutti gli infissi
          </p>
        </div>
      )}
    </div>
  );
}
