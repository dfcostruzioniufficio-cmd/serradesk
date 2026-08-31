import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TerminiPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8">
          <ArrowLeft size={16} /> Torna alla Homepage
        </Link>
        
        <h1 className="text-4xl font-black text-gray-900 mb-8">Termini e Condizioni di Servizio</h1>
        <div className="prose prose-slate max-w-none text-gray-700 space-y-6">
          <p>
            I presenti Termini e Condizioni disciplinano l'utilizzo della piattaforma software in cloud "SerraDesk" (di seguito "Software" o "Servizio").
            Creando un account, l'utente ("Utente") accetta integralmente e senza riserve le presenti condizioni.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Oggetto del Servizio</h2>
          <p>
            SerraDesk è una piattaforma B2B (Business to Business) dedicata ai professionisti del settore serramenti per la creazione di preventivi e distinte di taglio. 
            Il Servizio è offerto "as is" (così com'è) e "as available" (come disponibile).
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Nessuna Garanzia di Uptime e Manutenzione</h2>
          <p>
            SerraDesk non garantisce che il Servizio sia ininterrotto, sicuro o privo di errori. 
            L'Utente accetta esplicitamente che interruzioni temporanee del servizio possano verificarsi a causa di manutenzione programmata, aggiornamenti, 
            problemi di rete, problemi dei fornitori di hosting o cause di forza maggiore. In nessun caso l'Azienda sarà ritenuta responsabile per danni, perdite di fatturato, 
            o ritardi causati dall'impossibilità di accedere al Software.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Sicurezza, Perdita Dati e Attacchi Informatici</h2>
          <p>
            SerraDesk adotta le migliori misure tecniche sul mercato (es. hosting cloud gestito, database protetti) per preservare la sicurezza dei dati inseriti. 
            Tuttavia, l'Azienda non può essere ritenuta responsabile in caso di smarrimento, alterazione, distruzione o accesso non autorizzato ai dati dell'Utente 
            dovuti ad attacchi hacker imprevedibili, violazioni dei server o errori umani. 
            È responsabilità dell'Utente effettuare regolarmente il download o l'esportazione (es. tramite PDF) dei propri documenti più importanti come forma di backup.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Pagamenti e Nessun Rimborso</h2>
          <p>
            Il Servizio prevede piani in abbonamento (mensile o annuale) a rinnovo automatico.
            Poiché viene offerto un periodo di prova gratuito iniziale e trattandosi di un servizio B2B per l'esercizio della professione o impresa, 
            <strong> non è previsto alcun tipo di rimborso</strong> (totale o parziale) per i canoni già versati, né per i periodi di abbonamento parzialmente non utilizzati.
            L'Utente può disdire il rinnovo automatico in qualsiasi momento direttamente dal proprio account; il servizio rimarrà attivo fino al termine del periodo già fatturato.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Responsabilità sui Dati Caricati</h2>
          <p>
            L'Utente è l'unico ed esclusivo responsabile dei dati, delle anagrafiche clienti (CRM), dei listini e delle configurazioni inserite nel Software.
            L'Utente garantisce di possedere il diritto di inserire tali dati nel rispetto delle normative sulla privacy (GDPR). 
            SerraDesk agisce esclusivamente come fornitore dell'infrastruttura tecnologica.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Modifiche ai Termini</h2>
          <p>
            SerraDesk si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Gli Utenti saranno informati via email o tramite avviso in piattaforma. 
            L'uso continuato del Servizio dopo le modifiche implica l'accettazione dei nuovi Termini.
          </p>
          
          <div className="mt-12 text-sm text-gray-500 border-t pt-8">
            Ultimo aggiornamento: Giugno 2026.<br/>
            Per domande tecniche o legali relative ai termini d'uso: info@serradesk.it
          </div>
        </div>
      </div>
    </div>
  );
}
