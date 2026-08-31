import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ExternalLink, CheckCircle, Clock, Truck, FileText, Euro, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabaseClient';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATI = ['Bozza', 'Bozza dal Web', 'Bozza (Stampata)', 'Inviato', 'Confermato', 'In Produzione', 'Consegnato'];

const STATO_COLORS = {
  'Bozza':             { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
  'Bozza dal Web':     { bg: '#fef3c7', text: '#d97706', border: '#fde68a' }, // Giallo/Ambra per i lead web
  'Bozza (Stampata)':  { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' }, // Indigo tenue per distinguerla
  'Inviato':           { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
  'Confermato':        { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  'In Produzione':     { bg: '#fef08a', text: '#a16207', border: '#fde047' },
  'Consegnato':        { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
};

export default function OrdiniPage() {
  const [ordini, setOrdini] = useState([]);
  const [filtroStato, setFiltroStato] = useState('tutti');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrdini();
  }, []);

  const fetchOrdini = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('ordini')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Errore caricamento ordini:', error);
    } else {
      setOrdini(data || []);
    }
    setIsLoading(false);
  };

  const updateStato = async (id, stato) => {
    const { error } = await supabase.from('ordini').update({ stato }).eq('id', id);
    if (!error) {
      setOrdini(ordini.map(o => o.id === id ? { ...o, stato } : o));
    } else {
      alert('Errore aggiornamento stato');
    }
  };

  const deleteOrdine = async (id) => {
    if (window.confirm('Eliminare questo ordine?')) {
      const { error } = await supabase.from('ordini').delete().eq('id', id);
      if (!error) {
        setOrdini(ordini.filter(o => o.id !== id));
      } else {
        alert('Errore eliminazione ordine');
      }
    }
  };

  const handleAddPayment = async (ordineId, importo, dataPagamento) => {
    const ordine = ordini.find(o => o.id === ordineId);
    if (!ordine) return;
    
    // Extract items and metadata
    const items = [...(ordine.items || [])];
    let metaIndex = items.findIndex(i => i.type === 'metadata');
    let metadata = metaIndex >= 0 ? { ...items[metaIndex] } : { type: 'metadata' };
    
    // Add payment
    const pagamenti = metadata.pagamenti || [];
    pagamenti.push({ importo: Number(importo), data: dataPagamento, id: Date.now() });
    metadata.pagamenti = pagamenti;
    
    if (metaIndex >= 0) items[metaIndex] = metadata;
    else items.push(metadata);
    
    const { error } = await supabase.from('ordini').update({ items }).eq('id', ordineId);
    if (!error) {
      setOrdini(ordini.map(o => o.id === ordineId ? { ...o, items } : o));
      return true;
    }
    return false;
  };

  const handleDeletePayment = async (ordineId, paymentId) => {
    const ordine = ordini.find(o => o.id === ordineId);
    if (!ordine) return;
    
    const items = [...(ordine.items || [])];
    const metaIndex = items.findIndex(i => i.type === 'metadata');
    if (metaIndex < 0) return;
    
    let metadata = { ...items[metaIndex] };
    metadata.pagamenti = (metadata.pagamenti || []).filter(p => p.id !== paymentId);
    items[metaIndex] = metadata;
    
    const { error } = await supabase.from('ordini').update({ items }).eq('id', ordineId);
    if (!error) {
      setOrdini(ordini.map(o => o.id === ordineId ? { ...o, items } : o));
    }
  };

  const handleRiapri = (ordine) => {
    // We map backend fields to frontend local fields for the session storage restore if needed
    const frontendOrdine = {
      ...ordine,
      clientName: ordine.cliente
    };
    sessionStorage.setItem('sd_edit_ordine', JSON.stringify(frontendOrdine));
    navigate('/preventivi');
  };

  const filtered = filtroStato === 'tutti' ? ordini : ordini.filter(o => o.stato === filtroStato);
  const totaleValore = ordini.filter(o => o.stato === 'Confermato' || o.stato === 'In Produzione').reduce((s, o) => s + (o.totale || 0), 0);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const onAddPaymentSubmit = async () => {
    const amt = parseFloat(newPaymentAmount);
    if (isNaN(amt) || amt <= 0) return alert('Importo non valido');
    const success = await handleAddPayment(selectedOrderForPayment.id, amt, newPaymentDate);
    if (success) {
      setPaymentModalOpen(false);
      setNewPaymentAmount('');
    } else {
      alert('Errore durante il salvataggio del pagamento');
    }
  };

  const handleWhatsApp = (e, phone, order) => {
    e.stopPropagation();
    let finalPhone = phone;
    if (!finalPhone) {
      finalPhone = window.prompt("Numero di telefono non trovato nel preventivo.\nInserisci qui il numero di cellulare (es. 3331234567) per inviare il messaggio:");
      if (!finalPhone) return;
    }
    let cleanPhone = finalPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('39') && cleanPhone.length >= 9) {
      cleanPhone = '39' + cleanPhone;
    }
    const text = encodeURIComponent(`Buongiorno ${order.cliente},\nti invio in allegato il preventivo concordato per i tuoi nuovi infissi. Resto a disposizione per qualsiasi chiarimento!`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1a365d]">Archivio Ordini</h1>
          <p className="text-sm text-gray-500">Gestisci lo stato di ogni preventivo/ordine</p>
        </div>

        {/* Header rimosso, spostato nella DashboardPage dedicata */}

        {/* Filtro stato */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {['tutti', ...STATI].map(s => (
            <button key={s} onClick={() => setFiltroStato(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                filtroStato === s
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              {s === 'tutti' ? `Tutti (${ordini.length})` : `${s} (${ordini.filter(o=>o.stato===s).length})`}
            </button>
          ))}
        </div>

        {/* Lista ordini */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border-dashed border-2 border-gray-200 p-12 text-center text-gray-400">
            {ordini.length === 0
              ? <>Nessun ordine salvato. Vai in <Link to="/preventivi" className="text-blue-600 underline">Preventivi</Link> e clicca "Salva Ordine".</>
              : 'Nessun ordine con questo filtro.'}
          </div>
        )}

        <div className="space-y-3">
          {filtered.sort((a,b) => b.id.localeCompare(a.id)).map(o => {
            const sc = STATO_COLORS[o.stato] || STATO_COLORS['Bozza'];
            const meta = (o.items || []).find(i => i.type === 'metadata') || {};
            const pagamenti = meta.pagamenti || [];
            const totIncassato = pagamenti.reduce((acc, p) => acc + Number(p.importo), 0);
            const rimanente = Number(o.totale || 0) - totIncassato;
            const isSaldato = rimanente <= 0;
            const displayItems = (o.items || []).filter(i => i.type !== 'metadata');

            return (
              <div key={o.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="flex justify-between items-start p-4 pb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-900 text-lg">{o.cliente}</span>
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded" title={o.id}>
                        #{o.id.substring(0, 8)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(o.created_at).toLocaleDateString('it-IT')} · {displayItems.length} articoli · <b className="text-gray-700">Totale: € {(Number(o.totale) || 0).toFixed(2)}</b>
                    </div>
                    {/* Pagamenti UI */}
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <div className="bg-gray-50 px-3 py-1.5 rounded-md border flex items-center gap-2">
                        <span className="text-gray-500 font-medium">Incassato:</span>
                        <span className="font-bold text-gray-800">€ {totIncassato.toFixed(2)}</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-md border flex items-center gap-2 ${isSaldato && Number(o.totale)>0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <span className="font-medium">{isSaldato && Number(o.totale)>0 ? 'Saldato!' : 'Da incassare:'}</span>
                        {!isSaldato && <span className="font-bold">€ {rimanente.toFixed(2)}</span>}
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs bg-white" onClick={() => { setSelectedOrderForPayment(o); setPaymentModalOpen(true); }}>
                        <Euro size={12} className="mr-1" /> Aggiungi Pagamento
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {/* Cambio stato */}
                    <select
                      value={o.stato}
                      onChange={e => updateStato(o.id, e.target.value)}
                      className="text-xs font-bold border-2 rounded-lg px-2 py-1.5 cursor-pointer"
                      style={{ color: sc.text, borderColor: sc.border, background: sc.bg }}>
                      {STATI.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <Button variant="ghost" onClick={(e) => handleWhatsApp(e, meta.clientData?.phone || '', o)}
                        className="text-green-600 hover:bg-green-50 text-xs font-bold px-2 h-8">
                        <MessageCircle size={14} className="mr-1"/> WhatsApp
                      </Button>
                      <Button variant="ghost" onClick={() => handleRiapri(o)}
                        className="text-blue-600 hover:bg-blue-50 text-xs font-bold px-2 h-8">
                        <ExternalLink size={14} className="mr-1"/> Riapri
                      </Button>
                      <Button variant="ghost" onClick={() => deleteOrdine(o.id)}
                        className="text-red-400 hover:bg-red-50 hover:text-red-600 h-8 px-2">
                        <Trash2 size={15}/>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Articoli */}
                <div className="border-t border-gray-100 px-4 py-2 flex flex-wrap gap-2 bg-gray-50/50">
                  {displayItems.slice(0, 6).map((item, ii) => (
                    <span key={ii} className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-md shadow-sm">
                      {item.model || item.customDescription || 'Articolo'} {item.width && item.height ? `${item.width}×${item.height}mm` : ''} ×{item.quantity}
                    </span>
                  ))}
                  {displayItems.length > 6 && <span className="text-xs text-gray-400">+{displayItems.length - 6} altri</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Pagamenti - {selectedOrderForPayment.cliente}</h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-800"><Trash2 size={18} className="opacity-0"/>Chiudi</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                <span className="text-sm font-semibold text-blue-800">Totale Ordine:</span>
                <span className="text-lg font-bold text-blue-900">€ {(Number(selectedOrderForPayment.totale)||0).toFixed(2)}</span>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Storico Pagamenti</h4>
                {((selectedOrderForPayment.items || []).find(i => i.type === 'metadata')?.pagamenti || []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Nessun pagamento registrato.</p>
                ) : (
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {((selectedOrderForPayment.items || []).find(i => i.type === 'metadata')?.pagamenti || []).map(p => (
                      <li key={p.id} className="flex justify-between items-center bg-gray-50 border p-2 rounded text-sm">
                        <span>{new Date(p.data).toLocaleDateString('it-IT')}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-green-600">€ {Number(p.importo).toFixed(2)}</span>
                          <button onClick={() => handleDeletePayment(selectedOrderForPayment.id, p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Aggiungi Nuovo Acconto/Saldo</h4>
                <div className="flex gap-2">
                  <input type="date" value={newPaymentDate} onChange={e => setNewPaymentDate(e.target.value)} className="border rounded p-2 text-sm w-1/2" />
                  <div className="relative w-1/2">
                    <span className="absolute left-3 top-2 text-gray-500">€</span>
                    <input type="number" placeholder="Importo" value={newPaymentAmount} onChange={e => setNewPaymentAmount(e.target.value)} className="border rounded p-2 pl-7 text-sm w-full font-bold" />
                  </div>
                </div>
                <Button onClick={onAddPaymentSubmit} className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white">Registra Pagamento</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
