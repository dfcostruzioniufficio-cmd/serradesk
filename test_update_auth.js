import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const email = 'test_agent_' + Date.now() + '@example.com';
  console.log('Signing up:', email);
  
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });
  if (authErr) return console.error('Auth error:', authErr);
  
  const user = authData.user;
  console.log('User created:', user.id);
  
  const newSist = {
    user_id: user.id,
    nome: 'Test System',
    marca: 'Test',
    materiale: 'PVC',
    tipologia: 'BATTENTE',
    calc_type: 'mq',
    base_price: 100,
    is_active: true
  };
  
  const { data: insertData, error: insertErr } = await supabase.from('sistemi_cam').insert([newSist]).select();
  if (insertErr) return console.error('Insert error:', insertErr);
  
  const id = insertData[0].id;
  console.log('Inserted system:', id, 'is_active:', insertData[0].is_active);
  
  const { data: updateData, error: updateErr } = await supabase.from('sistemi_cam').update({ is_active: false }).eq('id', id).select();
  if (updateErr) return console.error('Update error:', updateErr);
  
  console.log('Updated system data length:', updateData.length);
  if (updateData.length) {
    console.log('Updated system is_active:', updateData[0].is_active);
  }
}

test().catch(console.error);
