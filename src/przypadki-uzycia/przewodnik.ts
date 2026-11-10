// Stan przeczytania przewodnika (P-688, P-690; jak Trening `markGuideSeen`, `lib/guide.ts:78`): lista id w `ustawienie.przewodnik_przeczytane`
// (dane.md „Klucze tabeli ustawienie”: stan urządzenia, bez iCloud, przy imporcie pomijany; „Usuń wszystkie dane” czyści). Odczyt w kolejce,
// zapis przez operacjaZapisu (odczyt i zapis w jednej transakcji: dwa szybkie rozwinięcia nie gubią id). Nieznane id pomija domena.
import type { Wynik } from '../domena/bledy';
import { dodajPrzeczytana, przeczytaneZZapisu } from '../domena/przewodnik';
import { odczytajUstawienie, zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import { wKolejce } from './kolejka';
import { operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

const KLUCZ = 'przewodnik_przeczytane';

export async function przeczytanePrzewodnika(z: Pick<Zaleznosci, 'baza' | 'zegar'>): Promise<Wynik<string[]>> {
  return { ok: true, wartosc: przeczytaneZZapisu(await wKolejce(z.baza, () => odczytajUstawienie(z.baza, KLUCZ))) };
}

/** Pierwsze rozwinięcie funkcji = przeczytana; zwraca listę po zapisie. Bez zmiany (znane albo nieznane id) — bez zapisu. */
export function oznaczPrzeczytana(z: Pick<Zaleznosci, 'baza' | 'zegar'>, id: string): Promise<Wynik<string[]>> {
  return operacjaZapisu(z, 'przewodnikPrzeczytane', async (tx, teraz) => {
    const byly = przeczytaneZZapisu(await odczytajUstawienie(tx, KLUCZ));
    const sa = dodajPrzeczytana(byly, id);
    if (sa.length !== byly.length) await zapiszUstawienie(tx, KLUCZ, sa, teraz);
    return { ok: true, wartosc: sa };
  });
}
