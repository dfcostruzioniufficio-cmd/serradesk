"""Modello di preventivo per infissi in Excel, da scaricare gratis dalla guida.

Si rigenera con:  python3 scripts/modelli/modello_excel.py
(serve openpyxl). Il file finisce in public/modelli/.
"""
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

USCITA = Path(__file__).resolve().parents[2] / "public" / "modelli" / "modello-preventivo-infissi.xlsx"
RIGHE = 15

BLU = "1A365D"
GRIGIO = "F1F5F9"
sottile = Side(style="thin", color="CBD5E1")
bordo = Border(left=sottile, right=sottile, top=sottile, bottom=sottile)

wb = Workbook()
ws = wb.active
ws.title = "Preventivo"
ws.sheet_view.showGridLines = False

larghezze = {"A": 6, "B": 22, "C": 7, "D": 11, "E": 11, "F": 9, "G": 7, "H": 9, "I": 22, "J": 20, "K": 13, "L": 14}
for col, w in larghezze.items():
    ws.column_dimensions[col].width = w

def cella(rif, valore=None, grassetto=False, dim=10, colore="0F172A", sfondo=None, allinea="left", formato=None):
    c = ws[rif]
    if valore is not None:
        c.value = valore
    c.font = Font(name="Calibri", size=dim, bold=grassetto, color=colore)
    c.alignment = Alignment(horizontal=allinea, vertical="center", wrap_text=True)
    if sfondo:
        c.fill = PatternFill("solid", fgColor=sfondo)
    if formato:
        c.number_format = formato
    return c

# Intestazione ditta
cella("A1", "LA TUA DITTA S.R.L.", grassetto=True, dim=16, colore=BLU)
cella("A2", "Via, numero civico - CAP Città (Provincia)", dim=9, colore="475569")
cella("A3", "P.IVA 00000000000 - Tel. 000 0000000 - email@tuaditta.it", dim=9, colore="475569")
cella("I1", "PREVENTIVO", grassetto=True, dim=18, colore=BLU, allinea="right")
ws.merge_cells("I1:L1")
for r, (etichetta, valore) in enumerate([("N. preventivo", "1/2026"), ("Data", None), ("Validità offerta", "30 giorni")], start=2):
    cella(f"I{r}", etichetta, dim=9, colore="475569", allinea="right")
    ws.merge_cells(f"I{r}:J{r}")
    c = cella(f"K{r}", valore, grassetto=True, dim=10, allinea="right", formato="DD/MM/YYYY" if etichetta == "Data" else None)
    ws.merge_cells(f"K{r}:L{r}")

# Cliente
cella("A5", "CLIENTE", grassetto=True, dim=9, colore="FFFFFF", sfondo=BLU)
ws.merge_cells("A5:F5")
cella("G5", "CANTIERE / LUOGO DI POSA", grassetto=True, dim=9, colore="FFFFFF", sfondo=BLU)
ws.merge_cells("G5:L5")
for r, (sx, dx) in enumerate([("Nome e cognome / Ragione sociale:", "Indirizzo:"), ("Indirizzo:", "Piano / interno:"), ("Telefono / email:", "Riferimento:")], start=6):
    cella(f"A{r}", sx, dim=9, colore="475569")
    ws.merge_cells(f"A{r}:F{r}")
    cella(f"G{r}", dx, dim=9, colore="475569")
    ws.merge_cells(f"G{r}:L{r}")
    for col in "ABCDEFGHIJKL":
        ws[f"{col}{r}"].border = Border(bottom=sottile)

# Tabella articoli
INTESTA = 10
titoli = ["Pos.", "Tipologia", "Ante", "Larghezza\n(mm)", "Altezza\n(mm)", "m² cad.", "Q.tà", "m² tot.", "Profilo e colore", "Vetro", "Prezzo cad. (€)", "Totale (€)"]
for i, t in enumerate(titoli):
    col = chr(ord("A") + i)
    c = cella(f"{col}{INTESTA}", t, grassetto=True, dim=9, colore="FFFFFF", sfondo=BLU, allinea="center")
    c.border = bordo
ws.row_dimensions[INTESTA].height = 30

tipologie = DataValidation(type="list", formula1='"Finestra battente,Portafinestra battente,Scorrevole,Alzante scorrevole,Vasistas,Fisso,Persiana,Porta d\'ingresso,Tapparella,Cassonetto,Altro"', allow_blank=True)
ws.add_data_validation(tipologie)

esempi = [
    ("Finestra battente", 2, 1200, 1450, 3, "PVC 76 mm - Bianco", "4/16/33.1 basso emissivo", 520),
    ("Portafinestra battente", 2, 1400, 2300, 1, "PVC 76 mm - Bianco", "33.1/16/33.1 basso emissivo", 890),
]
for n in range(RIGHE):
    r = INTESTA + 1 + n
    pieno = n < len(esempi)
    sfondo = GRIGIO if n % 2 else None
    valori = {
        "A": n + 1,
        "F": f'=IF(AND(D{r}>0,E{r}>0),D{r}*E{r}/1000000,"")',
        "H": f'=IF(AND(F{r}<>"",G{r}>0),F{r}*G{r},"")',
        "L": f'=IF(AND(G{r}>0,K{r}>0),G{r}*K{r},"")',
    }
    if pieno:
        tip, ante, lw, lh, q, prof, vetro, prezzo = esempi[n]
        valori.update({"B": tip, "C": ante, "D": lw, "E": lh, "G": q, "I": prof, "J": vetro, "K": prezzo})
    for col in "ABCDEFGHIJKL":
        formato = {"F": "0.00", "H": "0.00", "K": '#,##0.00 "€"', "L": '#,##0.00 "€"'}.get(col)
        c = cella(f"{col}{r}", valori.get(col), dim=10, sfondo=sfondo,
                  allinea="center" if col in "ACDEFGH" else ("right" if col in "KL" else "left"), formato=formato)
        c.border = bordo
    tipologie.add(f"B{r}")
    ws.row_dimensions[r].height = 20

fine = INTESTA + RIGHE
tot = fine + 2

# Totali
def riga_totale(r, etichetta, formula, grassetto=False, formato='#,##0.00 "€"', sfondo=None, colore="0F172A"):
    cella(f"I{r}", etichetta, grassetto=grassetto, dim=10, allinea="right", sfondo=sfondo, colore=colore)
    ws.merge_cells(f"I{r}:K{r}")
    c = cella(f"L{r}", formula, grassetto=grassetto, dim=11 if grassetto else 10, allinea="right", formato=formato, sfondo=sfondo, colore=colore)
    c.border = bordo

cella(f"A{tot}", "Superficie totale", dim=9, colore="475569")
ws.merge_cells(f"A{tot}:C{tot}")
cella(f"D{tot}", f"=SUM(H{INTESTA+1}:H{fine})", grassetto=True, formato='0.00 "m²"')
riga_totale(tot, "Totale imponibile", f"=SUM(L{INTESTA+1}:L{fine})")
def riga_percentuale(r, etichetta, valore, formula):
    cella(f"I{r}", etichetta, dim=10, allinea="right")
    ws.merge_cells(f"I{r}:J{r}")
    c = cella(f"K{r}", valore, grassetto=True, allinea="center", formato="0%", sfondo="FEF9C3")
    c.border = bordo
    c = cella(f"L{r}", formula, allinea="right", formato='#,##0.00 "€"')
    c.border = bordo

riga_percentuale(tot + 1, "Sconto %", 0, f"=-L{tot}*K{tot+1}")
riga_totale(tot + 2, "Imponibile scontato", f"=L{tot}+L{tot+1}")
riga_percentuale(tot + 3, "IVA %", 0.10, f"=L{tot+2}*K{tot+3}")
riga_totale(tot + 4, "TOTALE", f"=L{tot+2}+L{tot+3}", grassetto=True, sfondo=BLU, colore="FFFFFF")

# Condizioni
cond = tot + 6
cella(f"A{cond}", "CONDIZIONI", grassetto=True, dim=9, colore="FFFFFF", sfondo=BLU)
ws.merge_cells(f"A{cond}:L{cond}")
condizioni = [
    "Posa in opera: inclusa / esclusa (cancella la voce che non serve).",
    "Smontaggio e smaltimento dei vecchi serramenti: inclusi / esclusi.",
    "Tempi di consegna: circa ___ settimane dalla conferma d'ordine e dal rilievo misure definitivo.",
    "Pagamento: ___% di acconto alla conferma, saldo a fine lavori.",
    "Le misure indicate sono da confermare con il rilievo in cantiere.",
    "Aliquota IVA da verificare in base al tipo di intervento e all'immobile.",
]
for i, t in enumerate(condizioni, start=1):
    cella(f"A{cond+i}", f"• {t}", dim=9, colore="334155")
    ws.merge_cells(f"A{cond+i}:L{cond+i}")

firma = cond + len(condizioni) + 2
cella(f"A{firma}", "Data e firma della ditta", dim=9, colore="475569")
ws.merge_cells(f"A{firma}:E{firma}")
cella(f"H{firma}", "Firma del cliente per accettazione", dim=9, colore="475569")
ws.merge_cells(f"H{firma}:L{firma}")
for col in "ABCDE":
    ws[f"{col}{firma+2}"].border = Border(bottom=sottile)
for col in "HIJKL":
    ws[f"{col}{firma+2}"].border = Border(bottom=sottile)

cella(f"A{firma+4}", "Modello gratuito di SerraDesk - serradesk.it", dim=8, colore="94A3B8")
ws.merge_cells(f"A{firma+4}:L{firma+4}")

# Stampa: A4 orizzontale, tutto su una pagina in larghezza
ws.page_setup.orientation = "landscape"
ws.page_setup.paperSize = ws.PAPERSIZE_A4
ws.page_setup.fitToWidth = 1
ws.page_setup.fitToHeight = 0
ws.sheet_properties.pageSetUpPr.fitToPage = True
ws.print_area = f"A1:L{firma+4}"
ws.page_margins.left = ws.page_margins.right = 0.4
ws.page_margins.top = ws.page_margins.bottom = 0.5

# Come si usa
guida = wb.create_sheet("Come si usa")
guida.sheet_view.showGridLines = False
guida.column_dimensions["A"].width = 100
istruzioni = [
    ("Come usare questo modello", True),
    ("1. Nel foglio Preventivo scrivi i dati della tua ditta al posto di quelli di esempio (righe 1-3).", False),
    ("2. Compila cliente e cantiere.", False),
    ("3. Per ogni serramento scrivi tipologia, ante, larghezza e altezza in millimetri, quantità e prezzo a pezzo.", False),
    ("   Metri quadri e totali si calcolano da soli. Le due righe compilate sono solo un esempio: cancellale.", False),
    ("4. Nelle celle gialle scrivi lo sconto e l'aliquota IVA.", False),
    ("5. Sistema le condizioni, poi File > Stampa o salva in PDF: il foglio sta su una pagina A4 orizzontale.", False),
    ("", False),
    ("Questo modello non calcola i prezzi dal listino e non disegna le finestre.", False),
    ("Se vuoi il preventivo già calcolato, col disegno di ogni serramento e il tuo logo: serradesk.it", True),
]
for i, (t, b) in enumerate(istruzioni, start=1):
    c = guida[f"A{i}"]
    c.value = t
    c.font = Font(name="Calibri", size=12 if i == 1 else 11, bold=b, color=BLU if b else "334155")
    c.alignment = Alignment(wrap_text=True, vertical="center")

wb.active = 0
USCITA.parent.mkdir(parents=True, exist_ok=True)
wb.save(USCITA)
print(USCITA)
