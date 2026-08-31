import React from 'react';
import WindowPreview from '../WindowPreview';
import ShutterPreview from '../ShutterPreview';
import CassonettoPreview from '../CassonettoPreview';
import BlindataPreview from '../BlindataPreview';

export default function LivePreview({ newItem, paneConfigs }) {
  const isShutter = newItem.apertura === 'Persiana' || newItem.apertura === 'Persiana Balcone';
  const isCassonetto = newItem.apertura === 'Cassonetto';
  const isTapparella = newItem.apertura?.toLowerCase() === 'tapparella';
  
  const vetroSupPannello = newItem.vetro ? (newItem.vetro.toLowerCase().includes('pannell') || newItem.vetro.toLowerCase().includes('cieco')) : false;
  const vetroInfPannello = newItem.hasTraverso && newItem.vetroInferioreNome 
    ? (newItem.vetroInferioreNome.toLowerCase().includes('pannell') || newItem.vetroInferioreNome.toLowerCase().includes('cieco')) 
    : vetroSupPannello;

  const isBlindata = newItem.apertura?.toLowerCase() === 'porta blindata';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Anteprima dal Vivo</h2>
      
      <div className="relative flex items-center justify-center min-h-[300px] p-4 bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
        {newItem.customImage && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur border border-purple-200 text-purple-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 z-10">
            <span>📷</span> Foto reale allegata per PDF
          </div>
        )}
        
        {isBlindata ? (
          <BlindataPreview
            frameColor={newItem.previewColor || newItem.frameColor}
            width={newItem.width}
            height={newItem.height}
            handlePosition={newItem.handlePosition}
            maniglioneAntipanico={newItem.maniglioneAntipanico}
          />
        ) : isShutter ? (
          <ShutterPreview
            numAnte={newItem.numAnte}
            frameColor={newItem.previewColor || newItem.frameColor}
            width={newItem.width}
            height={newItem.height}
            hasTraverso={newItem.hasTraverso}
            anteWidths={newItem.anteAsimmetriche ? newItem.anteWidths : null}
            paneConfigs={paneConfigs}
            accessoriColore={newItem.previewAccessoriColor || newItem.accessoriColore}
          />
        ) : isCassonetto ? (
          <CassonettoPreview 
            width={newItem.width} 
            height={newItem.height} 
          />
        ) : isTapparella ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl w-[80%] max-w-xs border-2 border-dashed border-gray-300 shadow-inner">
            <span className="text-4xl mb-3">🪟</span>
            <span className="font-bold text-gray-600 text-lg">Tapparella Avvolgibile</span>
            <span className="text-sm text-gray-500 font-medium mt-1">{newItem.width} x {newItem.height} mm</span>
          </div>
        ) : (
          <WindowPreview
            numAnte={newItem.numAnte}
            apertura={newItem.apertura}
            antaRibalta={newItem.antaRibalta}
            frameColor={newItem.previewColor || newItem.frameColor}
            accessoriColore={newItem.previewAccessoriColor || newItem.accessoriColore}
            width={newItem.width}
            height={newItem.height}
            hasTraverso={newItem.hasTraverso}
            traversoHeight={newItem.traversoHeight}
            topIsPanel={vetroSupPannello}
            bottomIsPanel={vetroInfPannello}
            hasSopraluce={newItem.hasSopraluce}
            sopraluceHeight={newItem.sopraluceHeight}
            handlePosition={newItem.handlePosition}
            paneConfigs={paneConfigs}
            anteWidths={newItem.anteAsimmetriche ? newItem.anteWidths : null}
            maniglioneAntipanico={newItem.maniglioneAntipanico}
          />
        )}
      </div>
    </div>
  );
}
