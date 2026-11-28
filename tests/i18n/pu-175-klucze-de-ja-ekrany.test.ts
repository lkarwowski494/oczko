// PU-175 (docs/jakosc/przypadki-uzycia.md, T-121): „Chcę używać Oczka po niemiecku i japońsku” — tytuły i przyciski ekranów języka, „Dziś”, licznika, przewodnika, Ustawień i „Oczko Pro”.
// Scenariusz Maestro 118 sprawdza tylko 8 napisów z tych ekranów (Heute, Leitfaden, Käufe wiederherstellen, tekst przypomnienia i ich odpowiedniki po japońsku); ten test sprawdza resztę:
// każdy klucz, który ekran ma po angielsku (en.json = źródło, src/i18n/typy.ts), ma w de.json i ja.json niepusty przekład. Brak klucza pokazałby użytkownikowi klucz albo angielski tekst.
// Poziom: jednostkowy (pliki słowników). Liczba mnoga: japoński ma tylko `other` (CLDR), więc porównujemy klucze bazowe (`licznik.seria_one`/`_other` → `licznik.seria`).
// OCZKO_SLOWNIKI_DIR (tylko dla próby na kopii słowników; domyślnie src/i18n/slowniki) wskazuje katalog z en.json, de.json, ja.json.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OCZEKUJACE_DO_FALI_1_0_2 } from './fala-2026-11-03';

const KATALOG = process.env.OCZKO_SLOWNIKI_DIR ?? join(__dirname, '../../src/i18n/slowniki');
// Przestrzenie nazw kluczy ekranów z PU-175: jezyk, (zakladki)/index = dzis + zakladki, licznik, oferty; scenariusz 118 przechodzi też przez ustawienia i przewodnik.
const PRZESTRZENIE = ['jezyk', 'dzis', 'zakladki', 'licznik', 'oferty', 'ustawienia', 'przewodnik'] as const;

type Plaski = Map<string, unknown>;

function splaszcz(v: unknown, prefiks = '', wynik: Plaski = new Map()): Plaski {
  if (typeof v === 'object' && v !== null) for (const [k, w] of Object.entries(v)) splaszcz(w, `${prefiks}${k}.`, wynik);
  else wynik.set(prefiks.slice(0, -1), v);
  return wynik;
}
const czytaj = (jezyk: string): Plaski => splaszcz(JSON.parse(readFileSync(join(KATALOG, `${jezyk}.json`), 'utf8')) as unknown);
const bazowy = (k: string): string => k.replace(/_(zero|one|two|few|many|other)$/, '');

/** Klucze bazowe z przestrzeni `przestrzenie`, których `cel` nie ma jako niepusty napis (w żadnej końcówce liczby mnogiej). */
function brakujaceKlucze(zrodlo: Plaski, cel: Plaski, przestrzenie: readonly string[]): string[] {
  const maCel = new Set([...cel].filter(([, w]) => typeof w === 'string' && w.trim() !== '').map(([k]) => bazowy(k)));
  const wymagane = new Set([...zrodlo.keys()].filter((k) => przestrzenie.some((p) => k.startsWith(`${p}.`))).map(bazowy));
  return [...wymagane].filter((k) => !maCel.has(k)).sort();
}

describe('PU-175 · de i ja mają przekład każdego klucza ekranów języka, „Dziś”, licznika, przewodnika, Ustawień i „Oczko Pro”', () => {
  const en = czytaj('en');
  test('źródło nie jest puste w żadnej przestrzeni (pusta lista to błąd testu, nie sukces)', () => {
    for (const p of PRZESTRZENIE) expect([...en.keys()].filter((k) => k.startsWith(`${p}.`)).length).toBeGreaterThan(0);
  });
  test.each(['de', 'ja'])('PU-175: %s — brak kluczy = brak', (jezyk) => {
    // P-1133 (KO-239, wyjątek nazwany): klucze 1.0.2 czekające na falę przekładu 09 (tylko lista OCZEKUJACE_DO_FALI_1_0_2, ta sama co w pierwsze-w-fali-154) nie są jeszcze w de i ja; każdy inny brak nadal pada.
    expect(brakujaceKlucze(en, czytaj(jezyk), PRZESTRZENIE).filter((k) => !OCZEKUJACE_DO_FALI_1_0_2.includes(k))).toEqual([]);
  });
  test('pułapka: kontrola widzi usunięty klucz i pusty przekład, a końcówki liczby mnogiej japońskiego (tylko other) nie są brakiem', () => {
    const zrodlo: Plaski = new Map<string, unknown>([['licznik.a', 'A'], ['licznik.seria_one', '1'], ['licznik.seria_other', 'n'], ['dzis.b', 'B'], ['inne.c', 'C']]);
    const cel: Plaski = new Map<string, unknown>([['licznik.seria_other', 'n'], ['dzis.b', '  ']]);
    expect(brakujaceKlucze(zrodlo, cel, ['licznik', 'dzis'])).toEqual(['dzis.b', 'licznik.a']);
  });
});
