// Poprawki 04 P2, sesja K (P-368; Aneks P2 poz. 5 i 6): klucze alertów błędu zapisu poza licznikiem i wzorem oraz nowa kolejność zdań w `wzor.blad_czas_opis`.
// Wyrocznia: docs/design/fix12-2026-11-02/klucze.json. Nowe klucze en zostały przełożone w fali 2026-11-03 (P-474, po audycie P-320); lista oczekujących jest pusta.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ZAKRES_FALI, brakiPrzekladu } from '../i18n/fala-2026-11-03';

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
  test('3 klucze są w zakresie fali 2026-11-03 i mają kompletny przekład w 33 językach; nie ma ich na liście oczekujących', () => {
    for (const k of P27) { expect([k, ZAKRES_FALI.includes(k)]).toEqual([k, true]); expect([k, OCZEKUJACE.includes(k)]).toEqual([k, false]); expect([k, brakiPrzekladu(k)]).toEqual([k, []]); }
  });
  test('`wzor.blad_czas_opis`: najpierw pewniejsze działanie (PDF), potem ponowienie — treść i kontekst z klucze.json', () => {
    expect(wartosc(EN, 'wzor.blad_czas_opis')).toBe(ANEKS.potwierdzone['wzor.blad_czas_opis']);
    expect(wartosc(KONTEKST, 'wzor.blad_czas_opis')).toBe(ANEKS.kontekstPotwierdzonych['wzor.blad_czas_opis']);
  });
  test('pozostałe potwierdzone przez 04 wartości robocze są w en.json bez zmian', () => {
    for (const k of ['wzor.blad_czas', 'wzor.przelacz_naglowek', 'stoper.menu_naglowek']) expect([k, wartosc(EN, k)]).toEqual([k, ANEKS.potwierdzone[k]]);
  });
});

// P2-8 (poz. 4): nazwa `historia.wpis_opis` była w 35 językach zajęta przez widoczny wiersz z rodzajem zmiany („{{czas}} · {{z}} → {{na}} ({{opis}})”),
// więc zdanie dla dostępności nazywa się `historia.wpis_a11y` (P-371: koordynator wybrał wariant A; nazwa poprawiona także w klucze.json).
describe('P2-8: zdanie opisu wpisu historii dla dostępności', () => {
  const NOWY = 'historia.wpis_a11y';
  test('en.json: treść z klucze.json, stary klucz wiersza z rodzajem zmiany bez zmian', () => {
    expect(wartosc(EN, NOWY)).toBe(ANEKS.en[NOWY]);
    expect(wartosc(EN, 'historia.wpis_opis')).toBe('{{czas}} · {{z}} → {{na}} ({{opis}})');
  });
  test('en.kontekst.json: kontekst z klucze.json i nowa nazwa klucza w opisie', () => {
    expect(wartosc(KONTEKST, NOWY)).toBe(ANEKS.kontekst[NOWY]);
  });
  test('klucz w zakresie fali 2026-11-03 z kompletnym przekładem w 33 językach; nie na liście oczekujących', () => {
    expect(ZAKRES_FALI).toContain(NOWY); expect(OCZEKUJACE).not.toContain(NOWY); expect(brakiPrzekladu(NOWY)).toEqual([]);
  });
});
