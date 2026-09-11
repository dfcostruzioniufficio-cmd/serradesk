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

// Piano di chi non ha un abbonamento attivo. is_active_paid_user() sul
// database richiede un piano fra starter/standard/pro/business, quindi
// 'free' equivale a "niente accesso".
const PIANO_SENZA_ABBONAMENTO = 'free';

function getPlanForProductId(productId, event) {
  const plan = PLAN_BY_PRODUCT_ID[productId];
  if (!plan) {
    logError(event, 'unknown_product', null, { product_id: productId });
  }
  return plan || null;
}

// Log strutturati (una riga JSON per evento) cosi' su Vercel si puo'
// ricostruire l'intero percorso di un pagamento filtrando per event_id.
function logStep(event, step, extra = {}) {
  console.log(JSON.stringify({
    scope: 'stripe-webhook',
    event_id: event?.id,
    event_type: event?.type,
    step,
    ...extra,
    ts: new Date().toISOString(),
  }));
}

function logError(event, step, err, extra = {}) {
  console.error(JSON.stringify({
    scope: 'stripe-webhook',
    event_id: event?.id,
    event_type: event?.type,
    step,
    error: err?.message || err || null,
    ...extra,
    ts: new Date().toISOString(),
  }));
}

/* ------------------------------------------------------------------ *
 * Lettura dei dati dagli oggetti Stripe
 *
 * I campi qui sotto hanno cambiato posizione fra le versioni dell'API e
 * sono la causa del guasto dell'11/09/2026: `current_period_end` non sta
 * più sull'abbonamento ma sui suoi elementi, quindi valeva `undefined`,
 * `new Date(NaN).toISOString()` sollevava un'eccezione e l'aggiornamento
 * del profilo non veniva mai eseguito. Leggiamo la posizione nuova e poi
 * quella vecchia, e restituiamo null invece di lanciare.
 * ------------------------------------------------------------------ */

export function scadenzaAbbonamento(subscription) {
  const posizioni = [
    subscription?.items?.data?.[0]?.current_period_end,
    subscription?.current_period_end,
  ];
  for (const valore of posizioni) {
    const secondi = Number(valore);
    if (Number.isFinite(secondi) && secondi > 0) {
      return new Date(secondi * 1000).toISOString();
    }
  }
  return null;
}

export function prodottoAbbonamento(subscription) {
  const item = subscription?.items?.data?.[0];
  return item?.price?.product || item?.plan?.product || null;
}

// Un campo Stripe che può arrivare come stringa o come oggetto espanso.
function idDi(valore) {
  if (!valore) return null;
  return typeof valore === 'string' ? valore : valore.id || null;
}

export function idAbbonamentoDaFattura(invoice) {
  return idDi(invoice?.subscription)
    || idDi(invoice?.parent?.subscription_details?.subscription)
    || idDi(invoice?.lines?.data?.[0]?.subscription)
    || null;
}

/* ------------------------------------------------------------------ */

// Da quale utente di SerraDesk viene questo pagamento. In ordine di
// affidabilità: i metadati dell'abbonamento (che scriviamo noi al primo
// pagamento), il riferimento della sessione di checkout, e come ultima
// risorsa l'email del cliente Stripe - che copre gli abbonamenti creati a
// mano dal pannello Stripe, dove le prime due non esistono.
async function trovaUtente(supabase, event, { subscription, session }) {
  const daMetadati = subscription?.metadata?.user_id;
  if (daMetadati) return daMetadati;

  const daSessione = session?.client_reference_id;
  if (daSessione) {
    logStep(event, 'user_id_da_client_reference_id', { user_id: daSessione });
    return daSessione;
  }

  let email = session?.customer_details?.email || null;
  if (!email) {
    const customerId = idDi(subscription?.customer);
    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer?.deleted) email = customer?.email || null;
      } catch (err) {
        logError(event, 'lettura_cliente_fallita', err, { customer_id: customerId });
      }
    }
  }

  if (email) {
    // ilike non e' solo "ignora le maiuscole": interpreta _ e % come
    // caratteri jolly. Un'email con un underscore (mario_rossi@...)
    // aggancerebbe anche marioxrossi@..., assegnando un piano pagato al
    // profilo sbagliato - verificato sul database. PostgREST traduce
    // inoltre * in %. Qui li rendiamo tutti caratteri letterali.
    const motivoDiRicerca = email.replace(/[\\%_*]/g, (carattere) => '\\' + carattere);

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email')
      .ilike('email', motivoDiRicerca)
      .limit(2);

    if (error) {
      logError(event, 'ricerca_per_email_fallita', error, { email });
    } else {
      // Seconda rete: si confronta il valore vero, non il motivo di
      // ricerca. Cosi' anche un jolly sfuggito non puo' agganciare
      // un'email diversa da quella del cliente che ha pagato.
      const esatti = (data || []).filter(
        (riga) => (riga.email || '').toLowerCase() === email.toLowerCase()
      );
      if (esatti.length === 1) {
        logStep(event, 'user_id_da_email', { email, user_id: esatti[0].user_id });
        return esatti[0].user_id;
      }
      if (esatti.length > 1) {
        logError(event, 'email_condivisa_da_piu_profili', null, { email, quanti: esatti.length });
      }
    }
  }

  return null;
}

// Scrive piano e scadenza sul profilo. Qualsiasi problema qui diventa
// un'eccezione: l'handler risponde 500, Stripe riprova, e la riga finisce
// nei log di Vercel. Meglio un errore rumoroso che un cliente che paga e
// resta chiuso fuori senza che nessuno se ne accorga.
async function aggiornaProfilo(supabase, event, { userId, piano, scadenza }) {
  const modifiche = {};
  if (piano) modifiche.plan = piano;
  if (scadenza) modifiche.trial_ends_at = scadenza;

  if (Object.keys(modifiche).length === 0) {
    throw new Error('Nessun dato da scrivere sul profilo (piano e scadenza entrambi assenti)');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(modifiche)
    .eq('user_id', userId)
    .select('user_id');

  if (error) {
    logError(event, 'profile_update_failed', error, { user_id: userId, ...modifiche });
    throw new Error(`Aggiornamento profilo fallito: ${error.message}`);
  }

  // update() senza righe corrispondenti non è un errore per Supabase: senza
  // questo controllo un user_id sbagliato passerebbe per un successo.
  if (!data || data.length === 0) {
    logError(event, 'profilo_non_trovato', null, { user_id: userId, ...modifiche });
    throw new Error(`Nessun profilo con user_id ${userId}`);
  }

  logStep(event, 'profilo_aggiornato', { user_id: userId, ...modifiche });
  return modifiche;
}

// Dato un abbonamento Stripe, porta il profilo allineato.
async function allineaDaAbbonamento(supabase, event, subscription, session = null) {
  const userId = await trovaUtente(supabase, event, { subscription, session });
  if (!userId) {
    logError(event, 'user_id_non_trovato', null, {
      subscription_id: subscription?.id,
      customer_id: idDi(subscription?.customer),
    });
    throw new Error(`Impossibile risalire all'utente per l'abbonamento ${subscription?.id}`);
  }

  const scadenza = scadenzaAbbonamento(subscription);
  if (!scadenza) {
    logError(event, 'scadenza_non_leggibile', null, {
      subscription_id: subscription?.id,
      user_id: userId,
    });
    throw new Error(`Scadenza non leggibile sull'abbonamento ${subscription?.id}`);
  }

  const piano = getPlanForProductId(prodottoAbbonamento(subscription), event);
  return aggiornaProfilo(supabase, event, { userId, piano, scadenza });
}

async function elaboraEvento(supabase, event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const subscriptionId = idDi(session.subscription);

    if (session.mode !== 'subscription' || !subscriptionId) {
      return { ignorato: true, motivo: 'pagamento_non_ricorrente' };
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Scriviamo l'user_id nei metadati per ritrovarlo ai rinnovi, dove la
    // sessione di checkout non c'è più. Se fallisce non blocchiamo lo
    // sblocco dell'utente: l'email resta come via di riserva.
    const userId = await trovaUtente(supabase, event, { subscription, session });
    if (userId && !subscription.metadata?.user_id) {
      try {
        await stripe.subscriptions.update(subscriptionId, { metadata: { user_id: userId } });
        subscription.metadata = { ...(subscription.metadata || {}), user_id: userId };
      } catch (err) {
        logError(event, 'scrittura_metadati_fallita', err, { user_id: userId });
      }
    }

    return allineaDaAbbonamento(supabase, event, subscription, session);
  }

  if (event.type === 'customer.subscription.updated') {
    return allineaDaAbbonamento(supabase, event, event.data.object);
  }

  // Rinnovo andato a buon fine: sposta in avanti la scadenza. Arriva anche
  // quando customer.subscription.updated non scatta, quindi i due si coprono
  // a vicenda - ed essendo idempotenti scrivere due volte non fa danno.
  if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') {
    const invoice = event.data.object;
    const subscriptionId = idAbbonamentoDaFattura(invoice);
    if (!subscriptionId) {
      return { ignorato: true, motivo: 'fattura_senza_abbonamento' };
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return allineaDaAbbonamento(supabase, event, subscription);
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const userId = await trovaUtente(supabase, event, { subscription });
    if (!userId) {
      logError(event, 'user_id_non_trovato', null, { subscription_id: subscription?.id });
      throw new Error(`Impossibile risalire all'utente per l'abbonamento ${subscription?.id}`);
    }

    // L'abbonamento è finito davvero: Stripe manda questo evento alla
    // scadenza del periodo pagato, non nel momento in cui il cliente
    // chiede la disdetta (quella arriva come subscription.updated con
    // cancel_at_period_end). Riportiamo comunque anche la data, così sul
    // profilo resta scritto fino a quando aveva pagato.
    const scadenza = scadenzaAbbonamento(subscription);
    return aggiornaProfilo(supabase, event, {
      userId,
      piano: PIANO_SENZA_ABBONAMENTO,
      scadenza: scadenza || new Date().toISOString(),
    });
  }

  return { ignorato: true, motivo: 'evento_non_gestito' };
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
    logError(null, 'signature_verification_failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logStep(event, 'received');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Idempotenza: Stripe puo' reinviare lo stesso evento (es. se la risposta
  // e' lenta). Registriamo l'event.id e usciamo subito se e' un duplicato,
  // cosi' non rieseguiamo due volte l'aggiornamento del piano.
  const { error: dedupeError } = await supabase
    .from('stripe_webhook_events')
    .insert({ event_id: event.id });

  if (dedupeError) {
    if (dedupeError.code === '23505') {
      logStep(event, 'duplicate_skipped');
      return res.json({ received: true, duplicate: true });
    }
    logError(event, 'dedupe_insert_failed', dedupeError);
    // Non blocchiamo l'elaborazione del pagamento per un errore di logging
  }
  const idempotenzaRegistrata = !dedupeError;

  try {
    const esito = await elaboraEvento(supabase, event);
    logStep(event, esito?.ignorato ? 'ignorato' : 'handled', esito || {});
    return res.json({ received: true });
  } catch (err) {
    logError(event, 'elaborazione_fallita', err);

    // Senza questa pulizia il rinvio automatico di Stripe verrebbe scartato
    // come duplicato e l'utente resterebbe bloccato per sempre: e' quello
    // che e' successo l'11/09/2026, quando il profilo ha dovuto essere
    // sistemato a mano.
    if (idempotenzaRegistrata) {
      const { error: pulizia } = await supabase
        .from('stripe_webhook_events')
        .delete()
        .eq('event_id', event.id);
      if (pulizia) logError(event, 'pulizia_idempotenza_fallita', pulizia);
    }

    // 500 => Stripe riprova per giorni e segnala l'endpoint come in errore
    // nel suo pannello. Prima rispondevamo 200 anche quando non avevamo
    // fatto nulla, quindi il guasto era invisibile da entrambe le parti.
    return res.status(500).json({ error: 'Elaborazione fallita' });
  }
}

// Vercel specific config to get the raw body for Stripe signature validation
export const config = {
  api: {
    bodyParser: false,
  },
};

// Il corpo va raccolto come byte: concatenarlo come stringa puo' spezzare un
// carattere multi-byte a cavallo fra due blocchi e far fallire la verifica
// della firma in modo intermittente.
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const blocchi = [];
    req.on('data', chunk => blocchi.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(blocchi)));
    req.on('error', reject);
  });
}
