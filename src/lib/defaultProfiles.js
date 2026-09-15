import { supabase } from './supabaseClient';

export const DEFAULT_PROFILES_DATA = [
  // VETRI
  // I tre vetri con prezzo sono visibili da subito; gli altri sono i vetri
  // di riferimento (VETRI_DI_RIFERIMENTO, piu' sotto), nascosti finche'
  // l'utente non ne imposta il prezzo.
  { nome: 'Vetrocamera 4/16/4 aria, vetro normale', marca: 'Generico', tipologia: 'VETRO', calc_type: 'mq', base_price: 45, specs: { trasmittanza: '2.7', categoria: 'Doppio vetro', descrizione: 'Doppio vetro trasparente senza trattamento', fonte: 'Calcolo EN 673 (2,73 W/m²K), UNI EN ISO 10077-1 prospetto C.2' } },
  { nome: 'Vetrocamera di sicurezza 33.1/16/33.1 basso emissivo, argon', marca: 'Generico', tipologia: 'VETRO', calc_type: 'mq', base_price: 85, specs: { trasmittanza: '1.1', categoria: 'Sicurezza e acustici', descrizione: 'Vetro antinfortunio isolante con gas argon', fonte: 'Vetrocamera basso emissivo argon 16 mm, EN 673: lo stratificato non cambia la Ug (AGC ipaphon V 6/16/VSG 44.2 Ar: 1,1)' } },
  { nome: 'Vetrocamera acustico 6/16/44.2 basso emissivo, argon (Rw 39 dB)', marca: 'Generico', tipologia: 'VETRO', calc_type: 'mq', base_price: 120, specs: { trasmittanza: '1.1', categoria: 'Sicurezza e acustici', descrizione: 'Vetro ad alto abbattimento acustico', fonte: 'AGC ipaphon 39/31 V, 6/16/VSG 44.2 Ar 90%, EN 673' } },
  // PVC
  { nome: 'Rehau Synego', marca: 'Rehau', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 370, specs: { materiale: 'PVC', trasmittanza: '0.97' } },
  { nome: 'Veka Softline 76 Italia', marca: 'Veka', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 340, specs: { materiale: 'PVC', trasmittanza: '1.1' } },
  { nome: 'Veka Softline 82', marca: 'Veka', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 440, specs: { materiale: 'PVC', trasmittanza: '1.0' } },
  { nome: 'Finstral Fin-Window', marca: 'Finstral', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 670, specs: { materiale: 'PVC', trasmittanza: '0.82' } },
  { nome: 'Internorm KF 410', marca: 'Internorm', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 770, specs: { materiale: 'PVC', trasmittanza: '0.65' } },
  { nome: 'Oknoplast Prolux Evolution', marca: 'Oknoplast', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 500, specs: { materiale: 'PVC', trasmittanza: '1.2' } },
  { nome: 'Kömmerling 76 MD', marca: 'Kömmerling', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 400, specs: { materiale: 'PVC', trasmittanza: '0.75' } },
  { nome: 'Deceuninck Elegant Infinity', marca: 'Deceuninck', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 420, specs: { materiale: 'PVC', trasmittanza: '1.0' } },
  { nome: 'Schüco Corona SI 82', marca: 'Schüco', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 470, specs: { materiale: 'PVC', trasmittanza: '0.74' } },
  { nome: 'Aluplast Ideal 5000', marca: 'Aluplast', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 240, specs: { materiale: 'PVC', trasmittanza: '1.3' } },
  // ALLUMINIO
  { nome: 'Schüco AWS 75.SI+', marca: 'Schüco', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 870, specs: { materiale: 'Alluminio TT', trasmittanza: '0.9' } },
  { nome: 'Reynaers Masterline 8', marca: 'Reynaers', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 840, specs: { materiale: 'Alluminio TT', trasmittanza: '1.0' } },
  { nome: 'AluK 77IW', marca: 'AluK', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 640, specs: { materiale: 'Alluminio TT', trasmittanza: '1.1' } },
  { nome: 'Metra NC 75 HES', marca: 'Metra', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 620, specs: { materiale: 'Alluminio TT', trasmittanza: '1.65' } },
  { nome: 'Domal Slide C160', marca: 'Domal', tipologia: 'SCORREVOLE', calc_type: 'mq', base_price: 1370, specs: { materiale: 'Alluminio TT', trasmittanza: '1.32' } },
  { nome: 'Domal Slide TB65', marca: 'Domal', tipologia: 'SCORREVOLE', calc_type: 'mq', base_price: 720, specs: { materiale: 'Alluminio TT', trasmittanza: '1.6' } },
  { nome: 'Ponzio WS 75', marca: 'Ponzio', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 600, specs: { materiale: 'Alluminio TT', trasmittanza: '1.5' } },
  { nome: 'Indinvest Dogma', marca: 'Indinvest', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 570, specs: { materiale: 'Alluminio TT', trasmittanza: '1.5' } },
  { nome: 'Cortizo COR Vision Plus', marca: 'Cortizo', tipologia: 'SCORREVOLE', calc_type: 'mq', base_price: 1470, specs: { materiale: 'Alluminio TT', trasmittanza: '0.9' } },
  { nome: 'Twin Systems RX 700 HP', marca: 'Twin Systems', tipologia: 'BATTENTE', calc_type: 'mq', base_price: 540, specs: { materiale: 'Alluminio TT', trasmittanza: '1.6' } },
  
  // Persiane e Scuri
  { nome: 'Persiana Alluminio Stecca Orientabile', marca: 'Kikau', tipologia: 'PERSIANA', calc_type: 'mq', base_price: 280, specs: { materiale: 'Alluminio', descrizione: 'Lamelle orientabili a goccia' } },
  { nome: 'Persiana Alluminio Stecca Fissa', marca: 'Domal', tipologia: 'PERSIANA', calc_type: 'mq', base_price: 220, specs: { materiale: 'Alluminio', descrizione: 'Lamelle fisse storiche' } },
  { nome: 'Scuro Alluminio Dogato', marca: 'Generico', tipologia: 'PERSIANA', calc_type: 'mq', base_price: 240, specs: { materiale: 'Alluminio', descrizione: 'Scuro classico a doghe verticali' } },

  // Tapparelle
  { nome: 'Tapparella Alluminio Coibentato', marca: 'Generico', tipologia: 'TAPPARELLA', calc_type: 'mq', base_price: 65, specs: { materiale: 'Alluminio', descrizione: 'Tapparella standard con poliuretano espanso' } },
  { nome: 'Tapparella Acciaio Alta Sicurezza', marca: 'Generico', tipologia: 'TAPPARELLA', calc_type: 'mq', base_price: 110, specs: { materiale: 'Acciaio', descrizione: 'Antieffrazione classe 3' } },

  // Cassonetti
  { nome: 'Cassonetto Coibentato Ristrutturazione', marca: 'Generico', tipologia: 'CASSONETTO', calc_type: 'ml', base_price: 120, specs: { materiale: 'EPS/Legno', descrizione: 'Isolamento termoacustico certificato' } },

  // Porte Blindate
  { nome: 'Porta Blindata Classe 3 Standard', marca: 'Dierre', tipologia: 'PORTA_BLINDATA', calc_type: 'pz', base_price: 850, specs: { materiale: 'Acciaio', descrizione: 'Serratura cilindro europeo, pannello liscio' } },
  { nome: 'Porta Blindata Classe 4', marca: 'Oikos', tipologia: 'PORTA_BLINDATA', calc_type: 'pz', base_price: 1400, specs: { materiale: 'Acciaio', descrizione: 'Altissima sicurezza' } }
];

/**
 * Vetri di uso comune con la Ug dichiarata dai produttori di vetro secondo
 * EN 673 (tabelle tecniche AGC Interpane, Guardian Performance Calculator
 * validato KIWA). Il prezzo dipende dal fornitore di ciascuno: partono senza
 * prezzo e nascosti nel preventivo, l'utente li attiva dopo averlo scritto.
 */
export const VETRI_DI_RIFERIMENTO = [
  { nome: 'Vetrocamera 4/16/4 basso emissivo, aria', ug: '1.4', categoria: 'Doppio vetro', fonte: 'Guardian ClimaGuard Premium 4/16 aria/4, EN 673: 1,36 W/m²K' },
  { nome: 'Vetrocamera 4/16/4 basso emissivo, argon', ug: '1.1', categoria: 'Doppio vetro', fonte: 'AGC iplus 1.1, 4/16/4 argon 90%, EN 673' },
  { nome: 'Vetrocamera 4/16/4 basso emissivo alte prestazioni, argon', ug: '1.0', categoria: 'Doppio vetro', fonte: 'AGC iplus 1.0, 4/16/4 argon 90%, EN 673; Saint-Gobain Planitherm One 4-16Ar-4: 1,0' },
  { nome: 'Vetrocamera controllo solare 6/16/4 basso emissivo, argon', ug: '1.0', categoria: 'Doppio vetro', fonte: 'AGC Stopray Vision / Energy 6/16/4 argon 90%, EN 673' },
  { nome: 'Vetrocamera di sicurezza 33.1/14/33.1 (6/7) basso emissivo, argon', ug: '1.1', categoria: 'Sicurezza e acustici', fonte: 'Calcolo EN 673 (1,12-1,14 W/m²K) con basso emissivo tarato sui valori dichiarati AGC iplus 1.1 (4/16/4 Ar 1,1) e Guardian ClimaGuard Premium (4/16/4 aria 1,36)' },
  { nome: 'Vetrocamera di sicurezza 33.1/14/33.1 (6/7) basso emissivo, aria', ug: '1.4', categoria: 'Sicurezza e acustici', fonte: 'Calcolo EN 673 (1,42-1,44 W/m²K) con basso emissivo tarato sui valori dichiarati AGC iplus 1.1 (4/16/4 Ar 1,1) e Guardian ClimaGuard Premium (4/16/4 aria 1,36)' },
  { nome: 'Triplo vetro 4/12/4/12/4 due basso emissivi, argon', ug: '0.7', categoria: 'Triplo vetro', fonte: 'AGC ipaphon 33/36, 4/12/4/12/4 argon 90%, EN 673' },
  { nome: 'Triplo vetro 4/16/4/16/4 due basso emissivi, argon', ug: '0.6', categoria: 'Triplo vetro', fonte: 'AGC iplus 1.1 tripla, 4/16/4/16/4 argon 90%, EN 673' },
  { nome: 'Triplo vetro 4/16/4/16/4 alte prestazioni, argon', ug: '0.5', categoria: 'Triplo vetro', fonte: 'AGC iplus 1.0 tripla, 4/16/4/16/4 argon 90%, EN 673' },
].map((v) => ({
  nome: v.nome, marca: 'Generico', tipologia: 'VETRO', calc_type: 'mq', base_price: 0,
  specs: { trasmittanza: v.ug, categoria: v.categoria, fonte: v.fonte, nel_preventivo: false },
}));

DEFAULT_PROFILES_DATA.push(...VETRI_DI_RIFERIMENTO);

export async function autoSeedProfilesIfNeeded(userId) {
  if (!userId) return false;
  
  // Check if they already have profiles
  const { data, error } = await supabase
    .from('sistemi_cam')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
    
  if (error) {
    console.error('Error checking existing profiles:', error);
    return false;
  }
  
  // If no profiles found, seed them!
  if (!data || data.length === 0) {
    console.log('No profiles found for user. Auto-seeding default market profiles...');
    
    const profilesToInsert = DEFAULT_PROFILES_DATA.map(p => ({
      ...p,
      user_id: userId
    }));
    
    const { error: insertError } = await supabase
      .from('sistemi_cam')
      .insert(profilesToInsert);
      
    if (insertError) {
      console.error('Error auto-seeding profiles:', insertError);
      return false;
    }
    
    console.log('Successfully seeded default profiles!');
    return true; // Returns true if seeded
  } else {
    // Check if they are missing specific new categories we just launched
    const { data: existingTypes } = await supabase.from('sistemi_cam').select('tipologia').eq('user_id', userId);
    if (existingTypes) {
      const types = existingTypes.map(t => t.tipologia);
      const missingTypes = [];
      if (!types.includes('CASSONETTO')) missingTypes.push('CASSONETTO');
      if (!types.includes('TAPPARELLA')) missingTypes.push('TAPPARELLA');
      if (!types.includes('PORTA_BLINDATA')) missingTypes.push('PORTA_BLINDATA');
      if (!types.includes('PERSIANA')) missingTypes.push('PERSIANA');

      if (missingTypes.length > 0) {
        console.log('Seeding missing new categories:', missingTypes);
        const missingProfiles = DEFAULT_PROFILES_DATA.filter(p => missingTypes.includes(p.tipologia)).map(p => ({
          ...p,
          user_id: userId
        }));
        await supabase.from('sistemi_cam').insert(missingProfiles);
        return true; // We seeded something new
      }
    }
  }
  
  return false; // Did not need to seed
}
