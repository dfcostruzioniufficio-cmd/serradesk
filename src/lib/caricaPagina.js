/**
 * Caricamento delle pagine a prova di pubblicazione.
 *
 * Le pagine si scaricano solo quando servono, e i loro file hanno un nome
 * diverso a ogni pubblicazione. Una scheda rimasta aperta - o un service
 * worker con la versione precedente in memoria - continua a chiedere i nomi
 * vecchi, che sul server non esistono piu'. Il server risponde con la pagina
 * HTML al posto del codice, il browser solleva
 * "'text/html' is not a valid JavaScript MIME type" e l'utente si trova
 * davanti una schermata rossa al posto dell'applicazione.
 *
 * Qui il fallimento viene intercettato: si svuota quello che il browser ha in
 * memoria e si ricarica una volta sola, cosi' riparte con la versione nuova.
 * Una sola volta, perche' se il problema fosse un altro un ricaricamento
 * continuo sarebbe peggio del guasto.
 */

const CHIAVE = 'sd_ricaricato_per_aggiornamento';

function leggiSegno() {
  try {
    return sessionStorage.getItem(CHIAVE) === '1';
  } catch {
    return false; // navigazione privata: meglio riprovare che arrendersi
  }
}

function scriviSegno() {
  try {
    sessionStorage.setItem(CHIAVE, '1');
  } catch {
    /* se non si puo' scrivere, il ricaricamento resta comunque protetto
       dal fatto che la versione nuova non fallira' di nuovo */
  }
}

function cancellaSegno() {
  try {
    sessionStorage.removeItem(CHIAVE);
  } catch {
    /* niente da fare */
  }
}

async function ricaricaPulito() {
  try {
    if ('serviceWorker' in navigator) {
      const registrazioni = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrazioni.map((r) => r.unregister().catch(() => null))
      );
    }
    if (typeof caches !== 'undefined') {
      const chiavi = await caches.keys();
      await Promise.all(chiavi.map((k) => caches.delete(k).catch(() => null)));
    }
  } catch {
    /* se la pulizia non riesce ricarichiamo lo stesso: nel caso piu'
       comune basta a rimettere in sesto la scheda */
  }
  window.location.reload();
}

export function caricaPagina(importaPagina) {
  return async () => {
    try {
      const modulo = await importaPagina();
      cancellaSegno();
      return modulo;
    } catch (errore) {
      if (leggiSegno()) throw errore;
      scriviSegno();
      ricaricaPulito();
      // La pagina si sta ricaricando: restituiamo una promessa che non si
      // risolve, cosi' resta il caricamento e non lampeggia un errore.
      return new Promise(() => {});
    }
  };
}
