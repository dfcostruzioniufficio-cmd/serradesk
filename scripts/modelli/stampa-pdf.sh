#!/bin/sh
# Stampa in PDF i modelli gratuiti della guida (public/modelli/) con Chrome
# senza finestra. Si rilancia dopo aver cambiato uno dei file .html qui.
set -e
QUI="$(cd "$(dirname "$0")" && pwd)"
USCITA="$QUI/../../public/modelli"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILO="$(mktemp -d)"
stampa() {
  "$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILO" \
    --no-pdf-header-footer --print-to-pdf="$USCITA/$2.pdf" "file://$QUI/$1.html" 2>/dev/null
}
stampa modello-preventivo modello-preventivo-infissi
stampa scheda-rilievo scheda-rilievo-misure-serramenti
rm -rf "$PROFILO"
