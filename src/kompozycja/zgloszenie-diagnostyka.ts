// Wartości wierszy „Sync” i „Watch” w zgłoszeniu problemu (P-383 B, 033-T2): neutralne angielskie znaczniki techniczne, jak w trybie awaryjnym
// (`zgloszenie-awaryjne.ts`). Podgląd i wysyłany plik to ten sam tekst (BR-DAN-010 S1), więc nie zależy od języka interfejsu.
import type { StanSynchronizacji } from '../domena/porty';

const SYNCHRONIZACJA: Record<StanSynchronizacji, string> = { wylaczona: 'off', aktywna: 'on', blad: 'error', brak_konta: 'no_account', konto_zmienione: 'account_changed' };
/** Brak silnika synchronizacji = wyłączona. */
export const znacznikSynchronizacji = (stan: StanSynchronizacji | null): string => SYNCHRONIZACJA[stan ?? 'wylaczona'];
/** BR-DAN-011: czas ostatniej partii z zegarka (UTC, ISO bez ułamka) albo „none”, gdy zegarek nigdy nie przysłał partii. */
export const znacznikZegarka = (ostatniaPartiaMs: number | null): string =>
  ostatniaPartiaMs === null ? 'none' : `last contact ${new Date(ostatniaPartiaMs).toISOString().replace('.000Z', 'Z')}`;
