// Adapter portu LiveActivity (ADR-0008 (7), moduly.md „Porty domeny”): stan v2 jako JSON do modułu Swift; `urzadzenie` w atrybutach aktywności
// (pole linii dziennika z intencji). Live Activity wyłączone w ustawieniach systemu → `niedozwolone_przejscie`; wyjątek modułu → `zapis`.
// `jezyk`: bieżący język aplikacji przy każdym wywołaniu (P-139: teksty Live Activity w języku aplikacji); bez źródła → null (Swift: angielski, P-115).
import type { Wynik } from '../domena/bledy';
import type { LiveActivity, StanEkranuBlokady } from '../domena/porty';
import { natywny as modul, type OczkoDziennikPlusNatywny } from '../../modules/oczko-dziennik-plus';

type Natywny = Pick<OczkoDziennikPlusNatywny, 'liveStart' | 'liveAktualizuj' | 'liveZakoncz' | 'liveDostepne'>;

export function liveActivity(urzadzenie: string, natywny: Natywny = modul(), jezyk?: () => string): LiveActivity {
  const j = () => (jezyk ? jezyk() : null);
  return {
    async start(s: StanEkranuBlokady): Promise<Wynik<void>> {
      if (!natywny.liveDostepne()) return { ok: false, powod: 'niedozwolone_przejscie' };
      try {
        await natywny.liveStart(JSON.stringify(s), urzadzenie, j());
        return { ok: true, wartosc: undefined };
      } catch {
        return { ok: false, powod: 'zapis' };
      }
    },
    // Aktualizacja i koniec: błąd modułu nie przerywa zapisu w aplikacji (stan Live Activity to widok, dane są w bazie i dzienniku).
    aktualizuj: (s) => natywny.liveAktualizuj(JSON.stringify(s), j()).catch(() => undefined),
    zakoncz: () => natywny.liveZakoncz().catch(() => undefined),
  };
}
