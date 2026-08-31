import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  const userId = "c18d3efd-686b-4eab-ac74-889812df9100"; // I will just get any user id or I'll query for the user id

  const defaultProfiles = [
      {
        user_id: userId,
        nome: 'Veka Softline 82 MD (Esempio)',
        marca: 'Veka',
        tipologia: 'BATTENTE',
        calc_type: 'mq',
        base_price: 350,
        specs: { trasmittanza: '1.0' },
        telaio_std: { codice: 'TEL-Z-82', aletta_mm: 30, saldatura_mm: 6, tolleranza_mm: 12 },
        telaio_inf: { codice: 'TEL-L-82', aletta_mm: 0, saldatura_mm: 6, tolleranza_mm: 12 },
        anta: { codice: 'ANT-T-82', ingombro_vista_mm: 82, sormonto_mm: 20, saldatura_mm: 6 },
        riporto: { codice: 'RIP-120', taglio_extra_mm: 120 }
      }
    ];

  const { data, error } = await supabase.from('sistemi_cam').insert(defaultProfiles).select();
  console.log("Error:", error);
}

test();
