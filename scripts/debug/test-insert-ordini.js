import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  const userId = users && users[0] ? users[0].id : 'c18d3efd-686b-4eab-ac74-889812df9100';

  const orderPayload = {
      user_id: userId,
      cliente: 'Test Cliente',
      totale: 100,
      stato: 'Bozza',
      items: [],
      updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('ordini').insert([orderPayload]).select();
  console.log("Error:", error);
}

test();
