import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.js?url';

// Vite esporterà il worker come asset statico in modo sicuro
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, options, setStatus, maxRetries = 10) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    
    // Gestione errori
    const errorData = await res.json().catch(() => ({}));
    const errMsg = errorData.error || res.statusText || 'Errore Sconosciuto';
    
    // Se è 503 o 429 (oppure un 500 che nasconde un 429)
    if (res.status === 503 || res.status === 429 || errMsg.includes('[429')) {
      if (attempt < maxRetries - 1) {
        let waitTime = 5000;
        
        // Cerca "Please retry in 25.33s."
        const match = errMsg.match(/Please retry in ([\d\.]+)s/);
        if (match && match[1]) {
          waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 2000; // Arrotondo e aggiungo 2s di margine
        }

        console.warn(`Quota Superata (${res.status}). Aspetto ${waitTime/1000} secondi prima di ritentare... (Tentativo ${attempt + 1}/${maxRetries})`);
        if (setStatus) {
           setStatus(`Limite traffico API Google raggiunto. In pausa automatica per ${Math.ceil(waitTime/1000)} secondi...`);
        }
        await sleep(waitTime); 
        
        if (setStatus) {
           setStatus(`Ripresa dell'analisi...`);
        }
        continue;
      }
    }
    
    throw new Error(`Server returned ${res.status}: ${errMsg}`);
  }
}

export default function AIPdfImporter({ isOpen, onClose, onProfilesAdded }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [foundProfiles, setFoundProfiles] = useState([]);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const processPDF = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProgress(0);
    setStatus('Inizializzazione motore PDF...');
    setFoundProfiles([]);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      }).promise;

      let allProfiles = [];
      
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
         setStatus('Errore: Devi essere loggato per salvare.');
         setIsProcessing(false);
         return;
      }

      const rangeCount = endPage - startPage + 1;
      const BATCH_SIZE = 5;

      for (let i = startPage; i <= endPage; i += BATCH_SIZE) {
        const currentEnd = Math.min(i + BATCH_SIZE - 1, endPage);
        setProgress(Math.round(((i - startPage) / rangeCount) * 100));
        setStatus(`Lettura pagine ${i}-${currentEnd} (di ${endPage})...`);
        
        let batchImages = [];
        for (let j = i; j <= currentEnd; j++) {
          const page = await pdf.getPage(j);
          const viewport = page.getViewport({ scale: 1.5 }); // Scale 1.5 for good quality OCR/vision
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport }).promise;
          batchImages.push(canvas.toDataURL('image/jpeg', 0.8));
        }

        // Invio immagini all'API con sistema di Retry per colli di bottiglia (503/429)
        setStatus(`Analisi AI pagine ${i}-${currentEnd}... (l'operazione richiede alcuni secondi)`);
        try {
          const res = await fetchWithRetry('/api/extract-catalog-page', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagesBase64: batchImages })
          }, setStatus);

          const data = await res.json();
          if (data.profiles && data.profiles.length > 0) {
              
              // Mappiamo i profili trovati nel nostro formato database
              const formattedProfiles = data.profiles.map(p => ({
                user_id: user.id,
                nome: p.nome,
                marca: p.marca || 'Sconosciuta',
                tipologia: 'BATTENTE', // Default, l'utente potrà cambiare
                calc_type: 'mq',
                base_price: p.base_price || 0,
                specs: { trasmittanza: p.specs?.trasmittanza || '' },
                telaio_std: {
                  codice: '',
                  aletta_mm: Number(p.specs?.aletta_vetro) || 0,
                  saldatura_mm: 6,
                  tolleranza_mm: 5
                },
                telaio_inf: {
                  codice: '',
                  aletta_mm: 0,
                  saldatura_mm: 6,
                  tolleranza_mm: 5
                },
                anta: {
                  codice: '',
                  ingombro_vista_mm: Number(p.specs?.spessore_telaio) || 70,
                  sormonto_mm: Number(p.specs?.sormonto) || 20,
                  saldatura_mm: 6
                }
              }));

              // Inserisci subito nel DB per salvare i dati "on the fly"
              const { data: insertedData, error } = await supabase.from('sistemi_cam').insert(formattedProfiles).select();
              
              if (!error && insertedData) {
                allProfiles = [...allProfiles, ...insertedData];
                setFoundProfiles(prev => [...prev, ...insertedData]);
              }
            }
        } catch (e) {
          console.error('Errore durante analisi batch:', e);
          if (e.message.includes('Server returned 500') || e.message.includes('Server returned 400') || e.message.includes('Server returned 404') || e.message.includes('Server returned 429') || e.message.includes('Server returned 503')) {
              alert(`Errore critico fermato alla pagina ${i}: ${e.message}`);
              throw e; 
          }
        }
        
        // Pausa di 2 secondi tra un batch e l'altro
        if (currentEnd < endPage) {
           await sleep(2000);
        }
      }

      setProgress(100);
      setStatus(`Analisi completata! Trovati ${allProfiles.length} profili.`);
      if (allProfiles.length > 0 && onProfilesAdded) {
         onProfilesAdded(allProfiles);
      }
    } catch (error) {
      console.error('Error parsing PDF:', error);
      alert('Errore durante la lettura del PDF: ' + error.message);
      setStatus('Errore durante la lettura del file PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert("Attenzione: Il file selezionato potrebbe non essere un PDF.");
    }
    
    setSelectedFile(file);
    setStatus('Lettura PDF in corso...');
    setIsProcessing(true); // per mostrare un piccolo loading se il pdf è grande
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      }).promise;
      setNumPages(pdf.numPages);
      setStartPage(1);
      setEndPage(pdf.numPages);
    } catch (err) {
      console.error(err);
      alert('Errore nella lettura del file PDF');
      setSelectedFile(null);
    }
    
    setIsProcessing(false);
    setStatus('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-600" size={24} />
            <h2 className="text-lg font-bold text-gray-900">Magic Onboarding AI</h2>
          </div>
          <button onClick={!isProcessing ? onClose : undefined} className={`text-gray-400 hover:text-gray-700 transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col items-center">
          {!selectedFile && !isProcessing && (
            <div 
              className="w-full border-2 border-dashed border-purple-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-purple-50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600">
                <UploadCloud size={32} />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Carica Catalogo PDF</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-xs">Carica il catalogo tecnico del tuo fornitore. L'AI sfoglierà le pagine ed estrarrà i profili automaticamente.</p>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold pointer-events-none">
                Seleziona File PDF
              </Button>
              <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>
          )}

          {selectedFile && !isProcessing && progress === 0 && (
            <div className="w-full flex flex-col gap-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-white p-2 rounded shadow-sm shrink-0">
                    <UploadCloud size={20} className="text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{numPages} pagine totali</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="text-red-500 shrink-0">
                  Rimuovi
                </Button>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-sm mb-2 text-gray-900">Seleziona pagine da analizzare</h4>
                <p className="text-xs text-gray-500 mb-4">
                  I cataloghi contengono spesso decine di pagine inutili (copertine, indici). Per velocizzare il processo ed evitare i blocchi di sicurezza di Google, seleziona <strong className="text-gray-700">solo il range di pagine</strong> che contiene effettivamente i profili e le quote!
                </p>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Da pagina</label>
                    <input 
                      type="number" min="1" max={numPages} 
                      value={startPage} 
                      onChange={e => setStartPage(Math.max(1, Math.min(numPages, Number(e.target.value))))} 
                      className="w-full border-2 border-gray-200 rounded-md p-2 mt-1 focus:border-purple-500 outline-none text-center font-semibold" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">A pagina</label>
                    <input 
                      type="number" min="1" max={numPages} 
                      value={endPage} 
                      onChange={e => setEndPage(Math.max(1, Math.min(numPages, Number(e.target.value))))} 
                      className="w-full border-2 border-gray-200 rounded-md p-2 mt-1 focus:border-purple-500 outline-none text-center font-semibold" 
                    />
                  </div>
                </div>
              </div>

              <Button onClick={processPDF} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full text-white font-bold h-12 text-lg shadow-lg">
                <Sparkles size={20} className="mr-2" />
                Avvia Scansione AI
              </Button>
            </div>
          )}

          {(isProcessing || progress > 0) && (
            <div className="w-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700 text-sm">{status}</span>
                <span className="font-bold text-purple-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-3 text-purple-600 mb-6">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-sm font-medium animate-pulse">L'AI sta sfogliando il catalogo...</span>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg border p-4 max-h-48 overflow-y-auto">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Profili Trovati ({foundProfiles.length})</h4>
                {foundProfiles.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Nessun profilo trovato finora...</p>
                ) : (
                  <ul className="space-y-2">
                    {foundProfiles.map((p, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded border shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle2 className="text-green-500 flex-shrink-0" size={16} />
                        <span className="font-medium">{p.nome}</span>
                        <span className="text-xs text-gray-500 ml-auto">{p.marca}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
           {progress === 100 ? (
             <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 text-white font-bold w-full sm:w-auto">
               Fatto! Chiudi
             </Button>
           ) : (
             <Button variant="outline" onClick={onClose} disabled={isProcessing} className="w-full sm:w-auto">
               Annulla
             </Button>
           )}
        </div>
      </div>
    </div>
  );
}
