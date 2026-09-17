import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { calculateWindowPrice, calculateQuoteSummary, syncFrameColor, calculateItemMq } from './usePricingEngine';
import { calcolaUw, formattaUw } from '../utils/trasmittanza';
import { mqTapparella, spiegaMqTapparella, righeTapparelle, totaleTapparelle, AVVOLGIMENTO_MM } from '../utils/tapparella';
import { autoSeedProfilesIfNeeded } from '../lib/defaultProfiles';

/**
 * Il colore scritto a mano nel campo "Colore Infisso".
 *
 * Quel campo scrive in frameColor, che pero' tiene due cose insieme: il
 * nome del colore come lo scrive l'utente ("RAL 7016", "RAL da definire")
 * e l'esadecimale scelto col selettore, che nel documento del cliente non
 * ci deve finire mai. Qui si tiene solo il primo.
 */
const coloreScritto = (valore) => {
  const testo = String(valore || '').trim();
  // Si scarta solo cio' che e' davvero un esadecimale: col cancelletto,
  // come lo scrive il selettore, o sei cifre piene. Un "9010" scritto a
  // mano e' il nome di un RAL e sul preventivo ci deve andare.
  return /^#/.test(testo) || /^[0-9a-fA-F]{6}$/.test(testo) ? '' : testo;
};

/** Colore da scrivere sul preventivo: quello dell'utente, se l'ha scritto. */
const coloreInfisso = (item) => item?.colorName || coloreScritto(item?.frameColor);

const nuovoUid = () => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
);

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
    sistemaCamId: '', complementoAction: 'Molla', complementoCalcType: 'mq', tapparellaAnte: 1,
    tapparelleEscluse: [], tapparelleDescrizione: 'Tapparelle in PVC',
    marca: '', vetro: '', trasmittanza: '', calcType: 'mq', basePrice: 500.00, accessoriColore: ''
  };

  const [newItem, setNewItem] = useState(defaultNewItem);
  const [iva, setIva] = useState(22);
  const [barLength, setBarLength] = useState(6500);
  const [sistemiCam, setSistemiCam] = useState([]);
  const [sconto, setSconto] = useState(0);
  // Note libere in fondo al preventivo: avvertenze sul colore, sui tempi,
  // su cosa non e' compreso. Vanno nel documento che legge il cliente.
  const [note, setNote] = useState('');
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
    if (clientName.trim() || items.length > 0 || String(note || '').trim()) {
      const draft = {
        clientName, editingOrderId, editingOrderStato,
        items: [...items, { type: 'metadata', discount: Number(sconto) || 0, clientData, note }]
      };
      localStorage.setItem('sd_draft_preventivo', JSON.stringify(draft));
    } else {
      localStorage.removeItem('sd_draft_preventivo');
    }
  }, [clientName, items, sconto, clientData, note, editingOrderId, editingOrderStato, isRestoring]);

  // Removed sd_draft_form saving

  // Sync pane configs
  useEffect(() => {
    if (skipPaneResetRef.current) {
      skipPaneResetRef.current = false;
      return;
    }
    const count = Math.max(1, Math.min(6, Number(newItem.numAnte) || 1));
    // Di default la maniglia va sull'anta più a destra, che è la più
    // usata. Con più ante va sul suo bordo sinistro (il montante
    // centrale, dove le ante si incontrano), non sul bordo esterno.
    // In precedenza, crescendo da 1 a più ante, l'anta di sinistra si
    // teneva la maniglia ereditata da quando era l'unica anta, e quella
    // nuova a destra restava senza.
    setPaneConfigs(() => Array.from({ length: count }, (_, i) => {
      if (i !== count - 1) return { handleEdge: null };
      return { handleEdge: count === 1 ? 'right' : 'left' };
    }));
  }, [newItem.numAnte]);

  // Scrive piu' campi in un colpo solo, SENZA far ripartire il calcolo.
  // Serve dove un campo ne alimenta un altro mentre l'utente sta ancora
  // digitando: passando da due updateItemField in fila, il ricalcolo
  // riscriveva il campo formattato con due decimali a ogni tasto e il ".00"
  // finale si mangiava le cifre successive (impossibile scrivere "500").
  const updateItemFields = (patch) => {
    setNewItem(prevItem => ({ ...prevItem, ...patch }));
  };

  const updateItemField = (field, value) => {
    setNewItem(prevItem => {
      let updatedItem = { ...prevItem, [field]: value };

      if (field === 'sistemaCamId' && value) {
        const s = sistemiCam.find(sys => sys.id === value);
        if (s) {
          updatedItem.apertura = s.tipologia === 'FISSO' ? 'Fisso' : s.tipologia === 'SCORREVOLE' ? 'Scorrevole' : s.tipologia === 'TAPPARELLA' ? 'Tapparella' : s.tipologia === 'CASSONETTO' ? 'Cassonetto' : s.tipologia === 'PORTA_BLINDATA' ? 'Porta Blindata' : 'Battente';
          updatedItem.marca = s.marca || '';
          updatedItem.vetro = s.specs?.vetro || '';
          updatedItem.accessoriColore = s.specs?.accessori || '';
          updatedItem.calcType = s.calc_type || s.calcType || 'mq';
          updatedItem.basePrice = Number(s.base_price || s.basePrice || 0);
          updatedItem.isManualBasePrice = false;
        }
      }

      if (['vetroId', 'vetroInferioreId'].includes(field)) {
        updatedItem.isManualBasePrice = false;
      }

      // Ribalta e vasistas esistono solo sul battente: cambiando apertura si
      // spengono subito, se no l'anteprima mostrava una persiana disegnata
      // come un vasistas mentre l'articolo salvato era una persiana normale.
      if (field === 'apertura' && value !== 'Battente') {
        updatedItem.antaRibalta = false;
        updatedItem.soloRibalta = false;
      }

      if (field === 'basePrice') {
        updatedItem.isManualBasePrice = true;
      }

      if (['width', 'height', 'manualMq', 'numAnte', 'apertura', 'sistemaCamId', 'vetroId', 'basePrice', 'calcType', 'hasTraverso', 'traversoHeight', 'vetroInferioreId'].includes(field)) {
        const { unitPrice, basePrice } = calculateWindowPrice(updatedItem, sistemiCam);
        updatedItem.basePrice = basePrice;
        if (unitPrice) updatedItem.unitPrice = unitPrice;

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
    } else if (itemType === 'tapparelle') {
      if (!totaleTapparelle(righeTapparelle(items), newItem.tapparelleEscluse).mq) {
        toast.error('Nessun serramento selezionato: spunta almeno una finestra con la tapparella.');
        return;
      }
      if (!Number(newItem.unitPrice)) {
        toast.error('Inserisci il prezzo al m² prima di aggiungere le tapparelle.');
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
    
    if (itemType === 'tapparelle') {
      // Una riga sola per tutte le tapparelle: i m² arrivano dai serramenti
      // gia' nel preventivo, l'utente mette solo il prezzo al m².
      const totale = totaleTapparelle(righeTapparelle(items), newItem.tapparelleEscluse);
      const quanti = totale.serramenti;
      const newItemObj = {
        id: targetId, type: 'custom',
        titolo: (newItem.tapparelleDescrizione || 'Tapparelle').trim(),
        customDescription: `${totale.mq.toFixed(2).replace('.', ',')} m² su ${quanti} ${quanti === 1 ? 'serramento' : 'serramenti'} · altezza +${AVVOLGIMENTO_MM / 10} cm per l'avvolgimento, minimi per ante${totale.righe.some((r) => r.calcolo.forzato) ? ', quadratura del serramento dove indicata' : ''}`,
        unita: 'm²',
        unitPrice: Number(newItem.unitPrice) || 0,
        quantity: totale.mq,
        rawInput: { ...newItem, itemType: 'tapparelle' }
      };
      if (isEditing) newItemsList[targetIndex] = newItemObj;
      else newItemsList.push(newItemObj);
    } else if (itemType === 'custom') {
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
      // La regola nuova vale solo se le ante sono indicate: gli articoli nuovi
      // partono da 1, quelli dei preventivi vecchi non hanno il campo e restano
      // L x H finche' l'utente non sceglie le ante.
      const tapparella = newItem.complementoType === 'Tapparella' && !isFisso && Number(newItem.tapparellaAnte) > 0;
      // Tapparella: +20 cm di avvolgimento e minimo per ante (utils/tapparella.js).
      const calcoloTapparella = tapparella ? mqTapparella({ ...newItem, numAnte: newItem.tapparellaAnte }) : null;
      if (calcoloTapparella) mq = calcoloTapparella.mqFatturati;
      const price = isFisso ? Number(newItem.unitPrice) : (mq * Number(newItem.unitPrice));
      
      let desc2 = `L ${newItem.width} x H ${newItem.height} mm`;
      if (calcoloTapparella) desc2 += ` (${spiegaMqTapparella(calcoloTapparella, newItem.tapparellaAnte)} fatturati)`;
      else if (!isFisso) desc2 += ` (Area: ${mq.toFixed(2)} mq)`;
      const compDesc = `${newItem.complementoType?.toUpperCase() || ''} - ${newItem.complementoMaterial || ''} - Azionamento: ${newItem.complementoAction || ''}`;

      const newItemObj = {
        id: targetId, type: 'complemento',
        model: newItem.complementoType,
        complementoType: newItem.complementoType,
        tapparellaAnte: Number(newItem.tapparellaAnte) > 0 ? Number(newItem.tapparellaAnte) : null,
        width: Number(newItem.width), height: Number(newItem.height),
        quantity: Number(newItem.quantity), unitPrice: Number(price.toFixed(2)),
        description1: '', description2: desc2, description3: compDesc,
        // Il complemento non ha il campo "Colore Infisso": prenderebbe quello
        // rimasto in memoria dal serramento configurato prima, e la zanzariera
        // uscirebbe "RAL 7016" senza che nessuno l'abbia chiesto.
        colInt: newItem.colorName || '', colEst: newItem.colorName || '',
        rawInput: { ...newItem, itemType: 'complemento' }
      };
      if (isEditing) newItemsList[targetIndex] = newItemObj;
      else newItemsList.push(newItemObj);
    } else {
      // Solo ribalta (vasistas): si taglia come un battente, cambiano la
      // ferramenta e il disegno, quindi l'apertura resta "Battente" e la
      // differenza la porta la descrizione.
      const soloRibalta = newItem.soloRibalta && newItem.apertura === 'Battente';
      const hasRibalta = !soloRibalta && newItem.antaRibalta && newItem.apertura === 'Battente';
      // Il cassonetto non ha ante: "CASSONETTO 1 ANTA" non ha senso.
      const senzaAnte = newItem.apertura === 'Cassonetto';
      const anteText = senzaAnte ? '' : `${newItem.numAnte} ANT${newItem.numAnte > 1 ? 'E' : 'A'}`;
      // Il vasistas non e' un battente che fa anche la ribalta: si apre solo a
      // ribalta, quindi si chiama con il suo nome invece che "BATTENTE".
      const nomeApertura = soloRibalta ? 'VASISTAS' : newItem.apertura.toUpperCase();
      let desc2 = `${[nomeApertura, anteText].filter(Boolean).join(' ')}${hasRibalta ? ' CON ANTA A RIBALTA' : ''}`;
      if (newItem.hasSopraluce) desc2 += ` CON SOPRALUCE H: ${newItem.sopraluceHeight} mm`;
      // Ante col maniglione, una sola volta per disegno e descrizione: se nel
      // frattempo le ante sono diminuite si tolgono quelle che non esistono
      // piu', e se non ne resta nessuna si torna all'anta con la maniglia.
      const numAnteArticolo = Math.max(1, Number(newItem.numAnte) || 1);
      let anteManiglione = null;
      if (newItem.maniglioneAntipanico && Array.isArray(newItem.maniglioneAnte)) {
        anteManiglione = [...new Set(newItem.maniglioneAnte)].filter(i => i >= 0 && i < numAnteArticolo).sort((a, b) => a - b);
        if (!anteManiglione.length) anteManiglione = [newItem.handlePosition === 'left' ? 0 : numAnteArticolo - 1];
      }
      if (newItem.maniglioneAntipanico) {
        desc2 += ' CON MANIGLIONE ANTIPANICO';
        if (numAnteArticolo > 1 && anteManiglione && anteManiglione.length < numAnteArticolo) {
          desc2 += ` SU ANT${anteManiglione.length > 1 ? 'E' : 'A'} ${anteManiglione.map(i => i + 1).join(' E ')}`;
        }
      }
      
      const sistemaCam = sistemiCam.find(s => s.id === newItem.sistemaCamId) || null;
      const isPersiana = newItem.apertura.toLowerCase().includes('persiana');
      const isBlindata = newItem.apertura?.toLowerCase() === 'porta blindata';
      const specs = { ...(sistemaCam?.specs || {}) };

      const newItemObj = {
        id: targetId, type: 'window',
        // Identita' stabile del serramento: l'id visibile si rinumera a ogni
        // cancellazione, l'uid no. Le tapparelle escluse si agganciano qui.
        // Modificando un serramento l'uid non si tocca mai: i serramenti dei
        // preventivi vecchi non ce l'hanno e devono restare senza, se no
        // cambierebbero identita' a meta' strada e l'esclusione salvata sul
        // loro id (l'unica che hanno) andrebbe persa, rimettendo in conto una
        // tapparella che il cliente non ha.
        uid: isEditing ? items[editingIndex]?.uid : nuovoUid(),
        model: [nomeApertura, anteText].filter(Boolean).join(' '),
        apertura: newItem.apertura, numAnte: newItem.numAnte,
        antaRibalta: hasRibalta, soloRibalta, hasTraverso: newItem.hasTraverso, traversoHeight: Number(newItem.traversoHeight),
        hasSopraluce: newItem.hasSopraluce, sopraluceHeight: Number(newItem.sopraluceHeight),
        handlePosition: newItem.handlePosition, paneConfigs: [...paneConfigs],
        // La spunta si vedeva nell'anteprima ma non veniva copiata
        // nell'articolo: nel preventivo e nel PDF tornava la maniglia normale.
        maniglioneAntipanico: !!newItem.maniglioneAntipanico,
        maniglioneAnte: anteManiglione,
        width: Number(newItem.width), height: Number(newItem.height),
        quantity: Number(newItem.quantity), unitPrice: Number(newItem.unitPrice),
        frameColor: newItem.frameColor, colorName: newItem.colorName,
        previewColor: newItem.previewColor || null,
        previewAccessoriColor: newItem.previewAccessoriColor || null,
        manualMq: newItem.manualMq || null,
        customImage: newItem.customImage || null,
        anteAsimmetriche: newItem.anteAsimmetriche || false, anteWidths: newItem.anteWidths || null,
        sistema_cam: sistemaCam,
        colInt: coloreInfisso(newItem) || specs.colInt || '', colEst: coloreInfisso(newItem) || specs.colEst || '',
        accessori: newItem.accessoriColore || specs.accessori || '', serrature: specs.serrature || '',
        vetro: (isPersiana || isBlindata) ? '' : newItem.vetro,
        colRmp: (isPersiana || isBlindata) ? '' : (specs.colRmp || ''), colCanalina: (isPersiana || isBlindata) ? '' : (specs.colCanalina || ''),
        colCoperture: specs.colCoperture || '',
        telaioFisso: specs.telaioFisso || (sistemaCam?.telaio_std?.codice) || '',
        telaioMobile: specs.telaioMobile || (sistemaCam?.anta?.codice) || '',
        // Uw calcolata al momento dell'inserimento con UNI EN ISO 10077-1 su
        // misure, ante, traverso e sopraluce di QUESTO articolo. Prima qui
        // finiva la trasmittanza del solo telaio (Uf) presa dal sistema.
        trasmittanza: formattaUw(calcolaUw(newItem, sistemiCam).uw),
        description1: (newItem.vetro && !isPersiana && !isBlindata) ? `Vetro: ${newItem.vetro}` : '',
        description2: desc2,
        description3: isBlindata ? 'Porta Blindata di Sicurezza' : [newItem.marca, sistemaCam?.nome].filter(Boolean).join(' - '),
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
    const rimasti = items.filter((_, index) => index !== indexToRemove);
    // Cancellando un articolo tutti gli id si rinumerano. I serramenti dei
    // preventivi vecchi non hanno l'uid, quindi le loro esclusioni sono
    // salvate per id e vanno spostate insieme a lui: se no il serramento
    // che l'utente aveva tolto rientra da solo nel conto delle tapparelle,
    // e il cliente si vede fatturare una tapparella che non ha.
    const idNuovi = new Map();
    rimasti.forEach((item, index) => {
      const nuovoId = (index + 1).toString().padStart(2, '0');
      if (item.id !== nuovoId) idNuovi.set(item.id, nuovoId);
    });
    const idRimosso = items[indexToRemove]?.id;
    const spostaEscluse = (escluse) => (
      Array.isArray(escluse)
        ? escluse.filter((k) => k !== idRimosso).map((k) => idNuovi.get(k) ?? k)
        : escluse
    );

    setItems(rimasti.map((item, index) => {
      const aggiornato = { ...item, id: (index + 1).toString().padStart(2, '0') };
      if (item.rawInput?.itemType === 'tapparelle') {
        aggiornato.rawInput = { ...item.rawInput, tapparelleEscluse: spostaEscluse(item.rawInput.tapparelleEscluse) };
      }
      return aggiornato;
    }));
    // Anche la scheda aperta in questo momento, se sta configurando tapparelle.
    setNewItem(prev => (
      Array.isArray(prev.tapparelleEscluse) && prev.tapparelleEscluse.length
        ? { ...prev, tapparelleEscluse: spostaEscluse(prev.tapparelleEscluse) }
        : prev
    ));
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
        description3: isBlindata ? 'Porta Blindata di Sicurezza' : [sistemaCam?.marca, sistemaCam?.nome].filter(Boolean).join(' - '),
        colInt: coloreInfisso(item) || specs.colInt || '',
        colEst: coloreInfisso(item) || specs.colEst || '',
        accessori: item.accessoriColore || specs.accessori || '',
        serrature: specs.serrature || '',
        colRmp: (isPersiana || isBlindata) ? '' : (specs.colRmp || ''),
        colCanalina: (isPersiana || isBlindata) ? '' : (specs.colCanalina || ''),
        colCoperture: specs.colCoperture || '',
        telaioFisso: specs.telaioFisso || (sistemaCam?.telaio_std?.codice) || '',
        telaioMobile: specs.telaioMobile || (sistemaCam?.anta?.codice) || '',
        // Cambiando profilo cambia Uf: la Uw va ricalcolata.
        trasmittanza: formattaUw(calcolaUw(newRawInput, sistemiCam).uw),
        unitPrice: Number(res.unitPrice) || item.unitPrice,
        basePrice: Number(res.basePrice) || item.basePrice,
        rawInput: newRawInput
      };
    });

    setItems(newItems);
  };

  const { imponibile, scontoAmount, imponibileScontato, totaleIva, totalePreventivo } = calculateQuoteSummary(items, sconto, iva);

  return {
    clientName, setClientName, clientData, setClientData, sconto, setSconto, note, setNote, iva, setIva,
    items, setItems, itemType, setItemType, editingOrderId, setEditingOrderId,
    editingOrderStato, setEditingOrderStato,
    showConfigurator, setShowConfigurator, showGallery, setShowGallery, paneConfigs, setPaneConfigs,
    editingIndex, setEditingIndex, newItem, setNewItem, barLength, setBarLength,
    sistemiCam, handleAddItem, handleEditItem, handleCancelEdit, removeItem,
    updateItemField, updateItemFields, defaultNewItem, imponibile, scontoAmount, imponibileScontato,
    totaleIva, totalePreventivo, handleSpalmaQuadratura, handleCambiaProfiloGlobale
  };
}
