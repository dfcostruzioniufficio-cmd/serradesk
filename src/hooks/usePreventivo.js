import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { calculateWindowPrice, calculateTransmittance, calculateQuoteSummary, syncFrameColor, calculateItemMq } from './usePricingEngine';
import { autoSeedProfilesIfNeeded } from '../lib/defaultProfiles';

export function usePreventivo(isRestoring, setIsRestoring) {
  const [clientName, setClientName] = useState('');
  const [items, setItems] = useState([]);
  const [itemType, setItemType] = useState('window'); // 'window' or 'custom' or 'complemento'
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingOrderStato, setEditingOrderStato] = useState('Bozza');
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [paneConfigs, setPaneConfigs] = useState([{ handleEdge: 'right' }]);
  const [editingIndex, setEditingIndex] = useState(null);
  const skipPaneResetRef = useRef(false);

  const defaultNewItem = {
    apertura: 'Battente', numAnte: 1, hasTraverso: false, traversoHeight: 1000,
    vetroInferioreId: '', hasSopraluce: false, sopraluceHeight: '', handlePosition: 'Centrale',
    width: '', height: '', quantity: 1, frameColor: '#ffffff', colorName: '',
    sistemaCamId: '', complementoAction: 'Molla', complementoCalcType: 'mq',
    marca: '', vetro: '', trasmittanza: '', calcType: 'mq', basePrice: 500.00, accessoriColore: ''
  };

  const [newItem, setNewItem] = useState(defaultNewItem);
  const [iva, setIva] = useState(22);
  const [barLength, setBarLength] = useState(6500);
  const [sistemiCam, setSistemiCam] = useState([]);
  const [sconto, setSconto] = useState(0);
  const [clientData, setClientData] = useState({ address: '', vat: '', phone: '', email: '' });

  // Load sistemi
  useEffect(() => {
    const fetchSistemiCam = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const seeded = await autoSeedProfilesIfNeeded(session.user.id);
      // If we seeded new profiles, the subsequent fetch will catch them

      const { data, error } = await supabase.from('sistemi_cam').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (!error && data) setSistemiCam(data);
    };
    fetchSistemiCam();
  }, []);

  // Autosave Draft
  useEffect(() => {
    if (isRestoring) return;
    if (clientName.trim() || items.length > 0) {
      const draft = {
        clientName, editingOrderId, editingOrderStato,
        items: [...items, { type: 'metadata', discount: Number(sconto) || 0, clientData }]
      };
      localStorage.setItem('sd_draft_preventivo', JSON.stringify(draft));
    } else {
      localStorage.removeItem('sd_draft_preventivo');
    }
  }, [clientName, items, sconto, clientData, editingOrderId, editingOrderStato, isRestoring]);

  // Removed sd_draft_form saving

  // Sync pane configs
  useEffect(() => {
    if (skipPaneResetRef.current) {
      skipPaneResetRef.current = false;
      return;
    }
    const count = Math.max(1, Math.min(6, Number(newItem.numAnte) || 1));
    // Di default la maniglia va sull'anta più a destra (l'ultima), che è
    // quella più usata. In precedenza, crescendo da 1 a più ante, l'anta
    // di sinistra si teneva la maniglia ereditata da quando era l'unica
    // anta, e quella nuova restava senza.
    setPaneConfigs(() => Array.from({ length: count }, (_, i) => ({
      handleEdge: i === count - 1 ? 'right' : null
    })));
  }, [newItem.numAnte]);

  const updateItemField = (field, value) => {
    setNewItem(prevItem => {
      let updatedItem = { ...prevItem, [field]: value };

      if (field === 'sistemaCamId' && value) {
        const s = sistemiCam.find(sys => sys.id === value);
        if (s) {
          updatedItem.apertura = s.tipologia === 'FISSO' ? 'Fisso' : s.tipologia === 'SCORREVOLE' ? 'Scorrevole' : s.tipologia === 'TAPPARELLA' ? 'Tapparella' : s.tipologia === 'CASSONETTO' ? 'Cassonetto' : s.tipologia === 'PORTA_BLINDATA' ? 'Porta Blindata' : 'Battente';
          updatedItem.marca = s.marca || '';
          updatedItem.vetro = s.specs?.vetro || '';
          updatedItem.trasmittanza = s.specs?.trasmittanza || '';
          updatedItem.accessoriColore = s.specs?.accessori || '';
          updatedItem.calcType = s.calc_type || s.calcType || 'mq';
          updatedItem.basePrice = Number(s.base_price || s.basePrice || 0);
          updatedItem.isManualBasePrice = false;
        }
      }

      if (['vetroId', 'vetroInferioreId'].includes(field)) {
        updatedItem.isManualBasePrice = false;
      }

      if (field === 'basePrice') {
        updatedItem.isManualBasePrice = true;
      }

      if (['width', 'height', 'manualMq', 'numAnte', 'apertura', 'sistemaCamId', 'vetroId', 'basePrice', 'calcType', 'hasTraverso', 'traversoHeight', 'vetroInferioreId'].includes(field)) {
        const { unitPrice, basePrice } = calculateWindowPrice(updatedItem, sistemiCam);
        updatedItem.basePrice = basePrice;
        if (unitPrice) updatedItem.unitPrice = unitPrice;

        const uw = calculateTransmittance(updatedItem, sistemiCam);
        if (uw) updatedItem.trasmittanza = uw;
      }
      
      if (field === 'colorName') {
        const hex = syncFrameColor(value);
        if (hex) updatedItem.frameColor = hex;
      }

      return updatedItem;
    });
  };

  const handleAddItem = () => {
    // Evita di aggiungere un articolo con misure o prezzo mancanti: senza
    // questo controllo il totale del preventivo diventa silenziosamente
    // "NaN €", ed è facile non accorgersene prima di mandarlo al cliente.
    if (itemType === 'window') {
      if (!Number(newItem.width) || !Number(newItem.height)) {
        toast.error('Inserisci larghezza e altezza prima di aggiungere il serramento.');
        return;
      }
      if (!Number(newItem.unitPrice)) {
        toast.error('Inserisci un prezzo valido prima di aggiungere il serramento.');
        return;
      }
    } else if (itemType === 'complemento') {
      const isFisso = newItem.complementoCalcType === 'fisso';
      if (!isFisso && (!Number(newItem.width) || !Number(newItem.height))) {
        toast.error('Inserisci larghezza e altezza (oppure passa a prezzo "fisso") prima di aggiungere.');
        return;
      }
      if (!Number(newItem.unitPrice)) {
        toast.error('Inserisci un prezzo valido prima di aggiungere.');
        return;
      }
    } else if (itemType === 'custom') {
      if (!Number(newItem.unitPrice)) {
        toast.error('Inserisci un prezzo valido prima di aggiungere.');
        return;
      }
    }

    let newItemsList = [...items];
    const isEditing = editingIndex !== null;
    const targetIndex = isEditing ? editingIndex : items.length;
    const targetId = isEditing ? items[editingIndex].id : (items.length + 1).toString().padStart(2, '0');
    
    if (itemType === 'custom') {
      const newItemObj = {
        id: targetId, type: 'custom',
        customDescription: newItem.customDescription,
        unitPrice: Number(newItem.unitPrice) || 0,
        quantity: Number(newItem.quantity) || 1,
        rawInput: { ...newItem, itemType: 'custom' }
      };
      if (isEditing) newItemsList[targetIndex] = newItemObj;
      else newItemsList.push(newItemObj);
    } else if (itemType === 'complemento') {
      const wM = Number(newItem.width) / 1000;
      const hM = Number(newItem.height) / 1000;
      let mq = wM * hM;
      const isFisso = newItem.complementoCalcType === 'fisso';
      const price = isFisso ? Number(newItem.unitPrice) : (mq * Number(newItem.unitPrice));
      
      let desc2 = `L ${newItem.width} x H ${newItem.height} mm`;
      if (!isFisso) desc2 += ` (Area: ${mq.toFixed(2)} mq)`;
      const compDesc = `${newItem.complementoType?.toUpperCase() || ''} - ${newItem.complementoMaterial || ''} - Azionamento: ${newItem.complementoAction || ''}`;

      const newItemObj = {
        id: targetId, type: 'complemento',
        model: newItem.complementoType,
        width: Number(newItem.width), height: Number(newItem.height),
        quantity: Number(newItem.quantity), unitPrice: Number(price.toFixed(2)),
        description1: '', description2: desc2, description3: compDesc,
        colInt: newItem.colorName, colEst: newItem.colorName,
        rawInput: { ...newItem, itemType: 'complemento' }
      };
      if (isEditing) newItemsList[targetIndex] = newItemObj;
      else newItemsList.push(newItemObj);
    } else {
      const hasRibalta = newItem.antaRibalta && newItem.apertura === 'Battente';
      const anteText = `${newItem.numAnte} ANT${newItem.numAnte > 1 ? 'E' : 'A'}`;
      let desc2 = `${newItem.apertura.toUpperCase()} ${anteText}${hasRibalta ? ' CON ANTA A RIBALTA' : ''}`;
      if (newItem.hasSopraluce) desc2 += ` CON SOPRALUCE H: ${newItem.sopraluceHeight} mm`;
      
      const sistemaCam = sistemiCam.find(s => s.id === newItem.sistemaCamId) || null;
      const isPersiana = newItem.apertura.toLowerCase().includes('persiana');
      const isBlindata = newItem.apertura?.toLowerCase() === 'porta blindata';
      const specs = { ...(sistemaCam?.specs || {}) };

      const newItemObj = {
        id: targetId, type: 'window',
        model: `${newItem.apertura.toUpperCase()} ${anteText}`,
        apertura: newItem.apertura, numAnte: newItem.numAnte,
        antaRibalta: hasRibalta, hasTraverso: newItem.hasTraverso, traversoHeight: Number(newItem.traversoHeight),
        hasSopraluce: newItem.hasSopraluce, sopraluceHeight: Number(newItem.sopraluceHeight),
        handlePosition: newItem.handlePosition, paneConfigs: [...paneConfigs],
        width: Number(newItem.width), height: Number(newItem.height),
        quantity: Number(newItem.quantity), unitPrice: Number(newItem.unitPrice),
        frameColor: newItem.frameColor, colorName: newItem.colorName,
        previewColor: newItem.previewColor || null,
        previewAccessoriColor: newItem.previewAccessoriColor || null,
        manualMq: newItem.manualMq || null,
        customImage: newItem.customImage || null,
        anteAsimmetriche: newItem.anteAsimmetriche || false, anteWidths: newItem.anteWidths || null,
        sistema_cam: sistemaCam,
        colInt: newItem.colorName || specs.colInt || '', colEst: newItem.colorName || specs.colEst || '',
        accessori: newItem.accessoriColore || specs.accessori || '', serrature: specs.serrature || '',
        vetro: (isPersiana || isBlindata) ? '' : newItem.vetro,
        colRmp: (isPersiana || isBlindata) ? '' : (specs.colRmp || ''), colCanalina: (isPersiana || isBlindata) ? '' : (specs.colCanalina || ''),
        colCoperture: specs.colCoperture || '',
        telaioFisso: specs.telaioFisso || (sistemaCam?.telaio_std?.codice) || '',
        telaioMobile: specs.telaioMobile || (sistemaCam?.anta?.codice) || '',
        trasmittanza: newItem.trasmittanza ? (newItem.trasmittanza.toLowerCase().includes('w/m') ? newItem.trasmittanza : `${newItem.trasmittanza} W/m²K`) : '',
        description1: (newItem.vetro && !isPersiana && !isBlindata) ? `Vetro: ${newItem.vetro}` : '',
        description2: desc2,
        description3: isBlindata ? 'Porta Blindata di Sicurezza' : (newItem.marca ? `${newItem.marca} - ${sistemaCam ? sistemaCam.nome : 'Profilo Personalizzato'}` : (sistemaCam ? sistemaCam.nome : 'Profilo Personalizzato')),
        rawInput: { ...newItem, itemType: 'window' }
      };
      if (isEditing) newItemsList[targetIndex] = newItemObj;
      else newItemsList.push(newItemObj);
    }

    setItems(newItemsList);
    setEditingIndex(null);
  };

  const handleEditItem = (index) => {
    const item = items[index];
    if (item.rawInput) {
      setItemType(item.rawInput.itemType || 'window');
      if (item.paneConfigs) {
        skipPaneResetRef.current = true;
        setPaneConfigs([...item.paneConfigs]);
      }
      setNewItem({ ...item.rawInput });
    }
    setEditingIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewItem(defaultNewItem);
  };

  const removeItem = (indexToRemove) => {
    setItems(items.filter((_, index) => index !== indexToRemove).map((item, index) => ({
      ...item, id: (index + 1).toString().padStart(2, '0')
    })));
  };

  const handleSpalmaQuadratura = (targetTotalMq) => {
    let currentTotal = 0;
    items.forEach(item => {
      if (item.type === 'window' || item.type === 'complemento') {
        currentTotal += calculateItemMq(item) * (item.quantity || 1);
      }
    });

    if (currentTotal <= 0) return alert('Nessun infisso calcolabile presente nel preventivo.');
    
    const ratio = targetTotalMq / currentTotal;

    const newItems = items.map(item => {
      if (item.type !== 'window' && item.type !== 'complemento') return item;
      
      const currentMq = calculateItemMq(item);
      if (currentMq > 0) {
        const newMq = currentMq * ratio;
        const newRawInput = { ...item.rawInput, manualMq: newMq.toFixed(2) };
        
        let newUnitPrice = item.unitPrice;
        let newBasePrice = item.basePrice;
        
        if (item.type === 'window') {
          const res = calculateWindowPrice(newRawInput, sistemiCam);
          newUnitPrice = res.unitPrice || newUnitPrice;
          newBasePrice = res.basePrice || newBasePrice;
        } else if (item.type === 'complemento') {
           const isFisso = item.complementoCalcType === 'fisso';
           if (!isFisso) {
              const bPrice = Number(newRawInput.unitPrice || 0); // unitPrice of complemento is base price
              newUnitPrice = Number((newMq * bPrice).toFixed(2));
           }
        }
        
        return {
          ...item,
          manualMq: newMq.toFixed(2),
          unitPrice: Number(newUnitPrice),
          basePrice: Number(newBasePrice),
          rawInput: newRawInput
        };
      }
      return item;
    });

    setItems(newItems);
  };

  const handleCambiaProfiloGlobale = (newSistemaId) => {
    const sistemaCam = sistemiCam.find(s => s.id === newSistemaId) || null;

    const newItems = items.map(item => {
      if (item.type !== 'window') return item; // Si applica solo alle finestre/scorrevoli

      // Manteniamo le proprietà esistenti ma cambiamo il sistemaCamId
      const newRawInput = {
        ...item.rawInput,
        sistemaCamId: newSistemaId,
        marca: sistemaCam?.marca || ''
      };

      // Ricalcola il prezzo con il nuovo profilo
      const res = calculateWindowPrice(newRawInput, sistemiCam);
      
      const isPersiana = item.apertura.toLowerCase().includes('persiana');
      const isBlindata = item.apertura?.toLowerCase() === 'porta blindata';
      const specs = { ...(sistemaCam?.specs || {}) };

      return {
        ...item,
        sistemaCamId: newSistemaId,
        sistema_cam: sistemaCam,
        marca: sistemaCam?.marca || '',
        description3: isBlindata ? 'Porta Blindata di Sicurezza' : (sistemaCam?.marca ? `${sistemaCam.marca} - ${sistemaCam ? sistemaCam.nome : 'Profilo Personalizzato'}` : (sistemaCam ? sistemaCam.nome : 'Profilo Personalizzato')),
        colInt: item.colorName || specs.colInt || '', 
        colEst: item.colorName || specs.colEst || '',
        accessori: item.accessoriColore || specs.accessori || '',
        serrature: specs.serrature || '',
        colRmp: (isPersiana || isBlindata) ? '' : (specs.colRmp || ''),
        colCanalina: (isPersiana || isBlindata) ? '' : (specs.colCanalina || ''),
        colCoperture: specs.colCoperture || '',
        telaioFisso: specs.telaioFisso || (sistemaCam?.telaio_std?.codice) || '',
        telaioMobile: specs.telaioMobile || (sistemaCam?.anta?.codice) || '',
        unitPrice: Number(res.unitPrice) || item.unitPrice,
        basePrice: Number(res.basePrice) || item.basePrice,
        rawInput: newRawInput
      };
    });

    setItems(newItems);
  };

  const { imponibile, scontoAmount, imponibileScontato, totaleIva, totalePreventivo } = calculateQuoteSummary(items, sconto, iva);

  return {
    clientName, setClientName, clientData, setClientData, sconto, setSconto, iva, setIva,
    items, setItems, itemType, setItemType, editingOrderId, setEditingOrderId,
    editingOrderStato, setEditingOrderStato,
    showConfigurator, setShowConfigurator, showGallery, setShowGallery, paneConfigs, setPaneConfigs,
    editingIndex, setEditingIndex, newItem, setNewItem, barLength, setBarLength,
    sistemiCam, handleAddItem, handleEditItem, handleCancelEdit, removeItem,
    updateItemField, defaultNewItem, imponibile, scontoAmount, imponibileScontato,
    totaleIva, totalePreventivo, handleSpalmaQuadratura, handleCambiaProfiloGlobale
  };
}
