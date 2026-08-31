import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env.local') });

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

const allExtractedEmails = [
  'info@casadelserramento.net', 'info@fenstertotal.ro', 'stefano-donativo91@libero.it', 
  'porvaemergenza@libero.it', 'carrarettoserramenti@gmail.com', 'ciambronegiuseppe5@gmail.com', 
  'bocchiddivmax@gmail.com', 'map.infissi@hotmail.it', 'giocaus@tiscali.it', 'berardimaxxx@gmail.com', 
  'yurinapoleobe@gmail.com', 'nycolyno1991@gmail.com', 'enricopennone50@gmail.com', 
  'vincenzoargentieri246@gmail.com', 'lakhouasamir@gmail.com', 'studio1-7srlsbo@gmail.com', 
  'kes04052014@icloud.com', 'cmgroupsupportordini@gmail.com', 'infissi@mailinator.com', 
  'istalmat@gmail.com', 'tecnico1@finestreart.it', 'salpanic27@gmail.com', 'ninfo@casadelserramento.net', 
  'carminemarro10@gmail.com', 'clienti.serradesk@gmail.com', 'danielecelano74@gmail.com', 
  'infissi.cs@gmail.com', 'topinfissi21@libero.it', 'scarascia1975@gmail.com', 'demasimax@gmail.com', 
  'bishoy.habashy@yahoo.com', 'lucianolustri@virgilio.it', 'multidouble.it@gmail.com', 
  'powerspa@tiscali.it', 'tralluminio@icloud.com', 'cosentinocataldoserramenti@gmail.com', 
  'domenicopanico@gmail.com', 'sebastiani.giovanni1969@gmail.com', 'matteo.colaiori@gmail.com', 
  'fabbroistallatore.cdn@gmail.com', 'maria.digesu93@libero.it', 'gruppogolia@gmail.com', 
  'info@puntoalluminio.com'
];

async function sendMassEmailToList() {
  console.log("Starting to send to " + allExtractedEmails.length + " users from the previous DB...");
  
  let successCount = 0;
  let failCount = 0;
  
  for (const email of allExtractedEmails) {
    console.log("Sending email to: " + email + "...");
    
    try {
      await transporter.sendMail({
        from: '"Team SerraDesk" <info@serradesk.it>',
        to: email,
        subject: '🚀 Il nuovo SerraDesk è arrivato',
        html: emailHtml,
      });
      console.log("✅ Sent to " + email);
      successCount++;
    } catch (err) {
      console.error("❌ Failed to send to " + email + ":", err.message);
      failCount++;
    }
    
    // Add a small delay to avoid spamming the SMTP server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log("---");
  console.log("Mission accomplished. Sent: " + successCount + ", Failed: " + failCount);
}

sendMassEmailToList();
