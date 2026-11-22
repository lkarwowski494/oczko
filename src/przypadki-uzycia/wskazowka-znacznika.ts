// M1-131 (DEC-33 b, P-447 wariant a, jak Trening): wskazówka pierwszego otwarcia wzoru raz na dane — flaga `wskazowka_znacznika_widziana` w `ustawienie`
// zapisuje się w tej samej transakcji, w której zapada decyzja o pokazaniu (dane.md „Klucze tabeli ustawienie”; jedzie z kopią).
import type { Wynik } from '../domena/bledy';
import { odczytajUstawienie, zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import { operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

/** `true`: pokazać wskazówkę teraz (flaga właśnie zapisana); `false`: już była. Zapis innego typu niż `true` = nie było. */
export function pierwszaWskazowkaZnacznika(z: Pick<Zaleznosci, 'baza' | 'zegar'>): Promise<Wynik<boolean>> {
  return operacjaZapisu(z, 'wskazowkaZnacznika', async (tx, teraz) => {
    if ((await odczytajUstawienie(tx, 'wskazowka_znacznika_widziana')) === true) return { ok: true, wartosc: false };
    await zapiszUstawienie(tx, 'wskazowka_znacznika_widziana', true, teraz);
    return { ok: true, wartosc: true };
  });
}
