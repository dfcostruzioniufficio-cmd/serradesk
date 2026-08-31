import { supabase } from './supabaseClient';

export const DEFAULT_PROFILES_DATA = [
  // VETRI
  { nome: 'Vetro Camera 4/16/4 (Base)', marca: 'Generico', tipologia: 'VETRO', calc_type: 'mq', base_price: 45, specs: { trasmittanza: '2.8', descrizione: 'Doppio vetro trasparente standard' } },
  { nome: 'Vetro Stratificato Basso Emissivo 33.1/16/33.1', marca: 'Generico', tipologia: 'VETRO', calc_type: 'mq', base_price: 85, specs: { trasmittanza: '1.1', descrizione: 'Vetro antinfortunistico isolante termico' } },
  { nome: 'Vetro Acustico 44.2/15/33.1', marca: 'Generico', tipologia: 'VETRO', calc_type: 'mq', base_price: 120, specs: { trasmittanza: '1.0', descrizione: 'Vetro ad altissimo abbattimento acustico' } },
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
