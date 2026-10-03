import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

/**
 * Parte a ogni nuova iscrizione (trigger "Email Benvenuto" su auth.users in
 * Supabase) e manda due mail:
 *  - a info@serradesk.it, l'avviso: chi si e' iscritto e a che ora. Chi si
 *    iscrive non ha giorni di prova e trova subito la pagina dei piani: se
 *    nessuno se ne accorge, entra, sbatte contro il muro e se ne va. Le
 *    iscrizioni di settembre e quelle della sera del 2 ottobre sono passate
 *    cosi', senza che nessuno le vedesse;
 *  - all'iscritto, un benvenuto che gli dice cosa fare e come scriverci.
 */

const AVVISI_A = process.env.NOTIFY_EMAIL || 'info@serradesk.it';
// Oltre questa eta' un account non e' piu' "appena iscritto": la chiamata e'
// vecchia o finta, e non si manda niente.
const MAX_MINUTI = 15;

const escape = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const authHeader = req.headers['authorization'];
  if (process.env.WEBHOOK_SECRET && authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const record = req.body?.record || {};
  if (!record.id || !record.email) {
    return res.status(400).json({ error: 'Nessun utente nel payload' });
  }

  // La chiave del trigger non e' mai stata impostata su Vercel: senza questo
  // controllo chiunque poteva chiamare questa pagina e far partire mail a
  // nome di SerraDesk verso indirizzi a caso. Si spedisce solo se l'utente
  // esiste davvero, con quella email, e si e' iscritto da pochi minuti.
  let utente;
  try {
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(record.id);
    if (error || !data?.user) throw error || new Error('utente non trovato');
    utente = data.user;
  } catch (e) {
    console.error('Iscrizione non verificata:', e?.message || e);
    return res.status(403).json({ error: 'Iscrizione non verificata' });
  }
  const minuti = (Date.now() - new Date(utente.created_at).getTime()) / 60000;
  if ((utente.email || '').toLowerCase() !== String(record.email).toLowerCase() || !(minuti >= 0 && minuti <= MAX_MINUTI)) {
    return res.status(403).json({ error: 'Iscrizione non verificata' });
  }

  const email = utente.email;
  const quando = new Date(utente.created_at).toLocaleString('it-IT', {
    timeZone: 'Europe/Rome', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const mittente = `"SerraDesk" <${process.env.SMTP_USER}>`;

  // Le due mail partono indipendenti: se una fallisce l'altra arriva lo stesso.
  const [avviso, benvenuto] = await Promise.allSettled([
    transporter.sendMail({
      from: mittente,
      to: AVVISI_A,
      subject: `Nuovo iscritto: ${email}`,
      text: [
        `Si e' appena iscritto ${email} (${quando}).`,
        '',
        'Non ha giorni di prova: sta vedendo la pagina dei piani.',
        'Per dargli la prova: https://serradesk.it/admin -> Modifica -> piano Trial e data di scadenza.',
        `Per scrivergli: rispondi a ${email}.`,
      ].join('\n'),
    }),
    transporter.sendMail({
      from: mittente,
      to: email,
      replyTo: AVVISI_A,
      subject: 'Benvenuto su SerraDesk',
      text: [
        'Buongiorno,',
        '',
        "grazie per l'iscrizione a SerraDesk, il programma per fare preventivi di serramenti con il disegno di ogni finestra e la distinta di taglio.",
        '',
        "Per usarlo scelga il piano dalla pagina che vede entrando: si attiva subito e si disdice quando vuole.",
        "Se prima vuole vederlo all'opera con i suoi profili e i suoi prezzi, risponda a questa mail: le scriviamo noi.",
        '',
        'Buon lavoro,',
        'SerraDesk',
        AVVISI_A,
      ].join('\n'),
      html: `
        <div style="font-family: Helvetica, Arial, sans-serif; max-width: 560px; color: #1f2937; font-size: 15px; line-height: 1.6;">
          <p>Buongiorno,</p>
          <p>grazie per l'iscrizione a <b>SerraDesk</b>, il programma per fare preventivi di serramenti con il disegno di ogni finestra e la distinta di taglio.</p>
          <p>Per usarlo scelga il piano dalla pagina che vede entrando: si attiva subito e si disdice quando vuole.</p>
          <p>Se prima vuole vederlo all'opera con i suoi profili e i suoi prezzi, <b>risponda a questa mail</b>: le scriviamo noi.</p>
          <p>Buon lavoro,<br>SerraDesk<br><a href="mailto:${escape(AVVISI_A)}" style="color:#2563eb">${escape(AVVISI_A)}</a></p>
        </div>`,
    }),
  ]);

  const esito = (r) => (r.status === 'fulfilled' ? 'inviata' : `errore: ${r.reason?.code || ''} ${r.reason?.message || r.reason}`);
  // Nei log di Vercel resta il motivo vero di un invio fallito (credenziali,
  // porta, server): prima si leggeva solo "Errore durante invio email".
  console.log('Nuova iscrizione', email, '- avviso:', esito(avviso), '- benvenuto:', esito(benvenuto));

  if (avviso.status === 'rejected' && benvenuto.status === 'rejected') {
    return res.status(500).json({ error: 'Errore durante invio email', avviso: esito(avviso), benvenuto: esito(benvenuto) });
  }
  return res.status(200).json({ avviso: esito(avviso), benvenuto: esito(benvenuto) });
}
