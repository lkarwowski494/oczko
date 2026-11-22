// sprawdz-nazwy-zrodel.mjs — P-085: nazwy źródeł wiedzy tylko na ekranie „Źródła wiedzy”. Bez zależności.
// Użycie: node scripts/sprawdz-nazwy-zrodel.mjs [--lista docs/tresci/nazwy-zrodel.json] <plik|katalog>...
// Skanuje wartości słowników JSON (klucze spłaszczone kropkami; pomija *.kontekst.json — notatki dla tłumaczy) i zdania .md (bez nagłówków i komentarzy).
// Kod wyjścia: 0 brak naruszeń, 1 naruszenia, 2 złe wywołanie.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const wzorzec = (nazwy) => new RegExp(`(?<![\\p{L}\\d])(?:${nazwy.map(esc).join('|')})(?![\\p{L}\\d])`, 'u');

const splaszcz = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? splaszcz(v, `${p}${k}.`) : [[`${p}${k}`, String(v)]]));

export function naruszenia(pliki, lista) {
  const re = wzorzec(lista.nazwy), out = [];
  for (const f of pliki) {
    if (lista.dozwolone_pliki?.includes(basename(f))) continue;
    if (extname(f) === '.json') {
      if (f.endsWith('.kontekst.json')) continue;
      for (const [k, v] of splaszcz(JSON.parse(readFileSync(f, 'utf8'))))
        if (!lista.dozwolone_klucze.some((d) => k === d || k.startsWith(`${d}.`)) && re.test(v)) out.push(`${f}: ${k}: „${v}”`);
    } else {
      readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, (s) => s.replace(/[^\n]/g, ' ')).split('\n').forEach((l, i) => {
        if (!/^\s*#/.test(l) && re.test(l)) out.push(`${f}:${i + 1}: „${l.trim()}”`);
      });
    }
  }
  return out;
}

const zbierz = (p) => (statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((f) => zbierz(join(p, f))) : ['.json', '.md'].includes(extname(p)) ? [p] : []);

export function main(argv) {
  const i = argv.indexOf('--lista'), sciezkaListy = i >= 0 ? argv[i + 1] : 'docs/tresci/nazwy-zrodel.json';
  const cele = argv.filter((_, j) => i < 0 || (j !== i && j !== i + 1));
  if (!cele.length) { console.error('Użycie: node scripts/sprawdz-nazwy-zrodel.mjs [--lista plik] <plik|katalog>...'); return 2; }
  const lista = JSON.parse(readFileSync(sciezkaListy, 'utf8'));
  const n = naruszenia(cele.flatMap(zbierz), lista);
  for (const x of n) console.log(`NARUSZENIE ${x}`);
  console.log(`naruszenia: ${n.length}`);
  return n.length ? 1 : 0;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) process.exitCode = main(process.argv.slice(2));
