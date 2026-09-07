import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../contexts/UserContext';
import { Save, Building, FileText, Image as ImageIcon, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function SettingsPage() {
  const { refreshUserSettings, session } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    vat_number: '',
    address: '',
    legal_address: '',
    phone: '',
    email: '',
    website: '',
    logo_base64: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const user = session?.user;
    if (user) {
      setUserId(user.id);
      setUserEmail(user.email);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setFormData({
          company_name: data.company_name || '',
          vat_number: data.vat_number || '',
          address: data.address || '',
          legal_address: data.legal_address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          logo_base64: data.logo_base64 || ''
        });
      }
    }
    setIsLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      alert("L'immagine è troppo grande. Usa un logo di massimo 200 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, logo_base64: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setIsSaving(true);
    setMessage(null);

    // Upsert behavior using onConflict
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        company_name: formData.company_name,
        vat_number: formData.vat_number,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        logo_base64: formData.logo_base64,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    setIsSaving(false);
    
    if (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Errore durante il salvataggio.' });
    } else {
      await refreshUserSettings(); // aggiorna il context globale
      setMessage({ type: 'success', text: 'Impostazioni salvate con successo!' });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1a365d]">Impostazioni Azienda</h1>
            <p className="text-sm text-gray-500">I dati inseriti appariranno sui tuoi preventivi in PDF</p>
          </div>
          
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 px-6">
            <Save size={18} />
            {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </Button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg font-medium border-l-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-500' : 'bg-red-50 text-red-700 border-red-500'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Logo Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start pb-8 border-b border-gray-100">
              <div className="md:w-1/3">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <ImageIcon size={20} className="text-blue-600"/> Logo Aziendale
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Questo logo verrà stampato in alto a sinistra nei preventivi e nelle distinte PDF. (Max 200 KB)
                </p>
              </div>
              
              <div className="md:w-2/3 flex flex-col items-center sm:flex-row gap-6">
                <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                  {formData.logo_base64 ? (
                    <img src={formData.logo_base64} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                      <span className="text-xs">Nessun logo</span>
                    </div>
                  )}
                  
                  {formData.logo_base64 && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => setFormData({...formData, logo_base64: ''})} 
                        className="text-white text-xs font-bold bg-red-500 px-3 py-1.5 rounded-lg"
                      >
                        Rimuovi
                      </button>
                    </div>
                  )}
                </div>
                
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <label 
                    htmlFor="logo-upload" 
                    className="cursor-pointer bg-white border border-gray-300 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors inline-block"
                  >
                    Carica Immagine
                  </label>
                  <p className="text-xs text-gray-400 mt-2">Formati: PNG, JPG.</p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
              <div className="col-span-1 md:col-span-2">
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  <Building size={16} className="text-blue-600"/> Nome Azienda / Ragione Sociale
                </Label>
                <Input 
                  value={formData.company_name} 
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})} 
                  placeholder="Es. Mario Rossi Serramenti s.r.l."
                  className="h-11"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  <FileText size={16} className="text-blue-600"/> Partita IVA / C.F.
                </Label>
                <Input 
                  value={formData.vat_number} 
                  onChange={(e) => setFormData({...formData, vat_number: e.target.value})} 
                  placeholder="Es. 01234567890"
                  className="h-11"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  <MapPin size={16} className="text-blue-600"/> Indirizzo Sede Operativa
                </Label>
                <Input 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  placeholder="Es. Via Roma 1, 00100 Milano (MI)"
                  className="h-11"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  <Building size={16} className="text-blue-600"/> Indirizzo Sede Legale
                </Label>
                <Input 
                  value={formData.legal_address} 
                  onChange={(e) => setFormData({...formData, legal_address: e.target.value})} 
                  placeholder="Es. Via Milano 2, 00100 Roma (RM) - Opzionale"
                  className="h-11"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  📞 Telefono
                </Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="Es. 02 1234567"
                  className="h-11"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  ✉️ Email
                </Label>
                <Input 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  placeholder="Es. info@azienda.it"
                  className="h-11"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  🌐 Sito Web
                </Label>
                <Input 
                  value={formData.website} 
                  onChange={(e) => setFormData({...formData, website: e.target.value})} 
                  placeholder="Es. www.azienda.it"
                  className="h-11"
                />
              </div>
            </div>

          </div>
        </div>

        {userId && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 mt-6 overflow-hidden">
            <div className="bg-blue-50 p-6 border-b border-blue-100">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                🌐 Integrazione Sito Web (Preventivatore Pubblico)
              </h2>
              <p className="text-blue-700 text-sm mt-2">
                Fai compilare ai tuoi clienti i preventivi direttamente dal tuo sito web. 
                Le richieste arriveranno automaticamente nella tua pagina "Preventivi" con l'etichetta "Bozza dal Web".
              </p>
            </div>
            
            {userEmail === 'dfcostruzioni.ufficio@gmail.com' ? (
              <div className="p-6 space-y-6">
                <div>
                  <Label className="text-gray-700 font-bold mb-2 block">Link Diretto (da inviare su WhatsApp o Facebook)</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={`https://serradesk.it/preventivatore/${userId}`} className="bg-gray-50 text-blue-600 font-mono" />
                    <Button variant="outline" onClick={() => {
                      navigator.clipboard.writeText(`https://serradesk.it/preventivatore/${userId}`);
                      alert('Link copiato!');
                    }}>Copia</Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-700 font-bold mb-2 block">Codice iFrame (da incollare nel tuo sito web)</Label>
                  <div className="flex gap-2">
                    <textarea 
                      readOnly 
                      className="w-full bg-gray-50 text-gray-600 font-mono text-sm p-3 border rounded-md h-24"
                      value={`<iframe src="https://serradesk.it/preventivatore/${userId}" width="100%" height="800" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center justify-center bg-gray-50">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Funzionalità Premium</h3>
                <p className="text-gray-600 max-w-md mb-6">
                  Il Modulo "Preventivatore Web" è una funzionalità premium. Esegui l'upgrade per sbloccare l'acquisizione lead direttamente dal tuo sito.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                  Scopri i Piani Premium
                </Button>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
