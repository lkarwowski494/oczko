// kontrola-nz05f404.mjs — czy projekt pokrywa pozycje fixu NZ-05-F4-04 (P-138, P-142).
// node docs/design/narzedzia/kontrola-nz05f404.mjs [katalog docs/design]; kod 1, gdy brak którejkolwiek pozycji.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const czytaj = (p) => (existsSync(join(dir, p)) ? readFileSync(join(dir, p), 'utf8') : '');
const spec = czytaj('design-spec.md');
const akt = czytaj('aktywnosc.html');
const tokeny = czytaj('tokeny.json');
const sekcja = (n) => akt.match(new RegExp(`<section data-ekran="${n}"[\\s\\S]*?</section>`))?.[0] ?? '';
const klucz = (k) => spec.includes(`\`${k}\``);
const bezPrzyciskow = (s) => s !== '' && !/class="(plus|minus)"/.test(s);
const pozycje = {
  '1 zegarek „nie zapisano” (1b)': [
    sekcja('zegarek-nie-zapisano').includes('count on iPhone'), /class="plus"/.test(sekcja('zegarek-nie-zapisano')),
    klucz('aktywnosc.blad_zapisu_zegarek'), klucz('aktywnosc.nie_usunieto'),
    /"haptykaZegarek"/.test(tokeny) && /\.retry/.test(tokeny), /WKHapticType/.test(spec),
  ],
  '2 blokada licznika bez przycisków (2a)': [
    ...['blokada-zablokowany', 'wyspa-zablokowany', 'zegarek-zablokowany'].map((n) => bezPrzyciskow(sekcja(n))),
    sekcja('zegarek-smart-stack-zablokowany').includes('Counter locked'),
    klucz('aktywnosc.zablokowany'), klucz('aktywnosc.zablokowany_a11y'), /\.failure/.test(tokeny),
  ],
  '3 tekst odblokowania i wyjątek w Głosie (t1)': [
    klucz('aktywnosc.zablokowany_jak'), klucz('aktywnosc.zablokowany_jak_zegarek'),
    sekcja('zegarek-zablokowany').includes('on your iPhone'), /P-142/.test(spec) && /blokad\w* licznika/.test(spec.match(/## Głos[\s\S]*?\n## /)?.[0] ?? ''),
  ],
  '4 uwaga → makiety, przycisk zostaje (4a), pierwszeństwo stanów': [
    /uwaga: 'odblokuj'/.test(spec) && /'blad_zapisu'/.test(spec), /Pierwszeństwo stanów/.test(spec), /class="plus"/.test(sekcja('blokada-blad-zapisu')),
  ],
  'Dla 08 (NZ-05-F4-04)': [/## Dla 08 \(fix NZ-05-F4-04/.test(spec)],
};
let brak = 0;
for (const [p, w] of Object.entries(pozycje)) {
  const ok = w.every(Boolean);
  if (!ok) brak++;
  console.log(`${ok ? 'OK  ' : 'BRAK'} ${p} (${w.filter(Boolean).length}/${w.length})`);
}
const n = Object.keys(pozycje).length;
console.log(`${n - brak}/${n}`);
process.exit(brak ? 1 : 0);
