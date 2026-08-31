import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
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

const CSV_FILE = resolve(__dirname, 'contatti.csv');
const TRACKING_FILE = resolve(__dirname, 'sent_cold_emails.json');

function parseCsvLine(text) {
  let ret = [''], i = 0, p = '', s = true;
  for (let l = text.length; i < l; i++) {
    let c = text[i];
    if (c === '"') {
      s = !s;
    } else if (c === ';' && s) {
      ret.push('');
    } else {
      ret[ret.length - 1] += c;
    }
  }
  return ret.map(str => str.trim());
}

async function sendDailyColdEmails() {
  let sentEmails = [];
  if (fs.existsSync(TRACKING_FILE)) {
    try {
      sentEmails = JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'));
    } catch (e) {}
  }

  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const lines = csvContent.split(/\r?\n/);
  
  let emailsToSend = [];
  
  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCsvLine(line);
    // "Email 1" is at index 15 based on the headers
    if (parts.length > 15) {
      const email1 = parts[15];
      const name = parts[1] ? parts[1] : '';
      
      if (email1 && email1.includes('@')) {
        // Handle multiple emails in the same field like "info@; admin@"
        const extractedEmails = email1.split(/[, \s]+/).filter(e => e.includes('@'));
        for (const e of extractedEmails) {
          if (!sentEmails.includes(e) && !emailsToSend.some(item => item.email === e)) {
            emailsToSend.push({ email: e, name: name });
          }
        }
      }
    }
  }

  // Limit to 100
  const targets = emailsToSend.slice(0, 100);
  
  console.log("Trovati " + targets.length + " nuovi contatti a cui inviare la mail oggi.");
  
  let successCount = 0;
  let failCount = 0;

  for (const target of targets) {
    console.log("Invio a: " + target.email + " (" + target.name + ")");
    try {
      await transporter.sendMail({
        from: '"Team SerraDesk" <info@serradesk.it>',
        to: target.email,
        subject: '🚀 Il nuovo SerraDesk è arrivato',
        html: emailHtml,
      });
      console.log("✅ Inviata: " + target.email);
      sentEmails.push(target.email);
      successCount++;
    } catch (err) {
      console.error("❌ Errore su " + target.email + ":", err.message);
      failCount++;
    }
    
    // Save state after each send so we don't lose progress if interrupted
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(sentEmails, null, 2));
    
    // Throttle to avoid Aruba SMTP blocks
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("---");
  console.log("Missione giornaliera completata. Inviate: " + successCount + ", Fallite: " + failCount);
}

sendDailyColdEmails();
