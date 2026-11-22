// Prośba o ocenę po zamknięciu karty ukończenia (moduly.md „Prośba o ocenę”, BR-DAN-012, P-150, P-156): bramka czyProsicOOcene,
// wywołanie systemowe poza transakcją, zapis `ostatnia_prosba_o_ocene` dopiero po udanym wywołaniu. Wyjątek modułu albo niedostępność → bez zapisu.
import { czyProsicOOcene } from '../domena/ocena';
import { zapiszBlad } from '../dane/repozytoria/bledy';
import { odczytajUstawienie, zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import { wKolejce } from './kolejka';
import { operacjaZapisu, OK } from './zapis';
import type { Zaleznosci } from './zaleznosci';

/** Port prośby o ocenę (kształt 08, moduly.md: „kształt portu ustala 08”): dostępność, wersja aplikacji i wywołanie systemowe. */
export interface PortOceny {
  dostepna(): Promise<boolean>;   // StoreReview.isAvailableAsync()
  wersja(): string;               // CFBundleShortVersionString
  popros(): Promise<void>;        // StoreReview.requestReview(); wyjątek = prośby nie było
}

export async function prosbaPoUkonczeniu(z: Zaleznosci, o: PortOceny): Promise<'poproszono' | 'bez-prosby'> {
  const ostatnia = await wKolejce(z.baza, () => odczytajUstawienie(z.baza, 'ostatnia_prosba_o_ocene').catch(() => undefined));
  let dostepna = false;
  try { dostepna = await o.dostepna(); } catch { dostepna = false; }
  const dzis = z.zegar.teraz().dzien;
  const wersja = o.wersja();
  if (!czyProsicOOcene({ zdarzenie: 'zamknieto_karte_ukonczenia', wersja, ostatniaProsba: ostatnia, dzis, dostepna })) return 'bez-prosby';
  try { await o.popros(); } catch { return 'bez-prosby'; }
  const zapis = await operacjaZapisu(z, 'prosbaOOcene', async (tx, teraz) => { await zapiszUstawienie(tx, 'ostatnia_prosba_o_ocene', { wersja, dzien: dzis }, teraz); return OK; });
  if (!zapis.ok) await zapiszBlad(z.baza, { czasMs: z.zegar.teraz().ms, kod: 'zapis_prosby_o_ocene', szczegoly: { powod: zapis.powod } }).catch(() => undefined);
  return 'poproszono';
}
