// kontrola-nz08p5bd.mjs — czy projekt pokrywa pozycje fixu NZ-08-P5-BD (P-189, P-191).
// node docs/design/narzedzia/kontrola-nz08p5bd.mjs [katalog docs/design] [--tylko-b]; kod 1, gdy brak którejkolwiek pozycji.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const arg = process.argv.slice(2);
const tylkoB = arg.includes('--tylko-b');
const dir = arg.find((a) => !a.startsWith('--')) ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const czytaj = (p) => (existsSync(join(dir, p)) ? readFileSync(join(dir, p), 'utf8') : '');
const spec = czytaj('design-spec.md');
const makB = czytaj('fix6-2026-10-26/sesje-historia.html');
const makD = czytaj('fix6-2026-10-26/narzedzia-zdjecia.html');
let klucze = { en: {}, kontekst: {}, zastap: [] };
try { klucze = JSON.parse(czytaj('fix6-2026-10-26/klucze.json') || '{"en":{},"kontekst":{}}'); } catch { /* zostaje pusty */ }
const en = klucze.en ?? {};
const ctx = klucze.kontekst ?? {};
const baza = (k) => k.replace(/_(one|other)$/, '');
const stan = (m, n) => m.match(new RegExp(`<main data-ekran="${n}"[\\s\\S]*?</main>`))?.[0] ?? '';
const wzorce = (p, n) => [320, 390, 430].every((w) => ['light', 'dark'].every((t) => ['', '-ax5'].every((a) => existsSync(join(dir, `wzorce-zrzuty/${p}-${n}-${w}-${t}${a}.png`)))));
const stanyB = ['licznik-stoper', 'licznik-stoper-trwa', 'licznik-stoper-menu', 'licznik-stoper-pauza', 'licznik-stoper-inny', 'licznik-stoper-limit', 'licznik-stoper-zablokowany', 'licznik-stoper-sprawdz', 'projekt-czas', 'sesje', 'sesja-korekta', 'sesja-korekta-blad', 'historia', 'historia-dzien-pusty', 'historia-sam-stoper', 'historia-bez-stopera', 'historia-pierwsze'];
const stanyD = ['narzedzia', 'probka', 'probka-cale', 'probka-blad', 'zapas', 'zapas-filtr', 'zapas-pusty', 'wloczka', 'druty-lista', 'drut', 'projekt-zdjecia', 'zdjecie-zrodlo', 'zdjecie-podglad', 'zdjecie-usun', 'zdjecie-brak-dostepu', 'karta-obraz', 'karta-obraz-bez-stopera'];
const wymaganeB = ['stoper.start_a11y', 'stoper.trwa_a11y', 'stoper.wstrzymaj', 'stoper.wznow', 'stoper.zatrzymaj', 'stoper.inny_tytul', 'stoper.inny_potwierdz', 'stoper.zapisano', 'stoper.sprawdz', 'sesje.tytul', 'sesje.do_sprawdzenia', 'projekt.czas', 'projekt.sesje', 'formularz.sesja_trwanie', 'dni.tytul', 'dni.tydzien', 'dni.tydzien_poprzedni', 'dni.od_poniedzialku', 'dni.bez_stopera', 'dni.pusto_dzien', 'dni.pierwsze'];
const wymaganeD = ['narzedzia.tytul', 'narzedzia.probka', 'narzedzia.zapas', 'narzedzia.druty', 'zapas.dodaj', 'zapas.wszystkie', 'zdjecia.dodaj', 'zdjecia.usun_tytul', 'karta.stopka', 'aktywnosc.plus_a11y_przypomnienie', 'projekty.wiersz_cel', 'projekt.oczka', 'formularz.termin_osiagniety'];
const kluczeOk = (lista) => lista.every((k) => Object.keys(en).some((e) => baza(e) === k || e === k) || (klucze.zastap ?? []).includes(k));
const kontekstOk = Object.keys(en).length > 0 && Object.keys(en).every((k) => typeof ctx[baza(k)] === 'string' && ctx[baza(k)].length > 10);
const pozycje = {
  'B1 (P1a–P3a): stoper w pasku licznika, stany, limit, blokada, inny projekt': [
    stanyB.slice(0, 8).every((n) => stan(makB, n) !== ''),
    stan(makB, 'licznik-stoper-trwa').includes('class="kapsula"'),
    stan(makB, 'licznik-stoper-limit').includes('kapsula') && stan(makB, 'licznik-stoper-zablokowany').includes('kapsula'),
  ],
  'B2 (P4a, P5a): grupa „Time”, lista sesji, korekta, „do sprawdzenia”': [
    ['projekt-czas', 'sesje', 'sesja-korekta', 'sesja-korekta-blad'].every((n) => stan(makB, n) !== ''),
    stan(makB, 'sesje').includes('data-testid="sesje-do-sprawdzenia"'),
  ],
  'B3 (P6a): Historia — kalendarz, dzień, tydzień i miesiąc': [
    ['historia', 'historia-dzien-pusty', 'historia-sam-stoper', 'historia-bez-stopera', 'historia-pierwsze'].every((n) => stan(makB, n) !== ''),
    stan(makB, 'historia').includes('Week of') && stan(makB, 'historia').includes('Weeks start on Monday'),
  ],
  'B: łatka kluczy, kontekst, skrypt': [kluczeOk(wymaganeB), kontekstOk, existsSync(join(dir, 'narzedzia/nakladaj-klucze-fix6.mjs'))],
  'B: zrzuty wzorcowe': [stanyB.every((n) => wzorce('sesje-historia', n))],
  'B: spec i „Dla 08 (NZ-08-P5-BD, grupa B)”': [/## Dla 08 \(fix NZ-08-P5-BD, grupa B/.test(spec), wymaganeB.every((k) => spec.includes(`\`${k}`))],
};
if (!tylkoB) Object.assign(pozycje, {
  'D1–D4 (P7a–P10a): stany makiet': [stanyD.every((n) => stan(makD, n) !== '')],
  'D: zrzuty wzorcowe': [stanyD.every((n) => wzorce('narzedzia-zdjecia', n))],
  'D i R: klucze': [kluczeOk(wymaganeD)],
  'R1: token nieaktywny w tokeny.json': [/przyciskNieaktywnyTlo/.test(czytaj('tokeny.json'))],
  'D: spec i „Dla 08 (NZ-08-P5-BD, grupa D)”': [/## Dla 08 \(fix NZ-08-P5-BD, grupa D/.test(spec), wymaganeD.every((k) => spec.includes(`\`${k}`))],
});
let brak = 0;
for (const [nazwa, testy] of Object.entries(pozycje)) {
  const ok = testy.every(Boolean);
  if (!ok) brak++;
  console.log(`${ok ? 'OK  ' : 'BRAK'} ${nazwa}`);
}
const n = Object.keys(pozycje).length;
console.log(`${n - brak}/${n}`);
process.exit(brak ? 1 : 0);
