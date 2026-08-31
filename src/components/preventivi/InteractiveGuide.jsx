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
      disableBeacon: true,
    },
    {
      target: '#tour-step-1',
      content: '1. Scegli qui il tipo di infisso (es. Finestra a 2 ante, Scorrevole, ecc).',
      placement: 'bottom',
    },
    {
      target: '#tour-step-2',
      content: '2. Inserisci le Misure (Larghezza e Altezza) e scegli la colorazione.',
      placement: 'top',
    },
    {
      target: '#tour-step-3',
      content: '3. Seleziona il Profilo (Alluminio/PVC) e il Vetro.',
      placement: 'top',
    },
    {
      target: '#tour-step-4',
      content: '4. Fatto? Clicca su "Aggiungi al Preventivo" per calcolare il prezzo istantaneamente.',
      placement: 'top',
    },
    {
      target: '#tour-step-5',
      content: '5. Da qui puoi salvare l\'ordine in cloud o scaricare il PDF pronto per il tuo cliente con il tuo logo!',
      placement: 'bottom',
    }
  ]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('sd_tour_completed', 'true');
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous={true}
      run={run}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#0f172a', // slate-900 (primary)
          textColor: '#334155', // slate-700
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
        },
        buttonClose: {
          display: 'none',
        },
        buttonSkip: {
          color: '#64748b',
          fontWeight: 600,
        },
        buttonNext: {
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
        skip: 'Salta Guida',
      }}
    />
  );
}
