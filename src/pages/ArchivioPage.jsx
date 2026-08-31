import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit, Copy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import AIPdfImporter from '../components/AIPdfImporter';
import { autoSeedProfilesIfNeeded } from '../lib/defaultProfiles';

export const DEFAULT_SISTEMI = [
  {
    id: 'DEC_EL76_BATTENTE',
    nome: 'Deceuninck Elegant 76 — Battente',
    marca: 'Deceuninck', tipologia: 'BATTENTE',
    calcType: 'mq', basePrice: 500,
    specs: { trasmittanza: '1,09 W/m²K', vetro: 'Vetro 33.1 PLANITHERM CLEAR (ARGON)/4MM', colInt: 'BIANCO IN MASSA 9010', colEst: 'BIANCO IN MASSA 9010', accessori: 'MARTELLINA HOPPE ARGENTO SATINATO' },
    profilo_lati: { codice: 'TEL-Z30',     descrizione: 'Telaio a Z',              aletta_mm: 30, saldatura_mm: 6, tolleranza_mm: 5 },
    profilo_basso: { codice: 'TEL-INF-DRN', descrizione: 'Davanzale con Drenaggio', aletta_mm: 0,  saldatura_mm: 6, tolleranza_mm: 5 },
    profilo_anta:  { codice: 'ANT-T70',     descrizione: 'Profilo Anta a T 70mm',   rebate_mm: 64, sormonto_mm: 20, saldatura_mm: 6, ingombro_vista_mm: 70, gioco_centrale_mm: 0 },
    profilo_riporto: { codice: 'RIP-70',    descrizione: 'Scambio Battuta / Riporto', taglio_extra_mm: 0 },
    profilo_fermavetro: { codice: 'FERM-24', descrizione: 'Fermavetro standard', },
  },
  {
    id: 'VETRO_4_16_4',
    nome: 'Vetro Camera 4/16/4',
    marca: 'Generico', tipologia: 'VETRO',
    calcType: 'mq', basePrice: 45,
    specs: { trasmittanza: '2,8 W/m²K', spessore: '24', descrizione: 'Doppio vetro trasparente standard', colInt: '', colEst: '', accessori: '' },
    profilo_lati:  { codice: '', descrizione: '', aletta_mm: 0, saldatura_mm: 0, tolleranza_mm: 0 },
    profilo_basso: { codice: '', descrizione: '', aletta_mm: 0, saldatura_mm: 0, tolleranza_mm: 0 },
    profilo_anta:  { codice: '', descrizione: '', rebate_mm: 0, sormonto_mm: 0, saldatura_mm: 0, ingombro_vista_mm: 0 },
    profilo_riporto: { codice: '', descrizione: '', taglio_extra_mm: 0 },
    profilo_fermavetro: { codice: '', descrizione: '' },
  },
  {
    id: 'VETRO_331_16_331',
    nome: 'Vetro Stratificato Basso Emissivo 33.1/16/33.1',
    marca: 'Generico', tipologia: 'VETRO',
    calcType: 'mq', basePrice: 85,
    specs: { trasmittanza: '1,1 W/m²K', spessore: '30', descrizione: 'Vetro antinfortunistico isolante termico e acustico (Gas Argon)', colInt: '', colEst: '', accessori: '' },
    profilo_lati:  { codice: '', descrizione: '', aletta_mm: 0, saldatura_mm: 0, tolleranza_mm: 0 },
    profilo_basso: { codice: '', descrizione: '', aletta_mm: 0, saldatura_mm: 0, tolleranza_mm: 0 },
    profilo_anta:  { codice: '', descrizione: '', rebate_mm: 0, sormonto_mm: 0, saldatura_mm: 0, ingombro_vista_mm: 0 },
    profilo_riporto: { codice: '', descrizione: '', taglio_extra_mm: 0 },
    profilo_fermavetro: { codice: '', descrizione: '' },
  },
];

const VUOTO = {
  nome: '', marca: '', tipologia: 'BATTENTE', calcType: 'mq', basePrice: '', is_active: true,
  specs: { trasmittanza: '', colInt: 'BIANCO IN MASSA 9010', colEst: 'BIANCO IN MASSA 9010', accessori: '' },
  profilo_lati:  { codice: '', descrizione: '', aletta_mm: 30, saldatura_mm: 6, tolleranza_mm: 5 },
  profilo_basso: { codice: '', descrizione: '', aletta_mm: 0,  saldatura_mm: 6, tolleranza_mm: 5 },
  profilo_anta:  { codice: '', descrizione: '', rebate_mm: 64, sormonto_mm: 20, saldatura_mm: 6, ingombro_vista_mm: 70, gioco_centrale_mm: 0 },
  profilo_riporto: { codice: '', descrizione: '', taglio_extra_mm: 0 },
  profilo_fermavetro: { codice: '', descrizione: '' },
};



function Row({ label, hint, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-700">{label}</Label>
      {hint && <p className="text-[10px] text-gray-400 leading-tight">{hint}</p>}
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function ProfiloBox({ title, subtitle, color, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-2 rounded-xl overflow-hidden" style={{ borderColor: color }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-2.5 text-left font-bold text-white text-sm"
        style={{ background: color }}>
        <span>{title}</span>
        {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
      </button>
      {open && <div className="p-3 bg-white"><p className="text-xs text-gray-500 mb-2 italic">{subtitle}</p>{children}</div>}
    </div>
  );
}

export default function ArchivioPage() {
  const [sistemi, setSistemi] = useState([]);
  const [form, setForm] = useState(VUOTO);
  const [expanded, setExpanded] = useState(null);
  const [mainTab, setMainTab] = useState('profili'); // 'profili' | 'vetri'
  const [categoryFilter, setCategoryFilter] = useState('Tutti');
  const [formTab, setFormTab] = useState('commerciale');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isInsertingDefaults, setIsInsertingDefaults] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // Vetro form
  const [formVetro, setFormVetro] = useState({ nome: '', basePrice: '', ug: '', is_active: true });

  useEffect(() => {
    fetchSistemi();
  }, []);

  const fetchSistemi = async () => {
    setIsLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const seeded = await autoSeedProfilesIfNeeded(session.user.id);
      if (seeded) {
        // If we seeded, we fetch immediately after to get the fresh data
        const { data } = await supabase.from('sistemi_cam').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        setSistemi(data || []);
        setIsLoading(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from('sistemi_cam')
      .select('*')
      .eq('user_id', session?.user?.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sistemi:', error);
    } else {
      setSistemi(data || []);
    }
    setIsLoading(false);
  };

  const f = (section, key, val) => setForm(p => ({ ...p, [section]: { ...p[section], [key]: val } }));
  const n = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.nome.trim()) return alert('Inserisci il nome del sistema');
    
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return alert('Devi essere loggato per salvare.');

    const newSistema = {
      user_id: user.id,
      nome: form.nome,
      marca: form.marca,
      materiale: 'Non specificato',
      tipologia: form.tipologia,
      calc_type: form.calcType,
      base_price: Number(form.basePrice) || 0,
      is_active: form.is_active,
      specs: {
        ...form.specs,
        riporto: form.profilo_riporto,
        fermavetro: form.profilo_fermavetro
      },
      telaio_std: form.profilo_lati,
      telaio_inf: form.profilo_basso,
      anta: form.profilo_anta
    };

    let response;
    if (editingId) {
      response = await supabase.from('sistemi_cam').update(newSistema).eq('id', editingId).select();
    } else {
      response = await supabase.from('sistemi_cam').insert([newSistema]).select();
    }

    if (response.error) {
      console.error('Error saving sistema:', response.error);
      alert('Errore durante il salvataggio.');
    } else {
      if (editingId) {
        setSistemi(s => s.map(item => item.id === editingId ? (response.data && response.data[0] ? response.data[0] : { ...item, ...newSistema }) : item));
      } else {
        setSistemi(s => [(response.data && response.data[0] ? response.data[0] : newSistema), ...s]);
      }
      setForm(VUOTO);
      setEditingId(null);
      setFormTab('commerciale');
    }
  };

  const handleSaveVetro = async () => {
    if (!formVetro.nome.trim()) return alert('Inserisci il nome del vetro');
    if (!formVetro.basePrice) return alert('Inserisci il prezzo al mq');
    
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return alert('Devi essere loggato per importare.');

    const newVetro = {
      user_id: user.id,
      nome: formVetro.nome,
      tipologia: 'VETRO',
      calc_type: 'mq',
      base_price: Number(formVetro.basePrice) || 0,
      is_active: formVetro.is_active,
      specs: {
        trasmittanza: formVetro.ug
      }
    };

    let response;
    if (editingId) {
      response = await supabase.from('sistemi_cam').update(newVetro).eq('id', editingId).select();
    } else {
      response = await supabase.from('sistemi_cam').insert([newVetro]).select();
    }

    if (response.error) {
      console.error('Error saving vetro:', response.error);
      alert('Errore durante il salvataggio.');
    } else {
      if (editingId) {
        setSistemi(s => s.map(item => item.id === editingId ? (response.data && response.data[0] ? response.data[0] : { ...item, ...newVetro }) : item));
      } else {
        setSistemi(s => [(response.data && response.data[0] ? response.data[0] : newVetro), ...s]);
      }
      setFormVetro({ nome: '', basePrice: '', ug: '' });
      setEditingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sicuro di voler eliminare questo sistema?')) return;
    const { error } = await supabase.from('sistemi_cam').delete().eq('id', id);
    if (error) {
      console.error('Error deleting:', error);
      alert('Errore durante l\'eliminazione.');
    } else {
      setSistemi(s => s.filter(x => x.id !== id));
      if (editingId === id) cancelEdit();
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    if (s.tipologia === 'VETRO') {
      setMainTab('vetri');
      setFormVetro({
        nome: s.nome || '',
        basePrice: s.base_price || '',
        ug: s.specs?.trasmittanza || '',
        is_active: s.is_active ?? true
      });
    } else {
      setMainTab('profili');
      setFormTab('commerciale');
      setForm({
        nome: s.nome || '',
        marca: s.marca || '',
        tipologia: s.tipologia || 'BATTENTE',
        calcType: s.calc_type || 'mq',
        basePrice: s.base_price || '',
        is_active: s.is_active ?? true,
        specs: {
          trasmittanza: s.specs?.trasmittanza || '',
          colInt: s.specs?.colInt || '',
          colEst: s.specs?.colEst || '',
          accessori: s.specs?.accessori || ''
        },
        profilo_lati: s.telaio_std || VUOTO.profilo_lati,
        profilo_basso: s.telaio_inf || VUOTO.profilo_basso,
        profilo_anta: s.anta || VUOTO.profilo_anta,
        profilo_riporto: s.specs?.riporto || VUOTO.profilo_riporto,
        profilo_fermavetro: s.specs?.fermavetro || VUOTO.profilo_fermavetro
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = (s) => {
    setEditingId(null); // Importante: annulla l'editing per fare un insert
    if (s.tipologia === 'VETRO') {
      setMainTab('vetri');
      setFormVetro({
        nome: `${s.nome || ''} (Copia)`,
        basePrice: s.base_price || '',
        ug: s.specs?.trasmittanza || ''
      });
    } else {
      setMainTab('profili');
      setFormTab('commerciale');
      setForm({
        nome: `${s.nome || ''} (Copia)`,
        marca: s.marca || '',
        tipologia: s.tipologia || 'BATTENTE',
        calcType: s.calc_type || 'mq',
        basePrice: s.base_price || '',
        specs: {
          trasmittanza: s.specs?.trasmittanza || '',
          colInt: s.specs?.colInt || '',
          colEst: s.specs?.colEst || '',
          accessori: s.specs?.accessori || ''
        },
        profilo_lati: s.telaio_std || VUOTO.profilo_lati,
        profilo_basso: s.telaio_inf || VUOTO.profilo_basso,
        profilo_anta: s.anta || VUOTO.profilo_anta,
        profilo_riporto: s.specs?.riporto || VUOTO.profilo_riporto,
        profilo_fermavetro: s.specs?.fermavetro || VUOTO.profilo_fermavetro
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // The manual default insertion was moved to automatic autoSeedProfilesIfNeeded

  const cancelEdit = () => {
    setEditingId(null);
    if (mainTab === 'vetri') {
      setFormVetro({ nome: '', basePrice: '', ug: '' });
    } else {
      setForm(VUOTO);
      setFormTab('commerciale');
    }
  };

  const applyPreset = (type) => {
    if (type === 'pvc') {
      setForm(p => ({
        ...p,
        profilo_lati: { ...p.profilo_lati, aletta_mm: 30, saldatura_mm: 6, tolleranza_mm: 5 },
        profilo_basso: { ...p.profilo_basso, aletta_mm: 0, saldatura_mm: 6, tolleranza_mm: 5 },
        profilo_anta: { ...p.profilo_anta, rebate_mm: 64, sormonto_mm: 20, saldatura_mm: 6, ingombro_vista_mm: 70, gioco_centrale_mm: 0 },
        profilo_riporto: { ...p.profilo_riporto, taglio_extra_mm: 0 }
      }));
    } else if (type === 'alu') {
      setForm(p => ({
        ...p,
        profilo_lati: { ...p.profilo_lati, aletta_mm: 22, saldatura_mm: 0, tolleranza_mm: 5 },
        profilo_basso: { ...p.profilo_basso, aletta_mm: 0, saldatura_mm: 0, tolleranza_mm: 5 },
        profilo_anta: { ...p.profilo_anta, rebate_mm: 50, sormonto_mm: 15, saldatura_mm: 0, ingombro_vista_mm: 60, gioco_centrale_mm: 5 },
        profilo_riporto: { ...p.profilo_riporto, taglio_extra_mm: 0 }
      }));
    }
  };

  const C = { BATTENTE: '#1e3a5f', FISSO: '#2d6a4f', SCORREVOLE: '#7b2d8b' };

  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-[#1a365d]">Archivio Sistemi</h1>
            <p className="text-sm text-gray-500 mt-1">Definisci marca, prezzi e profili di taglio per ogni sistema PVC/ALU</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* FORM */}
          <div className="lg:col-span-2">
            
            {/* TABS PRINCIPALI (Profili vs Vetri vs Intermediari) */}
            <div className="flex gap-2 mb-4 bg-white p-2 rounded-xl shadow-sm border">
              <Button 
                className={`flex-1 ${mainTab === 'profili' ? 'bg-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} 
                onClick={() => setMainTab('profili')}
              >
                Profili
              </Button>
              <Button 
                className={`flex-1 ${mainTab === 'vetri' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} 
                onClick={() => setMainTab('vetri')}
              >
                Vetri
              </Button>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-0 overflow-hidden flex flex-col">
              {mainTab === 'profili' ? (
                <>
                  <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">{editingId ? 'Modifica Profilo' : '+ Nuovo Profilo'}</h2>
                      {editingId && <p className="text-xs text-orange-600 font-medium">Stai modificando un profilo esistente</p>}
                    </div>
                    {editingId && (
                      <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-gray-500 hover:text-gray-800">
                        Annulla
                      </Button>
                    )}
                  </div>
                  <div className="bg-gray-100 px-4 pb-4 border-b">
                    <div className="flex gap-2">
                      <Button 
                        variant={formTab === 'commerciale' ? 'default' : 'outline'} 
                        onClick={() => setFormTab('commerciale')}
                        className={formTab === 'commerciale' ? 'bg-blue-700' : ''}
                      >
                        1. Dati Commerciali
                      </Button>
                      <Button 
                        variant={formTab === 'taglio' ? 'default' : 'outline'} 
                        onClick={() => setFormTab('taglio')}
                        className={formTab === 'taglio' ? 'bg-orange-600 hover:bg-orange-700 text-white border-transparent' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}
                      >
                        2. Dati di Taglio (Avanzato)
                      </Button>
                    </div>
                  </div>

              <div className="p-5 space-y-4">
                {formTab === 'commerciale' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <Row label="Nome del Sistema" hint="Un nome che riconosci facilmente (es. Deceuninck Elegant 76)">
                      <Input value={form.nome} onChange={e => n('nome', e.target.value)} placeholder="es. Deceuninck Elegant 76 Battente"/>
                    </Row>
                    <div className="grid grid-cols-2 gap-3">
                      <Row label="Marca/Produttore">
                        <Input className="h-9 text-sm" value={form.marca} onChange={e => n('marca', e.target.value)} placeholder="es. Deceuninck"/>
                      </Row>
                      <Row label="Tipo di Articolo">
                        <select className="w-full h-9 border rounded-md px-2 text-sm" value={form.tipologia} onChange={e => n('tipologia', e.target.value)}>
                          <option value="BATTENTE">Finestra Battente</option>
                          <option value="FISSO">Finestra Fissa</option>
                          <option value="SCORREVOLE">Finestra Scorrevole</option>
                          <option value="PERSIANA">Persiana / Scurone</option>
                          <option value="TAPPARELLA">Tapparella</option>
                          <option value="CASSONETTO">Cassonetto</option>
                          <option value="ZANZARIERA">Zanzariera</option>
                          <option value="TENDA">Tenda (Sole/Tecnica)</option>
                          <option value="PORTA_BLINDATA">Porta Blindata</option>
                        </select>
                      </Row>
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs font-bold text-green-800 mb-2">Prezzo di Listino</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Row label="Tipo di Calcolo">
                          <select className="w-full h-9 border rounded-md px-2 text-sm" value={form.calcType} onChange={e => n('calcType', e.target.value)}>
                            <option value="mq">Al Metro Quadro (€/mq)</option>
                            <option value="ml">Al Metro Lineare (€/ml)</option>
                            <option value="kg">A Peso (Kg/ml)</option>
                            <option value="pz">A Pezzo / Fisso (€/pz)</option>
                          </select>
                        </Row>
                        <Row label={form.calcType === 'kg' ? "Prezzo Alluminio (€/Kg)" : "Prezzo Base (€)"}>
                          <Input type="number" className="h-9 text-sm" value={form.basePrice} onChange={e => n('basePrice', e.target.value.replace(/^0+(?=\d)/, ''))}/>
                        </Row>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-blue-800 mb-1">Dati Tecnici per il PDF Preventivo</p>
                      <Row label="Trasmittanza Nodo (Uf) W/m²K"><Input className="h-8 text-xs" value={form.specs.trasmittanza} onChange={e => f('specs','trasmittanza',e.target.value)} placeholder="es. 1,09 o 2,5"/></Row>
                    </div>

                    <div className="p-4 bg-gray-50 border rounded-xl flex items-center justify-between mt-4">
                      <div>
                        <Label className="font-bold text-gray-800">Mostra nel Preventivatore Web</Label>
                        <p className="text-xs text-gray-500">I clienti potranno scegliere questo profilo dal tuo sito</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={form.is_active} onChange={e => n('is_active', e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <Button onClick={() => setFormTab('taglio')} variant="outline" className="w-full mt-2 text-blue-700 border-blue-200 hover:bg-blue-50">
                      Continua con i Dati di Taglio →
                    </Button>
                  </div>
                )}

                {formTab === 'taglio' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-200">
                      <div>
                        <p className="text-xs font-bold text-orange-800">Motore Distinta Base (CAM)</p>
                        <p className="text-[10px] text-orange-600">Seleziona un preset per compilare rapidamente le tolleranze.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={() => applyPreset('pvc')}>Preset PVC</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={() => applyPreset('alu')}>Preset Alluminio</Button>
                      </div>
                    </div>

                    <ProfiloBox
                      title="Profilo Telaio (Lati Sup, Sx, Dx)"
                      subtitle="Solitamente il profilo 'a Z'. Formano i 3 lati su cui batte l'anta."
                      color="#1e3a5f">
                      <div className="grid grid-cols-2 gap-2">
                        <Row label="Codice Profilo"><Input className="h-8 text-xs" value={form.profilo_lati.codice} onChange={e => f('profilo_lati','codice',e.target.value)} placeholder="es. TEL-Z30"/></Row>
                        <Row label="Descrizione"><Input className="h-8 text-xs" value={form.profilo_lati.descrizione} onChange={e => f('profilo_lati','descrizione',e.target.value)}/></Row>
                        <Row label="Aletta battuta (mm)"><Input type="number" className="h-8 text-xs" value={form.profilo_lati.aletta_mm} onChange={e => f('profilo_lati','aletta_mm',Number(e.target.value))}/></Row>
                        <Row label="Aria posa (mm)"><Input type="number" className="h-8 text-xs" value={form.profilo_lati.tolleranza_mm} onChange={e => f('profilo_lati','tolleranza_mm',Number(e.target.value))}/></Row>
                        <Row label="Saldatura (mm)"><Input type="number" className="h-8 text-xs" value={form.profilo_lati.saldatura_mm} onChange={e => f('profilo_lati','saldatura_mm',Number(e.target.value))}/></Row>
                        {form.calcType === 'kg' && <Row label="Peso (Kg/ml)"><Input type="number" className="h-8 text-xs border-blue-400 bg-blue-50" value={form.profilo_lati.peso_kg_ml || ''} onChange={e => f('profilo_lati','peso_kg_ml',Number(e.target.value))}/></Row>}
                      </div>
                    </ProfiloBox>

                    <ProfiloBox
                      title="Profilo Davanzale (Lato Inf)"
                      subtitle="Lato basso del telaio, spesso senza aletta."
                      color="#2d6a4f">
                      <div className="grid grid-cols-2 gap-2">
                        <Row label="Codice Profilo"><Input className="h-8 text-xs" value={form.profilo_basso.codice} onChange={e => f('profilo_basso','codice',e.target.value)} placeholder="es. TEL-INF"/></Row>
                        <Row label="Descrizione"><Input className="h-8 text-xs" value={form.profilo_basso.descrizione} onChange={e => f('profilo_basso','descrizione',e.target.value)}/></Row>
                        <Row label="Aletta battuta (mm)"><Input type="number" className="h-8 text-xs" value={form.profilo_basso.aletta_mm} onChange={e => f('profilo_basso','aletta_mm',Number(e.target.value))}/></Row>
                        <Row label="Saldatura (mm)"><Input type="number" className="h-8 text-xs" value={form.profilo_basso.saldatura_mm} onChange={e => f('profilo_basso','saldatura_mm',Number(e.target.value))}/></Row>
                        {form.calcType === 'kg' && <Row label="Peso (Kg/ml)"><Input type="number" className="h-8 text-xs border-blue-400 bg-blue-50" value={form.profilo_basso.peso_kg_ml || ''} onChange={e => f('profilo_basso','peso_kg_ml',Number(e.target.value))}/></Row>}
                      </div>
                    </ProfiloBox>

                    {form.tipologia !== 'FISSO' && form.tipologia !== 'TAPPARELLA' && form.tipologia !== 'CASSONETTO' && form.tipologia !== 'PORTA_BLINDATA' && form.tipologia !== 'ZANZARIERA' && form.tipologia !== 'TENDA' && (
                      <>
                        <ProfiloBox
                          title="Profilo Anta (Cornice Mobile)"
                          subtitle="Profilo a T per l'apertura."
                          color="#7b2d8b">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <Row label="Codice Profilo"><Input className="h-8 text-xs" value={form.profilo_anta.codice} onChange={e => f('profilo_anta','codice',e.target.value)} placeholder="es. ANT-T70"/></Row>
                            <Row label="Descrizione"><Input className="h-8 text-xs" value={form.profilo_anta.descrizione} onChange={e => f('profilo_anta','descrizione',e.target.value)}/></Row>
                            <Row label="Ingombro a vista (mm)" hint="Larghezza del nodo per fermavetri"><Input type="number" className="h-8 text-xs" value={form.profilo_anta.ingombro_vista_mm} onChange={e => f('profilo_anta','ingombro_vista_mm',Number(e.target.value))}/></Row>
                            <Row label="Battuta telaio (mm)"><Input type="number" className="h-8 text-xs" value={form.profilo_anta.rebate_mm} onChange={e => f('profilo_anta','rebate_mm',Number(e.target.value))}/></Row>
                            <Row label="Sormonto (mm)"><Input type="number" className="h-8 text-xs" value={form.profilo_anta.sormonto_mm} onChange={e => f('profilo_anta','sormonto_mm',Number(e.target.value))}/></Row>
                            <Row label="Gioco Centr. (mm)" hint="Spazio aria tra 2 ante"><Input type="number" className="h-8 text-xs" value={form.profilo_anta.gioco_centrale_mm || ''} onChange={e => f('profilo_anta','gioco_centrale_mm',Number(e.target.value))}/></Row>
                            <Row label="Saldatura (mm)"><Input type="number" className="h-8 text-xs" value={form.profilo_anta.saldatura_mm} onChange={e => f('profilo_anta','saldatura_mm',Number(e.target.value))}/></Row>
                            {form.calcType === 'kg' && <Row label="Peso (Kg/ml)"><Input type="number" className="h-8 text-xs border-blue-400 bg-blue-50" value={form.profilo_anta.peso_kg_ml || ''} onChange={e => f('profilo_anta','peso_kg_ml',Number(e.target.value))}/></Row>}
                          </div>
                        </ProfiloBox>

                        <ProfiloBox
                          title="Scambio Battuta (Riporto Centrale)"
                          subtitle="Profilo per la chiusura dell'anta principale sull'anta secondaria (per 2+ ante)."
                          color="#d97706">
                          <div className="grid grid-cols-2 gap-2">
                            <Row label="Codice Profilo"><Input className="h-8 text-xs" value={form.profilo_riporto.codice} onChange={e => f('profilo_riporto','codice',e.target.value)} placeholder="es. RIP-70"/></Row>
                            <Row label="Descrizione"><Input className="h-8 text-xs" value={form.profilo_riporto.descrizione} onChange={e => f('profilo_riporto','descrizione',e.target.value)}/></Row>
                            <Row label="Taglio Extra (mm)" hint="Saldatura o aria aggiuntiva"><Input type="number" className="h-8 text-xs" value={form.profilo_riporto.taglio_extra_mm} onChange={e => f('profilo_riporto','taglio_extra_mm',Number(e.target.value))}/></Row>
                            {form.calcType === 'kg' && <Row label="Peso (Kg/ml)"><Input type="number" className="h-8 text-xs border-blue-400 bg-blue-50" value={form.profilo_riporto.peso_kg_ml || ''} onChange={e => f('profilo_riporto','peso_kg_ml',Number(e.target.value))}/></Row>}
                          </div>
                        </ProfiloBox>
                      </>
                    )}

                    <ProfiloBox
                      title="Profilo Fermavetro"
                      subtitle="Regoli fermavetro calcolati in base alla luce netta dell'anta o del telaio (se fisso)."
                      color="#059669">
                      <div className="grid grid-cols-2 gap-2">
                        <Row label="Codice Profilo"><Input className="h-8 text-xs" value={form.profilo_fermavetro.codice} onChange={e => f('profilo_fermavetro','codice',e.target.value)} placeholder="es. FERM-24"/></Row>
                        <Row label="Descrizione"><Input className="h-8 text-xs" value={form.profilo_fermavetro.descrizione} onChange={e => f('profilo_fermavetro','descrizione',e.target.value)}/></Row>
                      </div>
                    </ProfiloBox>
                    
                    <Button onClick={() => setFormTab('commerciale')} variant="ghost" className="w-full mt-2 text-gray-500">
                      ← Torna ai Dati Commerciali
                    </Button>
                  </div>
                )}
                
                <div className="pt-4 border-t mt-4">
                  <Button onClick={handleSave} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 shadow-md text-lg">
                    {editingId ? 'Aggiorna Profilo' : 'Salva Profilo in Archivio'}
                  </Button>
                </div>
              </div>
              </>) : (
                <>
                  <div className="bg-emerald-50 p-4 border-b border-emerald-200 flex justify-between items-center">
                    <div>
                      <h2 className="font-bold text-emerald-900 text-lg">{editingId ? 'Modifica Vetro' : '+ Aggiungi Nuovo Vetro'}</h2>
                      <p className="text-xs text-emerald-700">{editingId ? 'Modifica i dati del vetro esistente.' : 'Questo vetro sarà selezionabile da tutti i profili.'}</p>
                    </div>
                    {editingId && (
                      <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-emerald-700 hover:bg-emerald-100">
                        Annulla
                      </Button>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    <Row label="Nome del Vetro" hint="Es. Doppio Vetro Acustico 4mm">
                      <Input value={formVetro.nome} onChange={e => setFormVetro({...formVetro, nome: e.target.value})} placeholder="Es. Doppio Vetro Standard"/>
                    </Row>
                    <div className="grid grid-cols-2 gap-4">
                      <Row label="Prezzo al Mq (€)">
                        <Input type="number" value={formVetro.basePrice} onChange={e => setFormVetro({...formVetro, basePrice: e.target.value})} placeholder="Es. 45"/>
                      </Row>
                      <Row label="Trasmittanza Vetro (Ug) W/m²K" hint="Opzionale">
                        <Input type="text" value={formVetro.ug} onChange={e => setFormVetro({...formVetro, ug: e.target.value.replace(',', '.')})} placeholder="Es. 1.0"/>
                      </Row>
                    </div>
                    
                    <div className="p-4 bg-gray-50 border rounded-xl flex items-center justify-between">
                      <div>
                        <Label className="font-bold text-gray-800">Mostra nel Preventivatore Web</Label>
                        <p className="text-xs text-gray-500">I clienti potranno scegliere questo vetro dal tuo sito</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formVetro.is_active} onChange={e => setFormVetro({...formVetro, is_active: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <Button onClick={handleSaveVetro} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 shadow-md text-lg mt-4">
                      {editingId ? 'Aggiorna Vetro' : 'Salva Vetro'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* LISTA */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="font-bold text-gray-700 text-lg">
                 {mainTab === 'profili' ? `Profili e Accessori Salvati` : mainTab === 'vetri' ? `Vetri Salvati (${sistemi.filter(s => s.tipologia === 'VETRO').length})` : 'Cataloghi Partner Disponibili'}
              </h2>
              {mainTab === 'profili' && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Tutti', 'Finestre', 'Persiane', 'Tapparelle', 'Zanzariere', 'Tende', 'Cassonetti', 'Porte Blindate'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors border ${categoryFilter === cat ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {mainTab !== 'intermediari' && sistemi.length === 0 && (
              <div className="bg-white rounded-2xl border-dashed border-2 border-gray-200 p-10 text-center">
                <h3 className="text-xl font-bold text-gray-700 mb-2">Stiamo caricando l'archivio...</h3>
                <p className="text-gray-500 mb-6">Il sistema sta popolando automaticamente il tuo account con i migliori profili di mercato.</p>
              </div>
            )}

            {mainTab !== 'intermediari' && (
              <div className="bg-white rounded-2xl border shadow-sm">
                  {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Caricamento in corso...</div>
                  ) : (() => {
                    let list = mainTab === 'profili' ? sistemi.filter(s => s.tipologia !== 'VETRO') : sistemi.filter(s => s.tipologia === 'VETRO');
                    if (mainTab === 'profili' && categoryFilter !== 'Tutti') {
                      if (categoryFilter === 'Finestre') list = list.filter(s => ['BATTENTE', 'FISSO', 'SCORREVOLE'].includes(s.tipologia));
                      if (categoryFilter === 'Persiane') list = list.filter(s => ['PERSIANA', 'PERSIANA BALCONE'].includes(s.tipologia));
                      if (categoryFilter === 'Tapparelle') list = list.filter(s => s.tipologia === 'TAPPARELLA');
                      if (categoryFilter === 'Zanzariere') list = list.filter(s => s.tipologia === 'ZANZARIERA');
                      if (categoryFilter === 'Tende') list = list.filter(s => s.tipologia === 'TENDA');
                      if (categoryFilter === 'Cassonetti') list = list.filter(s => s.tipologia === 'CASSONETTO');
                      if (categoryFilter === 'Porte Blindate') list = list.filter(s => s.tipologia === 'PORTA_BLINDATA');
                    }
                    if (list.length === 0) {
                      return (
                        <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                          <p className="mb-4">Nessun elemento presente in questa sezione.</p>
                        </div>
                      );
                    }
                    return list.map(s => (
                      <div key={s.id} className="border-b last:border-0">
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ background: C[s.tipologia] || '#10b981' }}/>
                            <div>
                              <p className="font-bold text-gray-800">{s.nome} {s.marca && <span className="text-gray-400 font-normal text-sm">({s.marca})</span>}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{s.tipologia} · € {s.base_price}/{s.calc_type}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" title="Modifica" onClick={(e) => { e.stopPropagation(); handleEdit(s); }} className="text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                              <Edit size={16}/>
                            </Button>
                            <Button variant="ghost" size="icon" title="Duplica" onClick={(e) => { e.stopPropagation(); handleDuplicate(s); }} className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                              <Copy size={16}/>
                            </Button>
                            <Button variant="ghost" size="icon" title="Elimina" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                              <Trash2 size={16}/>
                            </Button>
                          </div>
                        </div>
                        
                        {expanded === s.id && s.tipologia !== 'VETRO' && (
                          <div className="p-4 bg-gray-50 border-t grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                              <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Dati Commerciali / PDF</h4>
                              <ul className="space-y-1 text-gray-600">
                                <li><span className="font-semibold text-gray-700">Trasmittanza:</span> {s.specs?.trasmittanza}</li>
                                <li><span className="font-semibold text-gray-700">Accessori:</span> {s.specs?.accessori}</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Regole di Taglio</h4>
                              <ul className="space-y-2 text-xs text-gray-600">
                                <li><span className="font-bold text-blue-700">Telaio:</span> {s.telaio_std?.codice} (Aletta: {s.telaio_std?.aletta_mm}mm, Saldatura: {s.telaio_std?.saldatura_mm}mm)</li>
                                <li><span className="font-bold text-blue-700">Telaio Inf:</span> {s.telaio_inf?.codice}</li>
                                {s.tipologia !== 'FISSO' && s.tipologia !== 'TAPPARELLA' && s.tipologia !== 'CASSONETTO' && s.tipologia !== 'PORTA_BLINDATA' && s.tipologia !== 'ZANZARIERA' && s.tipologia !== 'TENDA' && (
                                  <>
                                    <li><span className="font-bold text-purple-700">Anta:</span> {s.anta?.codice} (Sormonto: {s.anta?.sormonto_mm}mm, Ingombro: {s.anta?.ingombro_vista_mm}mm)</li>
                                    {(s.riporto?.codice || s.specs?.riporto?.codice) && <li><span className="font-bold text-amber-600">Riporto Centr:</span> {s.riporto?.codice || s.specs?.riporto?.codice}</li>}
                                  </>
                                )}
                                {(s.fermavetro?.codice || s.specs?.fermavetro?.codice) && <li><span className="font-bold text-green-700">Fermavetro:</span> {s.fermavetro?.codice || s.specs?.fermavetro?.codice}</li>}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
              </div>
            )}
          </div>
        </div>
      </div>

      <AIPdfImporter 
        isOpen={showAIModal} 
        onClose={() => setShowAIModal(false)} 
        onProfilesAdded={(newProfiles) => {
           setSistemi(s => [...newProfiles, ...s]);
        }}
      />
    </div>
  );
}
