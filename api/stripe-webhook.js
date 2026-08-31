import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe and Supabase (using Service Role Key to bypass RLS)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mappa esplicita Prodotto Stripe -> piano interno. Non usare più il nome
// prodotto per indovinare il piano: un prodotto rinominato o rimosso dal
// catalogo (es. "Business", tolto ad Agosto 2026) assegnava silenziosamente
// il piano sbagliato. Aggiornare qui quando cambia il catalogo prodotti.
const PLAN_BY_PRODUCT_ID = {
  'prod_UgBJy4C1qqtJPq': 'starter',   // Starter mensile
  'prod_UgBMoJTyOfA9dJ': 'standard',  // Standard annuale (livello base, come Starter)
  'prod_UYGYgdoKqTXJc1': 'pro',       // Pro mensile
  'prod_UYGZTINilm9bCH': 'pro',       // Pro Annuale
};

function getPlanForProductId(productId) {
  const plan = PLAN_BY_PRODUCT_ID[productId];
  if (!plan) {
    console.error(`Unknown Stripe product ${productId} - not in PLAN_BY_PRODUCT_ID, skipping plan assignment`);
  }
  return plan || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

    // Inizializza il client Supabase una sola volta per tutto l'handler
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotenza: Stripe puo' reinviare lo stesso evento (es. se la risposta
    // e' lenta). Registriamo l'event.id e usciamo subito se e' un duplicato,
    // cosi' non rieseguiamo due volte l'aggiornamento del piano.
    const { error: dedupeError } = await supabase
      .from('stripe_webhook_events')
      .insert({ event_id: event.id });

    if (dedupeError) {
      if (dedupeError.code === '23505') {
        console.log(`Event ${event.id} already processed, skipping`);
        return res.json({ received: true, duplicate: true });
      }
      console.error('Error recording webhook event id:', dedupeError);
      // Non blocchiamo l'elaborazione del pagamento per un errore di logging
    }

  // Handle the checkout completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;

    if (userId && session.mode === 'subscription' && session.subscription) {
      try {
        // Recuperiamo i dettagli dell'abbonamento da Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Salviamo l'user_id nei metadati di Stripe, così lo ritroveremo nei rinnovi futuri
        await stripe.subscriptions.update(session.subscription, {
          metadata: { user_id: userId }
        });

        // current_period_end è in secondi (UNIX timestamp). Lo convertiamo in data esatta
        // NB: trial_ends_at è usato come data di scadenza dell'accesso per QUALSIASI piano
        // (anche quelli pagati, non solo il trial gratuito) - vedi UserContext.isSubscriptionActive
        const endDate = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Recuperiamo il Prodotto per capire che piano hanno comprato
        const productId = subscription.items.data[0].price.product;
        const assignedPlan = getPlanForProductId(productId);

        const profileUpdate = { trial_ends_at: endDate };
        if (assignedPlan) profileUpdate.plan = assignedPlan;

        const { error } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('user_id', userId);

        if (error) {
          console.error("Error updating profile in Supabase:", error);
          return res.status(500).json({ error: 'Database update failed' });
        } else {
          console.log(`User ${userId} successfully upgraded. Expiration set to ${endDate}`);
        }
      } catch (err) {
        console.error("Stripe API error:", err);
      }
    }
  }

  // Gestione dei rinnovi mensili/annuali o disdette
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const userId = subscription.metadata?.user_id;

    if (userId) {
      const endDate = new Date(subscription.current_period_end * 1000).toISOString();
      // Se è un aggiornamento, ricontrolliamo il prodotto nel caso abbiano cambiato piano
      const productId = subscription.items.data[0]?.price?.product;
      const assignedPlan = productId ? getPlanForProductId(productId) : null;

      const updateData = { trial_ends_at: endDate };
      if (assignedPlan && event.type !== 'customer.subscription.deleted') {
        updateData.plan = assignedPlan;
      }

      await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);
        
      console.log(`Subscription updated for ${userId}. New expiration: ${endDate}`);
    }
  }

  res.json({ received: true });
}

// Vercel specific config to get the raw body for Stripe signature validation
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to read raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}
