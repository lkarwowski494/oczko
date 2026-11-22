// kontrola-nzp21704.mjs — czy projekt pokrywa pozycje fixu NZ-P217-04 (P-217, P-218, P-220).
// node docs/design/narzedzia/kontrola-nzp21704.mjs [katalog docs/design] [--tylko-w]; kod 1, gdy brak którejkolwiek pozycji.
// --tylko-w: tylko grupa W (wzory, iPad); bez: także R (rozszerzenie, skrzynka) i I (iCloud).
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const arg = process.argv.slice(2);
const tylkoW = arg.includes('--tylko-w');
const dir = arg.find((a) => !a.startsWith('--')) ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const czytaj = (p) => (existsSync(join(dir, p)) ? readFileSync(join(dir, p), 'utf8') : '');
const spec = czytaj('design-spec.md');
const makW = czytaj('fix7-2026-10-26/wzor.html');
const makR = czytaj('fix7-2026-10-26/udostepnij-icloud.html');
let klucze = { en: {}, kontekst: {} };
try { klucze = JSON.parse(czytaj('fix7-2026-10-26/klucze.json') || '{"en":{},"kontekst":{}}'); } catch { /* zostaje pusty */ }
const en = klucze.en ?? {};
const ctx = klucze.kontekst ?? {};
const baza = (k) => k.replace(/_(one|other)$/, '');
const stan = (m, n) => m.match(new RegExp(`<main data-ekran="${n}"[\\s\\S]*?</main>`))?.[0] ?? '';
const wzorceTel = (p, n) => [320, 390, 430].every((w) => ['light', 'dark'].every((t) => ['', '-ax5'].every((a) => existsSync(join(dir, `wzorce-zrzuty/${p}-${n}-${w}-${t}${a}.png`)))));
const wzorceStale = (p, n, r) => ['light', 'dark'].every((t) => ['', '-ax5'].every((a) => existsSync(join(dir, `wzorce-zrzuty/${p}-${n}-${r}-${t}${a}.png`))));
const stanyW = ['licznik-z-wzorem', 'projekt-wzor-pusty', 'projekt-wzory', 'wzor-dodaj', 'wzor-link', 'wzor-film', 'wzor-import-w-toku', 'wzor-czeka-siec', 'wzor-blad-plik', 'wzor-blad-typ', 'wzor-blad-rozmiar', 'wzor-blad-strona', 'wzor-brak-dostepu', 'wzor-pionowo', 'wzor-przelacz', 'wzor-menu', 'wzor-usun', 'wzor-zakreslacz', 'wzor-word', 'wzor-film-bez-sieci'];
const stanyStale = { 'wzor-poziomo': '844x390', 'ipad-wzor-pion': '820x1180', 'ipad-wzor-poziom': '1180x820', 'ipad-rysik': '820x1180', 'ipad-waskie': '375x1180', 'ipad-licznik': '1180x820', 'ipad-projekty': '1180x820' };
const stanyR = ['udostepnij', 'udostepnij-ma-wzor', 'udostepnij-bez-migawki', 'udostepnij-za-duzy', 'udostepnij-nieobslugiwany', 'skrzynka', 'skrzynka-blad'];
const stanyI = ['icloud-wylaczony', 'icloud-wlacz', 'icloud-aktywny', 'icloud-czeka', 'icloud-brak-konta', 'icloud-brak-miejsca', 'icloud-konto-zmienione', 'icloud-konflikt-licznik', 'icloud-konflikt-wybor', 'icloud-niepelna', 'icloud-zastap-wylacz', 'icloud-usun-wszystko'];
const wymaganeW = ['wzor.tytul', 'wzor.dodaj', 'wzor.dodaj_opis', 'wzor.z_pliku', 'wzor.skanuj', 'wzor.ze_zdjec', 'wzor.link_strony', 'wzor.dodaj_film', 'wzor.przelacz_a11y', 'wzor.strona_z', 'wzor.zakreslacz', 'wzor.gumka', 'wzor.pioro', 'wzor.cofnij_rysunek', 'wzor.zakreslenia', 'wzor.obroc', 'wzor.usun_tytul', 'wzor.blad_plik', 'wzor.blad_typ', 'wzor.blad_rozmiar', 'wzor.blad_strona', 'wzor.czeka_siec', 'wzor.word_podglad', 'wzor.zaznacz_rzad', 'wzor.kierunek_pytanie', 'wzor.nastepna_strona_a11y', 'licznik.wzor_a11y', 'projekt.wzory'];
const wymaganeR = ['udostepnij.tytul', 'udostepnij.do_projektu', 'udostepnij.nowy_projekt', 'udostepnij.gotowe', 'udostepnij.za_duzy', 'udostepnij.nieobslugiwany', 'udostepnij.bez_migawki', 'skrzynka.tytul'];
const wymaganeI = ['icloud.przelacznik', 'icloud.opis', 'icloud.wlacz_tytul', 'icloud.brak_konta', 'icloud.brak_miejsca', 'icloud.konto_zmienione_tytul', 'icloud.polacz', 'icloud.nie_synchronizuj', 'icloud.konflikt_licznik', 'icloud.niepelna', 'icloud.zastap_wylacz', 'icloud.usun_z_icloud'];
const kluczeOk = (lista) => lista.every((k) => Object.keys(en).some((e) => baza(e) === k || e === k));
const kontekstOk = Object.keys(en).length > 0 && Object.keys(en).every((k) => typeof ctx[baza(k)] === 'string' && ctx[baza(k)].length > 10);
const pozycje = {
  'W1a, W3: wzór pionowo z paskiem licznika, poziomo z kolumną': [
    stan(makW, 'wzor-pionowo').includes('class="pasek-licznika"'),
    stan(makW, 'wzor-poziomo').includes('class="kolumna-licznika"'),
  ],
  'W2a: ikona wzoru w pasku licznika': [stan(makW, 'licznik-z-wzorem').includes('data-testid="licznik-wzor"')],
  'W4b, G1: iPad pion (pasek), poziom (kolumna), wąskie okno, licznik i lista': [
    stan(makW, 'ipad-wzor-pion').includes('pasek-licznika'), stan(makW, 'ipad-wzor-poziom').includes('kolumna-licznika'),
    ['ipad-waskie', 'ipad-licznik', 'ipad-projekty'].every((n) => stan(makW, n) !== ''),
  ],
  'W5a, W6a: pasek narzędzi iPhone i iPad, zakreślacz żółty': [
    stan(makW, 'wzor-zakreslacz').includes('data-testid="wzor-zakreslacz"'),
    stan(makW, 'ipad-rysik').includes('Pen'), !/data-zakr-kolor/.test(makW),
  ],
  'W7a, W8, W9b: dodanie, grupa wzorów, przełączanie, usuwanie': [
    ['projekt-wzor-pusty', 'projekt-wzory', 'wzor-dodaj', 'wzor-link', 'wzor-film', 'wzor-przelacz', 'wzor-menu', 'wzor-usun'].every((n) => stan(makW, n) !== ''),
  ],
  'W11: stany importu i błędów': [['wzor-import-w-toku', 'wzor-czeka-siec', 'wzor-blad-plik', 'wzor-blad-typ', 'wzor-blad-rozmiar', 'wzor-blad-strona', 'wzor-brak-dostepu', 'wzor-word', 'wzor-film-bez-sieci'].every((n) => stan(makW, n) !== '')],
  'W: zrzuty wzorcowe': [stanyW.every((n) => wzorceTel('wzor', n)), Object.entries(stanyStale).every(([n, r]) => wzorceStale('wzor', n, r))],
  'W: łatka kluczy, kontekst, skrypt': [kluczeOk(wymaganeW), kontekstOk, existsSync(join(dir, 'narzedzia/nakladaj-klucze-fix7.mjs'))],
  'W: spec, OG-07 i „Dla 08 (NZ-P217-04, grupa W)”': [/## Wzór, rysik i iPad/.test(spec), /## Dla 08 \(fix NZ-P217-04, grupa W/.test(spec), /P-218/.test(spec), wymaganeW.every((k) => spec.includes(`\`${k}`))],
};
if (!tylkoW) Object.assign(pozycje, {
  'R1a, R2: arkusz „Udostępnij”, skrzynka': [stanyR.every((n) => stan(makR, n) !== '')],
  'I1a–I3: iCloud': [stanyI.every((n) => stan(makR, n) !== ''), stan(makR, 'icloud-konflikt-licznik').includes('linia-info')],
  'R, I: zrzuty wzorcowe': [[...stanyR, ...stanyI].every((n) => wzorceTel('udostepnij-icloud', n))],
  'R, I: klucze': [kluczeOk([...wymaganeR, ...wymaganeI])],
  'R, I: spec i „Dla 08 (NZ-P217-04, grupa R i I)”': [/## „Udostępnij do Oczka” i iCloud/.test(spec), /## Dla 08 \(fix NZ-P217-04, grupa R i I/.test(spec), [...wymaganeR, ...wymaganeI].every((k) => spec.includes(`\`${k}`))],
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
