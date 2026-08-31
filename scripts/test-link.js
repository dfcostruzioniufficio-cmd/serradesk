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

const getEmailTemplate = () => `
<!DOCTYPE html>
<html lang="it">
<body>
  <h2>Email di test per verificare il Link!</h2>
  <p>Clicca esattamente questo link qui sotto. Non cliccare quelli vecchi.</p>
  <p>👉 <strong><a href="https://serradesk.it/preventivi?demo=1" style="color: #3b82f6; text-decoration: underline; font-size: 18px;">Apri il Progetto Demo su SerraDesk</a></strong></p>
  <p>Se vedi la finestra e la persiana, allora funziona tutto perfettamente e possiamo procedere.</p>
</body>
</html>
`;

async function testMail() {
  console.log("⏳ Invio email di test...");
  try {
    await transporter.sendMail({
      from: '"Domenico di SerraDesk" <domenico@serradesk.it>', 
      to: 'domenicopanico0303@gmail.com',
      subject: "Test Definitivo Link Demo " + Math.random().toString().slice(2,6),
      html: getEmailTemplate(),
    });
    console.log("✅ Email di test inviata!");
  } catch (err) {
    console.error("❌ Errore durante l'invio:", err.message);
  }
}

testMail();
