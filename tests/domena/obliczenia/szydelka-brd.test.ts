// Test roli 08 (P-114 Q2a): RD-19 (rozmiar szydełka w mm na oznaczenie US, NZ-07 roli 01) — wektory BRD bez testu 07.
// Wyrocznia: tests/wektory/brd.json RD-19-W1–W7 (S-18); wektory treści „szydelka” (06) sprawdza grubosc-druty.test.ts.
import { rozmiarUS } from '../../../src/domena/obliczenia/druty';
import { BladDanych } from '../../../src/domena/bledy';
import { wektoryReguly, liczba, licznikWektorow, BLAD_DANYCH } from '../../narzedzia/akceptacja';

describe('RD-19 rozmiarUS szydełka: wektory BRD', () => {
  const wektory = wektoryReguly('RD-19');
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`RD-19 ${w.id} (${w.rodzaj}) ${w.wejscie['d [mm]']} mm → ${w.oczekiwane['US [-]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const mm = liczba(w.wejscie['d [mm]']);
      const o = w.oczekiwane['US [-]'];
      if (o === BLAD_DANYCH) expect(() => rozmiarUS(mm, 'szydelko')).toThrow(BladDanych);
      else expect(rozmiarUS(mm, 'szydelko')).toBe(o === 'brak' ? null : String(o));
    });
  });
  test(`RD-19 liczność: wykonano ${wektory.length} z 7 wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(7);
    licznik.wynik(wektory.length);
  });
});
