import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe and Supabase (using Service Role Key to bypass RLS)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
        const endDate = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Recuperiamo il Prodotto per capire che piano hanno comprato (Starter o Pro)
        const productId = subscription.items.data[0].price.product;
        const product = await stripe.products.retrieve(productId);
        const productName = product.name.toLowerCase();
        
        let assignedPlan = 'pro'; // Fallback
        if (productName.includes('starter')) assignedPlan = 'starter';
        if (productName.includes('business')) assignedPlan = 'business';

        const { error } = await supabase
          .from('profiles')
          .update({ 
            plan: assignedPlan,
            trial_ends_at: endDate 
          })
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
      // Se è un aggiornamento, recuperiamo di nuovo il prodotto nel caso abbiano cambiato piano
      let assignedPlan = null;
      try {
        const productId = subscription.items.data[0].price.product;
        const product = await stripe.products.retrieve(productId);
        const productName = product.name.toLowerCase();
        
        assignedPlan = 'pro';
        if (productName.includes('starter')) assignedPlan = 'starter';
        if (productName.includes('business')) assignedPlan = 'business';
      } catch(e) { console.error("Error fetching product on update", e); }

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
