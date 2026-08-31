import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Check, ChevronRight, Package, ArrowRight, User, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function WidgetWebPage() {
  const { userId } = useParams();
  const [step, setStep] = useState(1);
  const [sistemi, setSistemi] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Carrello e Dati Cliente
  const [cart, setCart] = useState([]);
  const [clientData, setClientData] = useState({
    nome: '', telefono: '', email: '', citta: '', note: ''
  });

  // Stato form corrente (Aggiunta pezzo)
  const [selectedSistema, setSelectedSistema] = useState(null);
  const [selectedVetroId, setSelectedVetroId] = useState('');
  const [larghezza, setLarghezza] = useState('');
  const [altezza, setAltezza] = useState('');
  const [quantita, setQuantita] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      // Fetch settings
      const { data: setts } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();
      if (setts) setSettings(setts);
      
      // Fetch active sistemi
      const { data: sists } = await supabase.from('sistemi_cam').select('*').eq('user_id', userId).eq('is_active', true);
      if (sists) setSistemi(sists);
      
      setIsLoading(false);
    }
    if (userId) loadData();
  }, [userId]);

  const addToCart = () => {
    if (!selectedSistema || !larghezza || !altezza || quantita < 1) return;
    
    const vetriDisponibili = sistemi.filter(s => s.tipologia === 'VETRO');
    let desc = selectedSistema.nome;
    if (selectedVetroId) {
       const v = vetriDisponibili.find(x => x.id === selectedVetroId);
       if (v) desc += ` + Vetro: ${v.nome}`;
    }
    
    setCart([...cart, {
      id: Date.now().toString(),
      sistema: selectedSistema,
      width: Number(larghezza),
      height: Number(altezza),
      quantity: Number(quantita),
      description: desc,
      type: 'item'
    }]);

    setSelectedSistema(null);
    setSelectedVetroId('');
    setLarghezza('');
    setAltezza('');
    setQuantita(1);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (cart.length === 0 || !clientData.nome || !clientData.telefono) {
      alert("Compila tutti i campi obbligatori (Nome, Telefono) e aggiungi almeno un articolo.");
      return;
    }

    setIsSubmitting(true);
    
    const payload = {
      user_id: userId,
      cliente: clientData.nome,
      totale: 0,
      stato: 'Bozza dal Web',
      items: [
        ...cart,
        { 
          type: 'metadata', 
          clientData: { 
            phone: clientData.telefono, 
            email: clientData.email, 
            address: clientData.citta,
            notes: clientData.note
          } 
        }
      ]
    };

    const { error } = await supabase.from('ordini').insert([payload]);
    
    setIsSubmitting(false);
    
    if (error) {
      console.error(error);
      alert("Errore durante l'invio. Riprova più tardi.");
    } else {
      setSubmitSuccess(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border-t-4 border-green-500">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Richiesta Inviata!</h2>
          <p className="text-gray-600 mb-6">
            Grazie per averci contattato. Un nostro tecnico esaminerà la tua richiesta e ti invierà un preventivo personalizzato il prima possibile.
          </p>
          <p className="text-sm font-bold text-gray-800">{settings?.company_name}</p>
          <div className="mt-8 text-xs text-gray-400 font-medium">⚡ Powered by Serradesk</div>
        </div>
      </div>
    );
  }

  // Raggruppa i sistemi per tipologia
  const vetriDisponibili = sistemi.filter(s => s.tipologia === 'VETRO');
  const groupedSistemi = sistemi.reduce((acc, curr) => {
    if (curr.tipologia === 'VETRO') return acc;
    if (!acc[curr.tipologia]) acc[curr.tipologia] = [];
    acc[curr.tipologia].push(curr);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* HEADER WIDGET */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.logo_base64 ? (
              <img src={settings.logo_base64} alt="Logo" className="h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xl">
                {settings?.company_name?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">{settings?.company_name || 'Richiesta Preventivo'}</h1>
              <p className="text-xs text-gray-500">Configuratore Online</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 py-8">
        
        {/* STEP PROGRESS */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className={`flex flex-col items-center flex-1 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
            <span className="text-xs font-bold text-center">La tua richiesta</span>
          </div>
          <div className={`h-1 flex-1 mx-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex flex-col items-center flex-1 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
            <span className="text-xs font-bold text-center">I tuoi dati</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Componi il tuo preventivo</h2>
              
              {!selectedSistema ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">Seleziona cosa desideri inserire nel preventivo dal nostro catalogo:</p>
                  
                  {sistemi.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 border rounded-xl border-dashed">
                      Questo negozio non ha ancora configurato un catalogo online.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(groupedSistemi).map(([tipologia, list]) => (
                        <div key={tipologia} className="border rounded-xl p-4 bg-white">
                          <h3 className="font-bold text-gray-800 mb-3 uppercase text-xs tracking-wider">{tipologia.replace('_', ' ')}</h3>
                          <div className="space-y-2">
                            {list.map(s => (
                              <button 
                                key={s.id} 
                                onClick={() => setSelectedSistema(s)}
                                className="w-full text-left p-3 rounded-lg border border-gray-100 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm transition-all flex items-center justify-between group"
                              >
                                <div>
                                  <p className="font-bold text-sm text-gray-900 group-hover:text-blue-700">{s.nome}</p>
                                  {s.marca && <p className="text-xs text-gray-500">{s.marca}</p>}
                                </div>
                                <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <button onClick={() => { setSelectedSistema(null); setSelectedVetroId(''); }} className="text-sm text-blue-600 hover:underline font-bold">
                      &larr; Indietro
                    </button>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedSistema.nome}</h3>
                      <p className="text-xs text-gray-500">{selectedSistema.tipologia.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {['BATTENTE', 'FISSO', 'SCORREVOLE'].includes(selectedSistema.tipologia) && vetriDisponibili.length > 0 && (
                      <div className="col-span-2 mb-2">
                        <label className="text-xs font-bold text-gray-700 mb-1 block">Vetro (Opzionale)</label>
                        <select 
                          className="w-full border rounded-md p-2 text-sm outline-none focus:border-blue-500"
                          value={selectedVetroId}
                          onChange={e => setSelectedVetroId(e.target.value)}
                        >
                          <option value="">-- Seleziona un vetro (oppure decidi dopo) --</option>
                          {vetriDisponibili.map(v => (
                            <option key={v.id} value={v.id}>{v.nome}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Larghezza (mm)</label>
                      <Input type="number" placeholder="es. 1000" value={larghezza} onChange={e => setLarghezza(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Altezza (mm)</label>
                      <Input type="number" placeholder="es. 1200" value={altezza} onChange={e => setAltezza(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Quantità</label>
                      <Input type="number" min="1" value={quantita} onChange={e => setQuantita(e.target.value)} />
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 mt-4" 
                    onClick={addToCart}
                    disabled={!larghezza || !altezza || quantita < 1}
                  >
                    Aggiungi alla richiesta
                  </Button>
                </div>
              )}

              {/* RIEPILOGO CARRELLO */}
              {cart.length > 0 && !selectedSistema && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Package size={18}/> Il tuo carrello</h3>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-blue-50 border border-blue-100 p-3 rounded-lg">
                        <div>
                          <p className="font-bold text-sm text-blue-900">{item.description}</p>
                          <p className="text-xs text-blue-700">L: {item.width} x H: {item.height} mm · {item.quantity} {item.quantity === 1 ? 'Pezzo' : 'Pezzi'}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-xs font-bold text-red-500 hover:underline px-2 py-1">Rimuovi</button>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg mt-6 shadow-lg shadow-green-200" onClick={() => setStep(2)}>
                    Procedi con i tuoi dati <ArrowRight className="ml-2" size={18}/>
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline font-bold">
                  &larr; Torna al carrello
                </button>
                <h2 className="text-xl font-bold text-gray-900">I tuoi contatti</h2>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1"><User size={14}/> Nome e Cognome *</label>
                <Input value={clientData.nome} onChange={e => setClientData({...clientData, nome: e.target.value})} placeholder="es. Mario Rossi" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1"><Phone size={14}/> Cellulare *</label>
                <Input value={clientData.telefono} onChange={e => setClientData({...clientData, telefono: e.target.value})} placeholder="es. 333 1234567" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1"><Mail size={14}/> Email</label>
                <Input type="email" value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} placeholder="es. mario.rossi@email.com" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1"><MapPin size={14}/> Città o Indirizzo</label>
                <Input value={clientData.citta} onChange={e => setClientData({...clientData, citta: e.target.value})} placeholder="es. Roma, Via Roma 1" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Note aggiuntive (o Codice Colore)</label>
                <textarea 
                  className="w-full border rounded-md p-3 text-sm min-h-[100px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  value={clientData.note} 
                  onChange={e => setClientData({...clientData, note: e.target.value})} 
                  placeholder="Es. Vorrei il tessuto Tempotest n. 15/1. L'appartamento è al 3° piano..."
                />
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg shadow-green-200" 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !clientData.nome || !clientData.telefono}
                >
                  {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta di Preventivo'}
                </Button>
                <p className="text-center text-xs text-gray-400 mt-3">Cliccando su Invia accetti di essere ricontattato in merito a questa richiesta.</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-xs font-bold text-gray-400">⚡ Powered by Serradesk</p>
        </div>
      </div>
    </div>
  );
}
