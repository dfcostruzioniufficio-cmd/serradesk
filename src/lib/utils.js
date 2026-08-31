import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

// Rileva il livello di zoom del browser (Cmd+/Cmd- o Ctrl+/Ctrl-) misurando
// quanto un elemento di riferimento largo esattamente 1000px risulta
// effettivamente sullo schermo. A zoom 100% risulta 1000; a zoom 80% risulta
// 800, ecc. Serve per compensare html2canvas, che cattura la dimensione
// "zoomata" degli elementi invece di quella reale, producendo PDF diversi
// a seconda dello zoom con cui sono stati generati.
export function detectBrowserZoom() {
	const probe = document.createElement('div');
	probe.style.cssText = 'position:absolute;visibility:hidden;width:1000px;';
	document.body.appendChild(probe);
	const measured = probe.getBoundingClientRect().width;
	document.body.removeChild(probe);
	return measured / 1000;
}
