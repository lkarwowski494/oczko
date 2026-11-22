// Okno „Uczciwe zasady” (P-089 (3a), KP-16, P-103 (5a)): decyzja z domeny `oknoUczciweZasady` na wszystkich dniach limitu i fladze
// `okno_uczciwe_zasady_widziane`; każde zamknięcie zapisuje flagę w kolejce (jak Trening `markFairRulesSeen`).
import type { Wynik } from '../domena/bledy';
import { oknoUczciweZasady, type PoziomDostepu } from '../domena/limit';
import { odczytajUstawienie, zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import { liczba, tekst, wiersze } from '../dane/repozytoria/wiersze';
import { OK, operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export function pokazacOknoUczciweZasady(z: Zaleznosci, w: { poziom: PoziomDostepu; ekran: string }): Promise<Wynik<boolean>> {
  return operacjaZapisu(z, 'oknoUczciweZasady', async (tx, _teraz, chwila) => {
    const dni = (await wiersze(tx.all('SELECT dzien, pro FROM dzien_limitu ORDER BY dzien'), 'oknoUczciweZasady')).map((r) => ({ data: tekst(r, 'dzien'), pro: liczba(r, 'pro') === 1 }));
    const widziane = (await odczytajUstawienie(tx, 'okno_uczciwe_zasady_widziane')) === true;
    return { ok: true, wartosc: oknoUczciweZasady({ dni, dzis: chwila.dzien, widziane, poziom: w.poziom, ekran: w.ekran }) };
  });
}
export function oznaczOknoWidziane(z: Zaleznosci): Promise<Wynik<void>> {
  return operacjaZapisu(z, 'oknoUczciweZasadyWidziane', async (tx, teraz) => {
    await zapiszUstawienie(tx, 'okno_uczciwe_zasady_widziane', true, teraz);
    return OK;
  });
}
