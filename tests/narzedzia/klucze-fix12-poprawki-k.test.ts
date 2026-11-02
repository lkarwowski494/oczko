// Poprawki 04 P2, sesja K (P-368; Aneks P2 poz. 5 i 6): klucze alertów błędu zapisu poza licznikiem i wzorem oraz nowa kolejność zdań w `wzor.blad_czas_opis`.
// Wyrocznia: docs/design/fix12-2026-11-02/klucze.json. Nowe klucze en są na liście „oczekujące na falę” (P-357); przekład po audycie (P-320).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): unknown => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
const ANEKS = czytaj('docs/design/fix12-2026-11-02/klucze.json') as { en: Record<string, string>; potwierdzone: Record<string, string>; kontekst: Record<string, string>; kontekstPotwierdzonych: Record<string, string> };
const EN = czytaj('src/i18n/slowniki/en.json') as Record<string, Record<string, string>>;
const KONTEKST = czytaj('src/i18n/slowniki/en.kontekst.json') as Record<string, Record<string, string>>;
const OCZEKUJACE = (czytaj('docs/lokalizacja/oczekujace.json') as { klucze: string[] }).klucze;
const wartosc = (s: Record<string, Record<string, string>>, klucz: string) => { const [sekcja, nazwa] = klucz.split('.'); return s[sekcja]?.[nazwa]; };

const P27 = ['ustawienia.blad_zapisu', 'formularz.blad_zapisu', 'wspolne.blad_zapisu_opis'];

describe('P2-7: klucze błędu zapisu poza licznikiem i wzorem', () => {
  test('każdy z 3 kluczy jest w en.json z wartością z klucze.json', () => {
    for (const k of P27) expect([k, wartosc(EN, k)]).toEqual([k, ANEKS.en[k]]);
  });
  test('każdy z 3 kluczy ma kontekst w en.kontekst.json z klucze.json', () => {
    for (const k of P27) expect([k, wartosc(KONTEKST, k)]).toEqual([k, ANEKS.kontekst[k]]);
  });
  test('3 klucze są na liście „oczekujące na falę przekładu” (P-357)', () => {
    for (const k of P27) expect(OCZEKUJACE).toContain(k);
  });
  test('`wzor.blad_czas_opis`: najpierw pewniejsze działanie (PDF), potem ponowienie — treść i kontekst z klucze.json', () => {
    expect(wartosc(EN, 'wzor.blad_czas_opis')).toBe(ANEKS.potwierdzone['wzor.blad_czas_opis']);
    expect(wartosc(KONTEKST, 'wzor.blad_czas_opis')).toBe(ANEKS.kontekstPotwierdzonych['wzor.blad_czas_opis']);
  });
  test('pozostałe potwierdzone przez 04 wartości robocze są w en.json bez zmian', () => {
    for (const k of ['wzor.blad_czas', 'wzor.przelacz_naglowek', 'stoper.menu_naglowek']) expect([k, wartosc(EN, k)]).toEqual([k, ANEKS.potwierdzone[k]]);
  });
});
