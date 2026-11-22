// KP-12, KP-13, BR-ZAK-005, BR-ZAK-006, NFR-PIE-001 (poziom domena-Node): wszystkie wektory L, S, Z roli 02
// (docs/monetyzacja/wektory-limitu.json; P-057 D2–D5, P-065 (1a)(2a), P-067, P-068). Ryzyko R-097 (rozjazd TS z limit.mjs).
// Wyrocznia: wektory (nie wzorzec limit.mjs). Oczekiwany błąd: oczekujBleduDanych (klasa BladDanych [DO USTALENIA], Z07-07).
import { startDnia, wolaStraznika, mozeZaczacDzien } from '../../../src/domena/limit';
import type { RodzajStraznika } from '../../../src/domena/limit';
import { LIMIT_DNI_W_MIESIACU, PRZERWA_NOWEGO_DNIA_MS } from '../../../src/konfiguracja';
import { WEKTORY_LIMITU, czyBlad, kryteria, oczekujBleduDanych, licznikWektorow } from './pomocnicze';

describe('KP-12 / R-097 wektory-limitu.json: parametry pliku = konfiguracja (P-057 D2, D3)', () => {
  test('KP-12 L-* plik wektorów liczy z limitem i przerwą z src/konfiguracja.ts', () => {
    // Wektory nie podają `limit`/`przerwa`, więc ich zgodność z konfiguracją jest warunkiem znaczenia wektorów.
    expect({ limit: WEKTORY_LIMITU.limit, przerwa: WEKTORY_LIMITU.przerwa_ms }).toEqual({ limit: LIMIT_DNI_W_MIESIACU, przerwa: PRZERWA_NOWEGO_DNIA_MS });
    // Sama zgodność liczb jest zielona przed kodem, więc test kończy się wywołaniem reguły z wartościami domyślnymi.
    expect(startDnia({ dni: [], dzis: '2026-11-01', teraz: 1_800_000_000_000, ostatniPlus: null, pro: false }).zostalo).toBe(LIMIT_DNI_W_MIESIACU - 1);
  });
});

describe('KP-12 startDnia: wektory L (BR-ZAK-005)', () => {
  const wektory = WEKTORY_LIMITU.startDnia;
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${kryteria(w.id)} ${w.id} ${w.scenariusz}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      // L-24, L-25 (Z07-07, R-103, R-178): błąd danych z kodem, nie dowolny wyjątek (NZ-05-01: kształt wektorów po fixie 02).
      if (czyBlad(w.oczekiwane)) oczekujBleduDanych(() => startDnia(w.wejscie));
      else expect(startDnia(w.wejscie)).toEqual(w.oczekiwane);
    });
  });
  test(`KP-12 R-097 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów startDnia (pusty plik = porażka)`, () => {
    licznik.wynik(wektory.length);
  });
});

describe('KP-12 wolaStraznika: wektory S (P-067)', () => {
  const wektory = WEKTORY_LIMITU.wolaStraznika;
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${kryteria(w.id)} ${w.id} ${w.scenariusz}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      if (czyBlad(w.oczekiwane)) {
        // Błąd danych ma nazwać nieznany rodzaj (komunikat, nie dowolny wyjątek; Z07-07).
        oczekujBleduDanych(() => wolaStraznika({ rodzaj: w.wejscie.rodzaj as RodzajStraznika }), w.wejscie.rodzaj);
      } else {
        expect(wolaStraznika(w.wejscie)).toBe(w.oczekiwane);
      }
    });
  });
  test(`KP-12 R-097 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów wolaStraznika (pusty plik = porażka)`, () => {
    licznik.wynik(wektory.length);
  });
});

describe('KP-13 mozeZaczacDzien: wektory Z (P-065 (1a), (2a))', () => {
  const wektory = WEKTORY_LIMITU.mozeZaczacDzien;
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${kryteria(w.id)} ${w.id} ${w.scenariusz}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      if (czyBlad(w.oczekiwane)) oczekujBleduDanych(() => mozeZaczacDzien(w.wejscie));
      else expect(mozeZaczacDzien(w.wejscie)).toEqual(w.oczekiwane);
    });
  });
  test(`KP-13 R-097 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów mozeZaczacDzien (pusty plik = porażka)`, () => {
    licznik.wynik(wektory.length);
  });
});
