// Test roli 08 (partia 1, mutanty przeżywające w straznik-tempa.ts): dwie części wzoru RD-17 bez wektora w brd.json.
// Wyrocznia: docs/brd/reguly.md RD-17 „seria obejmuje wszystkie dodania z odstępem ≤ T od poprzedniego” oraz
// „dodania sortuje się po czasie zdarzenia, a przy równym czasie po identyfikatorze zdarzenia” (P-091 (4b)).
import { serieDoSprawdzenia } from '../../../src/domena/straznik-tempa';
import { STRAZNIK_SERIA_ZDARZEN, STRAZNIK_OKNO_S } from '../../../src/konfiguracja';

const KONF = { seria: STRAZNIK_SERIA_ZDARZEN, oknoS: STRAZNIK_OKNO_S };

describe('RD-17 BR-LIC-019 części wzoru bez wektora', () => {
  test('RD-17 odstęp dokładnie T od poprzedniego wydłuża serię (0; 0,5; 1; 3 s → jedna seria z 4 dodaniami)', () => {
    const d = [0, 500, 1000, 3000].map((czasMs, i) => ({ id: `d${i}`, czasMs, zrodlo: 'aplikacja' as const }));
    expect(serieDoSprawdzenia(d, KONF)).toEqual({ ok: true, wartosc: [{ zrodlo: 'aplikacja', ids: ['d0', 'd1', 'd2', 'd3'], odMs: 0, doMs: 3000 }] });
  });
  test('RD-17 odstęp T + 1 ms kończy serię (0; 0,5; 1; 3,001 s → seria z 3 dodaniami)', () => {
    const d = [0, 500, 1000, 3001].map((czasMs, i) => ({ id: `d${i}`, czasMs, zrodlo: 'aplikacja' as const }));
    expect(serieDoSprawdzenia(d, KONF)).toEqual({ ok: true, wartosc: [{ zrodlo: 'aplikacja', ids: ['d0', 'd1', 'd2'], odMs: 0, doMs: 1000 }] });
  });
  test('RD-17 P-091 (4b) równy czas: kolejność po id, niezależnie od kolejności dostarczenia', () => {
    const d = ['c', 'a', 'b'].map((id) => ({ id, czasMs: 5000, zrodlo: 'zegarek' as const }));
    expect(serieDoSprawdzenia(d, KONF)).toEqual({ ok: true, wartosc: [{ zrodlo: 'zegarek', ids: ['a', 'b', 'c'], odMs: 5000, doMs: 5000 }] });
  });
});
