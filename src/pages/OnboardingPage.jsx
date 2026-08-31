import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../contexts/UserContext';
import { Building, FileText, MapPin, Phone, Mail, UploadCloud, CheckCircle, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// Zod Schema per la validazione dei dati aziendali
const companySchema = z.object({
  company_name: z.string().min(2, "La Ragione Sociale deve avere almeno 2 caratteri"),
  vat_number: z.string().min(5, "Inserisci una P.IVA / C.F. valida"),
  address: z.string().min(5, "L'indirizzo è obbligatorio"),
  email: z.string().email("Inserisci un'email valida"),
  phone: z.string().min(5, "Il telefono è obbligatorio"),
});

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshUserSettings, session } = useUser();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  const [step, setStep] = useState(1);
  const [logoBase64, setLogoBase64] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: '',
      vat_number: '',
      address: '',
      email: '',
      phone: '',
    }
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      alert("L'immagine è troppo grande. Usa un logo di massimo 200 KB per garantire prestazioni veloci.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const onSubmitData = async (data) => {
    setIsSaving(true);
    
    if (!session?.user) {
      alert('Sessione non trovata. Fai il login di nuovo.');
      setIsSaving(false);
      return;
    }

    const user = session.user;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        company_name: data.company_name,
        vat_number: data.vat_number,
        address: data.address,
        phone: data.phone,
        email: data.email,
        logo_base64: logoBase64 || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error("Errore salvataggio:", error);
      alert("Errore durante il salvataggio dei dati.");
      setIsSaving(false);
    } else {
      await refreshUserSettings();
      setStep(3); // Vai allo step finale (Successo)
    }
  };

  // Varianti per le animazioni Framer Motion
  const variants = {
    enter: { opacity: 0, x: 50, scale: 0.95 },
    center: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -50, scale: 0.95 },
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Decorativo Vibe */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-2xl z-10 relative">
        
        {/* Progress Indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center mb-10 gap-2">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'w-12 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-4 bg-white/20'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'w-12 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-4 bg-white/20'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 3 ? 'w-12 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-4 bg-white/20'}`} />
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* STEP 1: CARICA LOGO */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white mb-2">Personalizza i tuoi PDF</h1>
                <p className="text-slate-400">Inizia caricando il logo della tua azienda per intestare i documenti.</p>
              </div>

              <div className="flex flex-col items-center justify-center gap-6">
                
                <div className="relative group w-full">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <label 
                    htmlFor="logo-upload" 
                    className="flex flex-col items-center justify-center w-full h-48 md:h-64 border-2 border-dashed border-blue-500/50 rounded-2xl bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer group-hover:border-blue-400 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] overflow-hidden"
                  >
                    {isUploading ? (
                      <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                    ) : logoBase64 ? (
                      <img src={logoBase64} alt="Logo" className="max-w-full max-h-full object-contain p-4 transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <div className="p-4 bg-blue-500/10 rounded-full mb-4">
                          <UploadCloud size={40} className="text-blue-500" />
                        </div>
                        <span className="font-semibold text-slate-200">Clicca o trascina il tuo logo</span>
                        <span className="text-sm mt-1">Formati ammessi: PNG, JPG (Max 200 KB)</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row w-full gap-4 mt-6">
                  <Button 
                    variant="ghost" 
                    onClick={() => setStep(2)}
                    className="w-full text-slate-400 hover:text-white hover:bg-white/5 py-6 text-base"
                  >
                    Salta, lo farò dopo
                  </Button>
                  <Button 
                    onClick={() => setStep(2)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 text-base shadow-lg shadow-blue-600/20"
                  >
                    {logoBase64 ? "Continua" : "Continua senza logo"} <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: DATI AZIENDALI */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl"
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-white mb-2">Dati di Fatturazione</h1>
                <p className="text-slate-400">Come dobbiamo chiamarti nei documenti ufficiali?</p>
              </div>

              <form onSubmit={handleSubmit(onSubmitData)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2"><Building size={16} className="text-blue-500"/> Ragione Sociale</Label>
                    <Input 
                      {...register("company_name")} 
                      placeholder="Es. SerraDesk s.r.l." 
                      className="bg-[#1e293b] border-white/10 text-white h-12 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.company_name && <p className="text-red-400 text-sm">{errors.company_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2"><FileText size={16} className="text-blue-500"/> P.IVA / Codice Fiscale</Label>
                    <Input 
                      {...register("vat_number")} 
                      placeholder="Es. 01234567890" 
                      className="bg-[#1e293b] border-white/10 text-white h-12"
                    />
                    {errors.vat_number && <p className="text-red-400 text-sm">{errors.vat_number.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2"><MapPin size={16} className="text-blue-500"/> Indirizzo Sede Operativa</Label>
                    <Input 
                      {...register("address")} 
                      placeholder="Es. Via Roma 1, 00100 Milano" 
                      className="bg-[#1e293b] border-white/10 text-white h-12"
                    />
                    {errors.address && <p className="text-red-400 text-sm">{errors.address.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2"><Phone size={16} className="text-blue-500"/> Telefono</Label>
                    <Input 
                      {...register("phone")} 
                      placeholder="Es. 02 1234567" 
                      className="bg-[#1e293b] border-white/10 text-white h-12"
                    />
                    {errors.phone && <p className="text-red-400 text-sm">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2"><Mail size={16} className="text-blue-500"/> Email</Label>
                    <Input 
                      {...register("email")} 
                      placeholder="Es. preventivi@azienda.it" 
                      className="bg-[#1e293b] border-white/10 text-white h-12"
                    />
                    {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 mt-6 border-t border-white/5">
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setStep(1)}
                    className="text-slate-400 hover:text-white hover:bg-white/5 px-6"
                  >
                    Indietro
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 shadow-lg shadow-blue-600/20"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Salva e Continua"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 3: AHA MOMENT (SUCCESS) */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center p-8 max-w-lg mx-auto"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative"
              >
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <CheckCircle size={64} className="text-emerald-400" />
              </motion.div>
              
              <h1 className="text-4xl font-black text-white mb-4">Ottimo lavoro!</h1>
              <p className="text-xl text-slate-400 mb-10 leading-relaxed font-light">
                Il tuo setup è completato. Ora i tuoi preventivi sono pronti per essere inviati ai clienti con un look ultra-professionale.
              </p>
              
              <Button 
                onClick={() => navigate('/preventivi?tour=1')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-lg py-7 px-10 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                Attiva il tuo Abbonamento <ArrowRight size={20} className="ml-2" />
              </Button>
            </motion.div>
          )}

        </AnimatePresence>

        <div className="mt-8 flex justify-center">
          <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-white/80 transition-colors">
            <LogOut size={16} className="mr-2" /> Hai sbagliato account? Esci e riprova
          </Button>
        </div>
      </div>
    </div>
  );
}
