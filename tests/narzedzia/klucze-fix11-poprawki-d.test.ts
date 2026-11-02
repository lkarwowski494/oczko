// Poprawki 04, sesja D (P-360), D1: klucze aneksu partii 8 (04, 2026-11-02): 7 nowych w en.json i en.kontekst.json, na liście „oczekujące na falę” (P-357),
// oraz 7 wartości roboczych potwierdzonych przez 04 (różnica treści = poprawka). Wyrocznia: docs/design/fix11-2026-11-02/klucze.json.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): unknown => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
const ANEKS = czytaj('docs/design/fix11-2026-11-02/klucze.json') as { en: Record<string, string>; potwierdzone: Record<string, string>; kontekst: Record<string, string> };
const EN = czytaj('src/i18n/slowniki/en.json') as Record<string, Record<string, string>>;
const KONTEKST = czytaj('src/i18n/slowniki/en.kontekst.json') as Record<string, Record<string, string>>;
const OCZEKUJACE = (czytaj('docs/lokalizacja/oczekujace.json') as { klucze: string[] }).klucze;
const wartosc = (s: Record<string, Record<string, string>>, klucz: string) => { const [sekcja, nazwa] = klucz.split('.'); return s[sekcja]?.[nazwa]; };

const NOWE = ['projekt.miejsce_wzoru_strona', 'historia.wpis_rozwin_a11y', 'historia.wpis_rozwin_podpowiedz', 'licznik.wpisz_blad_format', 'wzor.blad_zapis', 'wzor.blad_zapis_opis', 'wzor.notatka_edytuj_a11y'];
// Zdanie „Undo is available.” (014) nie ma w aneksie klucza po stronie 04; w 08 jest drugim zdaniem `licznik.seria_one/_other` (nazwa zostaje po stronie 08, klucze.json „zrodlo”).
const BEZ_KLUCZA_04 = 'ogloszenie_cofnij_dostepne';

test('aneks 04: dokładnie 7 nowych kluczy en', () => {
  expect(Object.keys(ANEKS.en).sort()).toEqual([...NOWE].sort());
});
test('każdy nowy klucz aneksu jest w en.json z wartością z klucze.json', () => {
  for (const k of NOWE) expect([k, wartosc(EN, k)]).toEqual([k, ANEKS.en[k]]);
});
test('każdy nowy klucz aneksu ma kontekst w en.kontekst.json z klucze.json', () => {
  for (const k of NOWE) expect([k, wartosc(KONTEKST, k)]).toEqual([k, ANEKS.kontekst[k]]);
});
test('nowe klucze są na liście „oczekujące na falę przekładu” (P-357), bez przekładu 34 języków', () => {
  for (const k of NOWE) expect(OCZEKUJACE).toContain(k);
});
test('wartości robocze potwierdzone przez 04 są w en.json bez zmian (różnica treści = poprawka)', () => {
  const klucze = Object.entries(ANEKS.potwierdzone).filter(([k]) => k !== BEZ_KLUCZA_04);
  expect(klucze.length).toBe(6);
  for (const [k, v] of klucze) expect([k, wartosc(EN, k)]).toEqual([k, v]);
});
test('„Undo is available.” (potwierdzone 04) kończy ogłoszenie serii w en.json', () => {
  expect(ANEKS.potwierdzone[BEZ_KLUCZA_04]).toBe('Undo is available.');
  expect(wartosc(EN, 'licznik.seria_one')).toMatch(/ Undo is available\.$/);
  expect(wartosc(EN, 'licznik.seria_other')).toMatch(/ Undo is available\.$/);
});
test('korekta P-330: `ustawienia.pro_wlaczone` = „On”, a zdanie „Oczko Pro is on.” to `oferty.pro_wlaczone`', () => {
  expect(wartosc(EN, 'ustawienia.pro_wlaczone')).toBe('On');
  expect(wartosc(EN, 'oferty.pro_wlaczone')).toBe('Oczko Pro is on.');
});
