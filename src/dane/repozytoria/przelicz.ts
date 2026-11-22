// Pamięć podręczna licznika po dopisaniu zdarzeń z innego źródła (dziennik +1, zegarek, import „scal”; ADR-0005, ADR-0008, moduly.md „Scalanie”):
// `scal` nad wszystkimi zdarzeniami licznika → zgodny: wartość i głowa; konflikt: `konflikt = 1`, wartość bez zmian (NFR-DAN-003: pokaż, nie zgaduj);
// blad: wpis w `blad`, licznik pokazuje ostatnią zapisaną wartość, bez zapisu wyniku.
import type { PortBazy } from '../../domena/porty';
import { scal } from '../../domena/scal';
import { zapiszBladW } from './bledy';
import { stanLicznika, ustawStan, zdarzeniaDoScalenia } from './liczniki';

export async function przeliczLicznik(tx: PortBazy, licznikId: string, terazMs: number): Promise<'zgodny' | 'konflikt' | 'czeka' | 'blad'> {
  const w = scal(await zdarzeniaDoScalenia(tx, licznikId));
  if (w.stan === 'zgodny') {
    await ustawStan(tx, licznikId, { wartosc: w.wartosc, glowa: w.glowy[0] ?? null, konflikt: false });
  } else if (w.stan === 'konflikt') {
    const s = await stanLicznika(tx, licznikId);
    if (s) await ustawStan(tx, licznikId, { wartosc: s.wartosc, glowa: s.glowa, konflikt: true });
  } else if (w.stan === 'blad') {
    await zapiszBladW(tx, { czasMs: terazMs, kod: `scal_${w.powod}`, szczegoly: { licznik: licznikId, zdarzenie: w.id } });
  }
  return w.stan; // „czeka”: przypadek użycia nie woła scal z niepełną historią (poczekalnia), więc tylko po błędzie danych
}
