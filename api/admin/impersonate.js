import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Solo chiamate POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { targetEmail } = req.body;

    if (!targetEmail) {
      return res.status(400).json({ error: 'targetEmail is required' });
    }

    // Client Supabase con privilegi di amministrazione (Service Role)
    // ATTENZIONE: Questo bypassa RLS, va usato solo lato server in modo protetto
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Verifica chi sta chiamando (deve essere un admin)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 2. Controlla il ruolo 'admin' nella tabella profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You must be an admin' });
    }

    // 3. Genera il magic link per l'email del target
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
      options: {
        redirectTo: 'https://serradesk.it/preventivi'
      }
    });

    if (error) {
      console.error('Error generating link:', error);
      return res.status(500).json({ error: error.message });
    }

    // Ritorna il link "magico" segreto al client (AdminPage)
    return res.status(200).json({ link: data.properties.action_link });
    
  } catch (err) {
    console.error('Unexpected error in impersonate API:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
