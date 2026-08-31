import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabaseClient';
import { detectBrowserZoom } from '../lib/utils';
import { usePreventivo } from '../hooks/usePreventivo';

import QuoteToolbar from '../components/preventivi/QuoteToolbar';
import ClientInfoCard from '../components/preventivi/ClientInfoCard';
import CRMModal from '../components/preventivi/CRMModal';
import CostSummary from '../components/preventivi/CostSummary';
import ItemsList from '../components/preventivi/ItemsList';
import LivePreview from '../components/preventivi/LivePreview';
import ItemConfigurator from '../components/preventivi/ItemConfigurator';
import InteractiveGuide from '../components/preventivi/InteractiveGuide';

import QuotePDFTemplate from '../components/QuotePDFTemplate';
import WindowConfigurator from '../components/WindowConfigurator';
import TemplateGalleryModal from '../components/preventivi/TemplateGalleryModal';
import ChangeProfileModal from '../components/preventivi/ChangeProfileModal';
import AIPdfImporter from '../components/AIPdfImporter';

import { FileText, Bot } from 'lucide-react';
import SEOManager from '../components/SEOManager';

export default function PreventiviPage() {
  const navigate = useNavigate();
  const { userProfile, userSettings, session, isTrialExpired, needsPayment } = useUser();
  const isTrialAccount = userProfile?.plan === 'trial' && !isTrialExpired;
  const canAccessCAM = userProfile?.plan === 'pro' || userProfile?.plan === 'business' || userProfile?.role === 'admin' || isTrialAccount;

  const [isRestoring, setIsRestoring] = useState(true);
  const p = usePreventivo(isRestoring, setIsRestoring);

  const [isCrmOpen, setIsCrmOpen] = useState(false);
  const [isCustomerMode, setIsCustomerMode] = useState(false);
  const [savedClients, setSavedClients] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showAiImport, setShowAiImport] = useState(false);
  const [showChangeProfileModal, setShowChangeProfileModal] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfScale, setPdfScale] = useState(1);
  const [docHeight, setDocHeight] = useState(1122);
  const pdfRef = useRef(null);

  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 850) {
        setPdfScale(Math.max(0.3, (screenWidth - 48) / 794));
      } else {
        setPdfScale(1);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (!pdfRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setDocHeight(entries[0].contentRect.height);
      }
    });
    observer.observe(pdfRef.current);
    return () => observer.disconnect();
  }, [p.items, p.clientName]); // Re-observe when items change just in case

  useEffect(() => {
    const handleStartTour = () => setRunTour(true);
    window.addEventListener('start-tour', handleStartTour);
    return () => window.removeEventListener('start-tour', handleStartTour);
  }, []);

  // Restore Draft & Edit Order
  useEffect(() => {
    const restoreSession = async () => {
      let isDemo = false;
      let draftStr = null;

      // Helper to normalize items from Web Widget
      const normalizeItems = (itemsArray) => {
        if (!itemsArray || !Array.isArray(itemsArray)) return { items: [], cData: {}, discount: 0 };
        const meta = itemsArray.find(i => i.type === 'metadata');
        const notes = itemsArray.filter(i => i.type === 'note');
        let cData = meta?.clientData || { address: '', vat: '', phone: '', email: '' };
        
        let clientNotes = [];
        notes.forEach(n => {
          if (n.text.startsWith('Email: ')) cData.email = n.text.replace('Email: ', '').trim();
          else if (n.text.startsWith('Telefono: ')) cData.phone = n.text.replace('Telefono: ', '').trim();
          else if (n.text.startsWith('Indirizzo: ')) cData.address = n.text.replace('Indirizzo: ', '').trim();
          else if (n.text.startsWith('Note Cliente: ') && !n.text.includes('Nessuna')) clientNotes.push(n.text.replace('Note Cliente: ', '').trim());
        });

        const clean = itemsArray.filter(i => i.type !== 'metadata' && i.type !== 'note').map((it, idx) => {
          if (it.type === 'item' && it.sistema) {
            const s = it.sistema;
            const isTenda = s.tipologia === 'TENDA';
            const calcType = s.calc_type || s.calcType || 'mq';
            const basePrice = Number(s.base_price || s.basePrice || 0);
            const mq = (it.width / 1000) * (it.height / 1000);
            let price = basePrice;
            if (calcType === 'mq') price = basePrice * Math.max(mq, 1.2); // stima di base

            return {
              id: (idx + 1).toString().padStart(2, '0'),
              type: isTenda ? 'complemento' : 'window',
              model: it.description || s.nome,
              apertura: isTenda ? 'Tenda' : (s.tipologia === 'FISSO' ? 'Fisso' : s.tipologia === 'SCORREVOLE' ? 'Scorrevole' : 'Battente'),
              numAnte: 1,
              width: it.width,
              height: it.height,
              quantity: it.quantity,
              unitPrice: price,
              description1: it.description || s.nome,
              description2: s.nome,
              rawInput: {
                itemType: isTenda ? 'complemento' : 'window',
                sistemaCamId: s.id,
                basePrice, calcType, width: it.width, height: it.height, quantity: it.quantity
              }
            };
          }
          return it;
        });

        if (clientNotes.length > 0) {
          clean.push({
            id: (clean.length + 1).toString().padStart(2, '0'),
            type: 'custom',
            customDescription: 'Note Web: ' + clientNotes.join(' | '),
            quantity: 1,
            unitPrice: 0,
            rawInput: { itemType: 'custom' }
          });
        }

        return { items: clean, cData, discount: meta?.discount || 0 };
      };

      // 1. Edit da Archivio
      const editDataStr = sessionStorage.getItem('sd_edit_ordine');
      if (editDataStr) {
        try {
          const editData = JSON.parse(editDataStr);
          p.setEditingOrderId(editData.id);
          p.setEditingOrderStato(editData.stato || 'Bozza');
          p.setClientName(editData.cliente || '');
          
          const norm = normalizeItems(editData.items);
          p.setSconto(norm.discount);
          p.setClientData(norm.cData);
          p.setItems(norm.items);
          
          sessionStorage.removeItem('sd_edit_ordine');
          setIsRestoring(false);
          return;
        } catch (e) {
          console.error('Error parsing sd_edit_ordine', e);
        }
      }

      // 2. Draft
      draftStr = localStorage.getItem('sd_draft_preventivo');
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          p.setClientName(draft.clientName || '');
          p.setEditingOrderId(draft.editingOrderId || null);
          p.setEditingOrderStato(draft.editingOrderStato || 'Bozza');
          
          const norm = normalizeItems(draft.items);
          p.setSconto(norm.discount);
          p.setClientData(norm.cData);
          p.setItems(norm.items);
        } catch (e) {
          console.error('Error parsing sd_draft_preventivo', e);
        }
      }
      // 3. URL Params (Demo Project or Templates)
      const queryParams = new URLSearchParams(window.location.search);
      isDemo = queryParams.get('demo');
      const templateId = queryParams.get('template');

      if (isDemo === '1') {
        p.setClientName('Casa Rossi S.p.A.');
        p.setClientData({ address: '', vat: '', phone: '', email: '' });
        p.setSconto(15);
        p.setItems([
          {
            id: 1, type: 'window', model: 'BATTENTE 2 ANTE',
            apertura: 'Battente', numAnte: 2,
            width: 1200, height: 1400, quantity: 4, unitPrice: 450,
            frameColor: '#8B5A2B', colorName: 'Noce Scuro',
            vetro: '4/16/4 Basso Emissivo',
            description1: 'Vetro: 4/16/4 Basso Emissivo',
            description2: 'BATTENTE 2 ANTE CON ANTA A RIBALTA',
            description3: 'Profilo Premium 76mm',
            antaRibalta: true,
            handlePosition: 'Destra',
            accessori: 'silver',
            paneConfigs: [
              { type: 'glass', handleEdge: 'right' },
              { type: 'glass', handleEdge: 'left' }
            ],
            rawInput: {
              itemType: 'window',
              apertura: 'Battente', numAnte: 2, width: 1200, height: 1400, quantity: 4, unitPrice: 450,
              frameColor: '#8B5A2B', colorName: 'Noce Scuro', vetro: '4/16/4 Basso Emissivo',
              antaRibalta: true, handlePosition: 'Destra', accessoriColore: 'silver'
            }
          },
          {
            id: 2, type: 'window', model: 'PERSIANA 2 ANTE',
            apertura: 'Persiana', numAnte: 2,
            width: 1200, height: 1400, quantity: 4, unitPrice: 380,
            frameColor: '#2e8b57', colorName: 'Verde Muschio',
            description2: 'PERSIANA 2 ANTE',
            description3: 'Persiana in Alluminio con Stecche Orientabili',
            paneConfigs: [
              { type: 'glass', handleEdge: 'right' },
              { type: 'glass', handleEdge: 'left' }
            ],
            rawInput: {
              itemType: 'window',
              apertura: 'Persiana', numAnte: 2, width: 1200, height: 1400, quantity: 4, unitPrice: 380,
              frameColor: '#2e8b57', colorName: 'Verde Muschio'
            }
          }
        ]);
        window.history.replaceState({}, '', '/preventivi'); // Clear URL
      } else if (templateId) {
        // Precompila il nuovo articolo in base al template per mostrare subito l'anteprima
        p.updateItemField('width', 1200);
        p.updateItemField('height', 1400);

        if (templateId === 'finestra_base') {
          p.updateItemField('apertura', 'Battente');
          p.updateItemField('numAnte', 2);
        } else if (templateId === 'porta_finestra') {
          p.updateItemField('apertura', 'Battente');
          p.updateItemField('numAnte', 1);
          p.updateItemField('height', 2200);
          p.updateItemField('hasTraverso', true);
          p.updateItemField('traversoHeight', 1000);
        } else if (templateId === 'scorrevole') {
          p.updateItemField('apertura', 'Scorrevole');
          p.updateItemField('numAnte', 2);
          p.updateItemField('width', 2000);
          p.updateItemField('height', 2200);
        } else if (templateId === 'porta_blindata') {
          p.updateItemField('apertura', 'Porta Blindata');
          p.updateItemField('width', 900);
          p.updateItemField('height', 2100);
        } else if (templateId === 'persiana') {
          p.updateItemField('apertura', 'Persiana');
          p.updateItemField('numAnte', 2);
        } else if (templateId === 'fisso') {
          p.updateItemField('apertura', 'Fisso');
          p.updateItemField('numAnte', 1);
        }
        window.history.replaceState({}, '', '/preventivi'); // Clear URL
      }
      
      setIsRestoring(false);

      // Tour Auto-Start
      const hasCompletedTour = localStorage.getItem('sd_tour_completed');
      const startTourParam = queryParams.get('tour');
      if (!hasCompletedTour && startTourParam === '1') {
        setTimeout(() => setRunTour(true), 1500);
      }
    };

    restoreSession();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const user = session?.user;
    if (!user) return;
    const { data } = await supabase.from('clienti').select('*').eq('user_id', user.id).order('name');
    if (data) setSavedClients(data);
  };

  const handleSaveClient = async () => {
    const user = session?.user;
    if (!user || !p.clientName.trim()) return;

    const clientPayload = {
      user_id: user.id,
      name: p.clientName.trim(),
      vat: p.clientData.vat || '',
      phone: p.clientData.phone || '',
      address: p.clientData.address || '',
      email: p.clientData.email || ''
    };

    const existing = savedClients.find(c => c.name.toLowerCase() === p.clientName.trim().toLowerCase());

    if (existing) {
      await supabase.from('clienti').update(clientPayload).eq('id', existing.id);
    } else {
      await supabase.from('clienti').insert([clientPayload]);
    }
    
    await fetchClients();
    setIsCrmOpen(false);
  };

  const handleDeleteClient = async (name) => {
    if (!window.confirm(`Vuoi davvero eliminare il cliente "${name}"?`)) return;
    const user = session?.user;
    if (!user) return;
    
    await supabase.from('clienti').delete().eq('user_id', user.id).eq('name', name);
    await fetchClients();
  };

  const handleSelectClientFromCRM = (c) => {
    p.setClientName(c.name);
    p.setClientData({ address: c.address || '', vat: c.vat || '', phone: c.phone || '', email: c.email || '' });
    setIsCrmOpen(false);
  };

  const handleSaveOrder = async (silent = false) => {
    if (!userProfile) {
      if (!silent) {
        alert("Fantastico! Per salvare i tuoi preventivi in cloud crea il tuo account gratuito in 10 secondi.");
        window.location.href = '/login?mode=signup';
      }
      return false;
    }

    if (needsPayment) {
      if (!silent) {
        alert("L'abbonamento PRO è necessario per salvare i preventivi e accedere al cloud. Passa subito al piano completo!");
        navigate('/dashboard'); // Li mando alla dashboard così scatta il paywall
      }
      return false;
    }

    if (p.items.length === 0) {
      if (!silent) alert('Aggiungi almeno un articolo al preventivo.');
      return false;
    }
    
    setIsSaving(true);
    const user = session?.user;
    if (!user) {
      if (!silent) alert('Devi effettuare l\'accesso per salvare.');
      setIsSaving(false);
      return false;
    }

    const orderPayload = {
      user_id: user.id,
      cliente: p.clientName || 'Cliente non specificato',
      totale: p.totalePreventivo,
      stato: p.editingOrderStato || 'Bozza',
      items: [...p.items, { type: 'metadata', discount: p.sconto, clientData: p.clientData }]
    };

    let error;
    if (p.editingOrderId) {
      const { error: err } = await supabase.from('ordini').update(orderPayload).eq('id', p.editingOrderId);
      error = err;
    } else {
      const { data, error: err } = await supabase.from('ordini').insert([orderPayload]).select();
      error = err;
      if (!err && data && data.length > 0) p.setEditingOrderId(data[0].id);
    }

    setIsSaving(false);
    if (error) {
      console.error(error);
      if (!silent) alert('Errore durante il salvataggio.');
      return false;
    } else {
      if (!silent) alert('Ordine salvato con successo!');
      return true;
    }
  };

  const handleClearAll = () => {
    p.setItems([]);
    p.setClientName('');
    p.setClientData({ address: '', vat: '', phone: '', email: '' });
    p.setSconto(0);
    p.setEditingOrderId(null);
    p.setEditingOrderStato('Bozza');
    localStorage.removeItem('sd_draft_preventivo');
  };

  const handleCreateVariant = () => {
    if (needsPayment) {
      alert("L'abbonamento PRO è necessario per gestire le varianti dei preventivi. Passa subito al piano completo!");
      navigate('/dashboard');
      return;
    }

    p.setEditingOrderId(null);
    p.setEditingOrderStato('Bozza');
    
    if (['info@puntoalluminio.com', 'domenicopanico0303@gmail.com'].includes(userEmail) && p.clientName) {
      let baseName = p.clientName;
      let nextLetter = 'A';
      
      const match = p.clientName.match(/ - Variante ([A-Z])$/);
      if (match) {
        baseName = p.clientName.replace(/ - Variante [A-Z]$/, '');
        nextLetter = String.fromCharCode(match[1].charCodeAt(0) + 1);
      }
      p.setClientName(`${baseName} - Variante ${nextLetter}`);
    } else {
      p.setClientName(p.clientName ? `${p.clientName} (Variante)` : 'Variante');
    }
    
    alert("Copia creata! Ora stai modificando un nuovo preventivo indipendente.");
  };

  const handleExportPDF = async () => {
    if (!userProfile) {
      alert("Ottimo lavoro! Per scaricare il tuo preventivo in formato PDF crea il tuo account gratuito in 10 secondi.");
      window.location.href = '/login?mode=signup';
      return;
    }

    if (needsPayment) {
      alert("L'abbonamento PRO è necessario per scaricare il preventivo in PDF e personalizzarlo col tuo logo. Passa subito al piano completo!");
      navigate('/dashboard'); // Li mando alla dashboard così scatta il paywall
      return;
    }

    // Autosalvataggio nell'archivio ordini
    const isSaved = await handleSaveOrder(true);
    if (isSaved) {
      alert("Il preventivo è stato salvato correttamente nell'Archivio. Sto generando il PDF...");
    } else {
      alert("Attenzione: Non è stato possibile salvare il preventivo in cloud. Sto comunque generando il PDF...");
    }

    setIsExporting(true);
    // Aspetta che React re-renderizzi senza ombre
    await new Promise(resolve => setTimeout(resolve, 150));
    let html2pdf;
    try {
      html2pdf = (await import('html2pdf.js')).default;
    } catch (e) {
      alert('Aggiornamento di sistema in corso. La pagina verrà ricaricata.');
      window.location.reload(true);
      return;
    }
    const element = document.getElementById('pdf-template-wrapper');
    if (!element) {
      setIsExporting(false);
      return;
    }
    const filename = `Preventivo_${p.clientName.replace(/\s+/g, '_')}.pdf`;
    const opt = {
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 4, 
        useCORS: true, 
        letterRendering: true, 
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          const wrapper = clonedDoc.getElementById('pdf-template-wrapper');
          if (wrapper) {
            wrapper.style.transform = 'none';
            wrapper.style.zoom = '1';
            
            // Remove all CSS filters to fix html2canvas clipping bugs (off-screen canvas sizing issue)
            const allElements = wrapper.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              if (allElements[i].style.filter) {
                allElements[i].style.filter = 'none';
              }
            }
            
            // Convert all SVGs to IMGs to fix html2canvas rendering bugs
            const svgs = wrapper.querySelectorAll('svg');
            svgs.forEach(svg => {
              // Gli SVG (es. anteprima finestra) hanno width/height="100%":
              // fuori dal loro contenitore originale (dentro un'immagine
              // data-URI isolata) il browser non ha più nulla a cui
              // riferire quella percentuale e sbaglia le dimensioni
              // intrinseche dell'immagine, mostrando solo un frammento
              // ritagliato invece dell'intera anteprima. Fissiamo width e
              // height numerici presi dal viewBox prima di serializzare.
              const svgClone = svg.cloneNode(true);
              const viewBox = svgClone.getAttribute('viewBox');
              if (viewBox) {
                const parts = viewBox.split(/\s+/).map(Number);
                if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                  svgClone.setAttribute('width', parts[2]);
                  svgClone.setAttribute('height', parts[3]);
                }
              }

              const xml = new XMLSerializer().serializeToString(svgClone);
              const svg64 = btoa(unescape(encodeURIComponent(xml)));
              const b64Start = 'data:image/svg+xml;base64,';
              const image64 = b64Start + svg64;

              const img = clonedDoc.createElement('img');
              img.src = image64;

              // Copy essential dimensions and styles (dimensione di
              // visualizzazione nella pagina, separata da quella intrinseca)
              img.style.width = svg.style.width || svg.getAttribute('width') || '100%';
              img.style.height = svg.style.height || svg.getAttribute('height') || '100%';
              if (svg.getAttribute('class')) img.setAttribute('class', svg.getAttribute('class'));

              svg.parentNode.replaceChild(img, svg);
            });
          }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    // Se il browser non è al 100% di zoom (es. Cmd+- per vedere meglio la
    // pagina), html2canvas cattura l'elemento nella sua dimensione "zoomata"
    // invece di quella reale, producendo un PDF con layout diverso.
    // Compensiamo applicando lo zoom inverso solo durante la cattura.
    const zoomFactor = detectBrowserZoom();
    const isZoomed = Math.abs(zoomFactor - 1) > 0.01;
    if (isZoomed) element.style.zoom = String(1 / zoomFactor);

    html2pdf().set(opt).from(element).save().then(() => {
      if (isZoomed) element.style.zoom = '';
      setIsExporting(false);
    });
  };

  const handleExportDistinta = () => {
    if (!userProfile) {
      alert("La distinta di taglio è riservata agli account registrati. Crea un account gratuito per sbloccarla.");
      window.location.href = '/login?mode=signup';
      return;
    }
    if (!canAccessCAM) return;
    // Salvo temporaneamente in sessionStorage e navigo a DistintaPage
    const tmpOrder = {
      id: p.editingOrderId,
      cliente: p.clientName,
      totale: p.totalePreventivo,
      items: [...p.items, { type: 'metadata', discount: p.sconto, clientData: p.clientData }],
      created_at: new Date().toISOString()
    };
    sessionStorage.setItem('sd_distinta_ordine', JSON.stringify(tmpOrder));
    window.location.href = '/distinta'; // Naviga alla pagina distinta
  };

  const handleApplyAiImport = (importedItems, customerData) => {
    if (customerData) {
      p.setClientName(customerData.name || '');
      p.setClientData({
        address: customerData.address || '',
        vat: customerData.vat || '',
        phone: customerData.phone || '',
        email: customerData.email || ''
      });
      if (customerData.sconto) p.setSconto(customerData.sconto);
    }

    if (importedItems && importedItems.length > 0) {
      const mergedItems = [...p.items, ...importedItems.map((it, idx) => ({
        ...it, id: (p.items.length + idx + 1).toString().padStart(2, '0')
      }))];
      p.setItems(mergedItems);
    }
    setShowAiImport(false);
  };

  if (isRestoring) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <main className="space-y-6 pb-32 max-w-[1400px] mx-auto">
      {runTour && <InteractiveGuide run={runTour} setRun={setRunTour} />}
      <SEOManager 
        title="Generatore gratuito preventivi e distinte di taglio serramenti" 
        description="Il calcolatore online per serramentisti: smetti di usare Excel. Crea preventivi veloci, calcola prezzi e ottieni le distinte di taglio esatte in pochi minuti."
        path="/preventivi" 
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex flex-wrap items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Generatore gratuito preventivi e distinte di taglio serramenti
            {p.editingOrderId && <span className="ml-0 sm:ml-3 px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full border border-amber-200 shadow-sm">Modifica Ordine</span>}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configura serramenti, crea il preventivo e genera i documenti per il cliente.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCustomerMode(!isCustomerMode)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all flex items-center gap-2 shadow-sm ${isCustomerMode ? 'bg-purple-600 text-white border-purple-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {isCustomerMode ? 'Mod. Cliente Attiva' : 'Modalità Cliente'}
          </button>
        </div>
      </div>



      <QuoteToolbar 
        clientName={p.clientName}
        editingOrderId={p.editingOrderId}
        editingOrderStato={p.editingOrderStato}
        items={p.items}
        onSave={handleSaveOrder}
        onClear={handleClearAll}
        onCreateVariant={handleCreateVariant}
        onExportPDF={handleExportPDF}
        onExportDistinta={handleExportDistinta}
        canAccessCAM={canAccessCAM}
        isSaving={isSaving}
        onChangeProfileGlobale={() => setShowChangeProfileModal(true)}
      />

      <ClientInfoCard 
        clientName={p.clientName} setClientName={p.setClientName}
        sconto={p.sconto} setSconto={p.setSconto}
        iva={p.iva} setIva={p.setIva}
        onOpenCRM={() => setIsCrmOpen(true)}
      />

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 relative">
         {/* Configurazione (Colonna Sinistra 2/3) */}
         <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <ItemConfigurator 
              itemType={p.itemType} setItemType={p.setItemType}
              newItem={p.newItem} updateItemField={p.updateItemField}
              sistemiCam={p.sistemiCam} editingIndex={p.editingIndex}
              handleCancelEdit={p.handleCancelEdit} handleAddItem={p.handleAddItem}
              setShowConfigurator={p.setShowConfigurator}
              setShowGallery={p.setShowGallery}
              isCustomerMode={isCustomerMode}
              userEmail={userEmail}
            />

            <ItemsList 
              items={p.items}
              onEdit={p.handleEditItem}
              onRemove={p.removeItem}
              editingIndex={p.editingIndex}
              isCustomerMode={isCustomerMode}
            />
         </div>
         
         {/* Preview e Totali (Colonna Destra 1/3) */}
         <div className="space-y-6 order-1 lg:order-2 lg:sticky lg:top-8 self-start">
            <LivePreview 
              newItem={p.newItem}
              paneConfigs={p.paneConfigs}
            />
            
            <CostSummary 
              imponibile={p.imponibile}
              scontoAmount={p.scontoAmount}
              sconto={p.sconto}
              imponibileScontato={p.imponibileScontato}
              totaleIva={p.totaleIva}
              iva={p.iva}
              totalePreventivo={p.totalePreventivo}
              onSpalmaQuadratura={p.handleSpalmaQuadratura}
            />
         </div>
      </div>

      {/* Anteprima Documento a fine pagina */}
      <div className="mt-12 mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-5xl mx-auto">
         <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Anteprima Documento Completo</h2>
         </div>
         <div className="w-full flex justify-center bg-gray-200/50 py-6 md:py-12 overflow-hidden">
            {/* Absolute positioning container to prevent Safari layout breaking during scale */}
            <div 
              style={{ 
                width: `${794 * pdfScale}px`, 
                height: `${docHeight * pdfScale}px`, 
                position: 'relative' 
              }} 
              className="pointer-events-none"
            >
              <div 
                ref={pdfRef}
                className="bg-white shadow-xl"
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '794px', 
                  minHeight: '1122px',
                  transform: `scale(${pdfScale})`,
                  transformOrigin: 'top left'
                }}
              >
                <QuotePDFTemplate 
                  quoteData={{
                    clientName: p.clientName || 'Cliente non specificato',
                    clientAddress: p.clientData.address,
                    clientVat: p.clientData.vat,
                    clientPhone: p.clientData.phone,
                    clientEmail: p.clientData.email,
                    items: p.items,
                    sconto: p.sconto,
                    iva: p.iva,
                    imponibile: p.imponibile,
                    scontoAmount: p.scontoAmount,
                    imponibileScontato: p.imponibileScontato,
                    totaleIva: p.totaleIva,
                    totalePreventivo: p.totalePreventivo
                  }} 
                  userSettings={userSettings} 
                  userEmail={session?.user?.email || userEmail}
                />
              </div>
            </div>
         </div>
      </div>

      {p.showConfigurator && ['Battente', 'Scorrevole', 'Vasistas', 'Bilico', 'Persiana'].includes(p.newItem.apertura) && (
        <WindowConfigurator
          numAnte={p.newItem.numAnte}
          frameColor={p.newItem.previewColor || p.newItem.frameColor}
          paneConfigs={p.paneConfigs}
          onChange={p.setPaneConfigs}
          onClose={() => p.setShowConfigurator(false)}
        />
      )}

      {p.showGallery && (
        <TemplateGalleryModal
          onSelectTemplate={(template) => {
            Object.entries(template).forEach(([key, val]) => {
              p.updateItemField(key, val);
            });
            p.setShowGallery(false);
          }}
          onClose={() => p.setShowGallery(false)}
        />
      )}

      <CRMModal 
        isOpen={isCrmOpen}
        onClose={() => setIsCrmOpen(false)}
        clientName={p.clientName}
        clientData={p.clientData}
        setClientName={p.setClientName}
        setClientData={p.setClientData}
        savedClients={savedClients}
        onSaveClient={handleSaveClient}
        onSelectClient={handleSelectClientFromCRM}
        onDeleteClient={handleDeleteClient}
      />

      <ChangeProfileModal
        isOpen={showChangeProfileModal}
        onClose={() => setShowChangeProfileModal(false)}
        sistemiCam={p.sistemiCam}
        onApply={(newSistemaId) => {
          p.handleCambiaProfiloGlobale(newSistemaId);
        }}
      />

      {/* Nascosto per esportazione PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
        <div id="pdf-template-wrapper" style={{ width: '210mm', background: 'white' }}>
          <QuotePDFTemplate 
            quoteData={{
              clientName: p.clientName || 'Cliente non specificato',
              clientAddress: p.clientData.address,
              clientVat: p.clientData.vat,
              clientPhone: p.clientData.phone,
              clientEmail: p.clientData.email,
              items: p.items,
              sconto: p.sconto,
              iva: p.iva,
              imponibile: p.imponibile,
              scontoAmount: p.scontoAmount,
              imponibileScontato: p.imponibileScontato,
              totaleIva: p.totaleIva,
              totalePreventivo: p.totalePreventivo
            }} 
            userSettings={userSettings} 
            userEmail={session?.user?.email || userEmail}
            isExporting={isExporting}
          />
        </div>
      </div>
    </main>
  );
}
