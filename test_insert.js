import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.from('clienti').insert([
    { user_id: 'e4044e78-8443-4575-83c8-9bb4c4616a9e', name: 'Test Cliente' }
  ]);
  console.log('Insert:', { data, error });
}
run();
