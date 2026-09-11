/**
 * Personalizzazioni concordate con singoli clienti.
 *
 * Stanno qui e non sparse nei componenti perche' la stessa lista di email era
 * ripetuta in quattro punti diversi (configuratore, PDF prima pagina, PDF
 * pagine successive, nomi delle varianti): correggerne uno solo lasciava gli
 * altri disallineati, ed e' gia' successo.
 */

// Punto Alluminio lavora a corpo: niente Prezzo Base, il totale della finestra
// vale anche come prezzo base, e l'intestazione del PDF e' la loro.
const EMAIL_PUNTO_ALLUMINIO = ['info@puntoalluminio.com'];

export const isClientePuntoAlluminio = (userEmail) =>
  EMAIL_PUNTO_ALLUMINIO.includes(userEmail);
