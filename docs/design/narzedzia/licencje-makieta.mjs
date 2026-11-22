// fix11 (M1-245): wstrzykuje pełny tekst docs/design/fonty/breeserif-OFL.txt do makiety ekranu licencji.
// Użycie: node docs/design/narzedzia/licencje-makieta.mjs  →  docs/design/fix11-2026-11-10/licencje.html
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const design = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ofl = readFileSync(join(design, 'fonty/breeserif-OFL.txt'), 'utf8').replace(/\r\n/g, '\n').trim();
// Zawijanie akapitów (fix11, reguła dla generatora 08): pojedyncze złamanie wiersza w akapicie → spacja; zostają puste linie,
// linie z samych dywizów, nagłówki wersalikami i punkty „1)”. Tekst licencji bez zmian poza białymi znakami.
const sztywna = (l) => !l.trim() || /^-+$/.test(l.trim()) || /^[A-Z0-9 .,-]+$/.test(l.trim());
const zawin = (t) => t.split('\n').reduce((acc, l) => { const p = acc.length ? acc[acc.length - 1] : null; if (p !== null && !sztywna(p) && !sztywna(l) && !/^\d+\)/.test(l.trim())) acc[acc.length - 1] = p + ' ' + l.trim(); else acc.push(l); return acc; }, []).join('\n');
const szablon = readFileSync(join(design, 'fix11-2026-11-10/licencje.szablon.html'), 'utf8');
if (!szablon.includes('%%OFL%%')) throw new Error('brak znacznika %%OFL%% w szablonie');
writeFileSync(join(design, 'fix11-2026-11-10/licencje.html'), szablon.replace('%%OFL%%', esc(zawin(ofl))));
console.log(`licencje.html: tekst OFL ${ofl.length} znaków`);
