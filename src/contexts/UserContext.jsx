import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const UserContext = createContext(null);

export function UserProvider({ children, session }) {
  const [userSettings, setUserSettings] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadUserSettings(session.user.id);
    } else {
      setUserSettings(null);
      setUserProfile(null);
      setIsLoadingSettings(false);
    }
  }, [session]);

  const loadUserSettings = async (userId) => {
    setIsLoadingSettings(true);
    
    // Load Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsData && !settingsError) {
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
    <UserContext.Provider value={{ session, userSettings, userProfile, needsPayment, isLoadingSettings, refreshUserSettings, setUserSettings }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
