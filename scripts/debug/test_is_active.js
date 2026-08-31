import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL + '/rest/v1/sistemi_cam?select=*&limit=1';
const key = process.env.VITE_SUPABASE_ANON_KEY;

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Accept': 'application/json'
  }
}).then(res => res.json()).then(data => {
  console.log('Row keys:', data.length > 0 ? Object.keys(data[0]) : 'No rows');
}).catch(console.error);
