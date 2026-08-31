import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL + '/rest/v1/sistemi_cam?id=eq.26f779b2-400b-437e-8964-ff29c80752ec';
const key = process.env.VITE_SUPABASE_ANON_KEY;

fetch(url, {
  method: 'PATCH',
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({ is_active: false })
}).then(res => res.json()).then(console.log).catch(console.error);
