// M3 p1 (ADR-0034 pkt 2, Potwierdzenie; design-spec „Element firmowy: dzianina części”): czysta funkcja geometrii, bez renderera.
import { OKNO_BEZ_CELU, geometriaDzianiny } from '../../src/ekrany/dzianina-geometria';

const W = { szerokosc: 100, wysokosc: 200 };
const g = (p: Partial<Parameters<typeof geometriaDzianiny>[0]>) => geometriaDzianiny({ gotowe: 48, cel: 96, dzis: 12, przypomnienie: null, ...W, ...p });

describe('geometriaDzianiny', () => {
  test('wysokość dzianiny rośnie z postępem części: 48 z 96 rzędów = połowa dostępnej wysokości', () => {
    const a = g({ gotowe: 24 }), b = g({ gotowe: 48 }), c = g({ gotowe: 72 });
    expect(b.dzianina.h).toBeCloseTo(a.dzianina.h * 2, 6);
    expect(c.dzianina.h).toBeCloseTo(a.dzianina.h * 3, 6);
    expect(b.dzianina.y + b.dzianina.h).toBeCloseTo(a.dzianina.y + a.dzianina.h, 6); // dół stały (nabranie)
  });
  // Zmienione jawnie w 001 (P-619, `docs/programista/m3-fix-e5-zastapione-testy.md`): było „igła stoi na dole” (y = dół dzianiny); makieta `ekrany.html:629–631`
  // rysuje przy 0 rzędach pas nabranych oczek 8 jedn. i igłę nad nim.
  test('0 rzędów = sama igła z nabranymi oczkami: dzianina ma wysokość 0, pas nabrania 8 nad dołem, igła na nabraniu, bez pasa „dziś”', () => {
    const r = g({ gotowe: 0, dzis: 0 });
    expect(r.dzianina.h).toBe(0);
    expect(r.pasDzis).toBeNull();
    expect(r.nabranie).toEqual({ y: r.dzianina.y - 8, h: 8 });
    expect(r.igla.y).toBeCloseTo(r.dzianina.y - 8, 6);
  });
  test('001: przy rzędach > 0 bez pasa nabrania, igła na górnym brzegu dzianiny', () => {
    const r = g({ gotowe: 1, dzis: 1 });
    expect(r.nabranie).toBeNull();
    expect(r.igla.y).toBeCloseTo(r.dzianina.y, 6);
  });
  test('jaśniejszy pas u góry = rzędy dziś, nie większy niż dzianina', () => {
    const r = g({ gotowe: 48, dzis: 12 });
    expect(r.pasDzis?.y).toBeCloseTo(r.dzianina.y, 6);
    expect(r.pasDzis?.h).toBeCloseTo(r.dzianina.h / 4, 6);
    expect(g({ gotowe: 5, dzis: 50 }).pasDzis?.h).toBeCloseTo(g({ gotowe: 5, dzis: 50 }).dzianina.h, 6);
  });
  test('część bez celu: okno 96 rzędów i brak linii celu', () => {
    expect(OKNO_BEZ_CELU).toBe(96);
    const r = g({ cel: null, gotowe: 48 });
    expect(r.liniaCelu).toBeNull();
    expect(r.dzianina.h).toBeCloseTo(g({ cel: 96, gotowe: 48 }).dzianina.h, 6);
  });
  test('cel osiągnięty albo przekroczony: dzianina pod linią celu, nie wyżej', () => {
    const r = g({ gotowe: 120, cel: 96 });
    expect(r.liniaCelu).not.toBeNull();
    expect(r.dzianina.y).toBeGreaterThanOrEqual(r.liniaCelu!.y);
    expect(r.dzianina.h).toBeCloseTo(g({ gotowe: 96, cel: 96 }).dzianina.h, 6);
  });
  test('przypomnienie w rzędzie powyżej bieżącego = ząbek w brzegu; poniżej bieżącego albo brak = bez ząbka', () => {
    const z = g({ gotowe: 48, przypomnienie: 60 }).zabek;
    expect(z).not.toBeNull();
    expect(z!.y).toBeLessThan(g({ gotowe: 48 }).dzianina.y);
    expect(g({ gotowe: 48, przypomnienie: 30 }).zabek).toBeNull();
    expect(g({ gotowe: 48, przypomnienie: null }).zabek).toBeNull();
  });
  test('wartości ujemne i NaN nie psują rysunku (brak zostaje brakiem: traktowane jak 0)', () => {
    const r = g({ gotowe: -5, dzis: Number.NaN });
    expect(r.dzianina.h).toBe(0);
    expect(r.pasDzis).toBeNull();
  });
});
