import React from 'react';
import { calcolaUw, formattaUw } from '../../utils/trasmittanza';
import { mqTapparella, spiegaMqTapparella } from '../../utils/tapparella';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Palette, ChevronDown, ChevronRight } from 'lucide-react';
import { getFrameColorHex, getAccessoriHex } from '../../utils/colors';
import { isClientePuntoAlluminio } from '../../lib/personalizzazioni';
import TapparellePreventivoPanel from './TapparellePreventivoPanel';
import WindowConfigurator from '../WindowConfigurator';
import { moduloVuoto, larghezzaModuli, superficieModuli, moduliValidi } from '../../utils/composto';
import { ALTEZZA_BALCONE_MM, SENZA_VETRO } from '../../hooks/usePreventivo';

/**
 * I serramenti che si fanno di piu', a un clic. Dicono solo che cosa e' il
 * serramento: le misure non le toccano. Gli stessi valori dei modelli della
 * galleria, che resta per tutto il resto ("Altri modelli").
 */
const MODELLI_RAPIDI = [
  { nome: '1 anta', props: { apertura: 'Battente', numAnte: 1, hasTraverso: false } },
  { nome: '2 ante', props: { apertura: 'Battente', numAnte: 2, hasTraverso: false } },
  { nome: '3 ante', props: { apertura: 'Battente', numAnte: 3, hasTraverso: false } },
  { nome: 'PF 1 anta', props: { apertura: 'Battente', numAnte: 1, hasTraverso: true, traversoHeight: 1000 } },
  { nome: 'PF 2 ante', props: { apertura: 'Battente', numAnte: 2, hasTraverso: true, traversoHeight: 1000 } },
  { nome: 'Scorrevole', props: { apertura: 'Scorrevole', numAnte: 2, hasTraverso: false } },
  { nome: 'Fisso', props: { apertura: 'Fisso', numAnte: 1, hasTraverso: false } },
  { nome: 'Persiana', props: { apertura: 'Persiana', numAnte: 2, hasTraverso: false } },
  { nome: 'Blindata', props: { apertura: 'Porta Blindata', numAnte: 1, hasTraverso: false } },
];
const RIPULITI = { hasSopraluce: false, anteAsimmetriche: false };

// Le aperture che hanno un disegno su cui scegliere ante e maniglie.
const CON_DISEGNO = ['Battente', 'Scorrevole', 'Vasistas', 'Bilico', 'Persiana'];
// Dove traverso e sopraluce non hanno senso. Le persiane li possono avere;
// il vetro no (SENZA_VETRO, la stessa regola che toglie il vetro dal prezzo).
const SENZA_TRAVERSO = ['Cassonetto', 'Tapparella', 'Porta Blindata'];

export default function ItemConfigurator({
  itemType,
  setItemType,
  items = [],
  newItem,
  updateItemField,
  updateItemFields,
  sistemiCam,
  editingIndex,
  handleCancelEdit,
  handleAddItem,
  setShowGallery,
  applicaModello,
  paneConfigs = [],
  aggiornaAnte,
  isCustomerMode,
  userEmail
}) {
  // "Altro": le cose che si usano di rado. Si apre da solo quando si riapre
  // un articolo che ne usa qualcuna, cosi' niente resta nascosto.
  const [showAltro, setShowAltro] = React.useState(false);
  const altroInUso = [
    newItem.isManualBasePrice && 'prezzo base a mano',
    Number(newItem.manualMq) > 0 && 'quadratura a mano',
    newItem.anteAsimmetriche && 'ante asimmetriche',
    newItem.composto && 'composto',
    newItem.customImage && 'foto',
  ].filter(Boolean);
  React.useEffect(() => {
    if (editingIndex !== null && altroInUso.length) setShowAltro(true);
    // Solo quando si apre un articolo, non a ogni tasto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingIndex]);

  // Profilo, colori e vetri valgono per tutto il preventivo: scelti una
  // volta diventano una riga sola, e si riaprono con "Cambia".
  const [comuniAperti, setComuniAperti] = React.useState(() => !newItem.sistemaCamId && !newItem.marca);

  /**
   * Aggiunge l'articolo e, se e' entrato, rimette il cursore sulla prima
   * misura: il preventivo si compila in un giro solo di tastiera, senza
   * tornare al mouse fra un serramento e l'altro. Se il controllo ha
   * respinto l'articolo il cursore non si muove, altrimenti l'errore appena
   * mostrato scivolerebbe via.
   */
  const contenitore = React.useRef(null);
  const aggiungiERiparti = () => {
    if (!handleAddItem()) return;
    const primo = contenitore.current?.querySelector('[data-prima-misura]');
    if (!primo || primo.offsetParent === null) return;
    primo.focus();
    primo.select?.();
  };

  const isCustomImageEnabled = ['domenicopanico0303@gmail.com'].includes(userEmail);
  const isPuntoAlluminio = isClientePuntoAlluminio(userEmail);

  /**
   * Invio passa al campo successivo. Si prendono le misure da un foglio e si
   * digita a raffica: tornare al mouse fra larghezza e altezza, per venti
   * serramenti, sono venti interruzioni.
   *
   * Nella riga delle misure l'Invio resta nella riga: larghezza, altezza,
   * quantita' e poi il pulsante Aggiungi, senza premerlo (preme chi vuole,
   * con un altro Invio). Il totale si salta: arriva dall'archivio e si
   * corregge a mano di rado. Chi scrive il prezzo a corpo (Punto Alluminio)
   * dalla quantita' passa invece al totale.
   *
   * Sta sul contenitore e non sui singoli campi perche' cosi' vale anche per
   * quelli che si aggiungono da soli quando cambi tipo di articolo.
   */
  const invioVaAvanti = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const campo = e.target;
    // Nelle note si va a capo, e i pulsanti hanno gia' il loro Invio.
    if (!campo.matches('input:not([type="checkbox"]):not([type="radio"]), select')) return;
    e.preventDefault();
    const aggiungi = e.currentTarget.querySelector('[data-aggiungi]');
    const misura = campo.getAttribute('data-misura');
    if (misura) {
      if (misura === 'totale' || (misura === 'qta' && !isPuntoAlluminio)) {
        aggiungi?.focus();
        return;
      }
      const riga = [...e.currentTarget.querySelectorAll('[data-misura]')].filter((c) => c.offsetParent !== null);
      const dopo = riga[riga.indexOf(campo) + 1];
      if (dopo) { dopo.focus(); dopo.select?.(); } else aggiungi?.focus();
      return;
    }
    const tutti = [...e.currentTarget.querySelectorAll('input, select, textarea')]
      .filter((c) => !c.disabled && !c.readOnly && c.type !== 'hidden' && c.offsetParent !== null);
    const prossimo = tutti[tutti.indexOf(campo) + 1];
    if (prossimo) {
      prossimo.focus();
      if (typeof prossimo.select === 'function') prossimo.select();
      return;
    }
    aggiungi?.focus();
  };

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

  // Accendendo il maniglione si parte dall'anta che ha la maniglia (quella
  // che apre per prima): e' quasi sempre li' che va, e si puo' cambiare.
  const attivaManiglione = (acceso) => {
    updateItemField('maniglioneAntipanico', acceso);
    if (acceso) {
      const ante = Math.max(1, Number(newItem.numAnte) || 1);
      updateItemField('maniglioneAnte', [newItem.handlePosition === 'left' ? 0 : ante - 1]);
    }
  };

  const sistema = sistemiCam.find((s) => s.id === newItem.sistemaCamId);
  const vetriInArchivio = (scelto) => sistemiCam.filter((s) => s.tipologia === 'VETRO' && (s.specs?.nel_preventivo !== false || s.id === scelto));
  const nomeVetro = (id) => sistemiCam.find((s) => s.id === id)?.nome;
  // Il campo colore tiene anche l'esadecimale del selettore: quello non e'
  // un nome di colore da far leggere.
  const coloreScritto = /^#|^[0-9a-fA-F]{6}$/.test(String(newItem.frameColor || '').trim()) ? '' : String(newItem.frameColor || '').trim();
  const conVetro = !!newItem.sistemaCamId && !SENZA_VETRO.includes(newItem.apertura);
  const balcone = Number(newItem.height) >= ALTEZZA_BALCONE_MM;
  const modelloAttivo = (m) => !newItem.composto
    && m.props.apertura === newItem.apertura
    && Number(m.props.numAnte) === Number(newItem.numAnte)
    && !!m.props.hasTraverso === !!newItem.hasTraverso;

  // Il prezzo base: col profilo arriva dall'archivio e si tocca di rado, e
  // sta in "Altro". Senza profilo e' l'unica leva sul prezzo, e sta accanto
  // alle misure: nascosto, un utente nuovo vedrebbe 500 €/m² senza sapere
  // da dove vengono.
  const mostraPrezzoBase = !isCustomerMode && !isPuntoAlluminio;
  const campoPrezzoBase = (
    <div>
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
  );
  const prezzoBaseInRiga = mostraPrezzoBase && !newItem.sistemaCamId;

  const classeSelect = 'mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:border-blue-300 transition-colors';

  return (
    <div ref={contenitore} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100" onKeyDown={invioVaAvanti}>
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
          onClick={() => setItemType('tapparelle')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${itemType === 'tapparelle' ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          Tapparelle al m²
        </button>
        <button
          onClick={() => setItemType('custom')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${itemType === 'custom' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          Voce Libera
        </button>
      </div>

      {itemType === 'window' && (
        <div className="space-y-6">

          {/* ── 1. Uguale per tutto il preventivo ── */}
          <section id="tour-step-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Uguale per tutto il preventivo</p>
            {!comuniAperti ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm">
                <span className="font-semibold text-gray-800">{sistema ? `${sistema.nome}${sistema.marca ? ` (${sistema.marca})` : ''}` : (newItem.marca || 'Configurazione manuale')}</span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <span className="inline-block w-3.5 h-3.5 rounded border border-gray-300" style={{ background: newItem.previewColor || getFrameColorHex(newItem.frameColor) }} />
                  {coloreScritto || 'colore non scritto'}
                </span>
                {newItem.sistemaCamId && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-700">Finestre: <span className="text-gray-500">{nomeVetro(newItem.vetroFinestreId) || 'vetro per serramento'}</span></span>
                    {newItem.vetroBalconiId && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-700">Balconi: <span className="text-gray-500">{nomeVetro(newItem.vetroBalconiId)}</span></span>
                      </>
                    )}
                  </>
                )}
                {newItem.accessoriColore && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500">Accessori {newItem.accessoriColore}</span>
                  </>
                )}
                <button type="button" onClick={() => setComuniAperti(true)} className="ml-auto rounded-lg border border-gray-200 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50">
                  Cambia
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                <div className="col-span-2">
                  <Label className="text-blue-700 font-bold">Sistema / Profilo</Label>
                  <select
                    value={newItem.sistemaCamId}
                    onChange={e => updateItemField('sistemaCamId', e.target.value)}
                    className="mt-1.5 flex h-11 w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-2 text-sm font-semibold hover:border-blue-300 focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Configurazione Manuale --</option>
                    {/* Solo i profili scelti in Archivio ("Scegli i profili del
                        preventivo"), piu' quello gia' assegnato a questo articolo,
                        altrimenti riaprendo un articolo vecchio il menu lo perderebbe. */}
                    {sistemiCam.filter(s => s.tipologia !== 'VETRO' && (s.specs?.nel_preventivo !== false || s.id === newItem.sistemaCamId)).map(s => (
                      <option key={s.id} value={s.id}>{s.nome} ({s.marca})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <Label className="font-semibold text-gray-700">Marca / Profilo</Label>
                  <Input
                    type="text"
                    value={newItem.marca || ''}
                    onChange={e => updateItemField('marca', e.target.value)}
                    placeholder="Es. Schuco, Ponzio..."
                    className="mt-1.5 h-11 rounded-xl bg-white"
                  />
                </div>
                <div className="col-span-1 relative">
                  <Label className="font-semibold text-gray-700">Colore Infisso</Label>
                  <div className="relative mt-1.5 flex items-center">
                    <Input
                      type="text"
                      value={newItem.frameColor || ''}
                      onChange={e => {
                        updateItemField('frameColor', e.target.value);
                        updateItemField('previewColor', null); // Reset custom color when text changes
                      }}
                      placeholder="Es. RAL 9010, Noce..."
                      className="h-11 rounded-xl pr-10 bg-white"
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

                {newItem.sistemaCamId && (
                  <>
                    <div className="col-span-2">
                      <Label className="text-emerald-700 font-bold">Vetro delle finestre</Label>
                      <select value={newItem.vetroFinestreId || ''} onChange={e => updateItemField('vetroFinestreId', e.target.value)}
                        className="mt-1.5 flex h-11 w-full rounded-xl border-2 border-emerald-200 bg-white px-4 py-2 text-sm hover:border-emerald-300 focus:border-emerald-500 transition-colors">
                        <option value="">-- Si sceglie serramento per serramento --</option>
                        {vetriInArchivio(newItem.vetroFinestreId).map(v => (
                          <option key={v.id} value={v.id}>{v.nome} (+{v.base_price}€/mq)</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-emerald-700 font-bold">Vetro dei balconi <span className="font-normal text-gray-500">(da {ALTEZZA_BALCONE_MM / 1000} m di altezza in su)</span></Label>
                      <select value={newItem.vetroBalconiId || ''} onChange={e => updateItemField('vetroBalconiId', e.target.value)}
                        className="mt-1.5 flex h-11 w-full rounded-xl border-2 border-emerald-200 bg-white px-4 py-2 text-sm hover:border-emerald-300 focus:border-emerald-500 transition-colors">
                        <option value="">-- Uguale a quello delle finestre --</option>
                        {vetriInArchivio(newItem.vetroBalconiId).map(v => (
                          <option key={v.id} value={v.id}>{v.nome} (+{v.base_price}€/mq)</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="col-span-2">
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
                      className="h-11 rounded-xl pr-10 bg-white"
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
                <div className="col-span-2 flex items-end justify-end h-full">
                  <button type="button" onClick={() => setComuniAperti(false)} className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700">
                    Fatto
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ── 2. Che cosa è ── */}
          <section id="tour-step-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Che cosa è</p>
            <div className="flex flex-wrap gap-2">
              {MODELLI_RAPIDI.map((m) => (
                <button
                  key={m.nome}
                  type="button"
                  onClick={() => applicaModello({ ...RIPULITI, ...m.props })}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold border transition-colors ${modelloAttivo(m) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-700'}`}
                >
                  {m.nome}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowGallery && setShowGallery(true)}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold border border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1.5"
              >
                <Palette size={14} /> Altri modelli…
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div className="w-56">
                <Label className="text-xs font-semibold text-gray-600">Apertura</Label>
                <select
                  value={newItem.apertura}
                  onChange={e => updateItemField('apertura', e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium hover:border-blue-300 transition-colors"
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
              <div className="w-24">
                <Label className="text-xs font-semibold text-gray-600">Ante</Label>
                <Input type="number" min="1" max="6" value={newItem.numAnte} onChange={e => updateItemField('numAnte', parseInt(e.target.value) || 1)} className="mt-1 h-10 rounded-xl" />
              </div>
            </div>
          </section>

          {/* ── 3. Misure ── */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Misure</p>
            <div className={`grid grid-cols-2 ${prezzoBaseInRiga ? 'md:grid-cols-[repeat(5,minmax(0,1fr))_auto]' : 'md:grid-cols-[repeat(4,minmax(0,1fr))_auto]'} gap-4 items-end`}>
              <div id="tour-step-2">
                <Label className="font-semibold text-gray-700">Larghezza (mm)</Label>
                <Input data-prima-misura data-misura="larghezza" type="number" value={newItem.width} onChange={e => updateItemField('width', e.target.value.replace(/^0+(?=\d)/, ''))} className="mt-1.5 h-11 rounded-xl font-medium" />
              </div>
              <div>
                <Label className="font-semibold text-gray-700">Altezza (mm)</Label>
                <Input data-misura="altezza" type="number" value={newItem.height} onChange={e => updateItemField('height', e.target.value.replace(/^0+(?=\d)/, ''))} className="mt-1.5 h-11 rounded-xl font-medium" />
              </div>
              <div>
                <Label className="font-semibold text-gray-700">Quantità</Label>
                <Input data-misura="qta" type="number" value={newItem.quantity} onChange={e => updateItemField('quantity', e.target.value.replace(/^0+(?=\d)/, ''))} className="mt-1.5 h-11 rounded-xl" />
              </div>
              {prezzoBaseInRiga && campoPrezzoBase}
              <div>
                <Label className="font-semibold text-gray-700">Totale (€)</Label>
                <Input data-misura="totale" type="number" step="0.01" value={newItem.unitPrice} onChange={e => {
                  const valore = e.target.value.replace(/^0+(?=\d)/, '');
                  // Dove il totale vale anche come prezzo base, i due campi vanno
                  // scritti insieme: due chiamate in fila facevano ripartire il
                  // calcolo a ogni tasto, che riscriveva "5.00" e impediva di
                  // arrivare a "500".
                  if (isPuntoAlluminio) updateItemFields({ unitPrice: valore, basePrice: valore, isManualBasePrice: true });
                  else updateItemField('unitPrice', valore);
                }} className="mt-1.5 h-11 rounded-xl font-bold text-green-700 bg-green-50 border-green-200" />
              </div>
              <div id="tour-step-4" className="col-span-2 md:col-span-1 flex gap-2">
                {editingIndex !== null && (
                  <Button onClick={handleCancelEdit} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50 h-11 px-4 rounded-xl font-semibold">
                    Annulla
                  </Button>
                )}
                <Button
                  onClick={aggiungiERiparti}
                  data-aggiungi
                  className={`h-11 px-6 rounded-xl font-bold flex items-center gap-2 shadow-sm ${editingIndex !== null ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
                >
                  {editingIndex !== null ? 'Salva Modifiche' : <><Plus size={18} /> Aggiungi</>}
                </Button>
              </div>
            </div>
            {newItem.sistemaCamId && (() => {
              // La Uw che finira' nel preventivo, calcolata sulle misure di
              // questo articolo. Se non si puo' calcolare si dice perche'.
              const t = calcolaUw(newItem, sistemiCam);
              return (
                <p className="mt-2 text-xs text-gray-600">
                  {t.uw != null ? (
                    <>Trasmittanza <b>Uw {formattaUw(t.uw)}</b>
                      <span className="text-gray-400"> · Ug {String(t.ug).replace('.', ',')} · Uf {String(t.uf).replace('.', ',')}{t.stimata ? ' · profili a vista stimati' : ''}</span>
                    </>
                  ) : (
                    <span className="text-amber-700">Uw non calcolabile: {t.motivo}</span>
                  )}
                </p>
              );
            })()}
          </section>

          {/* ── Disegno: ante, maniglie, traverso, sopraluce, vetro di questo pezzo ── */}
          <section className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 space-y-4">
            {!newItem.composto && CON_DISEGNO.includes(newItem.apertura) && aggiornaAnte && (
              <WindowConfigurator
                inline
                numAnte={newItem.numAnte}
                apertura={newItem.apertura}
                hasTraverso={!!newItem.hasTraverso}
                traversoHeight={newItem.traversoHeight}
                height={newItem.height}
                frameColor={newItem.previewColor || newItem.frameColor}
                maniglioneAntipanico={!!newItem.maniglioneAntipanico}
                maniglioneAnte={newItem.maniglioneAnte}
                paneConfigs={paneConfigs}
                onChange={aggiornaAnte}
              />
            )}

            <div className="flex flex-wrap gap-3">
              {/* Il maniglione delle porte blindate: il loro disegno non ha
                  ante da toccare, quindi resta la spunta. Sulle altre aperture
                  il maniglione si accende nel disegno, sull'anta che lo porta. */}
              {newItem.apertura?.toLowerCase() === 'porta blindata' && (
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border hover:border-blue-300 transition-colors shadow-sm">
                  <input
                    type="checkbox"
                    checked={!!newItem.maniglioneAntipanico}
                    onChange={e => attivaManiglione(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Maniglione Antipanico</span>
                </label>
              )}
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border hover:border-blue-300 transition-colors shadow-sm">
                <input type="checkbox" checked={!!newItem.hasTraverso} onChange={e => updateItemField('hasTraverso', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Traverso Centrale</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border hover:border-blue-300 transition-colors shadow-sm">
                <input type="checkbox" checked={!!newItem.hasSopraluce} onChange={e => updateItemField('hasSopraluce', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Sopraluce</span>
              </label>
              {!!newItem.maniglioneAntipanico && newItem.apertura?.toLowerCase() !== 'porta blindata' && (
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <span className="text-sm font-medium text-amber-800">
                    Maniglione antipanico sull&#39;anta {Array.isArray(newItem.maniglioneAnte) && newItem.maniglioneAnte.length
                      ? newItem.maniglioneAnte.map((i) => i + 1).join(', ')
                      : '1'}
                  </span>
                  <span className="text-xs text-amber-600">— si cambia nel disegno</span>
                </div>
              )}
            </div>

            {!SENZA_TRAVERSO.includes(newItem.apertura) && (newItem.hasTraverso || newItem.hasSopraluce) && (
              <div className="flex flex-wrap gap-4">
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
                          {vetriInArchivio(newItem.vetroInferioreId).map(v => (
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
                    {/* Il sopraluce puo' essere diviso in piu' vetri fissi:
                        nella P01 degli abachi sono due sopra la portafinestra. */}
                    <Label className="text-sm font-semibold text-gray-700">Divisioni:</Label>
                    <Input type="number" min="1" max="6" value={newItem.sopraluceDivisioni ?? 1} onChange={e => updateItemField('sopraluceDivisioni', e.target.value)} className="w-16 h-9" />
                  </div>
                )}
              </div>
            )}

            {conVetro && (
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-full md:w-96">
                  <Label className="text-emerald-700 font-bold">Vetro di questo serramento {newItem.hasTraverso ? '(Superiore)' : ''}</Label>
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
                    className="mt-1.5 flex h-11 w-full rounded-xl border-2 border-emerald-200 bg-white px-4 py-2 text-sm hover:border-emerald-300 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">-- Nessun Vetro --</option>
                    {/* Solo i vetri tenuti nel preventivo (Archivio > Vetri), piu' quello
                        gia' scelto per questo articolo. */}
                    {vetriInArchivio(newItem.vetroId).map(v => (
                      <option key={v.id} value={v.id}>{v.nome} (+{v.base_price}€/mq)</option>
                    ))}
                    <option value="custom">-- Vetro Personalizzato --</option>
                  </select>
                </div>
                {newItem.vetroId === 'custom' && (
                  <div className="flex gap-2">
                    <Input type="text" value={newItem.vetro} onChange={e => updateItemField('vetro', e.target.value)} placeholder="Nome vetro..." className="h-11 border-emerald-300 rounded-lg bg-white w-56" />
                    {/* Senza la Ug di un vetro scritto a mano la Uw non si puo'
                        calcolare: la si chiede qui, accanto al nome. */}
                    <Input type="text" inputMode="decimal" value={newItem.vetroUg || ''} onChange={e => updateItemField('vetroUg', e.target.value)} placeholder="Ug W/m²K" title="Trasmittanza del vetro (Ug), dalla scheda del fornitore" className="h-11 w-28 border-emerald-300 rounded-lg bg-white" />
                  </div>
                )}
                {(newItem.vetroFinestreId || newItem.vetroBalconiId) && (
                  <p className="text-xs text-gray-500 pb-3">
                    {newItem.vetroScelto ? (
                      <>Scelto a mano per questo serramento ·{' '}
                        <button type="button" onClick={() => updateItemField('vetroScelto', false)} className="font-semibold text-blue-700 hover:underline">torna a quello del preventivo</button>
                      </>
                    ) : (
                      balcone && newItem.vetroBalconiId ? 'Vetro dei balconi: è alto 2 metri o più' : 'Vetro delle finestre'
                    )}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ── Altro: le cose che si usano di rado ── */}
          <section className="rounded-xl border border-gray-200">
            <button type="button" onClick={() => setShowAltro(!showAltro)} className="w-full flex items-center gap-2 px-4 py-3 text-left">
              {showAltro ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
              <span className="text-sm font-bold text-gray-700">Altro</span>
              {altroInUso.length > 0 ? (
                <span className="flex flex-wrap gap-1.5">
                  {altroInUso.map((t) => (
                    <span key={t} className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{t}</span>
                  ))}
                </span>
              ) : (
                <span className="text-xs text-gray-400">{newItem.sistemaCamId && mostraPrezzoBase ? 'prezzo base, ' : ''}quadratura a mano, ante asimmetriche, serramento composto{isCustomImageEnabled ? ', foto' : ''}</span>
              )}
            </button>

            {showAltro && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  {mostraPrezzoBase && newItem.sistemaCamId && campoPrezzoBase}
                  <div>
                    <Label className="font-semibold text-gray-700">Quadratura (mq)</Label>
                    <Input type="number" step="0.01" value={newItem.manualMq || ''} onChange={e => updateItemField('manualMq', e.target.value)} placeholder="Auto" className="mt-1.5 h-11 rounded-xl font-medium" />
                  </div>
                  {isPuntoAlluminio && (
                    <div>
                      <Label className="font-semibold text-gray-700">Fermavetro</Label>
                      <select
                        value={newItem.fermavetro || 'Squadrati'}
                        onChange={e => updateItemField('fermavetro', e.target.value)}
                        className={classeSelect}
                      >
                        <option value="Squadrati">Squadrato</option>
                        <option value="Arrotondati">Arrotondato</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border hover:border-blue-300 transition-colors shadow-sm">
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
                  {newItem.anteAsimmetriche && (
                    <div className="flex flex-wrap gap-2 pt-3">
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
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded"
                      checked={!!newItem.composto}
                      onChange={(e) => {
                        // Prima i moduli, poi il flag: 'composto' passa dal ricalcolo
                        // del prezzo e deve trovare l'articolo gia' completo.
                        if (e.target.checked && !(newItem.moduli || []).length) {
                          updateItemField('moduli', [moduloVuoto(), moduloVuoto()]);
                        }
                        updateItemField('composto', e.target.checked);
                      }}
                    />
                    <span>
                      <span className="block text-sm font-bold text-gray-800">Serramento composto</span>
                      <span className="block text-xs text-gray-500">
                        Piu' serramenti uniti da un profilo di accoppiamento, preventivati come un pezzo solo.
                        Larghezza e altezza delle misure sono la misura d&#39;ingombro, ed e&#39; su quella che si calcola il prezzo.
                      </span>
                    </span>
                  </label>
                  {newItem.composto && (() => {
                    const moduli = newItem.moduli || [];
                    const aggiorna = (i, patch) => updateItemField('moduli', moduli.map((m, k) => (k === i ? { ...m, ...patch } : m)));
                    const occupata = larghezzaModuli(moduli, newItem.accoppiamentoMm);
                    const ingombro = Number(newItem.width) || 0;
                    const scarto = ingombro ? occupata - ingombro : 0;
                    const supModuli = superficieModuli(moduli);
                    const supIngombro = (ingombro * (Number(newItem.height) || 0)) / 1000000;
                    return (
                      <div className="mt-4 space-y-3">
                        {moduli.map((m, i) => (
                          <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
                            <span className="text-xs font-bold text-gray-400 w-12 pb-2.5">Mod. {i + 1}</span>
                            <div className="w-24">
                              <Label className="text-[11px] font-semibold text-gray-600">Largh. (mm)</Label>
                              <Input type="number" value={m.larghezza} onChange={(e) => aggiorna(i, { larghezza: e.target.value })} className="mt-1 h-9 rounded-lg" />
                            </div>
                            <div className="w-24">
                              <Label className="text-[11px] font-semibold text-gray-600">Alt. (mm)</Label>
                              <Input type="number" value={m.altezza} onChange={(e) => aggiorna(i, { altezza: e.target.value })} className="mt-1 h-9 rounded-lg" />
                            </div>
                            <div className="w-32">
                              <Label className="text-[11px] font-semibold text-gray-600">Apertura</Label>
                              <select value={m.apertura} onChange={(e) => aggiorna(i, { apertura: e.target.value })}
                                className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm">
                                <option value="Battente">Battente</option>
                                <option value="Scorrevole">Scorrevole</option>
                                <option value="Fisso">Fisso</option>
                              </select>
                            </div>
                            <div className="w-20">
                              <Label className="text-[11px] font-semibold text-gray-600">Ante</Label>
                              <Input type="number" min="1" max="6" value={m.numAnte} onChange={(e) => aggiorna(i, { numAnte: Number(e.target.value) || 1 })} className="mt-1 h-9 rounded-lg" />
                            </div>
                            <div className="w-32">
                              <Label className="text-[11px] font-semibold text-gray-600">Appoggiato</Label>
                              <select value={m.ancoraggio || 'basso'} onChange={(e) => aggiorna(i, { ancoraggio: e.target.value })}
                                className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm">
                                <option value="basso">In basso</option>
                                <option value="alto">In alto</option>
                              </select>
                            </div>
                            {moduli.length > 2 && (
                              <button type="button" onClick={() => updateItemField('moduli', moduli.filter((_, k) => k !== i))}
                                className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:text-red-600 hover:border-red-200">
                                Togli
                              </button>
                            )}
                          </div>
                        ))}

                        <div className="flex flex-wrap items-center gap-3">
                          <button type="button" onClick={() => updateItemField('moduli', [...moduli, moduloVuoto()])}
                            className="h-9 px-4 rounded-lg border-2 border-dashed border-slate-300 text-xs font-bold text-gray-500 hover:border-blue-300 hover:text-blue-600">
                            + Aggiungi modulo
                          </button>
                          <div className="flex items-center gap-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">Accoppiamento (mm)</Label>
                            <Input type="number" value={newItem.accoppiamentoMm ?? 30}
                              onChange={(e) => updateItemField('accoppiamentoMm', e.target.value === '' ? '' : Number(e.target.value))}
                              className="h-9 w-20 rounded-lg" />
                          </div>
                        </div>

                        {moduliValidi(moduli).length > 0 && (
                          <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Larghezza dei moduli con gli accoppiamenti</span>
                              <span className={`font-bold ${Math.abs(scarto) > 2 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {occupata} mm{ingombro ? ` su ${ingombro}` : ''}
                                {ingombro && Math.abs(scarto) > 2 ? ` · ${scarto > 0 ? 'sfora di' : 'mancano'} ${Math.abs(scarto)} mm` : ''}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-1">
                              <span>Superficie vera dei moduli</span>
                              <span className="font-bold text-gray-800">{supModuli.toFixed(2).replace('.', ',')} m²</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Quadratura d&#39;ingombro, quella che paga</span>
                              <span className="font-bold text-gray-800">{supIngombro.toFixed(2).replace('.', ',')} m²</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {isCustomImageEnabled && (
                  <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
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
              </div>
            )}
          </section>
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
            <Input data-prima-misura type="number" value={newItem.width} onChange={e => updateItemField('width', e.target.value)} className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Altezza (mm)</Label>
            <Input type="number" value={newItem.height} onChange={e => updateItemField('height', e.target.value)} className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="font-semibold text-gray-700">Quantità</Label>
            <Input type="number" value={newItem.quantity} onChange={e => updateItemField('quantity', e.target.value)} className="mt-1.5 h-11 rounded-xl" />
          </div>
          {newItem.complementoType === 'Tapparella' && (
            <div className="col-span-2 md:col-span-1">
              <Label className="font-semibold text-gray-700">Ante del serramento</Label>
              <select value={Number(newItem.tapparellaAnte) > 0 ? newItem.tapparellaAnte : ''} onChange={e => updateItemField('tapparellaAnte', e.target.value === '' ? null : Number(e.target.value))} className="mt-1.5 flex h-11 w-full rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm">
                {/* Solo per le tapparelle dei preventivi vecchi, salvate prima
                    della regola con avvolgimento e minimi. */}
                {!(Number(newItem.tapparellaAnte) > 0) && <option value="">Calcolo precedente (L × H)</option>}
                <option value={1}>1 anta (min. 1,5 m²)</option>
                <option value={2}>2 ante (min. 2 m²)</option>
                <option value={3}>3 ante (min. 2,5 m²)</option>
                <option value={4}>4 ante o più (min. 3 m²)</option>
              </select>
            </div>
          )}
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
          {newItem.complementoType === 'Tapparella' && newItem.complementoCalcType !== 'fisso' && Number(newItem.tapparellaAnte) > 0 && (() => {
            // Il conto che finira' nel preventivo, scritto per esteso: si vede
            // subito l'avvolgimento e se scatta il minimo.
            const r = mqTapparella({ ...newItem, numAnte: newItem.tapparellaAnte });
            if (!r.mqFatturati) return null;
            const totale = r.mqFatturati * (Number(newItem.unitPrice) || 0);
            return (
              <p className="col-span-2 md:col-span-4 text-sm text-orange-900 bg-white border border-orange-100 rounded-lg px-3 py-2">
                {spiegaMqTapparella(r, newItem.tapparellaAnte)} fatturati
                {Number(newItem.unitPrice) > 0 && <> × {Number(newItem.unitPrice).toFixed(2).replace('.', ',')} € = <b>{totale.toFixed(2).replace('.', ',')} €</b></>}
                <span className="block text-xs text-orange-700/80">Altezza +20 cm per l&#39;avvolgimento. Motore, guide e cassonetto vanno come voci separate.</span>
              </p>
            );
          })()}
        </div>
      )}

      {itemType === 'tapparelle' && (
        <TapparellePreventivoPanel
          items={items}
          newItem={newItem}
          updateItemField={updateItemField}
          isCustomerMode={isCustomerMode}
        />
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
            {/* Quantita' con i decimali e unita' di misura: una voce libera
                puo' essere 12,50 m² di posa, non solo un numero di pezzi. */}
            <div className="mt-1.5 flex gap-2">
              <Input type="text" inputMode="decimal" value={newItem.quantity} onChange={e => updateItemField('quantity', e.target.value.replace(/[^\d.,]/g, ''))} className="h-11 rounded-xl min-w-0" />
              <select value={newItem.unitaVoce || 'pz'} onChange={e => updateItemField('unitaVoce', e.target.value)} className="h-11 rounded-xl border border-input bg-white px-2 text-sm font-semibold text-gray-700 shrink-0" aria-label="Unità di misura">
                <option value="pz">pz</option>
                <option value="m²">m²</option>
                <option value="ml">ml</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Note del singolo articolo: quelle in fondo al preventivo valgono per
          tutto il lavoro, ma "questa finestra va sul lato strada, misura da
          verificare dopo lo smontaggio" riguarda un pezzo solo e deve stare
          scritta accanto a quel pezzo. */}
      <div className="mt-5">
        <Label className="font-semibold text-gray-700">Note su questo articolo</Label>
        <textarea
          rows={2}
          value={newItem.noteArticolo || ''}
          onChange={e => updateItemField('noteArticolo', e.target.value)}
          placeholder="Es. misura da verificare dopo lo smontaggio · soglia ribassata · colore diverso all'esterno"
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
        />
      </div>

      {/* Sul serramento il pulsante sta nella riga delle misure, dove arriva
          l'Invio; qui resta per gli altri tipi di articolo. */}
      {itemType !== 'window' && (
      <div id="tour-step-4" className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
        {editingIndex !== null && (
          <Button onClick={handleCancelEdit} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50 h-11 px-6 rounded-xl font-semibold">
            Annulla
          </Button>
        )}
        <Button
          onClick={aggiungiERiparti}
          data-aggiungi
          className={`h-11 px-8 rounded-xl font-bold flex items-center gap-2 shadow-sm ${editingIndex !== null ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
        >
          {editingIndex !== null ? 'Salva Modifiche' : <><Plus size={18} /> Aggiungi Articolo</>}
        </Button>
      </div>
      )}
    </div>
  );
}
