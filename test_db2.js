import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const email = 'test_agent_check_' + Date.now() + '@example.com';
  const { data: authData } = await supabase.auth.signUp({ email, password: 'password123' });
  const user = authData.user;
  
  const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
  console.log(data);
}
test();
