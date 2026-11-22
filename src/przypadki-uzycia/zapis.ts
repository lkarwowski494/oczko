// Wspólna obsługa operacji zapisu przypadków użycia (ADR-0002, polityka błędów e3 §2, P-118 Q1a): kolejka, jedna transakcja,
// wyjątek SQLite → ROLLBACK, `powod: 'zapis'` (albo `bledne_dane` przy BladDanych) i wpis w `blad`; błąd nigdy cicho.
import type { Powod, Wynik } from '../domena/bledy';
import type { PortBazy } from '../domena/porty';
import { kodBledu } from '../dane/baza/bledy-sqlite';
import { zapiszBlad } from '../dane/repozytoria/bledy';
import { wKolejce } from './kolejka';
import type { Zaleznosci } from './zaleznosci';

/** Chwila operacji z portu Zegar (ms, strefa, dzień lokalny RD-16) — jedna na operację. */
export type Chwila = ReturnType<Zaleznosci['zegar']['teraz']>;
export const blad = (powod: Powod): { ok: false; powod: Powod } => ({ ok: false, powod });
export const OK: Wynik<void> = { ok: true, wartosc: undefined };
export const czyBladDanych = (e: unknown): boolean => typeof e === 'object' && e !== null && 'kod' in e && e.kod === 'BLAD_DANYCH';

/** Transakcja z obsługą błędu, bez kolejki: dla pozycji kolejki, które składają kilka kroków (start, eksport, import). */
export async function wTransakcji<T>(z: Pick<Zaleznosci, 'baza' | 'zegar'>, operacja: string, fn: (tx: PortBazy, terazMs: number, chwila: Chwila) => Promise<Wynik<T>>): Promise<Wynik<T>> {
  const chwila = z.zegar.teraz();
  const teraz = chwila.ms;
  try {
    return await z.baza.transakcja((tx) => fn(tx, teraz, chwila));
  } catch (e) {
    await zapiszBlad(z.baza, { czasMs: teraz, kod: `zapis_${operacja}`, szczegoly: { sqlite: kodBledu(e) } });
    return blad(czyBladDanych(e) ? 'bledne_dane' : 'zapis');
  }
}
/** Jedna operacja zapisu jako pozycja kolejki przypadków użycia. */
export function operacjaZapisu<T>(z: Pick<Zaleznosci, 'baza' | 'zegar'>, operacja: string, fn: (tx: PortBazy, terazMs: number, chwila: Chwila) => Promise<Wynik<T>>): Promise<Wynik<T>> {
  return wKolejce(z.baza, () => wTransakcji(z, operacja, fn));
}
