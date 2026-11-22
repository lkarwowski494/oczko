// Zależności przypadków użycia jako obiekt portów (sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22)). Tylko typy.
import type { CzasWTle, DziennikPlus, Identyfikatory, MagazynPlikow, PortBazy, Synchronizacja, Zegar } from '../domena/porty';
import type { Katalogi, Migruj, PortArchiwum } from '../domena/porty';
import type { RodzajUrzadzenia } from '../domena/stany';

export type Zaleznosci = {
  baza: PortBazy;
  zegar: Zegar;
  id: Identyfikatory;
  urzadzenie: string;             // zdarzenie.urzadzenie
  pro: () => boolean;             // bieżące uprawnienie (ADR-0010); wejście `pro` funkcji startDnia
  synchronizacja?: Synchronizacja;
  rodzajUrzadzenia?: RodzajUrzadzenia; // P-247 U6a: Platform.isPad → `ipad`, inaczej `iphone`; zapis w zdarzeniu (wybór wersji iCloud)
  straznikOknoS?: number;         // s; okno strażnika serii (RD-17); brak = STRAZNIK_OKNO_S. Ustawia tylko kompozycja z argumentu E2E `oczkoE2eOknoStraznika` (E2E-A4, P-358)
};
export type ZaleznosciPlikow = Zaleznosci & { magazyn: MagazynPlikow; katalogi: Katalogi };
export type ZaleznosciDziennika = Zaleznosci & { dziennik: DziennikPlus };
export type ZaleznosciStartu = ZaleznosciPlikow & { dziennik: DziennikPlus; migruj: Migruj };
export type ZaleznosciArchiwum = ZaleznosciPlikow & { dziennik: DziennikPlus; archiwum: PortArchiwum; czasWTle: CzasWTle };
