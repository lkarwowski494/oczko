// Rola 11, fix M2 partia 3c2: pomoc w pierwszym tygodniu (DEC-22 a).
// Wiersz „Help” w Ustawieniach i FAQ na stronie wsparcia: test trasy w tests/ekrany/testid-033-ustawienia-trasa.test.tsx i tests/ekrany/ustawienia.test.tsx.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ADRESY } from '../../src/kompozycja/adresy';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): string => readFileSync(join(KORZEN, p), 'utf8');
const EN = JSON.parse(czytaj('src/i18n/slowniki/en.json')) as Record<string, Record<string, string>>;
const KONTEKST = JSON.parse(czytaj('src/i18n/slowniki/en.kontekst.json')) as Record<string, Record<string, string>>;
const PSEUDO = JSON.parse(czytaj('src/i18n/pseudo/en-XA.json')) as Record<string, string>;
const OCZEKUJACE = (JSON.parse(czytaj('docs/lokalizacja/oczekujace.json')) as { klucze: string[] }).klucze;
const STRONA = JSON.parse(czytaj('docs/wydanie/adres-strony.json')) as { baza: string; wsparcie: string };

describe('061 (DEC-22 a): adres wsparcia jest jedną stałą ze strony wydania', () => {
  test('ADRESY.wsparcie = baza + wsparcie z docs/wydanie/adres-strony.json', () => {
    expect((ADRESY as Record<string, string>).wsparcie).toBe(STRONA.baza + STRONA.wsparcie);
  });
});

describe('061 (DEC-22 a): tekst wiersza „Help”', () => {
  test('en: ustawienia.pomoc = „Help”, kontekst tłumacza, pseudolokalizacja i lista oczekujących na falę (P-422)', () => {
    expect(EN.ustawienia.pomoc).toBe('Help');
    expect(typeof KONTEKST.ustawienia?.pomoc).toBe('string');
    expect(typeof PSEUDO['ustawienia.pomoc']).toBe('string');
    expect(OCZEKUJACE).toContain('ustawienia.pomoc');
  });
});

/** Fragment FAQ (od „Częste pytania” / „Frequently asked questions” do końca sekcji) jako lista par pytanie → odpowiedź. */
function faq(jezyk: 'pl' | 'en'): { pytanie: string; odpowiedz: string }[] {
  const html = czytaj('site/support.html');
  const sekcja = html.match(new RegExp(`<section lang="${jezyk}"[^>]*>([\\s\\S]*?)</section>`))?.[1] ?? '';
  return [...sekcja.matchAll(/<h3>([^<]+)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => ({ pytanie: m[1], odpowiedz: m[2].replace(/<[^>]+>/g, '') }));
}

describe('061 (DEC-22 a): FAQ strony wsparcia — dodanie wzoru i przypomnienie', () => {
  test.each(['pl', 'en'] as const)('%s: jest pytanie o dodanie wzoru i pytanie o przypomnienie (poza dotychczasowymi pięcioma)', (j) => {
    const p = faq(j);
    expect(p.length).toBe(7);
    expect(p.some((x) => (j === 'pl' ? /wzór/i : /pattern/i).test(x.pytanie))).toBe(true);
    expect(p.some((x) => (j === 'pl' ? /przypomnienie/i : /reminder/i).test(x.pytanie))).toBe(true);
  });

  test('en: odpowiedzi cytują nazwy z aplikacji dosłownie (menu ••• licznika, wzór, formularz przypomnienia)', () => {
    const p = faq('en');
    const wzor = p.find((x) => /pattern/i.test(x.pytanie))?.odpowiedz ?? '';
    const przyp = p.find((x) => /reminder/i.test(x.pytanie))?.odpowiedz ?? '';
    for (const k of [EN.menu.dodaj_wzor, EN.wzor.dodaj, EN.wzor.z_pliku, EN.wzor.skanuj, EN.wzor.ze_zdjec, EN.wzor.link_strony]) expect([k, wzor.includes(`“${k}”`)]).toEqual([k, true]);
    for (const k of [EN.menu.przypomnienie, EN.formularz.przyp_zapisz]) expect([k, przyp.includes(`“${k}”`)]).toEqual([k, true]);
    expect(wzor).toContain('use Share and choose Oczko'); // nazwa rozszerzenia: targets/share/expo-target.config.js (displayName)
  });

  test('pl: odpowiedzi cytują nazwy z aplikacji dosłownie według pl.json (do potwierdzenia przy fali przekładu, P-422)', () => {
    const PL = JSON.parse(czytaj('src/i18n/slowniki/pl.json')) as Record<string, Record<string, string>>;
    const p = faq('pl');
    const wzor = p.find((x) => /wzór/i.test(x.pytanie))?.odpowiedz ?? '';
    const przyp = p.find((x) => /przypomnienie/i.test(x.pytanie))?.odpowiedz ?? '';
    for (const k of [PL.menu.dodaj_wzor, PL.wzor.dodaj, PL.wzor.z_pliku, PL.wzor.skanuj, PL.wzor.ze_zdjec, PL.wzor.link_strony]) expect([k, wzor.includes(`„${k}”`)]).toEqual([k, true]);
    for (const k of [PL.menu.przypomnienie, PL.formularz.przyp_zapisz]) expect([k, przyp.includes(`„${k}”`)]).toEqual([k, true]);
  });

  test('strona nadal bez skryptów i bez adresów zewnętrznych poza mailem (test wydania)', () => {
    const html = czytaj('site/support.html');
    expect(html).not.toMatch(/<script|href="https?:/i);
  });
});
