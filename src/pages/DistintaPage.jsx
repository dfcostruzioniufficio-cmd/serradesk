import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabaseClient';
import { runCamEngine } from '../utils/camEngine';
import { detectBrowserZoom } from '../lib/utils';
import DistintaPDFTemplate from '../components/DistintaPDFTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, RefreshCw, FileText, Lock, ChevronDown } from 'lucide-react';

export default function DistintaPage() {
  const { userSettings, userProfile, isTrialExpired, session } = useUser();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [barLength, setBarLength] = useState(6500);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Verifica accesso CAM (Solo Pro, Business, Admin)
  const canAccessCAM = userProfile?.plan === 'pro' || userProfile?.plan === 'business' || userProfile?.role === 'admin';

  useEffect(() => {
    fetchOrders();
    // Se c'è un ordine nel sessionStorage (navigazione da Preventivi)
    const stored = sessionStorage.getItem('sd_distinta_ordine');
    if (stored) {
      try {
        const o = JSON.parse(stored);
        setSelectedOrder(o);
        setSelectedOrderId(o.id || '');
      } catch (e) { console.error(e); }
      sessionStorage.removeItem('sd_distinta_ordine');
    }
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const user = session?.user;
    if (!user) { setIsLoading(false); return; }

    const { data, error } = await supabase
      .from('ordini')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
      // Se non c'è un ordine già selezionato, seleziona il primo
      if (!selectedOrder && data.length > 0) {
        setSelectedOrderId(data[0].id);
      }
    }
    setIsLoading(false);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
    } else {
      setSelectedOrder(null);
    }
  };

  const handleGenerate = () => {
    const order = orders.find(o => o.id === selectedOrderId);
    if (order) {
      setSelectedOrder(order);
      setIsGenerating(true);
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  const handleExportPDF = async () => {
    let html2pdf;
    try {
      html2pdf = (await import('html2pdf.js')).default;
    } catch (e) {
      alert('Aggiornamento di sistema in corso. La pagina verrà ricaricata.');
      window.location.reload(true);
      return;
    }
    const element = document.getElementById('distinta-template-wrapper');
    if (!element) {
      alert('Genera prima la distinta selezionando un ordine.');
      return;
    }
    const clientName = selectedOrder?.cliente || 'Ordine';
    const filename = `Distinta_Taglio_${clientName.replace(/\s+/g, '_')}.pdf`;
    const opt = {
      margin: 8,
      filename,
      // vedi PreventiviPage.jsx: scale 2 + quality 0.92 restano nitidi
      // in stampa ma pesano 5-8 volte meno
      image: { type: 'jpeg', quality: 0.92 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          // Vedi PreventiviPage.jsx: gli SVG con width/height="100%" (qui,
          // il disegno del piano di taglio) perdono le dimensioni corrette
          // se isolati in un'immagine data-URI - fissiamo width/height
          // numerici presi dal viewBox prima che html2canvas li catturi.
          const svgs = clonedDoc.querySelectorAll('#distinta-template-wrapper svg');
          svgs.forEach(svg => {
            const viewBox = svg.getAttribute('viewBox');
            if (!viewBox) return;
            const parts = viewBox.split(/\s+/).map(Number);
            if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
              svg.setAttribute('width', parts[2]);
              svg.setAttribute('height', parts[3]);
            }
          });
        },
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    // Vedi PreventiviPage.jsx: compensa lo zoom del browser, altrimenti
    // html2canvas cattura l'elemento con dimensioni diverse a seconda dello
    // zoom con cui è stato generato il PDF.
    const zoomFactor = detectBrowserZoom();
    const isZoomed = Math.abs(zoomFactor - 1) > 0.01;
    if (isZoomed) element.style.zoom = String(1 / zoomFactor);

    html2pdf().set(opt).from(element).save().then(() => {
      if (isZoomed) element.style.zoom = '';
    });
  };

  // Filtra solo gli item reali (no metadata)
  const orderItems = selectedOrder?.items?.filter(i => i.type !== 'metadata') || [];
  const windowItems = orderItems.filter(i => i.type !== 'custom');
  const camResult = windowItems.length > 0 ? runCamEngine(windowItems, barLength) : null;

  if (!canAccessCAM) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Distinta di Taglio</h2>
          <p className="text-gray-500 mb-6">
            La Distinta di Taglio CAM è disponibile nei piani <strong>Pro</strong> e <strong>Business</strong>.
            Aggiorna il tuo piano per accedere alla generazione automatica delle distinte di taglio.
          </p>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-xl shadow-md"
          >
            Aggiorna Piano
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Distinta di Taglio</h1>
        <p className="text-gray-500 text-sm mt-1">Documento interno di produzione — genera le distinte di taglio CAM dai tuoi ordini salvati.</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
          <div className="flex-1 min-w-0">
            <Label className="text-gray-600 font-semibold text-sm">Seleziona Ordine</Label>
            <div className="relative mt-1.5">
              <select
                value={selectedOrderId}
                onChange={(e) => handleSelectOrder(e.target.value)}
                className="flex h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium appearance-none cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">-- Seleziona un ordine --</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.cliente || 'Senza nome'} — €{Number(o.totale || 0).toFixed(2)} — {new Date(o.created_at).toLocaleDateString('it-IT')}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="w-36">
            <Label className="text-gray-600 font-semibold text-sm">Barra (mm)</Label>
            <Input
              type="number"
              value={barLength}
              onChange={(e) => setBarLength(Number(e.target.value) || 0)}
              step="500"
              min="1000"
              className="mt-1.5 h-11 rounded-xl border-2 border-gray-200 font-medium"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!selectedOrderId}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-11 rounded-xl shadow-sm flex items-center gap-2"
          >
            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
            Genera Distinta
          </Button>

          <Button
            onClick={handleExportPDF}
            disabled={!selectedOrder || windowItems.length === 0}
            variant="outline"
            className="font-bold px-6 h-11 rounded-xl flex items-center gap-2 border-2"
          >
            <Download size={16} />
            Esporta PDF
          </Button>
        </div>
      </div>

      {/* Distinta Preview */}
      {selectedOrder && windowItems.length > 0 && camResult ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-gray-900 text-sm">{selectedOrder.cliente || 'Ordine'}</p>
              <p className="text-xs text-gray-500">
                {windowItems.length} serramento/i • Creato il {new Date(selectedOrder.created_at).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>
          <div id="distinta-template-wrapper" className="p-6" style={{ background: '#ffffff', width: '297mm', boxSizing: 'border-box' }}>
            <DistintaPDFTemplate
              clientName={selectedOrder.cliente}
              items={orderItems}
              camResult={camResult}
              userSettings={userSettings}
              barLength={barLength}
            />
          </div>
        </div>
      ) : selectedOrder && windowItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Questo ordine non contiene serramenti.</p>
          <p className="text-gray-400 text-sm mt-1">La distinta di taglio è disponibile solo per ordini con finestre o persiane.</p>
        </div>
      ) : !selectedOrder ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Seleziona un ordine per generare la distinta di taglio.</p>
          <p className="text-gray-400 text-sm mt-1">
            {isLoading ? 'Caricamento ordini...' : `${orders.length} ordini disponibili`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
