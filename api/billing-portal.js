import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Apre il Portale Clienti di Stripe per l'utente che sta chiamando.
// Da lì il cliente disdice (a fine periodo pagato), cambia la carta e
// scarica le fatture, senza che noi tocchiamo un solo dato di pagamento.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autenticazione mancante' });
  }
  const token = authHeader.split(' ')[1];

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Il portale si apre SOLO per chi sta chiamando: l'identità viene dal
    // token, mai da un parametro della richiesta, altrimenti chiunque
    // potrebbe aprire la pagina di fatturazione di un altro cliente.
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Sessione non valida' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error(JSON.stringify({ scope: 'billing-portal', step: 'lettura_profilo_fallita', user_id: user.id, error: profileError.message }));
      return res.status(500).json({ error: 'Non riesco a leggere il tuo profilo' });
    }

    let customerId = profile?.stripe_customer_id || null;

    // Ricaduta per gli abbonamenti attivati prima che salvassimo l'id:
    // lo cerchiamo per email e lo memorizziamo, così succede una volta sola.
    if (!customerId) {
      const email = profile?.email || user.email;
      if (email) {
        const clienti = await stripe.customers.list({ email, limit: 100 });
        // Se ci sono più schede cliente per la stessa email (succede quando
        // un pagamento viene ritentato) prendiamo quella che ha davvero un
        // abbonamento, non semplicemente la più recente.
        // Si preferisce la scheda con un abbonamento ancora in corso; se non
        // c'e', una con un abbonamento passato (serve per le fatture); solo
        // come ultima spiaggia la prima disponibile.
        let conAbbonamentoAttivo = null;
        let conAbbonamentoPassato = null;
        for (const cliente of clienti.data) {
          const abbonamenti = await stripe.subscriptions.list({ customer: cliente.id, status: 'all', limit: 10 });
          if (abbonamenti.data.length === 0) continue;
          const inCorso = abbonamenti.data.some((a) =>
            ['active', 'trialing', 'past_due', 'unpaid'].includes(a.status)
          );
          if (inCorso) { conAbbonamentoAttivo = cliente.id; break; }
          if (!conAbbonamentoPassato) conAbbonamentoPassato = cliente.id;
        }
        customerId = conAbbonamentoAttivo || conAbbonamentoPassato || clienti.data[0]?.id || null;
      }

      if (customerId) {
        const { error: salvataggio } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', user.id);
        if (salvataggio) {
          console.error(JSON.stringify({ scope: 'billing-portal', step: 'salvataggio_customer_id_fallito', user_id: user.id, error: salvataggio.message }));
        }
      }
    }

    if (!customerId) {
      // Non è un errore: è chi non ha mai pagato tramite Stripe.
      return res.status(404).json({ error: 'nessun_abbonamento' });
    }

    const origine = req.headers.origin || 'https://serradesk.it';
    const sessione = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origine}/settings`,
    });

    return res.status(200).json({ url: sessione.url });
  } catch (err) {
    console.error(JSON.stringify({ scope: 'billing-portal', step: 'errore', error: err?.message || String(err) }));
    // Il messaggio di Stripe è utile quando manca la configurazione del
    // portale nel pannello: lo passiamo avanti per non far indovinare.
    return res.status(500).json({ error: err?.message || 'Errore imprevisto' });
  }
}
