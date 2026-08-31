import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Solo richieste POST accettate
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Livello di sicurezza: autorizzazione tramite token segreto (da configurare su Supabase)
  const authHeader = req.headers['authorization'];
  if (process.env.WEBHOOK_SECRET && authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const payload = req.body;
  console.log("Webhook payload ricevuto:", payload);

  // Estrarre l'email dell'utente dal payload (assumendo trigger su auth.users)
  const userEmail = payload.record?.email;
  
  if (!userEmail) {
    return res.status(400).json({ error: 'Nessuna email nel payload' });
  }

  try {
    // Configurazione SMTP (dati letti dalle variabili Vercel)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 465,
      secure: true, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #0d1322; padding: 35px 20px; text-align: center; border-bottom: 4px solid #2563eb;">
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: -0.5px;">Serra<span style="color: #3b82f6;">Desk</span></h1>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #111827; margin-top: 0; font-size: 24px;">Benvenuto a bordo! 👋</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Ciao,<br><br>
            Grazie per esserti registrato. SerraDesk è il software in cloud numero 1 in Italia progettato per rendere immediata la generazione di preventivi commerciali e distinte di taglio per serramenti.
          </p>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #1e3a8a; font-size: 15px; font-weight: 500; line-height: 1.5;">
              Sappiamo che il tuo tempo in officina o in cantiere è prezioso. Per questo abbiamo preparato un brevissimo video tutorial che ti mostra come creare il tuo primo preventivo aziendale partendo da zero.
            </p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://serradesk.it" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              ▶ Guarda il Video Tutorial
            </a>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Se hai qualsiasi dubbio o se vuoi essere aiutato nella prima configurazione, rispondi semplicemente a questa email. Siamo qui per farti lavorare meglio e farti risparmiare ore di calcoli.
          </p>
          
          <p style="color: #111827; font-size: 16px; font-weight: 600; margin-top: 30px;">
            Buon lavoro,<br>
            Il Team di SerraDesk
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 13px; margin: 0;">
            © 2026 SerraDesk - Il Software per Serramentisti Italiani<br>
            Hai ricevuto questa email perché ti sei registrato su serradesk.it
          </p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"SerraDesk" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Benvenuto su SerraDesk! Inizia da qui 🚀',
      html: htmlContent,
    });

    console.log("Email inviata con successo a", userEmail, "-", info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error("Errore invio email:", error);
    return res.status(500).json({ error: 'Errore durante invio email' });
  }
}
