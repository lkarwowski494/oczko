// RD-01 oczka na szerokość (BR-KAL-001), RD-03 jednostki i RD-04 próbka 4 in → 10 cm (BR-KAL-003) — poziom domena-Node.
// Wyrocznia: tests/wektory/brd.json (RD-01, RD-03, RD-04, tolerancja z wektora) i docs/tresci/wektory.json „jednostki”
// (tolerancja 1e-9, przelicznik uncji 28,349523125 g z parametry.json, JED-005). Własności: przeliczenie tam i z powrotem.
import fc from 'fast-check';
import { oczkaNaSzerokosc, proba4inNa10cm } from '../../../src/domena/obliczenia/oczka';
import { przelicz } from '../../../src/domena/obliczenia/jednostki';
import type { Przelicznik } from '../../../src/domena/obliczenia/jednostki';
import parametry from '../../../docs/tresci/parametry.json';
import { wektoryReguly, liczba, licznikWektorow, wywolaj, BLAD_DANYCH, WEKTORY_TRESCI, opcjeWlasnosci } from '../../narzedzia/akceptacja';

const KRYTERIA: Record<string, string> = {
  'RD-01-W1': 'BR-KAL-001/S1',
  'RD-01-W2': 'BR-KAL-001/S3',
  'RD-01-W5': 'BR-KAL-001/S2',
  'RD-03-W3': 'BR-KAL-003/S2',
  'RD-04-W1': 'BR-KAL-003/S1',
  'JW-oz-3_5': 'BR-KAL-003/S2',
};

/**
 * „błąd danych” dla funkcji zwracającej liczbę (przelicz: sygnatura bez Wynik — brakująca sygnatura, raport E3).
 * Do decyzji 05: błąd domeny (wyjątek) albo wartość nie będąca wynikiem; nigdy liczba skończona ≥ 0.
 */
function oczekujBleduLiczby(fn: () => number): void {
  const r = wywolaj(fn);
  if (!r.rzucil) expect(Number.isFinite(r.wynik) && r.wynik >= 0).toBe(false);
}
function blisko(wynik: number, oczek: number, tol: number): void {
  expect(Math.abs(wynik - oczek)).toBeLessThanOrEqual(tol);
}

describe('RD-01 oczkaNaSzerokosc: wektory BRD', () => {
  const wektory = wektoryReguly('RD-01');
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${KRYTERIA[w.id] ?? 'BR-KAL-001'} ${w.id} (${w.rodzaj}) W=${w.wejscie['W [cm]']} P=${w.wejscie['P [o./10 cm]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const wynik = oczkaNaSzerokosc({ szerokoscCm: liczba(w.wejscie['W [cm]']), oczkaNa10cm: liczba(w.wejscie['P [o./10 cm]']) });
      const o = w.oczekiwane['N [o.]'];
      if (o === BLAD_DANYCH) expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      else {
        expect(wynik.ok).toBe(true);
        if (wynik.ok) blisko(wynik.wartosc, Number(o), w.tolerancja ?? 0);
      }
    });
  });
  test(`RD-01 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(5);
    licznik.wynik(wektory.length);
  });
});

describe('RD-04 proba4inNa10cm: wektory BRD', () => {
  const wektory = wektoryReguly('RD-04');
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${KRYTERIA[w.id] ?? 'BR-KAL-003'} ${w.id} (${w.rodzaj}) P4=${w.wejscie['P4 [o./4 in]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const wynik = proba4inNa10cm(liczba(w.wejscie['P4 [o./4 in]']));
      const o = w.oczekiwane['P10 [o./10 cm]'];
      if (o === BLAD_DANYCH) expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      else {
        expect(wynik.ok).toBe(true);
        if (wynik.ok) blisko(wynik.wartosc, Number(o), w.tolerancja ?? 0);
      }
    });
  });
  test(`RD-04 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(6);
    licznik.wynik(wektory.length);
  });
  test('BR-KAL-003/S1 RD-04 własność: P10 = P4 × 10 / 10,16 dokładnie (4 in = 10,16 cm, JED-006), P4 = całkowite/100', () => {
    const cm4 = parametry.jednostki.find((p) => p.parametr === 'cztery_cale_w_cm')?.wartosc;
    expect(cm4).toBe(10.16);
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }).map((n) => n / 100), (p4) => {
        const w = proba4inNa10cm(p4);
        expect(w.ok).toBe(true);
        if (w.ok) blisko(w.wartosc, (p4 * 10) / (cm4 as number), 1e-9);
      }),
      opcjeWlasnosci(),
    );
  });
});

describe('RD-03 przelicz: wektory BRD (tolerancja z wektora)', () => {
  const wektory = wektoryReguly('RD-03');
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${KRYTERIA[w.id] ?? 'BR-KAL-003'} ${w.id} (${w.rodzaj}) ${w.wejscie['Przelicznik [-]']} ${w.wejscie['Wartość [jedn. wejścia]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const p = String(w.wejscie['Przelicznik [-]']) as Przelicznik;
      const x = liczba(w.wejscie['Wartość [jedn. wejścia]']);
      const o = w.oczekiwane['wynik [jedn. wyjścia]'];
      if (o === BLAD_DANYCH) oczekujBleduLiczby(() => przelicz(x, p));
      else blisko(przelicz(x, p), Number(o), w.tolerancja ?? 0);
    });
  });
  test(`RD-03 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(7);
    licznik.wynik(wektory.length);
  });
});

describe('BR-KAL-003 przelicz: wektory treści „jednostki” (tolerancja 1e-9)', () => {
  const wektory = WEKTORY_TRESCI.jednostki;
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${KRYTERIA[w.id] ?? 'BR-KAL-003'} RD-03 ${w.id} ${w.przelicznik} ${w.wartosc} → ${w.oczekiwane}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const p = w.przelicznik as Przelicznik;
      if (w.oczekiwane === BLAD_DANYCH) oczekujBleduLiczby(() => przelicz(w.wartosc, p));
      else blisko(przelicz(w.wartosc, p), Number(w.oczekiwane), 1e-9);
    });
  });
  test(`BR-KAL-003 RD-03 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów jednostek (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(8);
    licznik.wynik(wektory.length);
  });
});

describe('BR-KAL-003 RD-03 własności przeliczeń (fast-check; wartości całkowite/100)', () => {
  const PARY: [Przelicznik, Przelicznik, string][] = [
    ['in→cm', 'cm→in', 'cal_w_cm'],
    ['yd→m', 'm→yd', 'jard_w_m'],
    ['oz→g', 'g→oz', 'uncja_w_g'],
  ];
  test.each(PARY)('BR-KAL-003 RD-03 %s i %s: wynik = x × przelicznik z parametry.json, a tam i z powrotem = x (1e-9 względnie)', (tam, zpowrotem, nazwa) => {
    const k = parametry.jednostki.find((p) => p.parametr === nazwa)?.wartosc as number;
    expect(k).toBeGreaterThan(0);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }).map((n) => n / 100), (x) => {
        const y = przelicz(x, tam);
        const tol = 1e-9 * Math.max(1, x * k);
        blisko(y, x * k, tol);
        blisko(przelicz(y, zpowrotem), x, 1e-9 * Math.max(1, x));
      }),
      opcjeWlasnosci(),
    );
  });
});
