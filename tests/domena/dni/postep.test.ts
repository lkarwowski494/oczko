// RD-14 postęp projektu (BR-DNI-004, F-60) i RD-15 cel dzienny do terminu (BR-DNI-005, F-61) — poziom domena-Node.
// Wyrocznia: tests/wektory/brd.json RD-14-W1…W7, RD-15-W1…W7 i W11…W16 (P-134 Q1a, NZ-RD15: wejście Z_teraz, wyjście stan/zostało); rachunek na liczbach całkowitych w teście (ER-38, R-127);
// własności ze wzorów RD-14 i RD-15 (P-047 (3), P-048 (1)). Daty RD-15 jako RRRR-MM-DD (dzień lokalny RD-16).
import fc from 'fast-check';
import { postepProcent, celDzienny } from '../../../src/domena/postep';
import type { CzescPostepu } from '../../../src/domena/postep';
import { type WartoscBrd, wektoryReguly, lista, liczba, licznikWektorow, BLAD_DANYCH, opcjeWlasnosci, DOBA } from '../../narzedzia/akceptacja';

const KRYTERIA_RD14: Record<string, string> = {
  'RD-14-W1': 'BR-DNI-004/S1',
  'RD-14-W4': 'BR-DNI-004/S2',
  'RD-14-W6': 'BR-DNI-004/S3',
};
const KRYTERIA_RD15: Record<string, string> = {
  'RD-15-W1': 'BR-DNI-005/S1',
  'RD-15-W4': 'BR-DNI-005/S4',
};

function czesci(r: WartoscBrd, c: WartoscBrd): CzescPostepu[] {
  const rz = lista(r), ce = lista(c);
  if (rz.length !== ce.length) throw new Error('Wektor RD-14: różna liczba r_i i c_i');
  return rz.map((x, i) => ({ rzedy: x ?? 0, cel: ce[i] }));
}
/** Dzień kalendarzowy + n dni (arytmetyka na datach, bez stref; RD-15: d = termin − dziś + 1). */
function plusDni(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * DOBA).toISOString().slice(0, 10);
}
/** Dziś z RD-15-W1 („d dla 2026-10-22 → 2026-11-04”). */
const DZIS = '2026-10-22';

describe('RD-14 postepProcent: wektory BRD', () => {
  const wektory = wektoryReguly('RD-14');
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${KRYTERIA_RD14[w.id] ?? 'BR-DNI-004'} ${w.id} (${w.rodzaj}) r=${w.wejscie['r_i [rz.]']} c=${w.wejscie['c_i [rz.]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const wynik = postepProcent(czesci(w.wejscie['r_i [rz.]'], w.wejscie['c_i [rz.]']));
      const o = w.oczekiwane['p [%]'];
      if (o === BLAD_DANYCH) expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      else expect(wynik).toEqual({ ok: true, wartosc: o });
    });
  });
  test(`RD-14 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(7); // W7 (ER-38) dopisany przez 01
    licznik.wynik(wektory.length);
  });
});

describe('RD-14 arytmetyka całkowita (ER-38, R-127)', () => {
  test('BR-DNI-004 R-127 ER-38 29/100 → 29 (nie 28 z Math.floor(100 × (29/100)))', () => {
    expect(postepProcent([{ rzedy: 29, cel: 100 }])).toEqual({ ok: true, wartosc: 29 });
  });
  test('BR-DNI-004 R-127 wyczerpująco jedna część, 1 ≤ c ≤ 500, 0 ≤ r ≤ c + 1: p = (100r − 100r mod c) / c na liczbach całkowitych', () => {
    const rozjazdy: string[] = [];
    for (let c = 1; c <= 500; c += 1)
      for (let r = 0; r <= c + 1; r += 1) {
        const s = Math.min(r, c);
        const oczek = (100 * s - ((100 * s) % c)) / c;
        const w = postepProcent([{ rzedy: r, cel: c }]);
        if (!w.ok || w.wartosc !== oczek) rozjazdy.push(`${r}/${c}: ${JSON.stringify(w)} ≠ ${oczek}`);
        if (rozjazdy.length > 20) break;
      }
    expect(rozjazdy).toEqual([]);
  });
});

describe('RD-14 własności (fast-check)', () => {
  const czescGen = fc.record({ rzedy: fc.integer({ min: 0, max: 2000 }), cel: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: null }) });
  test('BR-DNI-004 RD-14 postęp całkowity w 0..100; 100 tylko gdy każda część z celem osiągnęła cel (P-048 (1))', () => {
    fc.assert(
      fc.property(fc.array(czescGen, { minLength: 1, maxLength: 8 }).filter((cz) => cz.some((c) => c.cel !== null)), (cz) => {
        const w = postepProcent(cz);
        expect(w.ok).toBe(true);
        if (!w.ok) return;
        expect(Number.isInteger(w.wartosc)).toBe(true);
        expect(w.wartosc).toBeGreaterThanOrEqual(0);
        expect(w.wartosc).toBeLessThanOrEqual(100);
        const wszystkie = cz.every((c) => c.cel === null || c.rzedy >= c.cel);
        expect(w.wartosc === 100).toBe(wszystkie);
      }),
      opcjeWlasnosci(),
    );
  });
  test('BR-DNI-004 RD-14 część bez celu nie zmienia postępu (nie wchodzi do sumy)', () => {
    fc.assert(
      fc.property(fc.array(czescGen, { minLength: 1, maxLength: 6 }).filter((cz) => cz.some((c) => c.cel !== null)), fc.integer({ min: 0, max: 5000 }), (cz, r) => {
        expect(postepProcent([...cz, { rzedy: r, cel: null }])).toEqual(postepProcent(cz));
      }),
      opcjeWlasnosci(),
    );
  });
});

describe('RD-15 celDzienny: wektory BRD (dziś = 2026-10-22, termin = dziś + d − 1)', () => {
  // 08 (partia 1, NZ-05-01, P-097 1a, P-114 Q2a): pętla obejmuje wektory tego kształtu; wektory nowego kształtu sprawdza test 08 w tests/domena/.
  const wektory = wektoryReguly('RD-15').filter((w) => 'C [rz.]' in w.wejscie);
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${KRYTERIA_RD15[w.id] ?? 'BR-DNI-005'} ${w.id} (${w.rodzaj}) C=${w.wejscie['C [rz.]']} Z_przed=${w.wejscie['Z_przed [rz.]']} d=${w.wejscie['d [dni]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const d = liczba(w.wejscie['d [dni]']);
      const przedDzis = liczba(w.wejscie['Z_przed [rz.]']);
      // 08 (partia 4, P-136, P-134 Q1a): tabela W11–W16 podaje Z_teraz; wektory W1–W7 opisują początek dnia (Z_teraz = Z_przed).
      const zrobioneTeraz = 'Z_teraz [rz.]' in w.wejscie ? liczba(w.wejscie['Z_teraz [rz.]']) : przedDzis;
      const wynik = celDzienny({ suma: liczba(w.wejscie['C [rz.]']), przedDzis, zrobioneTeraz, termin: plusDni(DZIS, d - 1), dzis: DZIS });
      const o = w.oczekiwane['g [rz.]'];
      const stan = w.oczekiwane['stan [-]'];
      if (stan !== undefined) {
        // P-134 Q1a: „cel osiągnięty” (g = 0) ma pierwszeństwo przed terminem; „termin minął” → zostało = C − Z_teraz na bieżąco.
        if (stan === 'cel osiągnięty') expect(wynik).toEqual({ ok: true, wartosc: { rodzaj: 'osiagniety' } });
        else if (stan === 'termin minął') expect(wynik).toEqual({ ok: true, wartosc: { rodzaj: 'po_terminie', zostalo: liczba(w.oczekiwane['zostało [rz.]']) } });
        else throw new Error(`Wektor ${w.id}: nieznany stan „${String(stan)}”`);
      } else if (o === BLAD_DANYCH) expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      else if (typeof o === 'string') {
        const m = /zostało (\d+)/.exec(o);
        if (!m) throw new Error(`Wektor ${w.id}: nieznane oczekiwanie „${o}”`);
        expect(wynik).toEqual({ ok: true, wartosc: { rodzaj: 'po_terminie', zostalo: Number(m[1]) } });
      } else if (o === 0) expect(wynik).toEqual({ ok: true, wartosc: { rodzaj: 'osiagniety' } });
      else expect(wynik).toEqual({ ok: true, wartosc: { rodzaj: 'cel', rzedy: o } });
    });
  });
  test(`RD-15 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    // 08 (partia 4, P-136): liczność z wektorów — wszystkie wektory RD-15 poza W8–W10 (d z dat: tests/domena/dni/dni-tygodnie.test.ts).
    expect(wektory.length).toBe(wektoryReguly('RD-15').length - 3);
    // F07-03: oba kształty razem = cała reguła; nowy wektor innego kształtu nie może zostać pominięty po cichu.
    expect(wektoryReguly('RD-15').map((x) => x.id).sort()).toEqual([...wektory.map((x) => x.id), 'RD-15-W8', 'RD-15-W9', 'RD-15-W10'].sort());
    licznik.wynik(wektory.length);
  });
  test('BR-DNI-005/S1 RD-15-W1 kontrola wyprowadzenia daty: termin 2026-11-04 → d = 14 → cel 13', () => {
    expect(plusDni(DZIS, 13)).toBe('2026-11-04');
    expect(celDzienny({ suma: 320, przedDzis: 140, zrobioneTeraz: 140, termin: '2026-11-04', dzis: DZIS })).toEqual({ ok: true, wartosc: { rodzaj: 'cel', rzedy: 13 } });
  });
});

describe('RD-15 przez zmianę czasu (ER-38, R-135): dni liczone jako daty, nie jako 24 h', () => {
  test('BR-DNI-005 R-135 wiosna: dziś 2027-03-20, termin 2027-04-02 (przez 2027-03-28) → d = 14 → cel ⌈180/14⌉ = 13', () => {
    expect(celDzienny({ suma: 320, przedDzis: 140, zrobioneTeraz: 140, termin: '2027-04-02', dzis: '2027-03-20' })).toEqual({ ok: true, wartosc: { rodzaj: 'cel', rzedy: 13 } });
  });
  test('BR-DNI-005 R-135 dzień zmiany czasu: dziś 2027-03-28, termin 2027-03-29 → d = 2 → cel 10', () => {
    expect(celDzienny({ suma: 320, przedDzis: 300, zrobioneTeraz: 300, termin: '2027-03-29', dzis: '2027-03-28' })).toEqual({ ok: true, wartosc: { rodzaj: 'cel', rzedy: 10 } });
  });
  test('BR-DNI-005 R-135 jesień: dziś 2026-10-24, termin 2026-10-26 (przez 2026-10-25) → d = 3 → cel 7', () => {
    expect(celDzienny({ suma: 320, przedDzis: 300, zrobioneTeraz: 300, termin: '2026-10-26', dzis: '2026-10-24' })).toEqual({ ok: true, wartosc: { rodzaj: 'cel', rzedy: 7 } });
  });
});

describe('RD-15 własność: cel = ⌈R / d⌉ (P-047 (3)), kolejność gałęzi (P-134 Q1a)', () => {
  test('BR-DNI-005 RD-15 dla C > 0, 0 ≤ Z_przed, Z_teraz ≤ C: (1) d ≥ 1 i R = 0 albo d < 1 i R_teraz = 0 → osiągnięty; (2) d < 1 → po terminie, zostało R_teraz; (3) g·d ≥ R i (g − 1)·d < R', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5000 }), fc.integer({ min: 0, max: 5000 }), fc.integer({ min: 0, max: 5000 }), fc.integer({ min: -30, max: 400 }), (C, zp, zt, d) => {
        const Z = Math.min(zp, C), Zt = Math.min(zt, C);
        const R = C - Z, Rt = C - Zt;
        const w = celDzienny({ suma: C, przedDzis: Z, zrobioneTeraz: Zt, termin: plusDni(DZIS, d - 1), dzis: DZIS });
        if ((d >= 1 && R === 0) || (d < 1 && Rt === 0)) expect(w).toEqual({ ok: true, wartosc: { rodzaj: 'osiagniety' } });
        else if (d < 1) expect(w).toEqual({ ok: true, wartosc: { rodzaj: 'po_terminie', zostalo: Rt } });
        else {
          expect(w.ok && w.wartosc.rodzaj).toBe('cel');
          if (w.ok && w.wartosc.rodzaj === 'cel') {
            const g = w.wartosc.rzedy;
            expect(g * d).toBeGreaterThanOrEqual(R);
            expect((g - 1) * d).toBeLessThan(R);
          }
        }
      }),
      opcjeWlasnosci(),
    );
  });
});
