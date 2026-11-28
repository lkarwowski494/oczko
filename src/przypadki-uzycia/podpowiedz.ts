// ZM-25 (U7 forma A, P-1103): „Podpowiedz, gdy zapomnę +1” — próg w minutach (5/10/15/30) albo wyłączona. Preferencja urządzenia w tabeli `ustawienie`
// (klucz `podpowiedz_min`, tylko lokalnie: poza `tylkoKlucze` iCloud), nie kolumna licznika: nawyk osoby, nie cecha robótki, więc bez migracji i bez rekordów sierot po usunięciu licznika.
import type { Wynik } from '../domena/bledy';
import { odczytajUstawienie, zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import { PODPOWIEDZ_PROGI_MIN } from '../konfiguracja';
import { blad, operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

/** Próg podpowiedzi w minutach; brak klucza, `null` albo zła wartość (spoza listy progów) = wyłączona (brak zostaje brakiem). */
export function podpowiedzPlusMin(z: Zaleznosci): Promise<number | null> {
  return operacjaZapisu(z, 'podpowiedzPlusMin', async (tx) => {
    const v = await odczytajUstawienie(tx, 'podpowiedz_min');
    return { ok: true, wartosc: typeof v === 'number' && PODPOWIEDZ_PROGI_MIN.includes(v) ? v : null };
  }).then((r) => (r.ok ? r.wartosc : null), () => null);
}
export function ustawPodpowiedzPlus(z: Zaleznosci, w: { minuty: number | null }): Promise<Wynik<void>> {
  if (w.minuty !== null && !PODPOWIEDZ_PROGI_MIN.includes(w.minuty)) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'ustawPodpowiedzPlus', async (tx, teraz) => {
    await zapiszUstawienie(tx, 'podpowiedz_min', w.minuty, teraz);
    return { ok: true, wartosc: undefined };
  });
}
