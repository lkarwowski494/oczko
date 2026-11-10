// Przewodnik po funkcjach (KO-027; spec 04 `docs/design/przewodnik-2026-11-10.md` §2–§4, §7; P-685–P-689, P-690): treść w kodzie = `tresc.json` roli 04,
// każda funkcja ma trasę z plikiem w `app/` (poza Apple Watch), nazwy funkcji i grup to istniejące klucze używane w interfejsie, a każda nazwa
// w cudzysłowie w tekstach przewodnika jest wartością klucza interfejsu w tym samym języku albo literałem (jak `tests/wydanie/notatka-nazwy.test.ts`,
// Trening `tests/guide.test.tsx:31`). Logika czysta: przeczytane z zapisu (nieznane id pomijane), postęp, cel „Pokaż” z ostatniego miejsca.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { celPokaz, dodajPrzeczytana, FUNKCJE, GRUPY, KROKI, kluczOpisu, postep, przeczytaneZZapisu } from '../../src/domena/przewodnik';
import { LIMIT_DNI_W_MIESIACU } from '../../src/konfiguracja';

const KORZEN = join(__dirname, '../..');
type Tresc = {
  literaly: string[];
  klucze_stale: Record<string, { en: string; pl: string }>;
  kroki: { id: string; trasa: string; zapas?: string; en: string; pl: string }[];
  grupy: { id: string; nazwaKlucz: string; funkcje: { id: string; nazwaKlucz?: string; nazwaLiteral?: string; trasa: string | null; zapas?: string; en: string; pl: string }[] }[];
};
const TRESC = JSON.parse(readFileSync(join(KORZEN, 'docs/design/przewodnik-2026-11-10/tresc.json'), 'utf8')) as Tresc;

const plaski = (o: Record<string, unknown>, przed = ''): [string, string][] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? plaski(v as Record<string, unknown>, `${przed}${k}.`) : [[`${przed}${k}`, String(v)]]));
const slownik = (j: string): Map<string, string> => new Map(plaski(JSON.parse(readFileSync(join(KORZEN, `src/i18n/slowniki/${j}.json`), 'utf8'))));
const JEZYKI = readdirSync(join(KORZEN, 'src/i18n/slowniki')).filter((n) => /^[a-zA-Z-]+\.json$/.test(n) && !n.includes('kontekst')).map((n) => n.replace('.json', ''));

function pliki(k: string): string[] {
  return readdirSync(k).flatMap((n) => {
    const p = join(k, n);
    if (statSync(p).isDirectory()) return /i18n/.test(p) ? [] : pliki(p);
    return /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}
/** Kod interfejsu bez słowników i bez danych przewodnika (nazwa użyta tylko w przewodniku nie jest nazwą z interfejsu). */
const KOD = ['app', 'src'].flatMap((k) => pliki(join(KORZEN, k))).filter((p) => !/domena[\\/]przewodnik\.ts$/.test(p)).map((p) => readFileSync(p, 'utf8')).join('\n');
const uzywany = (k: string) => KOD.includes(`'${k}'`) || KOD.includes(`"${k}"`) || KOD.includes(`\`${k}\``);
/** Klucze przewodnika: stałe, kroki i opisy funkcji. */
const KLUCZE_PRZEWODNIKA = [...Object.keys(TRESC.klucze_stale), ...KROKI.map((k) => k.tekst), ...FUNKCJE.map((f) => f.opis)];
/** Cudzysłowy drukarskie w tekstach (en “…”, pl „…”, inne języki: «…», 「…」, ‚…‘); proste "…" nie są cytatem nazwy. */
const cytaty = (s: string): string[] => [...s.matchAll(/“([^”]+)”|„([^“”]+)[“”]|«\s?([^»]+?)\s?»|「([^」]+)」|‚([^‘]+)‘/g)].map((m) => (m.slice(1).find((x) => x !== undefined) ?? '').trim());
const wartosc = (s: string) => s.replace(/\{\{limit\}\}/g, '');

describe('treść przewodnika = tresc.json roli 04 (P-685–P-689)', () => {
  test('6 kroków, 9 grup, 42 funkcje; id unikalne i zgodne z kolejnością tresc.json', () => {
    expect(KROKI.map((k) => k.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(GRUPY.map((g) => g.id)).toEqual(TRESC.grupy.map((g) => g.id));
    expect(GRUPY.map((g) => g.funkcje.map((f) => f.id))).toEqual(TRESC.grupy.map((g) => g.funkcje.map((f) => f.id)));
    expect(FUNKCJE).toHaveLength(42);
    expect(new Set(FUNKCJE.map((f) => f.id)).size).toBe(42);
  });

  test('trasy i trasy zapasowe jak w tresc.json; każda trasa ma plik w app/ (Apple Watch bez trasy)', () => {
    expect(KROKI.map((k) => [k.trasa, k.zapas ?? null])).toEqual(TRESC.kroki.map((k) => [k.trasa, k.zapas ?? null]));
    expect(FUNKCJE.map((f) => [f.id, f.trasa, f.zapas ?? null])).toEqual(TRESC.grupy.flatMap((g) => g.funkcje.map((f) => [f.id, f.trasa, f.zapas ?? null])));
    const plik = (t: string) => (t === '/' ? 'app/(zakladki)/index.tsx' : ['/projekty', '/dni'].includes(t) ? `app/(zakladki)${t}.tsx` : `app${t}.tsx`);
    const trasy = [...KROKI.flatMap((k) => [k.trasa, k.zapas]), ...FUNKCJE.flatMap((f) => [f.trasa, f.zapas])].filter((t): t is string => typeof t === 'string');
    for (const t of new Set(trasy)) expect({ t, plik: existsSync(join(KORZEN, plik(t))) }).toEqual({ t, plik: true });
    expect(FUNKCJE.filter((f) => f.trasa === null).map((f) => f.id)).toEqual(['zegarek']);
    expect(FUNKCJE.find((f) => f.id === 'pro')?.trasa).toBe('/ustawienia'); // zakup tylko z komunikatu limitu i z Ustawień (ER-70, BR-ZAK-006)
  });

  test('nazwy funkcji i grup to istniejące klucze en używane w interfejsie (przewodnik nie tworzy drugiej nazwy funkcji)', () => {
    const en = slownik('en');
    const nazwy: string[] = [...GRUPY.map((g) => g.nazwa), ...FUNKCJE.flatMap((f) => ('klucz' in f.nazwa ? [f.nazwa.klucz] : []))];
    expect(nazwy).toEqual([...TRESC.grupy.map((g) => g.nazwaKlucz), ...TRESC.grupy.flatMap((g) => g.funkcje.flatMap((f) => (f.nazwaKlucz ? [f.nazwaKlucz] : [])))]);
    for (const k of nazwy.filter((n) => !n.startsWith('przewodnik.'))) expect({ k, en: en.has(k), wInterfejsie: uzywany(k) }).toEqual({ k, en: true, wInterfejsie: true });
    expect(FUNKCJE.find((f) => f.id === 'zegarek')?.nazwa).toEqual({ literal: 'Apple Watch' });
  });

  test('61 kluczy przewodnik.*: teksty en i pl = tresc.json (jedno źródło), opisy kluczami przewodnik.f_{id}', () => {
    const en = slownik('en');
    const pl = slownik('pl');
    const oczekiwane: [string, string, string][] = [
      ...Object.entries(TRESC.klucze_stale).map(([k, v]): [string, string, string] => [k, v.en, v.pl]),
      ...TRESC.kroki.map((k): [string, string, string] => [`przewodnik.krok_${k.id}`, k.en, k.pl]),
      ...TRESC.grupy.flatMap((g) => g.funkcje.map((f): [string, string, string] => [`przewodnik.f_${f.id.replace(/-/g, '_')}`, f.en, f.pl])),
    ];
    expect(oczekiwane).toHaveLength(61);
    expect([...KLUCZE_PRZEWODNIKA].sort()).toEqual(oczekiwane.map(([k]) => k).sort());
    expect(kluczOpisu('dodaj-wzor')).toBe('przewodnik.f_dodaj_wzor');
    for (const [k, e, p] of oczekiwane) expect({ k, en: en.get(k), pl: pl.get(k) }).toEqual({ k, en: e, pl: p });
    expect([...en.keys()].filter((k) => k.startsWith('przewodnik.')).sort()).toEqual(oczekiwane.map(([k]) => k).sort());
  });

  test('limit darmowych dni w opisie Pro z parametru {{limit}} (LIMIT_DNI_W_MIESIACU), nie liczbą w tekście', () => {
    for (const j of ['en', 'pl']) {
      const s = slownik(j).get('przewodnik.f_pro') ?? '';
      expect(s).toContain('{{limit}}');
      expect(s).not.toContain(String(LIMIT_DNI_W_MIESIACU));
    }
  });
});

describe('nazwy w cudzysłowach = wartości kluczy interfejsu w tym samym języku (wszystkie języki z tekstami przewodnika)', () => {
  test('en i pl mają cytaty (test nie jest pusty)', () => {
    const en = slownik('en');
    expect(KLUCZE_PRZEWODNIKA.flatMap((k) => cytaty(en.get(k) ?? '')).length).toBeGreaterThan(20);
  });
  test.each(JEZYKI)('%s: każdy cytat jest wartością klucza używanego w app/ albo src/ albo literałem', (j) => {
    const d = slownik(j);
    const wartosci = new Set([...d.entries()].filter(([k]) => !k.startsWith('przewodnik.') && uzywany(k.replace(/_(zero|one|two|few|many|other)$/, ''))).map(([, v]) => v));
    const zle = KLUCZE_PRZEWODNIKA.flatMap((k) => cytaty(wartosc(d.get(k) ?? '')).filter((c) => !wartosci.has(c) && !TRESC.literaly.includes(c)).map((c) => `${k}: ${c}`));
    expect(zle).toEqual([]);
  });
});

describe('logika przewodnika (czysta)', () => {
  test('przeczytane z zapisu: nieznane id, powtórzenia i zły typ pomijane; brak = []', () => {
    expect(przeczytaneZZapisu(undefined)).toEqual([]);
    expect(przeczytaneZZapisu('cel')).toEqual([]);
    expect(przeczytaneZZapisu({ cel: true })).toEqual([]);
    expect(przeczytaneZZapisu(['cel', 'nie-ma-takiej', 'cel', 7, null, 'kosz'])).toEqual(['cel', 'kosz']);
  });
  test('dodanie przeczytanej: bez powtórzeń, nieznane id bez zmiany', () => {
    expect(dodajPrzeczytana([], 'cel')).toEqual(['cel']);
    expect(dodajPrzeczytana(['cel'], 'cel')).toEqual(['cel']);
    expect(dodajPrzeczytana(['cel'], 'nie-ma-takiej')).toEqual(['cel']);
  });
  test('postęp: n z 42', () => {
    expect(postep([])).toEqual({ n: 0, m: 42 });
    expect(postep(['cel', 'kosz', 'zegarek'])).toEqual({ n: 3, m: 42 });
  });
  test('„Pokaż”: zakładki przez zamknięcie stosu; ekrany pchane; trasy z ostatniego miejsca z zapasem (P-687)', () => {
    const brak = { licznikId: null, projektId: null };
    const miejsce = { licznikId: 'l1', projektId: 'p1' };
    expect(celPokaz({ trasa: '/', zapas: undefined }, brak)).toEqual({ rodzaj: 'zakladka', sciezka: '/' });
    expect(celPokaz({ trasa: '/dni', zapas: undefined }, brak)).toEqual({ rodzaj: 'zakladka', sciezka: '/dni' });
    expect(celPokaz({ trasa: '/kosz', zapas: undefined }, brak)).toEqual({ rodzaj: 'ekran', sciezka: '/kosz' });
    expect(celPokaz({ trasa: '/licznik', zapas: '/' }, miejsce)).toEqual({ rodzaj: 'ekran', sciezka: '/licznik' });
    expect(celPokaz({ trasa: '/licznik', zapas: '/' }, brak)).toEqual({ rodzaj: 'zakladka', sciezka: '/' });
    expect(celPokaz({ trasa: '/wzor', zapas: '/' }, { licznikId: 'l1', projektId: null })).toEqual({ rodzaj: 'zakladka', sciezka: '/' });
    expect(celPokaz({ trasa: '/wzor', zapas: '/' }, miejsce)).toEqual({ rodzaj: 'ekran', sciezka: '/wzor' });
    expect(celPokaz({ trasa: '/projekt/[id]', zapas: '/projekty' }, miejsce)).toEqual({ rodzaj: 'ekran', sciezka: '/projekt/[id]', id: 'p1' });
    expect(celPokaz({ trasa: '/projekt/[id]', zapas: '/projekty' }, { licznikId: 'l1', projektId: null })).toEqual({ rodzaj: 'zakladka', sciezka: '/projekty' });
  });
});
