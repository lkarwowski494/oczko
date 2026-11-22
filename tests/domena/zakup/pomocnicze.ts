// Wspólne typy wektorów i pomocnik oczekiwanego błędu dla testów akceptacyjnych zakupu i limitu (rola 07, E3).
// Wyrocznia: docs/monetyzacja/wektory-limitu.json, wektory-dostepu.json (rola 02) i decyzje z ID w komentarzach testów.
import wektoryLimituJson from '../../../docs/monetyzacja/wektory-limitu.json';
import wektoryDostepuJson from '../../../docs/monetyzacja/wektory-dostepu.json';
import type { WejscieDnia, WynikStartu, StanZawczasu, RodzajStraznika } from '../../../src/domena/limit';
import type { Odczyt, Pamiec, DecyzjaDostepu } from '../../../src/domena/dostep';

export const BLAD = 'błąd' as const;
/** Błąd danych w wektorze: dawny zapis „błąd” albo kod `{ blad: 'BLAD_DANYCH' }` z fixu 02 (Z07-07, R-178, P-103). */
export type BladWektora = typeof BLAD | { blad: 'BLAD_DANYCH' };
export function czyBlad(o: unknown): o is BladWektora {
  return o === BLAD || (typeof o === 'object' && o !== null && 'blad' in o && o.blad === 'BLAD_DANYCH');
}
type Wektor<W, O> = { id: string; scenariusz: string; wejscie: W; oczekiwane: O };
export type PlikLimitu = {
  limit: number;
  przerwa_ms: number;
  startDnia: Wektor<WejscieDnia, WynikStartu | BladWektora>[];
  wolaStraznika: Wektor<{ rodzaj: RodzajStraznika; licznik: string; urzadzenie: string }, boolean | BladWektora>[];
  mozeZaczacDzien: Wektor<WejscieDnia, StanZawczasu | BladWektora>[];
};
export type PlikDostepu = {
  teraz: number;
  odblokowuja: string[];
  decyzja: { id: string; scenariusz: string; odczyt: Odczyt; pamiec: Pamiec; oczekiwane: DecyzjaDostepu }[];
  odczytajPamiec: Wektor<string | null, Pamiec>[];
};

export const WEKTORY_LIMITU = wektoryLimituJson as unknown as PlikLimitu;
export const WEKTORY_DOSTEPU = wektoryDostepuJson as unknown as PlikDostepu;

/** Kryteria z docs/jakosc/e0/kryteria.json (pole „wyrocznia”), które dany wektor rozstrzyga; pierwsze ID = kryterium główne. */
export const KRYTERIA: Record<string, string> = {
  'L-01': 'KP-12 BR-ZAK-005/S1 NFR-PIE-001', 'L-02': 'KP-12 BR-ZAK-005/S2', 'L-03': 'KP-12 BR-ZAK-005/S4',
  'L-04': 'KP-12 BR-ZAK-005/S3', 'L-04b': 'KP-12 BR-ZAK-005/S3', 'L-05': 'KP-12 BR-ZAK-005/S8',
  'L-06': 'KP-12 BR-ZAK-005/S6', 'L-08': 'KP-12 BR-ZAK-005/S5', 'L-09': 'KP-12 BR-ZAK-007/S1 KP-02',
  'L-10': 'KP-12 BR-ZAK-005/S9 BR-ZAK-001/S2', 'L-11': 'KP-12 BR-ZAK-005/S10 KP-15', 'L-12': 'KP-12',
  'L-14': 'KP-12 KP-15', 'L-15': 'KP-12 BR-ZAK-005/S15', 'L-16': 'KP-12 BR-ZAK-005/S14 KP-15',
  'L-17': 'KP-12 BR-ZAK-005/S14 KP-15', 'L-18': 'KP-12 BR-ZAK-005/S13 KP-15',
  'S-01': 'KP-12', 'S-02': 'KP-12 BR-ZAK-005/S11', 'S-03': 'KP-12', 'S-04': 'KP-12', 'S-05': 'KP-12',
  'S-06': 'KP-12 BR-ZAK-005/S5', 'S-07': 'KP-12 BR-ZAK-005/S12', 'S-08': 'KP-12 BR-ZAK-005/S12',
  'S-09': 'KP-12 BR-ZAK-005/S7', 'S-10': 'KP-12',
  'Z-01': 'KP-13 NFR-PIE-001', 'Z-02': 'KP-13 BR-ZAK-005/S4 BR-ZAK-006/S1', 'Z-03': 'KP-13 BR-ZAK-006/S2',
  'Z-04': 'KP-13', 'Z-05': 'KP-13', 'Z-06': 'KP-13 BR-ZAK-006/S6', 'Z-07': 'KP-13 BR-ZAK-006/S5', 'Z-08': 'KP-13',
  'W-01': 'KP-06', 'W-02': 'BR-ZAK-001/S1 KP-05', 'W-03': 'BR-ZAK-001/S2 KP-06', 'W-04': 'KP-06',
  'W-05': 'KP-02 BR-ZAK-007/S2', 'W-06': 'KP-02 BR-ZAK-007/S2', 'W-07': 'KP-08', 'W-08': 'KP-06',
  'W-09': 'BR-ZAK-001/S3', 'W-10': 'BR-ZAK-001/S5', 'W-11': 'KP-06', 'W-12': 'KP-06', 'W-13': 'KP-06',
  'W-14': 'KP-02 BR-ZAK-001/S6', 'W-15': 'BR-ZAK-003/S1', 'W-16': 'KP-02 BR-ZAK-007/S2', 'W-17': 'BR-ZAK-003/S1 KP-03',
  'W-18': 'BR-ZAK-001/S2 KP-06',
  'P-01': 'KP-06', 'P-02': 'KP-06', 'P-03': 'KP-06', 'P-04': 'KP-06', 'P-05': 'KP-06', 'P-06': 'KP-06',
  // Wektory dopisane przez 02 w fixie Z07-07–Z07-09 (P-103, P-109): kryterium/ryzyko z pola „scenariusz” wektora
  // (kryteria.json E0 roli 07 ich nie zna; dopisała rola 08 w partii 1, NZ-05-01, zgłoszenie do 07).
  'L-04c': 'KP-12 BR-ZAK-005/S3 R-100', 'L-04d': 'KP-12 BR-ZAK-005/S3 R-100', 'L-04e': 'KP-12 BR-ZAK-005/S3 R-100',
  'L-07': 'KP-12 BR-DAN-005/S2 BR-ZAK-005/S7', 'L-13': 'KP-12 BR-ZAK-001/S2', 'L-21': 'KP-12 KP-15 R-100',
  'L-22': 'KP-12 R-103', 'L-22b': 'KP-12 R-103', 'L-23': 'KP-12 R-102', 'L-23b': 'KP-12 R-102', 'L-24': 'KP-12 R-103',
  'L-25': 'KP-12 R-178', 'Z-09': 'KP-13 R-099',
  'W-12b': 'KP-06 R-116', 'W-19a': 'KP-06 R-113', 'W-19b': 'KP-06 R-113', 'W-20': 'KP-06 R-114', 'W-20b': 'KP-06 R-114',
  'W-21': 'KP-06 R-114', 'W-21b': 'KP-06 R-114', 'W-22': 'KP-07 R-111', 'W-22b': 'KP-07 R-111', 'W-23': 'KP-06 R-112',
  'W-23b': 'KP-06 R-112', 'W-23c': 'KP-06 R-112', 'W-23d': 'KP-06 R-112', 'W-23e': 'KP-06 R-112', 'P-07': 'KP-06 R-115',
};
export function kryteria(id: string): string {
  const k = KRYTERIA[id];
  if (!k) throw new Error(`Wektor ${id} bez przypisanego kryterium w pomocnicze.ts (dopisz z docs/jakosc/e0/kryteria.json)`);
  return k;
}

const ZNACZNIK = /^NIEZAIMPLEMENTOWANE:/;

/**
 * Oczekiwany „błąd danych” z wektora (oczekiwane: "błąd"). Zasada §3.4 strategii: nie „cokolwiek rzuca”.
 * Brak klasy błędu domeny (np. `BladDanych`, propozycja Z07-07) — do tego czasu: `Error`, ale nie błąd wykonania
 * (TypeError/ReferenceError, np. mutant `undefined.awaria` z Z07-07), i komunikat z podanym fragmentem.
 * Znacznik zaślepki przechodzi dalej bez zmian, żeby czerwień była „z właściwego powodu”.
 */
export function oczekujBleduDanych(fn: () => unknown, fragment?: string): void {
  let zlapany: unknown = undefined;
  let rzucil = false;
  try {
    fn();
  } catch (e) {
    rzucil = true;
    zlapany = e;
  }
  if (zlapany instanceof Error && ZNACZNIK.test(zlapany.message)) throw zlapany;
  expect(rzucil).toBe(true);
  expect(zlapany).toBeInstanceOf(Error);
  expect(zlapany instanceof TypeError || zlapany instanceof ReferenceError).toBe(false);
  if (fragment !== undefined) expect((zlapany as Error).message).toContain(fragment);
}

/** Licznik zgodnych wektorów (DoD §6: „wykonano N z N”); znacznik zaślepki z pierwszego wektora wraca w teście liczności. */
export function licznikWektorow() {
  let pierwszyBlad: Error | null = null;
  return {
    sprawdz(fn: () => void): void {
      try {
        fn();
      } catch (e) {
        if (!pierwszyBlad && e instanceof Error) pierwszyBlad = e;
        throw e;
      }
    },
    wynik(oczekiwanych: number): void {
      expect(oczekiwanych).toBeGreaterThan(0); // pusty plik wektorów = porażka (§3.3)
      if (pierwszyBlad && ZNACZNIK.test((pierwszyBlad as Error).message)) throw pierwszyBlad;
      // Bez porównania liczby zgodnych z `oczekiwanych`: test liczności może biec przed wektorami (jest --randomize, -t; 07-jakosc-001).
    },
  };
}

export const TERAZ = 1_800_000_000_000;
export const MIN = 60_000;
export const GODZ = 3_600_000;
export const DZIEN = 86_400_000;
/** Dni bez Pro z listopada 2026 (RRRR-MM-DD). */
export function dniListopada(...dni: number[]) {
  return dni.map((d) => ({ data: `2026-11-${String(d).padStart(2, '0')}`, pro: false }));
}
