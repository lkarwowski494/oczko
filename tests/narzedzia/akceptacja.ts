// Pomocnicy testów akceptacyjnych domeny (rola 07, E3): wektory BRD i treści, liczność „wykonano N z N”,
// znacznik zaślepki przepuszczany bez zmian (czerwień z właściwego powodu, tests/akceptacja/README.md).
import brdJson from '../wektory/brd.json';
import tresciJson from '../../docs/tresci/wektory.json';

// Kształt brd.json po P-097 (1a): zbiory i listy jako tablice, tak/nie jako true/false, „—” jako null (docs/brd/narzedzia/wektory.schema.json).
export type WartoscBrd = number | string | boolean | null | (number | string)[];
export type WektorBrd = {
  regula: string;
  id: string;
  wejscie: Record<string, WartoscBrd>;
  oczekiwane: Record<string, WartoscBrd>;
  tolerancja: number | null;
  rodzaj: string;
  pochodzenie: string;
};
export const WEKTORY_BRD = brdJson as unknown as WektorBrd[];
export function wektoryReguly(regula: string): WektorBrd[] {
  return WEKTORY_BRD.filter((w) => w.regula === regula);
}

type OczekiwanaKlasyfikacja = { wynik: string; kategorie?: number[]; p4_zaokraglone?: number | null; polowka?: boolean };
export type PlikTresci = {
  klasyfikacja_4in: { id: string; p4: number; rodzaj: string; oczekiwane: OczekiwanaKlasyfikacja }[];
  klasyfikacja_10cm: { id: string; p10: number; p4_dokladnie: number; oczekiwane: OczekiwanaKlasyfikacja }[];
  jednostki: { id: string; przelicznik: string; wartosc: number; oczekiwane: number | string; tolerancja?: number }[];
  druty: { id: string; mm: number; oczekiwane_us: string | null }[];
  szydelka: { id: string; mm: number; oczekiwane_us: string | null }[];
};
export const WEKTORY_TRESCI = tresciJson as unknown as PlikTresci;

export const BLAD_DANYCH = 'błąd danych';
/** „brak” w wektorze BRD (pusta wartość w polu wejścia) — w domenie jako NaN ([DO USTALENIA]: reprezentacja pustego pola). */
export function liczba(v: WartoscBrd): number {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') throw new Error(`Wektor: nie liczba ${JSON.stringify(v)}`);
  if (v === 'brak') return NaN;
  const n = Number(v.replace(',', '.'));
  if (Number.isNaN(n)) throw new Error(`Wektor: nie liczba „${v}”`);
  return n;
}
/** Lista z wektora BRD: tablica (P-097 1a), tekst „100; 40; 0” albo pojedyncza liczba; „brak” → null. */
export function lista(v: WartoscBrd): (number | null)[] {
  if (typeof v === 'number') return [v];
  if (Array.isArray(v)) return v.map((x) => (x === 'brak' ? null : liczba(x)));
  if (typeof v !== 'string') throw new Error(`Wektor: nie lista ${JSON.stringify(v)}`);
  return v.split(';').map((s) => s.trim()).map((s) => (s === 'brak' ? null : Number(s.replace(',', '.'))));
}

const ZNACZNIK = /^NIEZAIMPLEMENTOWANE:/;
export function czyZnacznik(e: unknown): boolean {
  return e instanceof Error && ZNACZNIK.test(e.message);
}

/** Wywołanie, które może rzucić błąd domeny; znacznik zaślepki i błędy wykonania (TypeError, ReferenceError) idą dalej. */
export function wywolaj<T>(fn: () => T): { rzucil: false; wynik: T } | { rzucil: true; blad: Error } {
  try {
    return { rzucil: false, wynik: fn() };
  } catch (e) {
    if (czyZnacznik(e) || e instanceof TypeError || e instanceof ReferenceError || !(e instanceof Error)) throw e;
    return { rzucil: true, blad: e };
  }
}

/** Licznik zgodnych wektorów (DoD §6: „wykonano N z N”); test liczności pada na znaczniku, dopóki choć jeden wektor pada. */
export function licznikWektorow() {
  let pierwszyBlad: unknown = null;
  return {
    sprawdz(fn: () => void): void {
      try {
        fn();
      } catch (e) {
        if (pierwszyBlad === null) pierwszyBlad = e;
        throw e;
      }
    },
    wynik(oczekiwanych: number): void {
      expect(oczekiwanych).toBeGreaterThan(0); // pusty zbiór wektorów = porażka (§3.3); pusty `test.each` Jest odrzuca sam
      if (czyZnacznik(pierwszyBlad)) throw pierwszyBlad;
      // Bez porównania `zgodne` z `oczekiwanych`: ten test może biec przed wektorami (jest --randomize, -t, --shard; 07-jakosc-001).
      // Porażka wektora jest porażką jego własnego testu, a lista ID wektorów jest sprawdzana w teście liczności osobno.
    },
  };
}

/**
 * Opcje fast-check (DS-03): 100 przypadków; ziarno z PROP_SEED, gdy jest (fast-check wypisuje ziarno przy porażce).
 * `includeErrorInReport`: komunikat porażki zawiera błąd właściwości (znacznik zaślepki albo asercję), więc raport
 * akceptacji (scripts/jakosc/akceptacja-raport.mjs) rozpoznaje powód czerwieni.
 */
export function opcjeWlasnosci(): { seed?: number; includeErrorInReport: boolean } {
  const ziarno = Number(process.env.PROP_SEED);
  return Number.isFinite(ziarno) && process.env.PROP_SEED ? { seed: ziarno, includeErrorInReport: true } : { includeErrorInReport: true };
}

export const MIN = 60_000;
export const GODZ = 3_600_000;
export const DOBA = 86_400_000;

// TQ1 (1.0.2, P-1113): testy przed kodem wobec funkcji, których jeszcze nie ma w `src/`. Brak modułu albo eksportu daje znacznik
// `NIEZAIMPLEMENTOWANE: <ID>` (czerwień z właściwego powodu), nie „Cannot find module” ani „is not a function” (zła czerwień, akceptacja-raport.mjs).
/** Moduł ze ścieżki bezwzględnej; brak pliku modułu → znacznik. Błąd wewnątrz istniejącego modułu idzie dalej bez zmian. */
export function modulLubZnacznik(sciezka: string, id: string): Record<string, unknown> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(sciezka) as Record<string, unknown>;
  } catch (e) {
    const komunikat = typeof (e as { message?: unknown })?.message === 'string' ? (e as { message: string }).message : ''; // błąd resolvera Jest jest z innego realmu: bez instanceof
    if (/Cannot find module/.test(komunikat) && komunikat.includes(sciezka.split('/').pop() ?? sciezka)) throw new Error(`NIEZAIMPLEMENTOWANE: ${id} — brak modułu ${sciezka.replace(/^.*?\/(src|app)\//, '$1/')}`);
    throw e;
  }
}
/** Eksport modułu (funkcja, stała, komponent); brak → znacznik z ID. */
export function eksportLubZnacznik<T>(modul: Record<string, unknown>, nazwa: string, id: string): T {
  if (modul[nazwa] === undefined) throw new Error(`NIEZAIMPLEMENTOWANE: ${id} — brak eksportu ${nazwa}`);
  return modul[nazwa] as T;
}
/** Wynik domeny bywa `Wynik<T>` (src/domena/bledy.ts) albo gołą wartością — test sprawdza wartość. */
export function rozpakuj<T>(x: T | { ok: true; wartosc: T } | { ok: false; powod: unknown }): T {
  if (x !== null && typeof x === 'object' && 'ok' in x) {
    if (x.ok === true && 'wartosc' in x) return x.wartosc as T;
    if (x.ok === false) throw new Error(`Wynik domeny: błąd ${JSON.stringify((x as { powod: unknown }).powod)}`);
  }
  return x as T;
}
