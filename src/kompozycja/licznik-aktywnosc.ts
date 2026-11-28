// Live Activity i etykiety konfliktu wydzielone z licznik.ts (limit 20 KB na plik, docs/architektura/narzedzia/granice.mjs): ZM-27 (b) menu „Zdejmij z ekranu blokady”
// (ADR-0037 (5), stan natywny portu) i etykieta źródła gałęzi w arkuszu „Dwie wersje” (PU-099, P-1111).
import { decyzjaAktywnosci } from '../domena/aktywnosc';
import { LIVE_KONIEC_PO_MS } from '../konfiguracja';
import type { Zaleznosci } from '../przypadki-uzycia/zaleznosci';
import type { ZaleznosciEkranuBlokady } from '../przypadki-uzycia/ekran-blokady';

/** ZM-27 (b): Live Activity Oczka — stan natywny (nie flaga) i zdjęcie z menu; następne liczenie uruchamia ją od nowa; stoper projektu `trwa` dla dopisku pozycji. */
export function ekranBlokady(z: Pick<ZaleznosciEkranuBlokady, 'liveActivity' | 'zegar'> & Pick<Zaleznosci, 'baza'>): { aktywna(): boolean; zdejmij(): Promise<void>; stoperTrwa(projektId: string): Promise<boolean> } {
  return {
    aktywna: () => z.liveActivity.aktywna(),
    async zdejmij() { // AK-07/AK-08: koniec tylko, gdy aktywność istnieje (stan natywny)
      const d = decyzjaAktywnosci({ zdarzenie: 'menu_zakoncz', aktywna: z.liveActivity.aktywna(), systemWlaczone: true, ostatniaZmianaMs: null, teraz: z.zegar.teraz().ms, koniecPoMs: LIVE_KONIEC_PO_MS });
      if (d === 'zakoncz') await z.liveActivity.zakoncz();
    },
    async stoperTrwa(projektId) {
      try { return (await z.baza.all("SELECT 1 AS t FROM sesja WHERE projekt_id = ? AND stan = 'trwa' LIMIT 1", [projektId])).length > 0; } catch { return false; }
    },
  };
}

/**
 * Etykieta źródła gałęzi w arkuszu PU-099 (P-1111): linia z ekranu blokady / zegarka niesie swoje źródło; gałąź aplikacji z TEGO SAMEGO urządzenia, gdy druga gałąź jest
 * z ekranu blokady albo zegarka, to „z aplikacji”; gałąź z innego urządzenia zostaje przy nazwie urządzenia (null).
 */
export function etykietaZrodlaGalezi(x: { zrodlo: string; urzadzenie: string }, wszyscy: readonly { zrodlo: string; urzadzenie: string }[]): 'dane.konflikt_z_ekranu_blokady' | 'dane.konflikt_z_zegarka' | 'dane.konflikt_z_aplikacji' | null {
  if (x.zrodlo === 'ekran_blokady') return 'dane.konflikt_z_ekranu_blokady';
  if (x.zrodlo === 'zegarek') return 'dane.konflikt_z_zegarka';
  const zLinia = wszyscy.some((y) => y !== x && y.urzadzenie === x.urzadzenie && (y.zrodlo === 'ekran_blokady' || y.zrodlo === 'zegarek'));
  return x.zrodlo === 'aplikacja' && zLinia ? 'dane.konflikt_z_aplikacji' : null;
}
