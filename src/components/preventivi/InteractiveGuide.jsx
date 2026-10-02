import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';

export default function InteractiveGuide({ run, setRun }) {
  const [steps] = useState([
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Benvenuto in SerraDesk! 👋</h3>
          <p className="text-gray-600">
            Facciamo un giro veloce: ti faccio vedere come creare un preventivo perfetto in soli 30 secondi.
          </p>
        </div>
      ),
      placement: 'center',
    },
    // I passi seguono la pagina dall'alto in basso, come la si compila.
    // Prima saltavano dal tipo alle misure e poi di nuovo su al profilo, e
    // parlavano di una schermata che non c'e' piu'.
    {
      target: '#tour-comuni',
      content: 'Prima di tutto profilo, colore e vetri. Valgono per tutto il preventivo: li scegli una volta, premi "Fatto" e diventano una riga sola. Il vetro dei balconi va da solo sui serramenti alti da 2 metri in su.',
      placement: 'bottom',
    },
    {
      target: '#tour-tipo',
      content: 'Scegli che cosa è: 1 anta, 2 ante, porta finestra, scorrevole… Le misure già scritte non si toccano. Per gli altri modelli c\'è "Altri modelli".',
      placement: 'bottom',
    },
    {
      target: '#tour-misure',
      content: 'Larghezza, Invio, altezza, Invio, quantità, Invio, e un altro Invio aggiunge la finestra. Il prezzo lo calcola dall\'archivio; se serve lo correggi nel totale.',
      placement: 'top',
    },
    {
      target: '#tour-disegno',
      content: 'Tocca il centro di un\'anta per scegliere come si apre (battente, fissa, ribalta, vasistas) e un bordo per spostare la maniglia. Qui ci sono anche traverso, sopraluce e il vetro di questo serramento.',
      placement: 'top',
    },
    {
      target: '#tour-aggiungi',
      content: 'Aggiungi: il serramento entra nel preventivo e il modulo riparte da zero per il prossimo. Due finestre uguali? Alza la quantità invece di aggiungerle due volte.',
      placement: 'top',
    },
    {
      target: '#tour-elenco',
      content: 'Qui trovi gli articoli aggiunti: con l\'ingranaggio li modifichi, con le due pagine ne duplichi uno per farne uno simile, col cestino lo togli.',
      placement: 'top',
    },
    {
      target: '#tour-salva',
      content: 'Fatto! Salva il preventivo in archivio o scarica il PDF da mandare al cliente, col tuo logo.',
      placement: 'top',
    }
  ]);

  // react-joyride 3 ha cambiato i nomi: callback e' diventato onEvent, e
  // colori, progresso, pulsanti e scorrimento stanno in "options". Con i
  // nomi della versione 2 quelle impostazioni venivano ignorate in silenzio:
  // niente "Salta guida", niente contatore dei passi, e la fine della guida
  // non veniva mai segnata, quindi ripartiva a ogni visita.
  const handleEvent = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('sd_tour_completed', 'true');
    }
  };

  return (
    <Joyride
      onEvent={handleEvent}
      continuous={true}
      run={run}
      scrollToFirstStep={true}
      steps={steps}
      options={{
        zIndex: 10000,
        primaryColor: '#0f172a', // slate-900 (primary)
        textColor: '#334155', // slate-700
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        showProgress: true,
        buttons: ['back', 'skip', 'primary'],
        // Respiro sopra il riquadro evidenziato: a filo, la scritta in cima
        // alla sezione finiva tagliata.
        scrollOffset: 120,
        spotlightPadding: 8,
        skipBeacon: true,
      }}
      styles={{
        buttonSkip: {
          color: '#64748b',
          fontWeight: 600,
        },
        buttonPrimary: {
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          fontWeight: 600,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#0f172a',
          fontWeight: 600,
        },
        tooltipContainer: {
          textAlign: 'left',
          padding: '16px',
        },
      }}
      locale={{
        back: 'Indietro',
        close: 'Chiudi',
        last: 'Fine',
        next: 'Avanti',
        nextWithProgress: 'Avanti ({current} di {total})',
        skip: 'Salta guida',
      }}
    />
  );
}
