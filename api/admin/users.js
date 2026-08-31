import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Verifica token e ruolo
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You must be an admin' });
    }

    // 2. Recupera tutti gli utenti reali dall'autenticazione
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) return res.status(500).json({ error: usersError.message });

    // 3. Recupera i profili
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) return res.status(500).json({ error: profilesError.message });

    // 4. Recupera le impostazioni
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*');
      
    if (settingsError) return res.status(500).json({ error: settingsError.message });

    // 5. Merge manuale dei dati basato su auth.users
    const mergedData = users.map(authUser => {
      const p = profiles.find(pr => pr.user_id === authUser.id) || {};
      const s = settings.find(st => st.user_id === authUser.id) || {};
      
      // Assicuriamoci che l'email reale sia passata nei settings per compatibilità col frontend
      const mergedSettings = { ...s, email: authUser.email };
      
      return {
        ...p,
        user_id: authUser.id,
        created_at: p.created_at || authUser.created_at,
        user_settings: [mergedSettings]
      };
    });

    // Ordina dal più recente
    mergedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({ users: mergedData });

  } catch (err) {
    console.error('Error in admin users API:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
