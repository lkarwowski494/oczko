// kontrola-nz08p5q1.mjs — czy projekt pokrywa pozycje fixu NZ-08-P5-Q1 (P-182 Q1a, P-183).
// node docs/design/narzedzia/kontrola-nz08p5q1.mjs [katalog docs/design]; kod 1, gdy brak którejkolwiek pozycji.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const czytaj = (p) => (existsSync(join(dir, p)) ? readFileSync(join(dir, p), 'utf8') : '');
const spec = czytaj('design-spec.md');
const ekrany = czytaj('ekrany.html');
const makieta = czytaj('fix5-2026-10-26/projekt-kosz.html');
let klucze = { en: {}, kontekst: {} };
try { klucze = JSON.parse(czytaj('fix5-2026-10-26/klucze.json') || '{"en":{},"kontekst":{}}'); } catch { /* zostaje pusty */ }
const en = klucze.en ?? {};
const ctx = klucze.kontekst ?? {};
const baza = (k) => k.replace(/_(one|other)$/, '');
const stany = ['lista', 'projekt', 'projekt-dodaj', 'projekt-menu', 'projekt-edycja', 'projekt-ukonczony', 'projekt-bez-celow', 'nowy-projekt', 'dodaj-czesc', 'dodaj-licznik', 'notatka', 'znaczenie', 'narzedzie', 'termin', 'co-dalej', 'licznik-calosc', 'licznik-cel', 'usun-projekt', 'usun-czesc', 'usun-licznik', 'kosz', 'kosz-pusty'];
const stan = (n) => makieta.match(new RegExp(`<main data-ekran="${n}"[\\s\\S]*?</main>`))?.[0] ?? '';
const wzorce = (n) => [320, 390, 430].every((w) => ['light', 'dark'].every((t) => ['', '-ax5'].every((a) => existsSync(join(dir, `wzorce-zrzuty/projekt-kosz-${n}-${w}-${t}${a}.png`)))));
const wymagane = ['projekty.ostatnia_praca_dzis', 'projekty.ostatnia_praca_wczoraj', 'projekty.ostatnia_praca_dni_other', 'projekty.kosz', 'projekt.dodaj_czesc', 'projekt.dodaj_licznik', 'projekt.zrob_taka_sama', 'projekt.usun', 'projekt.wznow', 'projekt.calosc_other', 'projekt.narzedzie_wiersz', 'projekt.termin', 'menu.znaczenie', 'formularz.znaczenie_skonczone', 'formularz.znaczenie_w_trakcie', 'formularz.nowy_tytul', 'formularz.licznik_tytul', 'formularz.narzedzie_tytul', 'formularz.termin_tytul', 'czesc.co_dalej_tytul', 'czesc.nowa', 'czesc.druga_taka_sama', 'usun.tytul', 'usun.projekt_opis', 'kosz.tytul', 'kosz.przywroc', 'kosz.pusto_other', 'licznik.calosc_other'];
const pozycje = {
  'P1 (1a): „last worked …” bez progu, testID projekty-ostatnia-praca, wyjątek scenariusza 20': [
    stan('lista').includes('last worked 41 days ago'), stan('lista').includes('data-testid="projekty-ostatnia-praca"'),
    !/last worked first/.test(ekrany), !/· 3 days ago</.test(ekrany),
    /projekty-ostatnia-praca/.test(spec) && /scenariusz 20/i.test(spec),
  ],
  'P2 (2a): wejście do kosza na liście, tylko gdy niepusty': [stan('lista').includes('Recently deleted'), /Recently deleted/.test(spec) && /tylko, gdy kosz nie jest pusty/.test(spec)],
  'P3 (3a): ekran projektu, „+” i •••, tryb Edit': [stan('projekt-dodaj').includes('Add counter'), stan('projekt-menu').includes('Make another like this'), stan('projekt-ukonczony').includes('Resume knitting'), stan('projekt-edycja').includes('Delete Ribbing')],
  'P4 (4a): łatka kluczy en + kontekst dla każdego klucza': [
    wymagane.every((k) => k in en), Object.keys(en).length >= 35,
    Object.keys(en).every((k) => typeof ctx[baza(k)] === 'string' && ctx[baza(k)].length > 10),
    existsSync(join(dir, 'narzedzia/nakladaj-klucze-fix5.mjs')),
  ],
  'D: stany makiet i zrzuty wzorcowe': [stany.every((n) => stan(n) !== ''), stany.every(wzorce)],
  'Spec: tabela kluczy i „Dla 08 (NZ-08-P5-Q1)”': [/## Dla 08 \(fix NZ-08-P5-Q1/.test(spec), wymagane.every((k) => spec.includes(`\`${k}\``))],
};
let brak = 0;
for (const [nazwa, testy] of Object.entries(pozycje)) {
  const ok = testy.every(Boolean);
  if (!ok) brak++;
  console.log(`${ok ? 'OK  ' : 'BRAK'} ${nazwa}`);
}
console.log(`${Object.keys(pozycje).length - brak}/${Object.keys(pozycje).length}`);
process.exit(brak ? 1 : 0);
