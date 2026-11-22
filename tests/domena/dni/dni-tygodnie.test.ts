// Test roli 08 (P-114 Q2a): wektory BRD bez testu 07 — RD-15-W8–W10 (liczba dni d z dat, ER-38) i RD-20-W1–W9 (tydzień od poniedziałku,
// P-110 Q7, NZ-05-03, dopisane przez 01 w fix-2). Wyrocznia: tests/wektory/brd.json; region z wektora RD-20 nie wpływa na wynik (reguła).
import { dniDoTerminu, poczatekTygodnia } from '../../../src/domena/postep';
import { wektoryReguly, liczba, licznikWektorow, BLAD_DANYCH } from '../../narzedzia/akceptacja';

describe('RD-15 dniDoTerminu: wektory BRD W8–W10 (daty kalendarzowe, nie różnica chwil)', () => {
  const wektory = wektoryReguly('RD-15').filter((w) => 'dziś [data]' in w.wejscie);
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`BR-DNI-005 R-135 ${w.id} (${w.rodzaj}) ${w.wejscie['dziś [data]']} → ${w.wejscie['termin [data]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      expect(dniDoTerminu(String(w.wejscie['dziś [data]']), String(w.wejscie['termin [data]']))).toEqual({ ok: true, wartosc: liczba(w.oczekiwane['d [dni]']) });
    });
  });
  test(`RD-15 liczność: wykonano ${wektory.length} z 3 wektorów d (pusty zbiór = porażka)`, () => {
    expect(wektory.map((w) => w.id)).toEqual(['RD-15-W8', 'RD-15-W9', 'RD-15-W10']);
    licznik.wynik(wektory.length);
  });
  test('RD-15 termin wczoraj → d = 0 (po terminie, RD-15-W4); zła data → błąd danych', () => {
    expect(dniDoTerminu('2026-10-22', '2026-10-21')).toEqual({ ok: true, wartosc: 0 });
    expect(dniDoTerminu('2026-02-30', '2026-03-01')).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});

describe('RD-20 poczatekTygodnia: wektory BRD (P-110 Q7)', () => {
  const wektory = wektoryReguly('RD-20');
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`BR-DNI-003/S1 ${w.id} (${w.rodzaj}) ${w.wejscie['dzień [data]']} ${w.wejscie['region [BCP 47]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const o = w.oczekiwane['początek tygodnia [data]'];
      const wynik = poczatekTygodnia(String(w.wejscie['dzień [data]']));
      if (o === BLAD_DANYCH) expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      else expect(wynik).toEqual({ ok: true, wartosc: o });
    });
  });
  test(`RD-20 liczność: wykonano ${wektory.length} z 9 wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(9);
    licznik.wynik(wektory.length);
  });
});
