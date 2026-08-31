import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, 
  auth: {
    user: 'apikey', 
    pass: process.env.SENDGRID_API_KEY, 
  },
});

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

async function testMail() {
  console.log("⏳ Invio email di test...");
  try {
    const nome = "Domenico";
    const azienda = "Serramenti Rossi";
    const info = await transporter.sendMail({
      from: '"Domenico di SerraDesk" <domenico@serradesk.it>', 
      to: 'domenicopanico0303@gmail.com',
      subject: "Un'alternativa a Excel per le distinte di taglio di " + azienda,
      text: getEmailText(nome, azienda),
      html: getEmailTemplate(nome, azienda),
      headers: {
        'List-Unsubscribe': '<mailto:domenico@serradesk.it?subject=Cancellami>',
        'Precedence': 'bulk'
      }
    });
    console.log("✅ Email di test inviata con successo!");
  } catch (err) {
    console.error("❌ Errore durante l'invio:", err.message);
  }
}

testMail();
