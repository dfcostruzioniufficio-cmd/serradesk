import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  const { data, error } = await supabase.from('sistemi_cam').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(error || 'Deleted old profiles.');
}
clean();
