// Maszyna synchronizacji iCloud (moduly.md, „Synchronizacja iCloud (F-27, F-58)”); stan w module natywnym, nie w bazie.
import type { StanSynchronizacji } from '../porty';

export type ZdarzenieSynchronizacji = 'wlacz_konto_jest' | 'wlacz_brak_konta' | 'blad' | 'wylogowanie' | 'ustapienie' | 'wylacz'
  | 'zmiana_konta' | 'polacz' | 'nie_synchronizuj'; // fix 05 2026-10-25 (Z07-14, P-110 Q9a): przejścia w moduly.md
// Przejście spoza tabeli moduly.md: stan bez zmian (sygnatura nie ma wyniku „niedozwolone”; wybór 08, zgłoszenie do 05).
export function przejdzSynchronizacje(s: StanSynchronizacji, z: ZdarzenieSynchronizacji): StanSynchronizacji {
  if (z === 'wylacz') return s === 'wylaczona' ? s : 'wylaczona'; // dane lokalne zostają
  switch (s) {
    case 'wylaczona':
      return z === 'wlacz_konto_jest' ? 'aktywna' : z === 'wlacz_brak_konta' ? 'brak_konta' : s;
    case 'aktywna':
      return z === 'blad' ? 'blad' : z === 'wylogowanie' ? 'brak_konta' : z === 'zmiana_konta' ? 'konto_zmienione' : s;
    case 'blad':
    case 'brak_konta':
      return z === 'ustapienie' ? 'aktywna' : z === 'zmiana_konta' ? 'konto_zmienione' : s;
    case 'konto_zmienione':
      return z === 'polacz' ? 'aktywna' : z === 'nie_synchronizuj' ? 'wylaczona' : s;
  }
}
