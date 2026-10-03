import React, { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../contexts/UserContext';
import { Building, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

/**
 * Il primo ingresso dopo l'iscrizione: una domanda sola, il nome
 * dell'azienda, e poi subito il preventivatore con la guida.
 *
 * Prima qui c'erano il logo e cinque dati obbligatori (ragione sociale,
 * partita IVA, indirizzo, email, telefono) prima di aver visto una sola
 * finestra disegnata, e alla fine la pagina dei prezzi. La sera del 2
 * ottobre, da un post su Facebook, due iscritti su quattro sono entrati e
 * hanno chiuso senza compilare. Logo e dati di fatturazione servono al PDF:
 * si chiedono in Impostazioni, e il preventivo li ricorda prima di stampare.
 */
const companySchema = z.object({
  company_name: z.string().trim().min(2, "Scrivi il nome della tua azienda"),
});

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshUserSettings, session } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: { company_name: '' },
  });

  const onSubmitData = async (data) => {
    setIsSaving(true);
    if (!session?.user) {
      toast.error('Sessione non trovata. Fai il login di nuovo.');
      setIsSaving(false);
      return;
    }

    // Solo il nome: gli altri dati, se qualcuno li ha gia', restano com'erano.
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: session.user.id,
        company_name: data.company_name.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Errore salvataggio:', error);
      toast.error('Non sono riuscito a salvare il nome. Riprova tra un momento.');
      setIsSaving(false);
      return;
    }
    await refreshUserSettings();
    // Dritto al preventivatore, con la guida: con l'account l'archivio dei
    // profili e' gia' caricato, e si vede il programma vero. Salvare e
    // stampare portano alla pagina dei piani.
    navigate('/preventivi?tour=1');
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Come si chiama la tua azienda?</h1>
            <p className="text-slate-400">Finisce in cima ai tuoi preventivi. Il resto (logo, partita IVA, indirizzo) lo aggiungi dopo, quando ti serve.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmitData)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-slate-300 flex items-center gap-2">
                <Building size={16} className="text-blue-500" /> Nome dell&#39;azienda
              </Label>
              <Input
                id="company_name"
                autoFocus
                autoComplete="organization"
                {...register('company_name')}
                placeholder="Es. Rossi Serramenti"
                className="bg-[#1e293b] border-white/10 text-white h-12 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.company_name && <p className="text-red-400 text-sm">{errors.company_name.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 text-base"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <>Vai al preventivatore <ArrowRight size={18} className="ml-2" /></>}
            </Button>
          </form>
        </motion.div>

        <div className="mt-8 flex justify-center">
          <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-white/80 transition-colors">
            <LogOut size={16} className="mr-2" /> Hai sbagliato account? Esci e riprova
          </Button>
        </div>
      </div>
    </div>
  );
}
