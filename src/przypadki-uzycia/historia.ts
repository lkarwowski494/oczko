// Model widoku „History” (F-59; BR-DNI-001–003; P-191 P6a, P-195 Q3b): jeden odczyt w kolejce — dni z robótką miesiąca, projekty wybranego
// dnia, tydzień wybranego dnia (PIERWSZY_DZIEN_TYGODNIA = poniedziałek, RD-20) z poprzednim i miesiąc z kalendarza. Teksty liczy kompozycja.
import type { Wynik } from '../domena/bledy';
import { dniZRobotka, podsumowanieMiesiaca, podsumowanieTygodnia, szczegolyDnia, ukonczoneDnia, type Podsumowanie, type ProjektDnia, type UkonczonyDnia } from '../dane/repozytoria/kalendarz';
import { liczba, wiersze } from '../dane/repozytoria/wiersze';
import { wKolejce } from './kolejka';
import type { Zaleznosci } from './zaleznosci';

export type WidokHistorii = { dniRobotki: string[]; dzien: ProjektDnia[]; ukonczoneDnia: UkonczonyDnia[]; tydzien: Podsumowanie; miesiac: { rzedy: number; czasMs: number | null; ukonczone: number; dni: number }; pierwsze: boolean };

export function widokHistorii(z: Pick<Zaleznosci, 'baza'>, w: { miesiac: string; dzien: string }): Promise<Wynik<WidokHistorii>> {
  return wKolejce(z.baza, async () => {
    try {
      const [p] = await wiersze(z.baza.all("SELECT (SELECT count(*) FROM zdarzenie WHERE rodzaj IN ('plus', 'minus')) + (SELECT count(*) FROM sesja) AS n"), 'widokHistorii');
      return {
        ok: true,
        wartosc: {
          dniRobotki: await dniZRobotka(z.baza, w.miesiac),
          dzien: await szczegolyDnia(z.baza, w.dzien),
          ukonczoneDnia: await ukonczoneDnia(z.baza, w.dzien), // F-51, F-59: ukończenia w widoku dnia (07-jakosc-018)
          tydzien: await podsumowanieTygodnia(z.baza, { dzis: w.dzien, pierwszyDzienTygodnia: 1 }),
          miesiac: await podsumowanieMiesiaca(z.baza, w.miesiac),
          pierwsze: !p || liczba(p, 'n') === 0, // BR-DNI-001 S5: pierwsze użycie bez ponagleń
        },
      };
    } catch {
      return { ok: false, powod: 'zapis' };
    }
  });
}
