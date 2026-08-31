import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL + '/rest/v1/sistemi_cam?limit=1';
const key = process.env.VITE_SUPABASE_ANON_KEY;

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
}).then(res => res.json()).then(console.log).catch(console.error);
