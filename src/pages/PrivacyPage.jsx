import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8">
          <ArrowLeft size={16} /> Torna alla Homepage
        </Link>
        
        <h1 className="text-4xl font-black text-gray-900 mb-8">Informativa sulla Privacy</h1>
        <div className="prose prose-slate max-w-none text-gray-700 space-y-6">
          <p>
            Ai sensi del Regolamento UE 2016/679 (GDPR), la presente informativa descrive le modalità di gestione dei dati personali 
            degli utenti ("Utente") della piattaforma in cloud SerraDesk ("Software" o "Piattaforma").
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Titolare del Trattamento</h2>
          <p>
            Il Titolare del trattamento per i dati di registrazione alla piattaforma (email, nome, dati di fatturazione dell'abbonamento) è 
            <strong> SerraDesk</strong>. Tali dati vengono utilizzati esclusivamente per fornire il servizio, gestire la fatturazione 
            e inviare comunicazioni tecniche inerenti al software.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Ruolo di SerraDesk come Responsabile del Trattamento (Data Processor)</h2>
          <p>
            Per quanto riguarda i dati personali che l'Utente (es. il Serramentista) inserisce liberamente nella Piattaforma (es. nomi, indirizzi, telefoni dei *propri* clienti finali nella sezione "Rubrica/CRM" e sui Preventivi), 
            <strong> l'Utente agisce in veste di Titolare del Trattamento (Data Controller)</strong>.
            <br /><br />
            SerraDesk agisce esclusivamente in veste di <strong>Responsabile del Trattamento (Data Processor)</strong>, 
            fornendo unicamente lo spazio cloud (hosting) e la struttura software per la conservazione di tali dati. 
            SerraDesk non utilizza, non vende e non elabora i dati dei clienti finali dell'Utente per nessuno scopo proprio.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Finalità del Trattamento</h2>
          <p>I dati forniti dall'Utente al momento della registrazione verranno trattati per le seguenti finalità:</p>
          <ul className="list-disc pl-5">
            <li>Erogazione del servizio SaaS SerraDesk e creazione dell'account protetto.</li>
            <li>Adempimento di obblighi fiscali e contabili (fatturazione dell'abbonamento).</li>
            <li>Assistenza tecnica e comunicazioni di servizio (es. manutenzioni).</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Misure di Sicurezza</h2>
          <p>
            I dati sono conservati su server protetti conformi agli standard industriali. L'accesso al database è strettamente limitato 
            e protetto da sistemi di autenticazione crittografati. Per la natura stessa di internet, nessuna trasmissione di dati 
            è sicura al 100%, ma SerraDesk si impegna ad aggiornare costantemente le misure di sicurezza per proteggere i dati caricati (es. protocollo HTTPS).
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Conservazione dei Dati</h2>
          <p>
            I dati dell'Utente saranno conservati per tutta la durata dell'abbonamento attivo. 
            In caso di disdetta e cancellazione dell'account, i dati verranno rimossi dai sistemi di produzione, 
            fatti salvi i dati necessari per obblighi fiscali e di legge che verranno conservati per i tempi previsti dalla normativa vigente (di norma 10 anni).
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Diritti dell'Interessato</h2>
          <p>
            In conformità al GDPR (artt. 15-22), l'Utente ha il diritto di: 
            chiedere l'accesso ai propri dati, la rettifica, la cancellazione (diritto all'oblio), la limitazione del trattamento, 
            e la portabilità dei dati. Tali richieste possono essere inoltrate all'indirizzo email di supporto.
          </p>

          <div className="mt-12 text-sm text-gray-500 border-t pt-8">
            Ultimo aggiornamento: Giugno 2026.<br/>
            Per richieste inerenti alla privacy: info@serradesk.it
          </div>
        </div>
      </div>
    </div>
  );
}
