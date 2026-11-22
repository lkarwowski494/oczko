// Adapter portu Zegarek (ADR-0009): stan do zegarka przez moduł Swift (updateApplicationContext `{ stan, potwierdzone }`); zdarzenia z zegarka
// zapisuje moduł do dziennika +1 (jedyny pisarz), a `odbieraj` dostaje je tylko jako sygnał do scalenia dziennika (źródłem prawdy jest dziennik).
// Potwierdzenia (ADR-0009, 2026-10-26 pkt 3): ostatnie ZEGAREK_POTWIERDZENIA_MAKS id w pamięci procesu, wysyłane razem z każdym stanem.
import type { StanZegarka, Zegarek, ZdarzenieWejsciowe } from '../domena/porty';
import { ZEGAREK_POTWIERDZENIA_MAKS } from '../konfiguracja';
import { parsujDziennik } from '../dane/dziennik';
import { natywny as modul, type OczkoDziennikPlusNatywny } from '../../modules/oczko-dziennik-plus';

type Natywny = Pick<OczkoDziennikPlusNatywny, 'zegarekWyslij' | 'addListener'>;

/** `jezyk`: bieżący język aplikacji do klucza `jezyk` kontekstu (P-139); bez źródła → null (zegarek: angielski, P-115). */
export function zegarek(natywny: Natywny = modul(), jezyk?: () => string): Zegarek {
  let potwierdzone: string[] = [];
  return {
    // Błąd wysyłki nie przerywa zapisu w aplikacji (zegarek dostanie kolejny stan); brak zegarka obsługuje moduł.
    wyslijStan: (s: StanZegarka) => natywny.zegarekWyslij(JSON.stringify(s), [...potwierdzone], jezyk ? jezyk() : null).catch(() => undefined),
    potwierdz(ids: readonly string[]) {
      // Bez powtórzeń; ponowne id przechodzi na koniec, najstarsze wypadają (utrata listy przy restarcie naprawia ponowienie zegarka, M-02).
      const nowe = new Set(ids);
      potwierdzone = [...potwierdzone.filter((id) => !nowe.has(id)), ...nowe].slice(-ZEGAREK_POTWIERDZENIA_MAKS);
    },
    odbieraj(fn: (z: ZdarzenieWejsciowe[]) => void) {
      const sub = natywny.addListener('zegarekZdarzenia', (e) => fn(parsujDziennik(e.linie.map((l) => `${l}\n`).join('')).zdarzenia));
      return () => sub.remove();
    },
  };
}
