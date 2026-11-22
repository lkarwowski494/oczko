// Preferencja języka aplikacji (F-36, BR-ZAK-004, ADR-0017, P-190): adapter portu MagazynPreferencji i18n na tabelę `ustawienie`, klucz `jezyk`
// (dane.md „Klucze tabeli ustawienie”: stan urządzenia). Odczyt w kolejce; zapis przez operacjaZapisu — nieudany zapis rzuca, więc i18n
// nie zmienia języka (ustawJezyk zapisuje przed zmianą), a ekran zostaje przy poprzednim wyborze.
import type { MagazynPreferencji } from '../i18n/i18n';
import { odczytajUstawienie, zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import { wKolejce } from './kolejka';
import { operacjaZapisu, OK } from './zapis';
import type { Zaleznosci } from './zaleznosci';

const KLUCZ = 'jezyk';

export function magazynJezyka(z: Pick<Zaleznosci, 'baza' | 'zegar'>): MagazynPreferencji {
  return {
    async odczytaj(klucz) {
      if (klucz !== KLUCZ) return null;
      const v = await wKolejce(z.baza, () => odczytajUstawienie(z.baza, KLUCZ));
      return typeof v === 'string' ? v : null; // nie napis = brak; nieznany tag odrzuca wybierzJezyk (→ za systemem)
    },
    async zapisz(klucz, wartosc) {
      if (klucz !== KLUCZ) throw new Error(`Nieznany klucz preferencji: ${klucz}`);
      const w = await operacjaZapisu(z, 'jezyk', async (tx, teraz) => { await zapiszUstawienie(tx, KLUCZ, wartosc, teraz); return OK; });
      if (!w.ok) throw new Error(`Zapis języka: ${w.powod}`);
    },
  };
}
