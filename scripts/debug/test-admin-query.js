import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iaqboqseeoexbrlktylo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // We can use the service role key from the environment if needed

// I will use SUPABASE_SERVICE_ROLE_KEY from process.env if available, otherwise just use the anon key.
// But to bypass RLS locally for debugging, let's use the service role key if we can pull it from vercel.
// Actually I'll just write a script that reads from .env.local 
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY // using anon key to simulate client-side fetch
);

async function test() {
  console.log("Testing user fetch...");
  
  // To simulate the admin user, we would need their token, but we can just use service role to see if the JOIN works.
  const adminClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // I need to get this from somewhere, or I can just test the syntax
  );

  const { data, error } = await adminClient
      .from('profiles')
      .select(`user_id, role, plan, trial_ends_at, created_at, user_settings(company_name, email)`)
      .order('created_at', { ascending: false })
      .limit(5);

  console.log("Data:", data);
  console.log("Error:", error);
}

test();
