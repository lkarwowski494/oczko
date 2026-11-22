// Maszyny stanów importu archiwum (BR-DAN-006, ADR-0004) i synchronizacji iCloud (BR-DAN-002, F-27, F-58) — poziom domena-Node.
// Wyrocznia: docs/architektura/moduly.md („Import archiwum (ADR-0004)”, „Synchronizacja iCloud (F-27, F-58)”).
// Import: przejście spoza opisu → 'niedozwolone' (sygnatura przejdzImport). `blad` przed `wczytywanie` nie jest opisany
// (np. VACUUM INTO bez miejsca) — [DO USTALENIA] 05, poza testem. Synchronizacja: sygnatura zwraca sam stan, bez wyniku
// „niedozwolone” — przejścia spoza tabeli nie mają oczekiwania (brakująca sygnatura, raport E3).
import { przejdzImport, bazaZmieniona } from '../../../src/domena/maszyny/import';
import type { StanImportu, ZdarzenieImportu } from '../../../src/domena/maszyny/import';
import { przejdzSynchronizacje } from '../../../src/domena/maszyny/synchronizacja';
import type { ZdarzenieSynchronizacji } from '../../../src/domena/maszyny/synchronizacja';
import type { StanSynchronizacji } from '../../../src/domena/porty';

const STANY_IMPORTU: StanImportu[] = ['sprawdzanie', 'odrzucony', 'gotowy', 'kopia_przed', 'wczytywanie', 'gotowe', 'wycofany'];
const ZDARZENIA_IMPORTU: ZdarzenieImportu[] = ['sprawdzono_ok', 'sprawdzono_zle', 'wybrano', 'kopia_gotowa', 'wczytano', 'blad'];
const PRZEJSCIA_IMPORTU: [StanImportu, ZdarzenieImportu, StanImportu][] = [
  ['sprawdzanie', 'sprawdzono_ok', 'gotowy'],
  ['sprawdzanie', 'sprawdzono_zle', 'odrzucony'],
  ['gotowy', 'wybrano', 'kopia_przed'],
  ['kopia_przed', 'kopia_gotowa', 'wczytywanie'],
  ['wczytywanie', 'wczytano', 'gotowe'],
  ['wczytywanie', 'blad', 'wycofany'],
];
const NIEOPISANE_IMPORTU = new Set(['sprawdzanie/blad', 'gotowy/blad', 'kopia_przed/blad']); // [DO USTALENIA] 05

describe('BR-DAN-006 przejdzImport: przejścia z moduly.md (ADR-0004)', () => {
  test.each(PRZEJSCIA_IMPORTU)('BR-DAN-006 %s + %s → %s', (s, z, oczek) => {
    expect(przejdzImport(s, z)).toBe(oczek);
  });
  const niedozwolone = STANY_IMPORTU.flatMap((s) => ZDARZENIA_IMPORTU.map((z) => [s, z] as const)).filter(
    ([s, z]) => !PRZEJSCIA_IMPORTU.some(([a, b]) => a === s && b === z) && !NIEOPISANE_IMPORTU.has(`${s}/${z}`),
  );
  test.each(niedozwolone)('BR-DAN-006 %s + %s → niedozwolone', (s, z) => {
    expect(przejdzImport(s, z)).toBe('niedozwolone');
  });
  test(`BR-DAN-006 liczność: ${PRZEJSCIA_IMPORTU.length} dozwolonych + ${niedozwolone.length} niedozwolonych + ${NIEOPISANE_IMPORTU.size} nieopisanych = ${STANY_IMPORTU.length * ZDARZENIA_IMPORTU.length} [ZIELONY-OK: kompletność tabeli testów, nie zachowanie]`, () => {
    expect(PRZEJSCIA_IMPORTU.length + niedozwolone.length + NIEOPISANE_IMPORTU.size).toBe(STANY_IMPORTU.length * ZDARZENIA_IMPORTU.length);
  });
  test.each([
    ['sprawdzanie', false],
    ['odrzucony', false],
    ['gotowy', false],
    ['kopia_przed', false],
    ['wczytywanie', true],
    ['gotowe', true],
  ] as const)('BR-DAN-006 bazaZmieniona(%s) = %s (przed wczytywanie zawsze false; wycofany: [DO USTALENIA])', (s, oczek) => {
    expect(bazaZmieniona(s)).toBe(oczek);
  });
});

describe('BR-DAN-002 przejdzSynchronizacje: przejścia z moduly.md', () => {
  const przejscia: [StanSynchronizacji, ZdarzenieSynchronizacji, StanSynchronizacji][] = [
    ['wylaczona', 'wlacz_konto_jest', 'aktywna'],
    ['wylaczona', 'wlacz_brak_konta', 'brak_konta'],
    ['aktywna', 'blad', 'blad'],
    ['aktywna', 'wylogowanie', 'brak_konta'],
    ['blad', 'ustapienie', 'aktywna'],
    ['brak_konta', 'ustapienie', 'aktywna'],
    ['aktywna', 'wylacz', 'wylaczona'],
    ['blad', 'wylacz', 'wylaczona'],
    ['brak_konta', 'wylacz', 'wylaczona'],
  ];
  test.each(przejscia)('BR-DAN-002 %s + %s → %s', (s, z, oczek) => {
    expect(przejdzSynchronizacje(s, z)).toBe(oczek);
  });
});
