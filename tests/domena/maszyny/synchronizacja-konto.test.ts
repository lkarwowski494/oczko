// Test roli 08 (P-114 Q2a): przejścia synchronizacji dodane w fixie 05 (Z07-14, P-110 Q9a) bez testu 07 i zachowanie poza tabelą.
// Wyrocznia: docs/architektura/moduly.md „Synchronizacja iCloud (F-27, F-58)”: zmiana konta z aktywna / blad / brak_konta → konto_zmienione;
// konto_zmienione + polacz → aktywna; konto_zmienione + nie_synchronizuj → wylaczona; dowolny ≠ wylaczona + wylacz → wylaczona.
// Poza tabelą: stan bez zmian — wybór 08 przyjęty w P-118 (W5, fix-2 roli 05); wcześniej bez wyroczni (F07-03).
import { przejdzSynchronizacje } from '../../../src/domena/maszyny/synchronizacja';
import type { ZdarzenieSynchronizacji } from '../../../src/domena/maszyny/synchronizacja';
import type { StanSynchronizacji } from '../../../src/domena/porty';

describe('BR-DAN-002 P-110 Q9a zmiana konta Apple (moduly.md)', () => {
  test.each([
    ['aktywna', 'zmiana_konta', 'konto_zmienione'],
    ['blad', 'zmiana_konta', 'konto_zmienione'],
    ['brak_konta', 'zmiana_konta', 'konto_zmienione'],
    ['konto_zmienione', 'polacz', 'aktywna'],
    ['konto_zmienione', 'nie_synchronizuj', 'wylaczona'],
    ['konto_zmienione', 'wylacz', 'wylaczona'],
  ] as [StanSynchronizacji, ZdarzenieSynchronizacji, StanSynchronizacji][])('BR-DAN-002 %s + %s → %s', (s, z, oczek) => {
    expect(przejdzSynchronizacje(s, z)).toBe(oczek);
  });
  test.each([
    ['wylaczona', 'zmiana_konta'],
    ['wylaczona', 'wylacz'],
    ['aktywna', 'polacz'],
    ['konto_zmienione', 'ustapienie'],
  ] as [StanSynchronizacji, ZdarzenieSynchronizacji][])('BR-DAN-002 poza tabelą: %s + %s → stan bez zmian', (s, z) => {
    expect(przejdzSynchronizacje(s, z)).toBe(s);
  });
});
