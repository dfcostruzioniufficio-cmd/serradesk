import React from 'react';
import WindowPreview from './WindowPreview';
import ShutterPreview from './ShutterPreview';
import CassonettoPreview from './CassonettoPreview';
import BlindataPreview from './BlindataPreview';
import PulsarPreviewPage from './preventivi/PulsarPreviewPage';
import { calculateItemMq } from '../hooks/usePricingEngine';

export default function QuotePDFTemplate({ quoteData, userSettings, userEmail, isExporting, includeRecap }) {
  const {
    clientName,
    clientAddress,
    clientVat,
    clientPhone,
    clientEmail,
    items,
    sconto,
    iva,
    imponibile,
    scontoAmount,
    imponibileScontato,
    totaleIva,
    totalePreventivo
  } = quoteData;

  const actualItems = items || [];
  const discountPercent = sconto || 0;
  const cData = {
    address: clientAddress,
    vat: clientVat,
    phone: clientPhone,
    email: clientEmail
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'decimal', minimumFractionDigits: 2 }).format(value);
  };

  const maxQuoteWidth = Math.max(1000, ...actualItems.map(i => Number(i.width) || 0));
  const maxQuoteHeight = Math.max(1000, ...actualItems.map(i => Number(i.height) || 0));

  const maxRatio = maxQuoteWidth / maxQuoteHeight;
  const MAX_W = 160;
  const MAX_H = 200;
  let maxBoundingH;
  if (maxRatio > MAX_W / MAX_H) { 
    maxBoundingH = MAX_W / maxRatio; 
  } else { 
    maxBoundingH = MAX_H; 
  }

  const getPages = () => {
    const pages = [];
    let remaining = [...actualItems];
    
    while (remaining.length > 0) {
      let currentPageItems = [];
      let currentWeight = 0;
      let maxWeight = pages.length === 0 ? 1.0 : 1.6;
      
      while (remaining.length > 0) {
        const item = remaining[0];
        let itemWeight = 0.35; // Serramento standard ridotto
        
        if (item.type === 'complemento') {
          itemWeight = 0.2;
        } else if (item.type === 'custom') {
          const descLen = (item.customDescription || '').length;
          itemWeight = 0.15 + (Math.floor(descLen / 100) * 0.05);
        }

        if (currentWeight + itemWeight <= maxWeight || currentPageItems.length === 0) {
          currentPageItems.push(remaining.shift());
          currentWeight += itemWeight;
        } else {
          break; // Pagina piena
        }
      }
      
      pages.push({
        isFirst: pages.length === 0,
        items: currentPageItems
      });
    }

    if (pages.length === 0) {
      pages.push({ isFirst: true, items: [] });
    }

    return pages;
  };

  const pages = getPages();
  const recapPageCount = includeRecap ? 1 : 0;

  const totalQuadratura = actualItems.reduce((acc, item) => {
    return acc + (calculateItemMq(item) * (item.quantity || 1));
  }, 0);
  const totalPerimetro = actualItems.reduce((acc, item) => item.type === 'custom' ? acc : acc + ((((item.width / 1000) + (item.height / 1000)) * 2) * item.quantity), 0);
  const ivaAmount = totaleIva;
  const totaleIvato = totalePreventivo;

  const renderItemRow = (item, index) => {
    const totale = item.unitPrice * item.quantity;

    if (item.type === 'custom') {
      return (
        <div key={index} className="flex border-b border-gray-200 py-3 break-inside-avoid items-center px-2">
          <div className="w-8 shrink-0 flex justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" className="overflow-visible">
              <defs>
                <linearGradient id={`gradNum_custom_${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="12" fill={`url(#gradNum_custom_${index})`} stroke="#eff6ff" strokeWidth="2" />
              <text x="12" y="16" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{item.id}</text>
            </svg>
          </div>
          <div className="flex-1 px-4">
            <h3 className="font-bold text-gray-900 text-[13px] mb-1 uppercase tracking-wide">Articolo Personalizzato</h3>
            <p className="text-gray-600 text-xs whitespace-pre-wrap leading-relaxed">{item.customDescription}</p>
          </div>
          <div className="w-24 text-right px-2 text-sm text-gray-600">{formatCurrency(item.unitPrice)}</div>
          <div className="w-16 text-center px-2 text-sm text-gray-600">{item.quantity} pz</div>
          <div className="w-28 text-right font-bold text-base text-gray-900 pr-2">{formatCurrency(totale)}</div>
        </div>
      );
    }

    if (item.type === 'complemento') {
      const areaMatch = item.description2.match(/\((.*?)\)/);
      const areaText = areaMatch ? areaMatch[1] : `Prezzo a Corpo`;

      return (
        <div key={index} className="flex border-b border-gray-200 py-6 break-inside-avoid items-center px-2">
          <div className="w-8 shrink-0 flex justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" className="overflow-visible">
              <defs>
                <linearGradient id={`gradNum_comp_${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="12" fill={`url(#gradNum_comp_${index})`} stroke="#eff6ff" strokeWidth="2" />
              <text x="12" y="16" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{item.id}</text>
            </svg>
          </div>
          <div className="flex-1 px-4 flex gap-4">
            <div className="w-[180px] shrink-0 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 p-2 min-h-[100px]">
              <p className="font-bold text-xs text-center text-gray-700">{item.description3}</p>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm mb-3 uppercase">{item.model || 'Complemento'}</h3>
              <div className="space-y-2 text-[10px]">
                <div className="flex flex-col border-b border-gray-100 pb-1">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider text-[8px]">Misure</span>
                  <span className="font-bold text-gray-800 text-xs">L {item.width} x H {item.height} mm</span>
                </div>
                {item.colInt && (
                  <div className="flex flex-col border-b border-gray-100 pb-1">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[8px]">Finitura</span>
                    <span className="font-bold text-gray-800">{item.colInt}</span>
                  </div>
                )}
                <div className="flex flex-col border-b border-gray-100 pb-1">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider text-[8px]">Dettaglio</span>
                  <span className="font-bold text-gray-800">{areaText}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-24 text-right px-2 text-sm text-gray-600">{formatCurrency(item.unitPrice)}</div>
          <div className="w-16 text-center px-2 text-sm text-gray-600">{item.quantity}</div>
          <div className="w-28 text-right font-bold text-base text-gray-900 pr-2">{formatCurrency(totale)}</div>
        </div>
      );
    }

    const mq = calculateItemMq(item);
    const superficie = mq.toFixed(2);
    const perimetro = (((item.width / 1000) + (item.height / 1000)) * 2).toFixed(1);

    const topIsPanel = item.vetro ? (item.vetro.toLowerCase().includes('pannell') || item.vetro.toLowerCase().includes('cieco')) : false;
    const bottomIsPanel = item.hasTraverso && item.vetroInferioreNome ? (item.vetroInferioreNome.toLowerCase().includes('pannell') || item.vetroInferioreNome.toLowerCase().includes('cieco')) : topIsPanel;

    const isShutter = item.apertura === 'Persiana' || item.apertura === 'Persiana Balcone';
    const isBlindata = item.apertura?.toLowerCase() === 'porta blindata';

    const mainTitle = item.description2 || `${item.apertura} ${item.numAnte ? item.numAnte + ' Ante' : ''}`.trim();
    const subTitle = item.description3 || item.description1;

    return (
      <div key={index} className="flex border-b border-gray-100 py-3 px-2 break-inside-avoid items-start">
        <div className="w-8 shrink-0 flex justify-center pt-1">
          <svg width="24" height="24" viewBox="0 0 24 24" className="overflow-visible">
            <defs>
              <linearGradient id={`gradNum_${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#4338ca" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="12" fill={`url(#gradNum_${index})`} stroke="#eff6ff" strokeWidth="2" />
            <text x="12" y="16" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{item.id}</text>
          </svg>
        </div>
        
        <div className="flex-1 px-2 flex gap-4">
          <div className="w-[160px] shrink-0 bg-white border border-slate-200 p-2 text-center flex items-center justify-center min-h-[120px]">
            <div style={{ display: 'inline-block' }}>
            {isBlindata ? (
              <BlindataPreview frameColor={item.previewColor || item.frameColor} width={item.width} height={item.height} handlePosition={item.handlePosition} maniglioneAntipanico={item.maniglioneAntipanico} maxQuoteWidth={maxQuoteWidth} maxQuoteHeight={maxQuoteHeight} isExporting={isExporting} />
            ) : isShutter ? (
              <ShutterPreview numAnte={item.numAnte} frameColor={item.previewColor || item.frameColor} accessoriColore={item.previewAccessoriColor || item.accessori} width={item.width} height={item.height} hasTraverso={item.hasTraverso} anteWidths={item.anteAsimmetriche ? item.anteWidths : null} paneConfigs={item.paneConfigs} maxQuoteWidth={maxQuoteWidth} maxQuoteHeight={maxQuoteHeight} isExporting={isExporting} />
            ) : item.apertura === 'Cassonetto' ? (
              <CassonettoPreview width={item.width} height={item.height} maxQuoteWidth={maxQuoteWidth} maxQuoteHeight={maxQuoteHeight} isExporting={isExporting} />
            ) : item.apertura?.toLowerCase() === 'tapparella' ? (
              <div className="flex flex-col items-center justify-center text-center p-2 text-slate-400">
                <span className="text-3xl mb-1">🪟</span>
                <span className="text-[10px] font-bold">TAPPARELLA</span>
              </div>
            ) : (
              <WindowPreview numAnte={item.numAnte} apertura={item.apertura} antaRibalta={item.antaRibalta} frameColor={item.previewColor || item.frameColor} accessoriColore={item.previewAccessoriColor || item.accessori} width={item.width} height={item.height} hasTraverso={item.hasTraverso} traversoHeight={item.traversoHeight} topIsPanel={topIsPanel} bottomIsPanel={bottomIsPanel} hasSopraluce={item.hasSopraluce} sopraluceHeight={item.sopraluceHeight} handlePosition={item.handlePosition} paneConfigs={item.paneConfigs} anteWidths={item.anteAsimmetriche ? item.anteWidths : null} maniglioneAntipanico={item.maniglioneAntipanico} maxQuoteWidth={maxQuoteWidth} maxQuoteHeight={maxQuoteHeight} isExporting={isExporting} />
            )}
            </div>
          </div>
          
          <div className="flex-1 pr-2">
            <h3 className="font-extrabold text-slate-900 text-[13px] uppercase leading-tight tracking-wide mb-1">
              {mainTitle}
            </h3>
            {subTitle && <p className="text-[10px] text-indigo-600 font-bold mb-1 uppercase tracking-wider">{subTitle}</p>}
            
            <div className={`grid grid-cols-2 gap-x-3 gap-y-2`}>
              <div className="flex flex-col bg-slate-50 rounded-md px-2 py-1.5 border border-slate-100">
                <span className="text-indigo-400/80 font-bold uppercase tracking-wider text-[6px] mb-[2px]">Misure Telaio</span>
                <span className="font-bold text-slate-800 text-[10px] leading-tight">L {item.width} x H {item.height} mm</span>
              </div>
              
              {item.marca && (
                <div className="flex flex-col bg-slate-50 rounded-md px-2 py-1.5 border border-slate-100">
                  <span className="text-indigo-400/80 font-bold uppercase tracking-wider text-[6px] mb-[2px]">Marca Profilo</span>
                  <span className="font-bold text-slate-800 text-[10px] leading-tight pr-2">{item.marca}</span>
                </div>
              )}
              
              {(item.colorName || item.colInt || item.colore) && (
                <div className="flex flex-col bg-slate-50 rounded-md px-2 py-1.5 border border-slate-100">
                  <span className="text-indigo-400/80 font-bold uppercase tracking-wider text-[6px] mb-[2px]">Colore</span>
                  <span className="font-bold text-slate-800 text-[10px] leading-tight break-words pr-2">{item.colInt || item.colorName || item.colore}</span>
                </div>
              )}
              
              {item.vetro && (
                <div className="flex flex-col bg-slate-50 rounded-md px-2 py-1.5 border border-slate-100">
                  <span className="text-indigo-400/80 font-bold uppercase tracking-wider text-[6px] mb-[2px]">Vetro</span>
                  <span className="font-bold text-slate-800 text-[10px] leading-tight pr-2 break-words">{item.vetro}</span>
                </div>
              )}
              
              <div className="flex flex-col bg-slate-50 rounded-md px-2 py-1.5 border border-slate-100">
                <span className="text-indigo-400/80 font-bold uppercase tracking-wider text-[6px] mb-[2px]">Sup. / Perimetro</span>
                <span className="font-bold text-slate-800 text-[10px] leading-tight">{superficie.replace('.', ',')} m² / {perimetro.replace('.', ',')} m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-20 text-right px-2 text-sm text-gray-600 pt-1">{formatCurrency(item.unitPrice)}</div>
        <div className="w-12 text-center px-2 text-sm text-gray-600 pt-1">{item.quantity}</div>
        <div className="w-24 text-right font-bold text-[15px] text-gray-900 pr-2 pt-1">{formatCurrency(totale)}</div>
      </div>
    );
  };

  const renderAbaco = () => (
    <div className="mt-8 flex justify-between items-stretch abaco-container break-inside-avoid gap-6">
      <div className="w-1/3 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400"></div>
        <h4 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-3 pl-2">Riepilogo Misure</h4>
        <div className="space-y-3 text-xs pl-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium tracking-wide">Quadratura Totale</span>
            <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{totalQuadratura.toFixed(2).replace('.', ',')} m²</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium tracking-wide">Perimetro Totale</span>
            <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{totalPerimetro.toFixed(2).replace('.', ',')} m</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 bg-white rounded-2xl border border-slate-200 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
        <div className="space-y-3 pl-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium tracking-wide">Totale Articoli</span>
            <span className="font-semibold text-slate-900">{formatCurrency(imponibile)}</span>
          </div>
          {scontoAmount > 0 && (
            <div className="flex justify-between items-center text-sm bg-emerald-50 text-emerald-700 -mx-6 px-6 py-2 border-y border-emerald-100/50">
              <span className="font-bold tracking-wide">Sconto applicato ({discountPercent}%)</span>
              <span className="font-bold text-emerald-800">- {formatCurrency(scontoAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm pt-1">
            <span className="text-slate-500 font-medium tracking-wide">Imponibile Scontato</span>
            <span className="font-bold text-slate-900">{formatCurrency(imponibileScontato)}</span>
          </div>
          <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-100">
            <span className="text-slate-500 font-medium tracking-wide">I.V.A. ({iva || 10}%)</span>
            <span className="font-semibold text-slate-900">{formatCurrency(ivaAmount)}</span>
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="font-black text-[16px] text-slate-900 uppercase tracking-widest">TOTALE DA PAGARE</span>
            <span className="font-black text-xl text-blue-700">{formatCurrency(totaleIvato)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const abacoNeedsNewPage = (() => {
    if (pages.length === 0) return false;
    const lastPage = pages[pages.length - 1];
    let weight = 0;
    lastPage.items.forEach(item => {
      let w = 0.35;
      if (item.type === 'complemento') w = 0.2;
      else if (item.type === 'custom') w = 0.15 + (Math.floor((item.customDescription || '').length / 100) * 0.05);
      weight += w;
    });
    return weight > 1.0;
  })();

  const hasPulsar = actualItems.some(item => 
    JSON.stringify(item).toLowerCase().includes('pulsar')
  );
  
  const showPulsarPage = typeof userEmail === 'string' && userEmail.trim().toLowerCase() === 'domenicopanico0303@gmail.com' && hasPulsar;

  return (
    <div className="w-full bg-white text-black font-sans text-sm flex flex-col items-center">
      {showPulsarPage && <PulsarPreviewPage userSettings={userSettings} />}

      {includeRecap && (
        <div className="bg-white relative shadow-sm" style={{
            width: '210mm',
            height: '296mm',
            overflow: 'hidden',
            padding: '12mm',
            boxSizing: 'border-box',
            pageBreakAfter: 'always',
            display: 'flex',
            flexDirection: 'column'
          }}>
          <div className="flex justify-between items-start mb-10 pb-6 border-b border-gray-200">
            <div className="flex flex-col gap-4 max-w-[50%]">
              <div className="h-16 relative flex items-center justify-start">
                  {userSettings?.logo_base64 ? (
                    <img src={userSettings.logo_base64} alt="Company Logo" className="max-h-full object-contain" />
                  ) : (
                    <div className="h-12 px-4 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl tracking-wider">
                      {userSettings?.company_name ? userSettings.company_name.toUpperCase() : 'SERRADESK'}
                    </div>
                  )}
              </div>
              <div className="text-[10px] space-y-[2px] text-gray-500">
                <h1 className="text-xs font-bold text-gray-800 uppercase mb-1">{userSettings?.company_name || 'Azienda Non Impostata'}</h1>
                <p>{userSettings?.address || 'Indirizzo non impostato'}</p>
                <p>P.IVA / C.F. {userSettings?.vat_number || 'Non impostata'}</p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end max-w-[45%]">
              <div className="bg-gray-50 border border-gray-200 px-6 py-4 rounded-xl text-left w-full">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Spett.le Cliente</p>
                <h2 className="text-base font-black text-gray-900 mb-1">{clientName || 'Cliente Non Specificato'}</h2>
              </div>
              <div className="mt-4 text-[10px] text-gray-500">
                <p>Documento: <span className="font-bold text-gray-900">Riepilogo Preventivo</span></p>
                <p>Data: <span className="font-bold text-gray-900">{new Date().toLocaleDateString('it-IT')}</span></p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-indigo-900 uppercase tracking-wider">Riepilogo Articoli</h2>
            <p className="text-xs text-gray-500 mt-1">Il dettaglio tecnico di ogni singolo articolo si trova nelle pagine seguenti.</p>
          </div>

          <div className="flex-1">
            <div className="flex bg-slate-800 text-white shadow-sm border border-slate-700 py-3 px-2 text-[10px] font-bold uppercase tracking-wider items-center rounded-lg mb-2">
              <div className="w-8 text-center shrink-0 text-slate-300">Nº</div>
              <div className="flex-1 px-3 text-slate-200">Descrizione</div>
              <div className="w-24 text-center shrink-0 text-slate-300">Misure (mm)</div>
              <div className="w-12 text-center shrink-0 text-slate-300">Q.TÀ</div>
              <div className="w-24 text-right pr-2 shrink-0 text-indigo-300">TOTALE</div>
            </div>

            {actualItems.map((item, index) => {
              const recapTitle = item.type === 'custom'
                ? 'Articolo Personalizzato'
                : (item.description2 || `${item.apertura || ''} ${item.numAnte ? item.numAnte + ' Ante' : ''}`.trim() || 'Complemento');
              const recapMisure = item.width && item.height ? `${item.width} x ${item.height}` : '—';
              const recapTotale = (item.unitPrice || 0) * (item.quantity || 1);
              return (
                <div key={`recap-${index}`} className="flex border-b border-gray-200 py-2.5 items-center px-2 text-xs">
                  <div className="w-8 text-center shrink-0 text-gray-400 font-bold">{index + 1}</div>
                  <div className="flex-1 px-3 font-semibold text-gray-800 truncate">{recapTitle}</div>
                  <div className="w-24 text-center shrink-0 text-gray-500 font-mono">{recapMisure}</div>
                  <div className="w-12 text-center shrink-0 text-gray-500">{item.quantity || 1}</div>
                  <div className="w-24 text-right pr-2 shrink-0 font-bold text-gray-900">{formatCurrency(recapTotale)}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-1/2 p-6 bg-white rounded-2xl border border-slate-200 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
              <div className="space-y-3 pl-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium tracking-wide">Totale Articoli</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(imponibile)}</span>
                </div>
                {scontoAmount > 0 && (
                  <div className="flex justify-between items-center text-sm bg-emerald-50 text-emerald-700 -mx-6 px-6 py-2 border-y border-emerald-100/50">
                    <span className="font-bold tracking-wide">Sconto applicato ({discountPercent}%)</span>
                    <span className="font-bold text-emerald-800">- {formatCurrency(scontoAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="text-slate-500 font-medium tracking-wide">Imponibile Scontato</span>
                  <span className="font-bold text-slate-900">{formatCurrency(imponibileScontato)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-100">
                  <span className="text-slate-500 font-medium tracking-wide">I.V.A. ({iva || 10}%)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(ivaAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="font-black text-[16px] text-slate-900 uppercase tracking-widest">TOTALE DA PAGARE</span>
                  <span className="font-black text-xl text-blue-700">{formatCurrency(totaleIvato)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-end text-[8px] text-gray-400">
            <div className="max-w-[70%]">
              {(!userEmail?.includes('dfcostruzioni.ufficio') && !userEmail?.includes('dfcostruzionisrl.ufficio')) && (
                <p>Generato tramite piattaforma cloud SerraDesk.it</p>
              )}
            </div>
            <div className="text-right">
              <p>Pagina 1 di {pages.length + (abacoNeedsNewPage ? 1 : 0) + recapPageCount}</p>
            </div>
          </div>
        </div>
      )}

      {pages.map((page, pageIndex) => {
        return (
          <div key={`page-${pageIndex}`} className="bg-white relative shadow-sm" style={{ 
              width: '210mm', 
              height: '296mm',
              overflow: 'hidden',
              padding: '12mm', 
              boxSizing: 'border-box', 
              pageBreakAfter: 'always',
              display: 'flex',
              flexDirection: 'column'
            }}>
            
            {/* Header Rendering Moderno */}
            {page.isFirst ? (
              <div className="flex justify-between items-start mb-10 pb-6 border-b border-gray-200">
                <div className="flex flex-col gap-4 max-w-[50%]">
                  <div className="h-16 relative flex items-center justify-start">
                      {userSettings?.logo_base64 ? (
                        <img src={userSettings.logo_base64} alt="Company Logo" className="max-h-full object-contain" />
                      ) : (
                        <div className="h-12 px-4 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl tracking-wider">
                          {userSettings?.company_name ? userSettings.company_name.toUpperCase() : 'SERRADESK'}
                        </div>
                      )}
                  </div>
                  <div className={`text-[10px] space-y-[2px] ${['info@puntoalluminio.com', 'domenicopanico0303@gmail.com'].includes(userEmail) ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>
                    <h1 className="text-xs font-bold text-gray-800 uppercase mb-1">
                      {['info@puntoalluminio.com', 'domenicopanico0303@gmail.com'].includes(userEmail) && userSettings?.company_name?.toLowerCase().includes('inverno') ? 'PUNTO ALLUMINIO' : (userSettings?.company_name || 'Azienda Non Impostata')}
                    </h1>
                    <p>{userSettings?.address || 'Indirizzo non impostato'}</p>
                    {userSettings?.legal_address && <p>Sede Legale: {userSettings.legal_address}</p>}
                    <p>P.IVA / C.F. {userSettings?.vat_number || 'Non impostata'}</p>
                    <p className="pt-1">
                      {userSettings?.phone && <span className="mr-3">T: {userSettings.phone}</span>}
                      {userSettings?.email && <span>E: {userSettings.email}</span>}
                    </p>
                    {userSettings?.website && <p className="text-blue-600">{userSettings.website}</p>}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end max-w-[45%]">
                  <div className="bg-gray-50 border border-gray-200 px-6 py-4 rounded-xl text-left w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Spett.le Cliente</p>
                    <h2 className="text-base font-black text-gray-900 mb-1">{clientName || 'Cliente Non Specificato'}</h2>
                    <div className="text-xs font-bold text-gray-800 space-y-[2px]">
                      {cData.address && <p>{cData.address}</p>}
                      {cData.vat && <p>P.IVA/CF: {cData.vat}</p>}
                      {cData.phone && <p>Tel: {cData.phone}</p>}
                      {cData.email && <p>Email: {cData.email}</p>}
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] text-gray-500">
                    <p>Documento: <span className="font-bold text-gray-900">Preventivo Commerciale</span></p>
                    <p>N. Preventivo: <span className="font-bold text-gray-900">
                      {`PRV-${new Date().getFullYear()}-${(clientName || 'CLI').substring(0,3).toUpperCase()}${clientName?.includes('Variante') ? '-' + clientName.split('Variante ')[1]?.substring(0,1) || '' : ''}`}
                    </span></p>
                    <p>Data: <span className="font-bold text-gray-900">{new Date().toLocaleDateString('it-IT')}</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{userSettings?.company_name || 'SERRADESK'}</h1>
                <p className="text-[10px] text-gray-500 font-medium">Preventivo Commerciale - Spett.le {clientName || 'Cliente Non Specificato'}</p>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1">
              {/* Table Header - Always render */}
              <div className="flex bg-slate-800 text-white shadow-sm border border-slate-700 py-3 px-2 text-[10px] font-bold uppercase tracking-wider items-center rounded-lg mt-4 mb-2">
                <div className="w-8 text-center shrink-0 text-slate-300">Nº</div>
                <div className="flex-1 px-2 flex items-center gap-4">
                  <div className="w-[160px] shrink-0 text-center text-[9px] text-slate-400">DISEGNO TECNICO</div>
                  <div className="flex-1 pr-2 text-slate-200 leading-tight">DESCRIZIONE ARTICOLO E SPECIFICHE</div>
                </div>
                <div className="w-20 text-right px-2 shrink-0 text-slate-300">PREZZO</div>
                <div className="w-12 text-center px-2 shrink-0 text-slate-300">Q.TÀ</div>
                <div className="w-24 text-right pr-2 shrink-0 text-indigo-300">TOTALE</div>
              </div>

              {/* Items */}
              <div className="flex flex-col">
                {page.items.map((item, itemIndex) => renderItemRow(item, itemIndex))}
              </div>

              {/* Render Abaco se c'è spazio sufficiente */}
              {pageIndex === pages.length - 1 && !abacoNeedsNewPage && renderAbaco()}
            </div>

            {/* Footer Globale */}
            <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-end text-[8px] text-gray-400">
              <div className="max-w-[70%]">
                <p className="mb-1"><strong>Validità dell'offerta:</strong> Il presente preventivo ha validità 15 giorni dalla data di emissione. Oltre tale termine, i prezzi potrebbero subire variazioni.</p>
                {(!userEmail?.includes('dfcostruzioni.ufficio') && !userEmail?.includes('dfcostruzionisrl.ufficio')) && (
                  <p>Generato tramite piattaforma cloud SerraDesk.it</p>
                )}
              </div>
              <div className="text-right">
                <p>Pagina {pageIndex + 1 + recapPageCount} di {pages.length + (abacoNeedsNewPage ? 1 : 0) + recapPageCount}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Render Abaco su nuova pagina se necessario */}
      {abacoNeedsNewPage && (
        <div className="bg-white relative shadow-sm" style={{ 
            width: '210mm', 
            height: '296mm',
            overflow: 'hidden',
            padding: '12mm', 
            boxSizing: 'border-box', 
            pageBreakAfter: 'always',
            display: 'flex',
            flexDirection: 'column'
          }}>
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h1 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{userSettings?.company_name || 'SERRADESK'}</h1>
            <p className="text-[10px] text-gray-500 font-medium">Preventivo Commerciale - Spett.le {clientName || 'Cliente Non Specificato'}</p>
          </div>
          
          <div className="flex-1">
            {renderAbaco()}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-end text-[8px] text-gray-400">
            <div className="max-w-[70%]">
              <p className="mb-1"><strong>Validità dell'offerta:</strong> Il presente preventivo ha validità 15 giorni dalla data di emissione. Oltre tale termine, i prezzi potrebbero subire variazioni.</p>
              {(!userEmail?.includes('dfcostruzioni.ufficio') && !userEmail?.includes('dfcostruzionisrl.ufficio')) && (
                <p>Generato tramite piattaforma cloud SerraDesk.it</p>
              )}
            </div>
            <div className="text-right">
              <p>Pagina {pages.length + 1 + recapPageCount} di {pages.length + (abacoNeedsNewPage ? 1 : 0) + recapPageCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Render Allegati Fotografici se presenti */}
      {(() => {
        const customImages = items.filter(i => i.customImage);
        if (customImages.length === 0) return null;
        
        const photoPages = [];
        for (let i = 0; i < customImages.length; i += 4) {
          photoPages.push(customImages.slice(i, i + 4));
        }

        return photoPages.map((photoPageItems, pIndex) => {
          return (
            <div key={`photo-page-${pIndex}`} className="bg-white relative shadow-sm break-before-page" style={{ 
                width: '210mm', 
                height: '296mm',
                overflow: 'hidden',
                padding: '12mm', 
                boxSizing: 'border-box', 
                pageBreakBefore: 'always',
                display: 'flex',
                flexDirection: 'column'
              }}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{userSettings?.company_name || 'SERRADESK'}</h1>
                <p className="text-[10px] text-gray-500 font-medium">Allegati Fotografici - Spett.le {clientName || 'Cliente Non Specificato'}</p>
              </div>

              <div className="mb-4">
                <h2 className="text-xl font-extrabold text-indigo-900 uppercase tracking-wider">Allegati Fotografici</h2>
                <p className="text-xs text-gray-500 mt-1">Immagini reali degli articoli configurati nel preventivo.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-4 content-start">
                {photoPageItems.map((item, iIndex) => {
                  const mainTitle = item.description2 || `${item.apertura} ${item.numAnte ? item.numAnte + ' Ante' : ''}`.trim();
                  return (
                    <div key={iIndex} className="flex flex-col border border-gray-200 rounded-xl p-4 shadow-sm bg-gray-50/50 break-inside-avoid">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {item.id}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-xs uppercase leading-tight">{mainTitle}</h3>
                          {item.description3 && <p className="text-[9px] text-gray-500 uppercase">{item.description3}</p>}
                        </div>
                      </div>
                      <div className="h-[260px] rounded-lg overflow-hidden border border-gray-100 bg-white flex items-center justify-center p-2">
                        <img src={item.customImage} alt={`Foto Articolo ${item.id}`} className="max-w-full max-h-[240px] object-contain" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-end text-[8px] text-gray-400">
                <div className="max-w-[70%]">
                  {(!userEmail?.includes('dfcostruzioni.ufficio') && !userEmail?.includes('dfcostruzionisrl.ufficio')) && (
                    <p>Generato tramite piattaforma cloud SerraDesk.it</p>
                  )}
                </div>
              </div>
            </div>
          );
        });
      })()}

    </div>
  );
}
