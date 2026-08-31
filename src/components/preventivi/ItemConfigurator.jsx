import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, Plus } from 'lucide-react';
import { getFrameColorHex, getAccessoriHex } from '../../utils/colors';

export default function ItemConfigurator({
  itemType,
  setItemType,
  newItem,
  updateItemField,
  sistemiCam,
  editingIndex,
  handleCancelEdit,
  handleAddItem,
  setShowConfigurator,
  setShowGallery,
  isCustomerMode,
  userEmail
}) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const isCustomImageEnabled = ['domenicopanico0303@gmail.com'].includes(userEmail);
  const isPuntoAlluminio = ['info@puntoalluminio.com', 'domenicopanico0303@gmail.com'].includes(userEmail);

  React.useEffect(() => {
    if (isPuntoAlluminio && newItem.calcType !== 'fisso') {
      updateItemField('calcType', 'fisso');
    }
  }, [isPuntoAlluminio, newItem.calcType]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateItemField('customImage', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex flex-wrap gap-2 md:gap-4 border-b pb-3 mb-6">
        <button 
          onClick={() => setItemType('window')} 
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${itemType === 'window' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          Serramento
        </button>
        <button 
          onClick={() => setItemType('complemento')} 
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${itemType === 'complemento' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          Complemento
        </button>
        <button 
          onClick={() => setItemType('custom')} 
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${itemType === 'custom' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          Voce Libera
        </button>
      </div>
      
      {itemType === 'window' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 items-end">
          <div id="tour-step-3" className="col-span-4 md:col-span-2">
            <Label className="text-blue-700 font-bold">Sistema / Profilo</Label>
            <select 
              value={newItem.sistemaCamId}
              onChange={e => updateItemField('sistemaCamId', e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-xl border-2 border-blue-200 bg-blue-50/50 px-4 py-2 text-sm font-semibold hover:border-blue-300 focus:border-blue-500 transition-colors"
            >
              <option value="">-- Configurazione Manuale --</option>
              {sistemiCam.filter(s => s.tipologia !== 'VETRO').map(s => (
                <option key={s.id} value={s.id}>{s.nome} ({s.marca})</option>
              ))}
            </select>
            {!newItem.sistemaCamId && (
              <Input 
                type="text" 
                placeholder="Specifica Nome o Marca del profilo" 
                value={newItem.marca} 
                onChange={e => updateItemField('marca', e.target.value)} 
                className="mt-2 h-10 border-blue-200 bg-white" 
              />
            )}
          </div>

          {showAdvanced && newItem.sistemaCamId && !['Cassonetto', 'Tapparella', 'Porta Blindata'].includes(newItem.apertura) && (
            <div className="col-span-4 md:col-span-2">
              <Label className="text-emerald-700 font-bold">Vetro {newItem.hasTraverso ? '(Superiore)' : ''}</Label>
              <select 
                value={newItem.vetroId || (newItem.vetro ? 'custom' : '')} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    updateItemField('vetroId', 'custom');
                    updateItemField('vetro', '');
                  } else if (val) {
                    const v = sistemiCam.find(s => s.id === val);
                    updateItemField('vetroId', val);
                    if (v) updateItemField('vetro', v.nome);
                  } else {
                    updateItemField('vetroId', '');
                    updateItemField('vetro', '');
                  }
                }}
                className="mt-1.5 flex h-11 w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-2 text-sm hover:border-emerald-300 focus:border-emerald-500 transition-colors"
              >
                <option value="">-- Nessun Vetro --</option>
                {sistemiCam.filter(s => s.tipologia === 'VETRO').map(v => (
                  <option key={v.id} value={v.id}>{v.nome} (+{v.base_price}€/mq)</option>
                ))}
                <option value="custom">-- Vetro Personalizzato --</option>
              </select>
              {newItem.vetroId === 'custom' && (
                <Input type="text" value={newItem.vetro} onChange={e => updateItemField('vetro', e.target.value)} placeholder="Nome vetro..." className="mt-2 h-10 border-emerald-300 rounded-lg bg-white" />
              )}
            </div>
          )}

          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Marca / Profilo</Label>
            <Input 
              type="text" 
              value={newItem.marca || ''} 
              onChange={e => updateItemField('marca', e.target.value)} 
              placeholder="Es. Schuco, Ponzio, Dierre..."
              className="mt-1.5 h-11 rounded-xl"
            />
          </div>

          <div className="col-span-2 md:col-span-1 relative">
            <Label className="font-semibold text-gray-700">Colore Infisso</Label>
            <div className="relative mt-1.5 flex items-center">
              <Input 
                type="text" 
                value={newItem.frameColor || ''} 
                onChange={e => {
                  updateItemField('frameColor', e.target.value);
                  updateItemField('previewColor', null); // Reset custom color when text changes
                }} 
                placeholder="Es. RAL 9010, Noce, Verde..."
                className="h-11 rounded-xl pr-10"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded overflow-hidden border border-gray-300 shadow-sm">
                <input 
                  type="color" 
                  value={newItem.previewColor || getFrameColorHex(newItem.frameColor)}
                  onChange={e => updateItemField('previewColor', e.target.value)} 
                  className="w-10 h-10 -translate-x-2 -translate-y-2 cursor-pointer"
                  title="Personalizza colore 3D"
                />
              </div>
            </div>
          </div>

          {showAdvanced && (
            <div className="col-span-2 md:col-span-2">
              <Label className="font-semibold text-gray-700">Colore Accessori (Maniglie/Cerniere)</Label>
              <div className="relative mt-1.5 flex items-center">
                <Input 
                  type="text" 
                  value={newItem.accessoriColore || ''} 
                  onChange={e => {
                    updateItemField('accessoriColore', e.target.value);
                    updateItemField('previewAccessoriColor', null);
                  }} 
                  placeholder="Es. Argento, Cromo sat., Bronzo..."
                  className="h-11 rounded-xl pr-10"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded overflow-hidden border border-gray-300 shadow-sm">
                  <input 
                    type="color" 
                    value={newItem.previewAccessoriColor || getAccessoriHex(newItem.accessoriColore)}
                    onChange={e => updateItemField('previewAccessoriColor', e.target.value)} 
                    className="w-10 h-10 -translate-x-2 -translate-y-2 cursor-pointer"
                    title="Personalizza colore accessori 3D"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="col-span-2 md:col-span-2">
            <Label className="font-semibold text-gray-700">Apertura</Label>
            <select 
              value={newItem.apertura} 
              onChange={e => updateItemField('apertura', e.target.value)} 
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:border-blue-300 transition-colors"
            >
              <optgroup label="Finestre">
                <option value="Battente">Battente</option>
                <option value="Scorrevole">Scorrevole</option>
                <option value="Fisso">Fisso</option>
              </optgroup>
              <optgroup label="Persiane">
                <option value="Persiana">Persiana (Finestra)</option>
                <option value="Persiana Balcone">Persiana Balcone</option>
              </optgroup>
              <optgroup label="Porte">
                <option value="Porta Blindata">Porta Blindata</option>
              </optgroup>
              <optgroup label="Altro">
                <option value="Cassonetto">Cassonetto</option>
              </optgroup>
            </select>
          </div>



          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Numero Ante</Label>
            <Input type="number" min="1" max="6" value={newItem.numAnte} onChange={e => updateItemField('numAnte', parseInt(e.target.value) || 1)} className="mt-1.5 h-11 rounded-xl" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Quantità</Label>
            <Input type="number" value={newItem.quantity} onChange={e => updateItemField('quantity', e.target.value.replace(/^0+(?=\d)/, ''))} className="mt-1.5 h-11 rounded-xl" />
          </div>

          <div id="tour-step-2" className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Larghezza (mm)</Label>
            <Input type="number" value={newItem.width} onChange={e => updateItemField('width', e.target.value.replace(/^0+(?=\d)/, ''))} className="mt-1.5 h-11 rounded-xl font-medium" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Altezza (mm)</Label>
            <Input type="number" value={newItem.height} onChange={e => updateItemField('height', e.target.value.replace(/^0+(?=\d)/, ''))} className="mt-1.5 h-11 rounded-xl font-medium" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Quadratura (mq)</Label>
            <Input type="number" step="0.01" value={newItem.manualMq || ''} onChange={e => updateItemField('manualMq', e.target.value)} placeholder="Auto" className="mt-1.5 h-11 rounded-xl font-medium" />
          </div>

          {!isCustomerMode && !isPuntoAlluminio && (
            <div className="col-span-2 md:col-span-1">
              <Label className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1.5">
                Prezzo Base
                <select value={newItem.calcType} onChange={e => updateItemField('calcType', e.target.value)} className="bg-transparent text-blue-600 font-bold ml-1 outline-none cursor-pointer">
                  <option value="mq">al mq</option>
                  <option value="ml">al ml</option>
                  <option value="fisso">fisso</option>
                  <option value="pz">al pezzo</option>
                </select>
              </Label>
              <Input type="number" step="0.01" value={newItem.basePrice} onChange={e => updateItemField('basePrice', e.target.value.replace(/^0+(?=\d)/, ''))} className="h-11 rounded-xl font-bold text-gray-700" />
            </div>
          )}

          <div className={`col-span-2 ${isPuntoAlluminio ? 'md:col-span-2' : 'md:col-span-1'}`}>
            <Label className="font-semibold text-gray-700">Totale Finestra (€)</Label>
            <Input type="number" step="0.01" value={newItem.unitPrice} onChange={e => { updateItemField('unitPrice', e.target.value.replace(/^0+(?=\d)/, '')); if(isPuntoAlluminio) updateItemField('basePrice', e.target.value.replace(/^0+(?=\d)/, '')); }} className="mt-1.5 h-11 rounded-xl font-bold text-green-700 bg-green-50 border-green-200" />
          </div>

          {/* Toggle Opzioni Avanzate */}
          <div className="col-span-4 flex items-center mt-2 mb-2">
            <div className="h-px bg-gray-200 flex-1"></div>
            <button 
              type="button" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 bg-white border border-gray-200 rounded-full px-4 py-1.5 mx-4 shadow-sm transition-all flex items-center gap-2"
            >
              {showAdvanced ? '− Nascondi Opzioni Avanzate' : '+ Mostra Opzioni Avanzate (Vetri, Accessori, Traversi...)'}
            </button>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {showAdvanced && (
            <>
              {/* Opzioni Aggiuntive */}
              <div className="col-span-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-4">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border hover:border-blue-300 transition-colors shadow-sm">
                <input type="checkbox" checked={newItem.antaRibalta} onChange={e => updateItemField('antaRibalta', e.target.checked)} disabled={newItem.apertura?.toLowerCase() !== 'battente'} className="w-4 h-4 rounded text-blue-600" />
                <span className={`text-sm font-medium ${newItem.apertura?.toLowerCase() !== 'battente' ? 'text-gray-400' : 'text-gray-700'}`}>Anta a Ribalta</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border hover:border-blue-300 transition-colors shadow-sm">
                <input 
                  type="checkbox" 
                  checked={newItem.maniglioneAntipanico} 
                  onChange={e => updateItemField('maniglioneAntipanico', e.target.checked)} 
                  disabled={newItem.apertura?.toLowerCase() !== 'porta blindata'} 
                  className="w-4 h-4 rounded text-blue-600" 
                />
                <span className={`text-sm font-medium ${newItem.apertura?.toLowerCase() !== 'porta blindata' ? 'text-gray-400' : 'text-gray-700'}`}>Maniglione Antipanico</span>
              </label>

              {isPuntoAlluminio && (
                <div className="flex flex-col gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm w-full md:w-auto">
                  <span className="text-sm font-semibold text-gray-700">Fermavetro</span>
                  <select 
                    value={newItem.fermavetro || 'Squadrati'} 
                    onChange={e => updateItemField('fermavetro', e.target.value)}
                    className="h-8 rounded border border-gray-200 text-sm px-2 focus:border-blue-500"
                  >
                    <option value="Squadrati">Squadrato</option>
                    <option value="Arrotondati">Arrotondato</option>
                  </select>
                </div>
              )}
              
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border hover:border-blue-300 transition-colors shadow-sm">
                <input type="checkbox" checked={newItem.hasTraverso} onChange={e => updateItemField('hasTraverso', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Traverso Centrale</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border hover:border-blue-300 transition-colors shadow-sm">
                <input type="checkbox" checked={newItem.hasSopraluce} onChange={e => updateItemField('hasSopraluce', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Sopraluce</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border hover:border-blue-300 transition-colors shadow-sm">
                <input 
                  type="checkbox" 
                  checked={!!newItem.anteAsimmetriche} 
                  onChange={e => {
                    updateItemField('anteAsimmetriche', e.target.checked);
                    if (e.target.checked && (!newItem.anteWidths || newItem.anteWidths.length !== newItem.numAnte)) {
                      const count = newItem.numAnte || 1;
                      const defaultW = Math.round((newItem.width || 1000) / count);
                      updateItemField('anteWidths', Array(count).fill(defaultW));
                    }
                  }} 
                  className="w-4 h-4 rounded text-blue-600" 
                />
                <span className="text-sm font-medium text-gray-700">Ante Asimmetriche</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border hover:border-blue-300 transition-colors shadow-sm">
                <input type="checkbox" checked={!!newItem.maniglioneAntipanico} onChange={e => updateItemField('maniglioneAntipanico', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Maniglione Antipanico</span>
              </label>
            </div>

            {newItem.anteAsimmetriche && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                <Label className="w-full text-sm font-semibold text-gray-700">Larghezza Singole Ante (mm):</Label>
                {Array.from({ length: newItem.numAnte || 1 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-xs font-bold px-1 text-gray-500">A{i+1}</span>
                    <Input 
                      type="number" 
                      className="w-20 h-8 text-sm" 
                      value={newItem.anteWidths?.[i] || ''} 
                      onChange={e => {
                        const newWidths = [...(newItem.anteWidths || Array(newItem.numAnte || 1).fill(''))];
                        newWidths[i] = e.target.value;
                        updateItemField('anteWidths', newWidths);
                      }} 
                    />
                  </div>
                ))}
              </div>
            )}

            {isCustomImageEnabled && (
              <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-purple-200 shadow-sm mt-3">
                <Label className="text-sm font-bold text-purple-700 uppercase tracking-wide">📷 Foto Reale Infisso (Funzione Esclusiva)</Label>
                <div className="flex items-center gap-4 mt-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="text-sm w-full max-w-[250px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" 
                  />
                  {newItem.customImage && (
                    <button type="button" onClick={() => updateItemField('customImage', null)} className="text-sm text-red-600 font-bold hover:underline bg-red-50 px-3 py-1.5 rounded-full">
                      Rimuovi Foto
                    </button>
                  )}
                </div>
              </div>
            )}

            {!['Cassonetto', 'Tapparella', 'Porta Blindata'].includes(newItem.apertura) && (newItem.hasTraverso || newItem.hasSopraluce) && (
              <div className="flex flex-wrap gap-4 pt-3 border-t border-gray-200">
                {newItem.hasTraverso && (
                  <div className="flex flex-wrap items-center gap-3 bg-white p-2 px-3 rounded-lg border border-gray-200 shadow-sm">
                    <Label className="text-sm font-semibold text-gray-700">Alt. Traverso:</Label>
                    <Input type="number" value={newItem.traversoHeight} onChange={e => updateItemField('traversoHeight', e.target.value)} className="w-24 h-9" placeholder="mm" />
                    
                    {newItem.sistemaCamId && (
                      <>
                        <Label className="text-sm font-semibold text-gray-700 ml-2">Vetro Inf:</Label>
                        <select 
                          value={newItem.vetroInferioreId} 
                      onChange={e => {
                        updateItemField('vetroInferioreId', e.target.value);
                        const v = sistemiCam.find(s => s.id === e.target.value);
                        if (v) updateItemField('vetroInferioreNome', v.nome);
                        else updateItemField('vetroInferioreNome', '');
                      }} 
                      className="h-9 w-48 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium"
                    >
                      <option value="">-- Uguale al Sup. --</option>
                      {sistemiCam.filter(s => s.tipologia === 'VETRO').map(v => (
                        <option key={v.id} value={v.id}>{v.nome}</option>
                      ))}
                      <option value="custom">Pannello / Custom</option>
                        </select>
                      </>
                    )}
                  </div>
                )}
                {newItem.hasSopraluce && (
                  <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border border-gray-200 shadow-sm">
                    <Label className="text-sm font-semibold text-gray-700">Alt. Sopraluce:</Label>
                    <Input type="number" value={newItem.sopraluceHeight} onChange={e => updateItemField('sopraluceHeight', e.target.value)} className="w-24 h-9" placeholder="mm" />
                  </div>
                )}
              </div>
            )}
            </div>

            <div className="col-span-4 flex flex-col sm:flex-row items-center gap-4 bg-white border border-blue-100 rounded-xl p-3 mt-4 shadow-sm">
              <div className="flex-1">
                <Label className="text-blue-800 font-bold">Configurazione Aperture (Disegno Tecnico)</Label>
                <p className="text-xs text-blue-600 mt-0.5">Posiziona visivamente le maniglie sulle ante e simula le aperture</p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigurator(true)}
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-200 transition-colors"
              >
                <Settings2 size={16} /> Apri Disegno
              </button>
            </div>
            </>
          )}

          <div id="tour-step-1" className="col-span-4 flex flex-col sm:flex-row items-center gap-4 bg-purple-50 border border-purple-200 rounded-xl p-4 mt-6 shadow-sm">
              <div className="flex-1">
                <Label className="text-purple-900 font-black text-base flex items-center gap-2">
                  <span className="text-xl">📐</span> Modelli Preimpostati
                </Label>
                <p className="text-sm text-purple-700 mt-1 font-medium">Scegli una tipologia di finestra e compila le misure.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGallery && setShowGallery(true)}
                className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 font-bold px-6 py-3 rounded-xl text-sm transition-all hover:scale-105 shadow-md"
              >
                🎨 Scegli Modello
              </button>
            </div>
        </div>
      )}

      {itemType === 'complemento' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end bg-orange-50/30 p-5 rounded-xl border border-orange-100">
          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Tipo Complemento</Label>
            <select value={newItem.complementoType} onChange={e => updateItemField('complementoType', e.target.value)} className="mt-1.5 flex h-11 w-full rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm">
              <option value="Zanzariera">Zanzariera</option>
              <option value="Tapparella">Tapparella / Avvolgibile</option>
              <option value="Cassonetto">Cassonetto</option>
              <option value="Tenda">Tenda / Frangisole / Veneziana</option>
            </select>
          </div>
          <div className="col-span-2 md:col-span-2">
            <Label className="font-semibold text-gray-700">Materiale / Specifiche</Label>
            <Input type="text" value={newItem.complementoMaterial} onChange={e => updateItemField('complementoMaterial', e.target.value)} className="mt-1.5 h-11 rounded-xl" placeholder="es. Alluminio Coibentato" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Manovra</Label>
            <select value={newItem.complementoAction} onChange={e => updateItemField('complementoAction', e.target.value)} className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
              <option value="Molla">A Molla</option>
              <option value="Cinghia">A Cinghia</option>
              <option value="Motore">Motore Elettrico</option>
              <option value="Motore Radio">Motore con Telecomando</option>
              <option value="Fisso">Fisso</option>
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Larghezza (mm)</Label>
            <Input type="number" value={newItem.width} onChange={e => updateItemField('width', e.target.value)} className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Altezza (mm)</Label>
            <Input type="number" value={newItem.height} onChange={e => updateItemField('height', e.target.value)} className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Quantità</Label>
            <Input type="number" value={newItem.quantity} onChange={e => updateItemField('quantity', e.target.value)} className="mt-1.5 h-11 rounded-xl" />
          </div>
          {!isCustomerMode && (
            <div className="col-span-2 md:col-span-1">
              <Label className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1.5">
                Prezzo {newItem.complementoCalcType === 'fisso' ? 'Fisso' : 'al Mq'}
                <select value={newItem.complementoCalcType || 'mq'} onChange={e => updateItemField('complementoCalcType', e.target.value)} className="bg-transparent text-orange-600 font-bold ml-1 outline-none cursor-pointer">
                  <option value="mq">al mq</option>
                  <option value="fisso">fisso</option>
                </select>
              </Label>
              <Input type="number" step="0.01" value={newItem.unitPrice} onChange={e => updateItemField('unitPrice', e.target.value)} className="h-11 rounded-xl font-bold text-orange-700 bg-orange-50" />
            </div>
          )}
        </div>
      )}

      {itemType === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-emerald-50/30 p-5 rounded-xl border border-emerald-100">
          <div className="col-span-1 md:col-span-2">
            <Label className="font-semibold text-gray-700">Descrizione Libera</Label>
            <Input type="text" value={newItem.customDescription} onChange={e => updateItemField('customDescription', e.target.value)} className="mt-1.5 h-11 rounded-xl" placeholder="Es. Posa in opera, Trasporto..." />
          </div>
          <div className="col-span-1 md:col-span-1">
            <Label className="font-semibold text-gray-700">Prezzo Unitario (€)</Label>
            <Input type="number" step="0.01" value={newItem.unitPrice} onChange={e => updateItemField('unitPrice', e.target.value.replace(/^0+(?=\d)/, ''))} className="mt-1.5 h-11 rounded-xl font-bold text-emerald-700 bg-emerald-50" />
          </div>
          <div className="col-span-1 md:col-span-1">
            <Label className="font-semibold text-gray-700">Quantità</Label>
            <Input type="number" value={newItem.quantity} onChange={e => updateItemField('quantity', e.target.value.replace(/^0+(?=\d)/, ''))} className="mt-1.5 h-11 rounded-xl" />
          </div>
        </div>
      )}

      <div id="tour-step-4" className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
        {editingIndex !== null && (
          <Button onClick={handleCancelEdit} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50 h-11 px-6 rounded-xl font-semibold">
            Annulla
          </Button>
        )}
        <Button 
          onClick={handleAddItem} 
          className={`h-11 px-8 rounded-xl font-bold flex items-center gap-2 shadow-sm ${editingIndex !== null ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
        >
          {editingIndex !== null ? 'Salva Modifiche' : <><Plus size={18} /> Aggiungi Articolo</>}
        </Button>
      </div>
    </div>
  );
}
