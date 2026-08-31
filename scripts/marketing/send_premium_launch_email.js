import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const emailHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #333;">
  <p>Ciao,</p>

  <p>ti scriviamo perché sei stato tra i primissimi a provare SerraDesk quando eravamo ancora agli inizi, e ci tenevamo a darti una notizia importante.</p>

  <p>In queste settimane abbiamo lavorato giorno e notte, ascoltando i feedback di chi lavora in officina, per trasformare il software nello strumento definitivo per chi produce e vende infissi.</p>

  <p><strong>Abbiamo appena lanciato in tutta Italia la Versione Premium 2.0. Cosa c'è di nuovo?</strong></p>
  <ul style="list-style: none; padding-left: 0;">
    <li>✅ Motore grafico fotorealistico per far cadere la mascella ai tuoi clienti.</li>
    <li>✅ Distinta di taglio automatica pronta per l'officina.</li>
    <li>✅ Archivio con modelli preimpostati: inizi a lavorare in 2 minuti senza configurazioni infinite. (ad esempio finestra 1-2-3 ante, porta finestra 1-2-3 ante ecc...)</li>
  </ul>

  <p>Da oggi, l'accesso gratuito al software è stato ufficialmente chiuso e SerraDesk è diventato un servizio Premium su abbonamento. Il tuo vecchio account è stato temporaneamente bloccato.</p>

  <p><strong>TUTTAVIA...</strong></p>

  <p>Siccome ci hai dato fiducia quando eravamo in fase di test, non volevamo assolutamente lasciarti fuori dalla porta. Abbiamo riservato per te un "Pass VIP".</p>

  <p>Puoi riattivare il tuo account, mantenere i tuoi vecchi preventivi, e sbloccare tutte le NUOVE funzioni Premium per un mese intero a <strong>soli 5€</strong> (anziché 35€).</p>

  <p>Nessun vincolo strano: lo sblocchi, fai un paio di preventivi con la nuova grafica spaccamascellare e vedi subito se ti aiuta a chiudere più contratti.</p>

  <p>👉 <strong><a href="https://serradesk.it" style="color: #2563eb; font-weight: bold; font-size: 16px;">Clicca qui per rientrare su SerraDesk a 5€</a></strong></p>

  <p><em>Attenzione: questo sblocco a 5€ è valido solo per pochi giorni, poi il sistema eliminerà gli account inattivi per fare spazio ai nuovi abbonati.</em></p>

  <p>Ti aspettiamo dentro!<br>
  Un saluto,<br>
  <strong>Il team di SerraDesk</strong></p>
</div>
`;

async function sendMassEmail() {
  console.log("Fetching users from Supabase...");
  
  // Get all users
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  
  const users = data.users;
  console.log("Found " + users.length + " users.");
  
  let successCount = 0;
  let failCount = 0;
  
  for (const user of users) {
    if (!user.email) continue;
    
    console.log("Sending email to: " + user.email + "...");
    
    try {
      await transporter.sendMail({
        from: '"Team SerraDesk" <info@serradesk.it>',
        to: user.email,
        subject: '🚀 Il nuovo SerraDesk è arrivato',
        html: emailHtml,
      });
      console.log("✅ Sent to " + user.email);
      successCount++;
    } catch (err) {
      console.error("❌ Failed to send to " + user.email + ":", err.message);
      failCount++;
    }
    
    // Add a small delay to avoid spamming the SMTP server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log("---");
  console.log("Mission accomplished. Sent: " + successCount + ", Failed: " + failCount);
}

sendMassEmail();
