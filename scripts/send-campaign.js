import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Inizializza le variabili d'ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione Nodemailer per SendGrid
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'apikey', // SendGrid usa sempre come username la stringa esatta 'apikey'
    pass: process.env.SENDGRID_API_KEY, // Inserire la chiave generata nel file .env
  },
});

const getEmailTemplate = (name = "Collega", azienda = "tua officina") => `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Ciao ${name},</p>
  
  <p>sono uno sviluppatore italiano. Lavorando a contatto con il settore, ho notato che moltissimi serramentisti perdono ancora le serate su vecchi fogli Excel per calcolare sormonti, tolleranze e distinte di taglio, con il rischio di costosi errori in officina.</p>
  
  <p>Per risolvere il problema ho creato <strong>SerraDesk</strong>, un motore online ultrarapido.<br>
  Inserisci due misure e il sistema genera automaticamente sia il preventivo commerciale che la distinta di taglio tecnica in meno di 60 secondi.</p>
  
  <p>È 100% gratuito e non serve nemmeno registrarsi per usarlo.</p>
  
  <p>Per farti vedere esattamente come funziona, ho preparato un progetto demo già compilato con una finestra e una persiana. Puoi aprirlo, modificarlo e vedere il risultato in tempo reale cliccando qui:</p>
  
  <p>👉 <strong><a href="https://serradesk.it/preventivi?demo=1" style="color: #3b82f6; text-decoration: underline;">Apri il Progetto Demo su SerraDesk</a></strong></p>
  
  <p>Dato che sei un esperto del settore, mi farebbe davvero piacere se ci dessi un'occhiata e mi dessi un tuo parere sincero su cosa manca o cosa miglioreresti.</p>
  
  <p>Buon lavoro, <br>
  <strong>Domenico</strong><br>
  <em>Fondatore di SerraDesk</em></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin-top: 40px;" />
  <p style="font-size: 11px; color: #999;">Hai ricevuto questa mail perché sei un professionista del settore serramenti. Se non desideri più ricevere i nostri aggiornamenti, rispondi con "Cancellami".</p>
</body>
</html>
`;

const getEmailText = (name = "Collega", azienda = "tua officina") => `
Ciao ${name},

sono uno sviluppatore italiano. Lavorando a contatto con il settore, ho notato che moltissimi serramentisti perdono ancora le serate su vecchi fogli Excel per calcolare sormonti, tolleranze e distinte di taglio, con il rischio di costosi errori in officina.

Per risolvere il problema ho creato SerraDesk, un motore online ultrarapido.
Inserisci due misure e il sistema genera automaticamente sia il preventivo commerciale che la distinta di taglio tecnica in meno di 60 secondi.

È 100% gratuito e non serve nemmeno registrarsi per usarlo.

Per farti vedere esattamente come funziona, ho preparato un progetto demo già compilato con una finestra e una persiana. Puoi aprirlo, modificarlo e vedere il risultato in tempo reale cliccando qui:
👉 https://serradesk.it/preventivi?demo=1

Dato che sei un esperto del settore, mi farebbe davvero piacere se ci dessi un'occhiata e mi dessi un tuo parere sincero su cosa manca o cosa miglioreresti.

Buon lavoro, 
Domenico
Fondatore di SerraDesk

--
Hai ricevuto questa mail perché sei un professionista del settore serramenti. Se non desideri più ricevere i nostri aggiornamenti, rispondi con "Cancellami".
`;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runCampaign() {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("❌ ERRORE: Manca la SENDGRID_API_KEY nel file .env!");
    process.exit(1);
  }

  const csvPath = path.resolve(__dirname, '../contatti.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ ERRORE: File ${csvPath} non trovato! Salva il tuo file Excel come contatti.csv nella cartella apps/web/`);
    process.exit(1);
  }

  console.log("🚀 Inizializzazione della Campagna...");
  
  const contatti = [];
  
  // Lettura del CSV
  fs.createReadStream(csvPath)
    .pipe(csv({ separator: ';' }))
    .on('data', (row) => {
      // Cerca una colonna che contenga la parola email (es. email, e-mail, Email)
      const emailKey = Object.keys(row).find(k => k.toLowerCase().includes('email'));
      const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('nome'));
      const aziendaKey = Object.keys(row).find(k => k.toLowerCase().includes('azienda') || k.toLowerCase().includes('ragione'));
      
      if (emailKey && row[emailKey]) {
        contatti.push({
          email: row[emailKey].trim(),
          nome: nameKey ? row[nameKey].trim() : undefined,
          azienda: aziendaKey ? row[aziendaKey].trim() : undefined
        });
      }
    })
    .on('end', async () => {
      console.log(`✅ File CSV letto. Trovati ${contatti.length} contatti validi.`);
      
      const logPath = path.resolve(__dirname, '../invio-campagna.log');
      const alreadySent = new Set();
      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf8');
        const matches = [...logContent.matchAll(/Inviata a: (.*)/g)];
        for (const m of matches) {
          alreadySent.add(m[1].trim());
        }
        console.log(`♻️ Trovate ${alreadySent.size} email già inviate nel log. Verranno ignorate.`);
      }

      let inviati = alreadySent.size;
      let errori = 0;
      let emailInviateOggi = 0;
      const LIMITE_GIORNALIERO = 95;

      // Invia le mail in sequenza con un ritardo (anti-spam e rate-limit)
      for (const contatto of contatti) {
        if (emailInviateOggi >= LIMITE_GIORNALIERO) {
          console.log(`\n🛑 Raggiunto il limite di sicurezza di ${LIMITE_GIORNALIERO} email per oggi.`);
          break;
        }

        if (alreadySent.has(contatto.email)) {
          continue; // Salta chi l'ha già ricevuta
        }
        try {
          const nome = contatto.nome || 'Collega';
          const azienda = contatto.azienda || 'la tua officina';
          
          await transporter.sendMail({
            from: '"Domenico di SerraDesk" <domenico@serradesk.it>', 
            replyTo: 'info@serradesk.it',
            to: contatto.email,
            subject: "Un'alternativa a Excel per le distinte di taglio di " + azienda,
            text: getEmailText(nome, azienda),
            html: getEmailTemplate(nome, azienda),
            headers: {
              'List-Unsubscribe': '<mailto:domenico@serradesk.it?subject=Cancellami>',
              'Precedence': 'bulk'
            }
          });
          
          inviati++;
          emailInviateOggi++;
          const logMsg = `[${inviati}/${contatti.length}] 📨 Inviata a: ${contatto.email}\n`;
          console.log(logMsg.trim());
          fs.appendFileSync(path.resolve(__dirname, '../invio-campagna.log'), logMsg);
          
          // Pausa di 2 secondi tra una mail e l'altra (essenziale per grosse moli)
          await delay(2000);
          
        } catch (error) {
          errori++;
          const errMsg = `❌ Errore invio a ${contatto.email}: ${error.message}\n`;
          console.error(errMsg.trim());
          fs.appendFileSync(path.resolve(__dirname, '../invio-campagna.log'), errMsg);
        }
      }
      
      console.log("-----------------------------------------");
      console.log(`🎉 CAMPAGNA COMPLETATA!`);
      console.log(`📨 Email inviate con successo: ${inviati}`);
      console.log(`❌ Errori: ${errori}`);
      console.log("-----------------------------------------");
    });
}

runCampaign();
