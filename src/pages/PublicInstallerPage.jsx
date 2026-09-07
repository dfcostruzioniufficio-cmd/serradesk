import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Check, ChevronRight, Package, ArrowRight, User, Phone, Mail, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import SEOManager from '../components/SEOManager';

export default function PublicInstallerPage() {
  const { slug } = useParams();
  const [step, setStep] = useState(1);
  const [sistemi, setSistemi] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [cart, setCart] = useState([]);
  const [clientData, setClientData] = useState({
    nome: '', telefono: '', email: '', citta: '', note: ''
  });

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

      const { data: setts } = await supabase
        .from('user_settings')
        .select('*')
        .eq('public_page_slug', slug)
        .eq('public_page_enabled', true)
        .maybeSingle();

      if (!setts) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      setSettings(setts);

      const { data: sists } = await supabase.from('sistemi_cam').select('*').eq('user_id', setts.user_id).eq('is_active', true);
      if (sists) setSistemi(sists);

      setIsLoading(false);
    }
    if (slug) loadData();
  }, [slug]);

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
    // Campo esca anti-spam: invisibile agli utenti reali, un bot che
    // compila tutti i campi del form probabilmente lo riempie anche.
    if (clientData.website_hp) {
      setSubmitSuccess(true);
      return;
    }
    if (cart.length === 0 || !clientData.nome || !clientData.telefono) {
      alert('Compila tutti i campi obbligatori (Nome, Telefono) e aggiungi almeno un articolo.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      user_id: settings.user_id,
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
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f5]">
        <div className="animate-spin h-8 w-8 border-4 border-[#0e6e66] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f6f5] text-[#14181b] px-6 text-center">
        <h1 className="font-display font-bold text-2xl mb-3">Pagina non trovata</h1>
        <p className="text-[#6b7573] mb-8 max-w-sm">Questo indirizzo non corrisponde a nessuna pagina attiva.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0e6e66] hover:underline">
          <ArrowLeft size={16} /> Torna alla home di SerraDesk
        </Link>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f5] p-6">
        <div className="bg-white p-8 rounded-sm shadow-sm border border-[#d7ddda] max-w-md w-full text-center">
          <div className="w-14 h-14 bg-[#0e6e66]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-[#0e6e66]" size={28} />
          </div>
          <h2 className="font-display font-bold text-xl mb-2">Richiesta inviata!</h2>
          <p className="text-[#6b7573] mb-6">
            Grazie per averci contattato. {settings?.company_name || "L'azienda"} esaminerà la tua richiesta e ti risponderà il prima possibile.
          </p>
          <p className="text-sm font-bold text-[#14181b]">{settings?.company_name}</p>
          <div className="mt-8 text-xs text-[#9fb0ac] font-mono">Preventivo generato con SerraDesk</div>
        </div>
      </div>
    );
  }

  const vetriDisponibili = sistemi.filter(s => s.tipologia === 'VETRO');
  const groupedSistemi = sistemi.reduce((acc, curr) => {
    if (curr.tipologia === 'VETRO') return acc;
    if (!acc[curr.tipologia]) acc[curr.tipologia] = [];
    acc[curr.tipologia].push(curr);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-[#14181b] font-sans">
      <SEOManager
        title={settings?.company_name ? `${settings.company_name} — Richiedi un preventivo` : 'Richiedi un preventivo'}
        description={settings?.public_page_bio || `Configura il tuo infisso e richiedi un preventivo${settings?.public_page_area ? ` a ${settings.public_page_area}` : ''}.`}
        path={`/i/${slug}`}
      />

      {/* HEADER */}
      <div className="bg-white border-b border-[#d7ddda]">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center gap-4 mb-4">
            {settings?.logo_base64 ? (
              <img src={settings.logo_base64} alt={settings.company_name} className="h-14 w-14 rounded object-contain border border-[#d7ddda] bg-white p-1" />
            ) : (
              <div className="h-14 w-14 rounded bg-[#14181b] flex items-center justify-center text-white font-display font-bold text-xl">
                {settings?.company_name?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-2xl leading-tight">{settings?.company_name || 'Richiesta Preventivo'}</h1>
              {settings?.public_page_area && (
                <p className="text-sm text-[#6b7573] flex items-center gap-1 mt-0.5"><MapPin size={13} /> {settings.public_page_area}</p>
              )}
            </div>
          </div>
          {settings?.public_page_bio && (
            <p className="text-[#4b5563] leading-relaxed max-w-xl">{settings.public_page_bio}</p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 py-10">
        {/* STEP PROGRESS */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className={`flex flex-col items-center flex-1 ${step >= 1 ? 'text-[#0e6e66]' : 'text-[#9fb0ac]'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-sm ${step >= 1 ? 'bg-[#0e6e66] text-white' : 'bg-[#e5e9e7]'}`}>1</div>
            <span className="text-xs font-bold text-center">La tua richiesta</span>
          </div>
          <div className={`h-1 flex-1 mx-2 rounded-full ${step >= 2 ? 'bg-[#0e6e66]' : 'bg-[#e5e9e7]'}`} />
          <div className={`flex flex-col items-center flex-1 ${step >= 2 ? 'text-[#0e6e66]' : 'text-[#9fb0ac]'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-sm ${step >= 2 ? 'bg-[#0e6e66] text-white' : 'bg-[#e5e9e7]'}`}>2</div>
            <span className="text-xs font-bold text-center">I tuoi dati</span>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-[#d7ddda] p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-display font-bold text-xl border-b border-[#d7ddda] pb-4">Componi la tua richiesta</h2>

              {!selectedSistema ? (
                <>
                  <p className="text-sm text-[#6b7573] mb-4">Seleziona cosa desideri inserire nella richiesta:</p>

                  {sistemi.length === 0 ? (
                    <div className="p-8 text-center text-[#6b7573] border border-dashed border-[#d7ddda] rounded-sm">
                      Il catalogo non è ancora stato configurato.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(groupedSistemi).map(([tipologia, list]) => (
                        <div key={tipologia} className="border border-[#d7ddda] rounded-sm p-4">
                          <h3 className="font-bold text-[#14181b] mb-3 uppercase text-xs tracking-wider">{tipologia.replace('_', ' ')}</h3>
                          <div className="space-y-2">
                            {list.map(s => (
                              <button
                                key={s.id}
                                onClick={() => setSelectedSistema(s)}
                                className="w-full text-left p-3 rounded-sm border border-[#d7ddda] hover:border-[#0e6e66] transition-colors flex items-center justify-between group"
                              >
                                <div>
                                  <p className="font-bold text-sm text-[#14181b]">{s.nome}</p>
                                  {s.marca && <p className="text-xs text-[#6b7573]">{s.marca}</p>}
                                </div>
                                <ChevronRight size={16} className="text-[#9fb0ac] group-hover:text-[#0e6e66]" />
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
                  <div className="flex items-center gap-3 pb-4 border-b border-[#d7ddda]">
                    <button onClick={() => { setSelectedSistema(null); setSelectedVetroId(''); }} className="text-sm text-[#0e6e66] hover:underline font-bold">
                      &larr; Indietro
                    </button>
                    <div>
                      <h3 className="font-bold text-[#14181b]">{selectedSistema.nome}</h3>
                      <p className="text-xs text-[#6b7573]">{selectedSistema.tipologia.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {['BATTENTE', 'FISSO', 'SCORREVOLE'].includes(selectedSistema.tipologia) && vetriDisponibili.length > 0 && (
                      <div className="col-span-2 mb-2">
                        <label className="text-xs font-bold text-[#374151] mb-1 block">Vetro (Opzionale)</label>
                        <select
                          className="w-full border border-[#d7ddda] rounded-sm p-2 text-sm outline-none focus:border-[#0e6e66]"
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
                      <label className="text-xs font-bold text-[#374151] mb-1 block">Larghezza (mm)</label>
                      <Input type="number" placeholder="es. 1000" value={larghezza} onChange={e => setLarghezza(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#374151] mb-1 block">Altezza (mm)</label>
                      <Input type="number" placeholder="es. 1200" value={altezza} onChange={e => setAltezza(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-[#374151] mb-1 block">Quantità</label>
                      <Input type="number" min="1" value={quantita} onChange={e => setQuantita(e.target.value)} />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-[#14181b] hover:bg-[#0e6e66] text-white font-bold h-12 mt-4 rounded-sm"
                    onClick={addToCart}
                    disabled={!larghezza || !altezza || quantita < 1}
                  >
                    Aggiungi alla richiesta
                  </Button>
                </div>
              )}

              {cart.length > 0 && !selectedSistema && (
                <div className="mt-8 pt-6 border-t border-[#d7ddda]">
                  <h3 className="font-bold text-[#14181b] mb-4 flex items-center gap-2"><Package size={18} /> La tua richiesta</h3>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-[#f4f6f5] border border-[#d7ddda] p-3 rounded-sm">
                        <div>
                          <p className="font-bold text-sm text-[#14181b]">{item.description}</p>
                          <p className="text-xs text-[#6b7573]">L: {item.width} x H: {item.height} mm · {item.quantity} {item.quantity === 1 ? 'Pezzo' : 'Pezzi'}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-xs font-bold text-red-500 hover:underline px-2 py-1">Rimuovi</button>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full h-12 bg-[#0e6e66] hover:bg-[#094a44] text-white font-bold text-base mt-6 rounded-sm" onClick={() => setStep(2)}>
                    Procedi con i tuoi dati <ArrowRight className="ml-2" size={18} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6 border-b border-[#d7ddda] pb-4">
                <button onClick={() => setStep(1)} className="text-sm text-[#0e6e66] hover:underline font-bold">
                  &larr; Torna alla richiesta
                </button>
                <h2 className="font-display font-bold text-xl">I tuoi contatti</h2>
              </div>

              {/* Campo esca anti-spam, nascosto agli utenti reali via CSS */}
              <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
                <label htmlFor="website_hp">Non compilare questo campo</label>
                <input id="website_hp" type="text" tabIndex="-1" autoComplete="off" value={clientData.website_hp || ''} onChange={e => setClientData({ ...clientData, website_hp: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151] flex items-center gap-1 mb-1"><User size={14} /> Nome e Cognome *</label>
                <Input value={clientData.nome} onChange={e => setClientData({ ...clientData, nome: e.target.value })} placeholder="es. Mario Rossi" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#374151] flex items-center gap-1 mb-1"><Phone size={14} /> Cellulare *</label>
                <Input value={clientData.telefono} onChange={e => setClientData({ ...clientData, telefono: e.target.value })} placeholder="es. 333 1234567" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#374151] flex items-center gap-1 mb-1"><Mail size={14} /> Email</label>
                <Input type="email" value={clientData.email} onChange={e => setClientData({ ...clientData, email: e.target.value })} placeholder="es. mario.rossi@email.com" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#374151] flex items-center gap-1 mb-1"><MapPin size={14} /> Città o Indirizzo</label>
                <Input value={clientData.citta} onChange={e => setClientData({ ...clientData, citta: e.target.value })} placeholder="es. Roma, Via Roma 1" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#374151] mb-1 block">Note aggiuntive</label>
                <textarea
                  className="w-full border border-[#d7ddda] rounded-sm p-3 text-sm min-h-[100px] outline-none focus:border-[#0e6e66]"
                  value={clientData.note}
                  onChange={e => setClientData({ ...clientData, note: e.target.value })}
                  placeholder="Es. Colore RAL preferito, piano dell'appartamento, ecc."
                />
              </div>

              <div className="pt-4">
                <Button
                  className="w-full h-14 bg-[#0e6e66] hover:bg-[#094a44] text-white font-bold text-base rounded-sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !clientData.nome || !clientData.telefono}
                >
                  {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta di Preventivo'}
                </Button>
                <p className="text-center text-xs text-[#9fb0ac] mt-3">Cliccando su Invia accetti di essere ricontattato in merito a questa richiesta.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs font-mono text-[#9fb0ac]">Preventivo generato con SerraDesk</p>
        </div>
      </div>
    </div>
  );
}
