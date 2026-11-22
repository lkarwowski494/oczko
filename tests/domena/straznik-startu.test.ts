// ADR-0019 strażnik startu: przypadki z „Decyzja → Logika czysta” (pierwszy start, po udanym, jeden nieudany, drugi z rzędu,
// „spróbuj normalnie” z kamieniem i bez, start awaryjny nie zapisuje kamienia, uszkodzony zapis). Próg PROG_NIEUDANYCH_STARTOW = 2 (P-080).
import { kamienMilowy, odczytajStan, poczatekStartu, sprobujNormalnie, STAN_POCZATKOWY, type StanStartu } from '../../src/niezawodnosc/start';
import { PROG_NIEUDANYCH_STARTOW } from '../../src/konfiguracja';

const zapis = (s: StanStartu) => JSON.stringify(s);
const start = (s: StanStartu) => poczatekStartu(s);

describe('ADR-0019 strażnik startu', () => {
  test('próg = 2 (P-080)', () => expect(PROG_NIEUDANYCH_STARTOW).toBe(2));
  test('pierwszy start → normalny, w toku; kamień → zero', () => {
    const a = start(STAN_POCZATKOWY);
    expect(a).toEqual({ stan: { nieudane: 0, wToku: true }, awaryjny: false });
    expect(kamienMilowy(a.stan)).toEqual({ nieudane: 0, wToku: false });
  });
  test('po udanym starcie kolejny normalny', () => {
    expect(start(kamienMilowy(start(STAN_POCZATKOWY).stan)).awaryjny).toBe(false);
  });
  test('jeden nieudany (start bez kamienia) → 1, dalej normalnie', () => {
    expect(start(start(STAN_POCZATKOWY).stan)).toEqual({ stan: { nieudane: 1, wToku: true }, awaryjny: false });
  });
  test('drugi nieudany z rzędu → tryb awaryjny (scenariusz E2E 09: dwa starty z awarią, trzeci awaryjny)', () => {
    const s1 = start(STAN_POCZATKOWY).stan;        // start z awarią przed kamieniem
    const s2 = start(s1).stan;                     // drugi z awarią
    expect(start(s2)).toEqual({ stan: { nieudane: 2, wToku: false }, awaryjny: true });
  });
  test('start awaryjny nie zapisuje kamienia: zamknięcie ekranu awaryjnego → znów awaryjny, licznik bez wzrostu', () => {
    const aw = start({ nieudane: 1, wToku: true });
    expect(start(aw.stan)).toEqual({ stan: { nieudane: 2, wToku: false }, awaryjny: true });
  });
  test('„spróbuj normalnie” z kamieniem → zero; bez kamienia (awaria) → przy następnym starcie awaryjny', () => {
    const s = sprobujNormalnie({ nieudane: 2, wToku: false });
    expect(kamienMilowy(s)).toEqual(STAN_POCZATKOWY);
    expect(start(s).awaryjny).toBe(true);
  });
  test('uszkodzony zapis → stan początkowy', () => {
    for (const z of ['{"x":1}', 'nie-json', null, undefined, '{"nieudane":-1,"wToku":true}', '{"nieudane":1.5,"wToku":false}', '{"nieudane":1,"wToku":"tak"}']) {
      expect(odczytajStan(z)).toEqual(STAN_POCZATKOWY);
    }
    expect(odczytajStan(zapis({ nieudane: 1, wToku: true }))).toEqual({ nieudane: 1, wToku: true });
  });
});
