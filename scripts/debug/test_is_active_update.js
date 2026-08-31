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
  console.log('Sample profile:', data.length ? Object.keys(data[0]) : 'No data');
  
  if (data.length) {
     const id = data[0].id;
     console.log('Trying to update id:', id, 'to is_active=false');
     
     const updateRes = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/sistemi_cam?id=eq.' + id, {
        method: 'PATCH',
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ is_active: false })
     });
     
     const updateData = await updateRes.json();
     console.log('Update result:', updateRes.status, updateData);
  }
}

test().catch(console.error);
