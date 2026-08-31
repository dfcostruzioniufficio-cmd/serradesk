import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL + '/rest/v1/sistemi_cam?id=eq.5f2a1c5a-368f-452a-b410-5389063b1eb5';
const key = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || key;

async function test() {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ is_active: false })
  });

  const data = await res.json();
  console.log('Update result:', data);
}
test();
