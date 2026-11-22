// M1-audytor-generalny-012 (źródło 12-niezawodnosc-002, NIE-04; DEC-17 b, P-393): zawieszenie startu przed kamieniem + wyjście do tła.
// Wybór (b): znane drogi do zawieszenia zamknięte bez zmiany strażnika — wyjątek startu → ekran awaryjny (M1-007,
// tests/ekrany/blad-odczytu-trasy.test.tsx), sklep bez odpowiedzi nie trzyma pierwszego ekranu (M1-022, tests/ekrany/start-limit-sklepu.test.tsx).
// Tu: (1) ekran awaryjny korzenia ma tekst także, gdy język systemu nie daje się odczytać (inaczej pusta plansza zamiast trybu awaryjnego);
// (2) nazwany wyjątek ADR-0019 („Uzupełnienie 2026-11-02”): obietnica, która nigdy się nie rozstrzyga, + tło nie daje trybu awaryjnego.
import { odczytajStan, poczatekStartu, wyjscieDoTla } from '../../src/niezawodnosc/start';

const mockLokalizacja = { rzuca: false };
jest.mock('../../src/platforma/lokalizacja', () => ({
  ...jest.requireActual<object>('../../src/platforma/lokalizacja'),
  tagiSystemowe: () => { if (mockLokalizacja.rzuca) throw new Error('getLocales: moduł natywny niedostępny'); return ['en-US']; },
}));
/* eslint-disable @typescript-eslint/no-require-imports */
const { tAwaryjny } = require('../../src/kompozycja/jezyk-awaryjny') as typeof import('../../src/kompozycja/jezyk-awaryjny');
/* eslint-enable @typescript-eslint/no-require-imports */

afterEach(() => { mockLokalizacja.rzuca = false; });

describe('M1-012: ekran awaryjny korzenia nie zostaje pustą planszą', () => {
  test('M1-012: odczyt języka systemu rzuca → tAwaryjny daje teksty języka źródłowego (en), nie odrzuconą obietnicę', async () => {
    mockLokalizacja.rzuca = true;
    const t = await tAwaryjny();
    expect(t('awaryjny.sprobuj')).not.toBe('awaryjny.sprobuj');
    expect(t('awaryjny.sprobuj').length).toBeGreaterThan(0);
  });
  test('M1-012: [kontrola] język systemu czytelny → te same teksty co dotąd', async () => {
    const t = await tAwaryjny();
    expect(t('awaryjny.sprobuj')).not.toBe('awaryjny.sprobuj');
  });
});

type Krok = 'start' | 'tlo';
function przebieg(kroki: readonly Krok[]): ('normalny' | 'awaryjny')[] {
  let plik: string | null = null;
  const d: ('normalny' | 'awaryjny')[] = [];
  for (const k of kroki) {
    const s = odczytajStan(plik);
    if (k === 'start') { const p = poczatekStartu(s); d.push(p.awaryjny ? 'awaryjny' : 'normalny'); plik = JSON.stringify(p.stan); }
    else plik = JSON.stringify(wyjscieDoTla(s));
  }
  return d;
}

describe('M1-012: nazwany wyjątek ADR-0019 (DEC-17 b) — zawieszenie + tło', () => {
  test('M1-012: [WYJĄTEK NAZWANY ADR-0019 2026-11-02] zawieszenie przed kamieniem + tło × 3 → kolejne starty normalne (strażnik bez zmian; przegląd z opcją (a) przy P-273)', () => {
    expect(przebieg(['start', 'tlo', 'start', 'tlo', 'start', 'tlo', 'start'])).toEqual(['normalny', 'normalny', 'normalny', 'normalny']);
  });
  test('M1-012: [kontrola] zawieszenie bez wyjścia do tła (zabicie procesu) × 2 → trzeci start awaryjny', () => {
    expect(przebieg(['start', 'start', 'start'])).toEqual(['normalny', 'normalny', 'awaryjny']);
  });
});
