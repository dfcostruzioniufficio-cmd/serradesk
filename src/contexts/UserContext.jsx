import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

const UserContext = createContext(null);

// Codice che PostgREST restituisce quando la riga non esiste davvero: è
// l'unico caso in cui l'utente è nuovo. Qualsiasi altro errore (rete assente,
// token in rinnovo, database irraggiungibile) è un guasto temporaneo e non va
// scambiato per "utente senza dati", altrimenti gli rimostriamo l'onboarding
// e finisce per riscrivere sopra le impostazioni che aveva già.
const NESSUNA_RIGA = 'PGRST116';

export function UserProvider({ children, session }) {
  const [userSettings, setUserSettings] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsLoadFailed, setSettingsLoadFailed] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadUserSettings(session.user.id);
    } else {
      setUserSettings(null);
      setUserProfile(null);
      setSettingsLoadFailed(false);
      setIsLoadingSettings(false);
    }
  }, [session]);

  // Un solo secondo tentativo dopo mezzo secondo: copre il caso più frequente,
  // cioè la lettura partita mentre il token di accesso si stava rinnovando.
  const leggiImpostazioni = async (userId) => {
    for (let tentativo = 0; tentativo < 2; tentativo++) {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error) return { data, guasto: false };
      if (error.code === NESSUNA_RIGA) return { data: null, guasto: false };
      if (tentativo === 1) return { data: null, guasto: true, error };
      await new Promise((risolvi) => setTimeout(risolvi, 500));
    }
  };

  const loadUserSettings = async (userId) => {
    setIsLoadingSettings(true);

    const { data: settingsData, guasto, error: settingsError } = await leggiImpostazioni(userId);

    if (guasto) {
      // I dati precedenti restano quelli che sono: non li azzeriamo per un
      // guasto di lettura. Va però detto all'utente, perché in questo stato
      // logo e dati aziendali non compaiono sui documenti.
      console.error('Impostazioni non caricate:', settingsError);
      setSettingsLoadFailed(true);
      toast.error('Non sono riuscito a caricare i dati della tua azienda. Ricarica la pagina prima di stampare un preventivo.');
    } else {
      setSettingsLoadFailed(false);
      setUserSettings(settingsData);
    }

    // Load Profile (Role, Plan)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileData && !profileError) {
      setUserProfile(profileData);
    }

    setIsLoadingSettings(false);
  };

  const refreshUserSettings = async () => {
    if (session?.user) {
      await loadUserSettings(session.user.id);
    }
  };

  // trial_ends_at, nonostante il nome, è la data di scadenza dell'accesso per
  // QUALSIASI piano (trial gratuito o abbonamento pagato) - viene aggiornata
  // anche ai rinnovi Stripe, non solo all'attivazione del trial
  const isSubscriptionActive = userProfile?.trial_ends_at ? new Date(userProfile.trial_ends_at) > new Date() : false;

  const needsPayment = userProfile?.role !== 'admin' && !isSubscriptionActive;

  return (
    <UserContext.Provider value={{ session, userSettings, userProfile, needsPayment, isLoadingSettings, settingsLoadFailed, refreshUserSettings, setUserSettings }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
