# SerraDesk

Gestionale di preventivi e distinte di taglio per serramentisti italiani.
Ci sono clienti paganti reali: un errore in produzione significa un prezzo
sbagliato mandato a un cliente finale, o un abbonato che non riesce a lavorare.

## Come si pubblica

Il flusso è sempre questo, senza scorciatoie:

1. Si lavora e si committa su `staging`
2. **Si esegue l'agente `judge`** sulle modifiche in uscita (`git diff main...HEAD`)
3. Si sistemano i problemi che il judge segnala come bloccanti
4. Se il judge non ha piu' bloccanti, **si pubblica subito**: merge su `main` e
   push, che fa partire il deploy su Vercel

Non serve chiedere il permesso a ogni pubblicazione: l'utente lo ha detto
esplicitamente il 16 settembre 2026, gli bastava aspettare troppo. Il via libera
che conta e' quello del judge. Non si pubblica mai, invece, senza aver eseguito
il judge quando serve (vedi sotto), o mentre restano suoi rilievi bloccanti.

### Quando il judge serve davvero

Il judge costa: ogni esecuzione rilegge i file da capo. Va eseguito sempre
quando le modifiche toccano **prezzi e calcoli, il PDF che riceve il cliente
finale, i salvataggi e i dati, i permessi e gli abbonamenti** — è lì che questo
progetto si è rotto ogni volta.

Per le modifiche che non toccano niente di tutto questo — etichette, testi,
colori, spaziature, contenuti statici — si pubblica senza judge, dopo aver
verificato che la build passi.

Nel dubbio si esegue.

### Una sola pubblicazione per più lavori

Quando l'utente chiede più cose di fila, si fanno tutte, poi **un solo giro di
judge e una sola pubblicazione**. Pubblicare ogni singola modifica moltiplica
judge, build e verifiche senza alcun vantaggio.

### Come si verifica

Si verifica leggendo il testo e la struttura della pagina (`get_page_text`,
`read_page`, il DOM), non fotografandola: uno screenshot costa circa dieci
volte tanto. Gli screenshot si fanno quando è **l'utente** a dover vedere com'è
venuto qualcosa, o quando il difetto è visivo (allineamenti, sovrapposizioni,
colori).

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
