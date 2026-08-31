import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const url = process.env.VITE_SUPABASE_URL + '/rest/v1/sistemi_cam?select=*&limit=1';
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(url, {
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Accept': 'application/json'
    }
  });
  
  const data = await res.json();
  if (data.length) {
     console.log('Type of is_active:', typeof data[0].is_active, 'Value:', data[0].is_active);
  } else {
     console.log('No data');
  }
}

test().catch(console.error);
