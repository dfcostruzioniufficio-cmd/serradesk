# SerraDesk

Gestionale di preventivi e distinte di taglio per serramentisti italiani.
Ci sono clienti paganti reali: un errore in produzione significa un prezzo
sbagliato mandato a un cliente finale, o un abbonato che non riesce a lavorare.

## Come si pubblica

Il flusso è sempre questo, senza scorciatoie:

1. Si lavora e si committa su `staging`
2. **Si esegue l'agente `judge`** sulle modifiche in uscita (`git diff main...HEAD`)
3. Si sistemano i problemi che il judge segnala come bloccanti
4. Si aspetta il via libera esplicito dell'utente
5. Solo allora: merge su `main` e push, che fa partire il deploy su Vercel

Non fare mai merge su `main` senza aver eseguito il judge e senza che l'utente
abbia detto di procedere.

## Verifiche dopo la pubblicazione

Dopo il deploy il service worker può servire ancora la versione precedente:
per vedere le modifiche servono due caricamenti della pagina. Tienilo presente
prima di concludere che qualcosa non ha funzionato — è già successo di rincorrere
un problema inesistente per questo motivo.

## Note sull'ambiente

- Le preview di Vercel sono protette da autenticazione: manifest e service worker
  rispondono 302, quindi **la PWA non è testabile su un link di preview**. Va provata
  in produzione.
- Il database Supabase è condiviso fra produzione e ambienti di sviluppo: attenzione
  a inserire o modificare dati di prova, sono dati di clienti veri.
