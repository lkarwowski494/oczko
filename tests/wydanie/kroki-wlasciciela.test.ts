/* L-028 Treningu (tests/kroki-wlasciciela-zrodla.test.ts, 2e4b0f8; P-315): każdy krok dla właściciela w Apple albo GitHubie ma w tej samej sekcji adres źródła
 * z datą odczytu, a w tabeli stanu wiersz z kolumną „Stan”. Plik: docs/wydanie/kroki-wlasciciela-testflight.md (rola 10, 2026-11-01). */
import { readFileSync } from 'fs';
import { join } from 'path';

const tekst = readFileSync(join(__dirname, '../../docs/wydanie/kroki-wlasciciela-testflight.md'), 'utf8');
const sekcje = tekst.split(/^## /m).slice(1).filter((s) => /^[AB]\d/.test(s));
const ZRODLO = /https:\/\/(developer\.apple\.com|docs\.github\.com|appstoreconnect\.apple\.com)\//;

describe('kroki właściciela przed TestFlight: źródła i stan (L-028)', () => {
  test('zadania A1–A6 i B2–B3 są kompletne; B1 (Paid Apps) nie jest wymieniane jako zadanie', () => {
    expect(sekcje.map((s) => s.slice(0, 2))).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B2', 'B3']);
  });
  test.each(sekcje.map((s) => [s.split('\n')[0].slice(0, 60), s]))('%s: adres źródła Apple/GitHub i data odczytu 2026-11-01 w sekcji', (_n, s) => {
    expect(s).toMatch(ZRODLO);
    expect(s).toContain('2026-11-01');
  });
  test('tabela stanu ma wiersz dla każdego zadania; A6 oznaczone „po audycie” (P-320) i niezaczynane; sekretów (wartości) w pliku nie ma', () => {
    for (const z of ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B2', 'B3']) expect(tekst).toMatch(new RegExp(`^\\| ${z} \\|`, 'm'));
    expect(tekst).toMatch(/\| A6 \|.*po audycie.*nie zaczynaj/);
    expect(tekst).not.toMatch(/BEGIN PRIVATE KEY-----\n[A-Za-z0-9+/=]{20,}/);
  });
  test('adresy GitHub wskazują repo po zmianie nazwy (lkarwowski494/oczko) i środowisko release', () => {
    expect(tekst).toContain('https://github.com/lkarwowski494/oczko/settings/environments');
    expect(tekst).not.toMatch(/lkarwowski494\/Oczko\//);
  });
});
