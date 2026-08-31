import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL + '/rest/v1/sistemi_cam?id=eq.26f779b2-400b-437e-8964-ff29c80752ec';
const key = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || key;

async function test() {
  // Update
  await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ is_active: false })
  });

  // Read back
  const res = await fetch(url, {
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey
    }
  });
  const data = await res.json();
  console.log('Read back after update:', data);
}

test();
