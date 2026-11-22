// P-118 W2 (fix-2 05), P-110 Q5a, Z07-15: sprzątanie kosza dopiero przy dwóch startach potwierdzających datę — test roli 08 z wyroczni
// docs/architektura/moduly.md („Funkcja sprzątania kosza”, 6 przypadków), P-120 Q4a; do przeglądu 07.
import { doSprzatniecia, type Projekt } from '../../../src/domena/maszyny/projekt';
import { KOSZ_DNI } from '../../../src/konfiguracja';
import { DOBA } from '../../narzedzia/akceptacja';

const U = 1_800_000_000_000; // usunietoMs
const D = KOSZ_DNI * DOBA;
const usuniety: Projekt = { stan: 'w_toku', ukonczonoMs: null, usunietoMs: U };

describe('P-118 W2 doSprzatniecia(p, terazMs, ostatniStartMs, koszDni): wyrocznia moduly.md', () => {
  test.each([
    ['projekt nieusunięty', { ...usuniety, usunietoMs: null }, U + 2 * D, U + D, false],
    ['pierwszy start po aktualizacji / brak klucza ostatni_start_ms', usuniety, U + 2 * D, null, false],
    ['dwa starty po terminie (granica: równość daje true)', usuniety, U + D + 1, U + D, true],
    ['jednorazowy skok zegara w przód', usuniety, U + 60 * DOBA, U + DOBA, false],
    ['zegar cofnięty między startami (ostatni start > teraz)', usuniety, U + D, U + 2 * D, false],
    ['zegar cofnięty przed usunięcie', usuniety, U - 1, U + D, false],
  ] as const)('P-118 W2 %s', (_n, p, teraz, ostatni, oczek) => {
    expect(doSprzatniecia(p, teraz, ostatni, KOSZ_DNI)).toBe(oczek);
  });
});
