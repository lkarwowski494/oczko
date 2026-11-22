// kontrola-nz08p404.mjs — czy projekt pokrywa pozycje fixu NZ-08-P4-04 (P-151, P-158).
// node docs/design/narzedzia/kontrola-nz08p404.mjs [katalog docs/design]; kod 1, gdy brak którejkolwiek pozycji.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const czytaj = (p) => (existsSync(join(dir, p)) ? readFileSync(join(dir, p), 'utf8') : '');
const spec = czytaj('design-spec.md');
const akt = czytaj('aktywnosc.html');
const tokeny = czytaj('tokeny.json');
const znak = czytaj('ikona/znak-kresek.svg');
const kontrast = czytaj('kontrast-pary.json');
const zrzuty = czytaj('narzedzia/zrzuty-aktywnosc.mjs');
const sekcja = (n) => akt.match(new RegExp(`<section data-ekran="${n}"[\\s\\S]*?</section>`))?.[0] ?? '';
const klucz = (k) => spec.includes(`\`${k}\``);
const bezPrzyciskow = (s) => s !== '' && !/class="(plus|minus)"/.test(s);
const pozycje = {
  '1 pas przypomnienia: klucze, stany, kilka przypomnień (1.1a)': [
    klucz('aktywnosc.przypomnienie'), klucz('aktywnosc.przypomnienie_a11y'),
    klucz('aktywnosc.przypomnienie_wiecej_one'), klucz('aktywnosc.przypomnienie_wiecej_other'),
    /class="zakr"/.test(sekcja('wyspa-przypomnienie')),
    sekcja('blokada-przypomnienie-wiecej').includes('more reminder'),
    sekcja('zegarek-przypomnienie-wiecej').includes('more reminder'),
  ],
  '2 znak kresek jako zasób (2a)': [
    /viewBox="204 224 618 570"/.test(znak), /q 14 250/.test(znak), !/fill="#/.test(znak),
    /"znakKresek"/.test(tokeny), /id="kreski" viewBox="204 224 618 570"/.test(akt),
    /accessibilityHidden/.test(spec), /znak kresek/i.test(kontrast),
  ],
  '3 Smart Stack: stany, rozmiary, CarPlay, uwaga pominięta (3.1a)': [
    ...['przypomnienie', 'limit', 'bez-sesji', 'robocza'].map((n) => bezPrzyciskow(sekcja(`zegarek-smart-stack-${n}`))),
    /supplementalActivityFamilies/.test(spec), /152\s?×\s?69,5/.test(spec) && /198\s?×\s?81,5/.test(spec), /CarPlay/.test(spec),
    /152/.test(zrzuty) && /198/.test(zrzuty) && /240/.test(zrzuty), /Smart Stack[^\n]*`uwaga`[^\n]*(pomija|ignor)/.test(spec),
  ],
  'Dla 08 (NZ-08-P4-04)': [/## Dla 08 \(fix NZ-08-P4-04/.test(spec)],
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
