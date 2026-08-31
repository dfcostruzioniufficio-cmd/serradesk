// Mocking the state and logic of PreventiviPage
function calculateTotals(items, sconto, iva) {
  const imponibile = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const scontoAmount = imponibile * (Number(sconto) || 0) / 100;
  const imponibileScontato = imponibile - scontoAmount;
  const totaleIva = imponibileScontato * (iva / 100);
  const totalePreventivo = imponibileScontato + totaleIva;
  
  return {
    imponibile: imponibile.toFixed(2),
    scontoAmount: scontoAmount.toFixed(2),
    imponibileScontato: imponibileScontato.toFixed(2),
    totaleIva: totaleIva.toFixed(2),
    totalePreventivo: totalePreventivo.toFixed(2)
  };
}

console.log("--- TEST 1: Normale (Sconto 10%, IVA 22%) ---");
console.log(calculateTotals([{ unitPrice: 100, quantity: 2 }, { unitPrice: 50, quantity: 1 }], 10, 22));
// Imponibile: 250, Sconto: 25, Scontato: 225, IVA: 49.5, Totale: 274.5

console.log("\n--- TEST 2: Sconto 0% ---");
console.log(calculateTotals([{ unitPrice: 100, quantity: 1 }], 0, 22));

console.log("\n--- TEST 3: Valori stringa vuota (Input cancellato) ---");
console.log(calculateTotals([{ unitPrice: 100, quantity: 1 }], "", 22));

console.log("\n--- TEST 4: Input anomalo (Sconto 'abc') ---");
console.log(calculateTotals([{ unitPrice: 100, quantity: 1 }], "abc", 22));

