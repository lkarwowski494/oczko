// Wynik operacji domeny (docs/architektura/moduly.md, „bledy.ts”). Powody są kontraktem dla ekranów i testów.
export type Powod =
  | 'zablokowany'
  | 'limit'
  | 'zapis'
  | 'bledne_dane'
  | 'niedozwolone_przejscie'
  | 'brak_miejsca'
  | 'wersja_nowsza'
  | 'uszkodzony'
  | 'za_duze'
  | 'konflikt'
  | 'brak_sieci' // konwersja strony WWW bez połączenia (fix-7, moduly.md „Fundament partii 6 i 7”)
  | 'przekroczono_czas' // konwersja pliku Word nie skończyła się w limicie czasu; plik lokalny nie zależy od sieci (E2-A3, 08 poprawki E2)
  | 'odmowa' // strona odpowiada 401/403 (BR-WZR-007 S3)
  | 'pusty' // PDF bez tekstu i obrazu (BR-WZR-007 S3)
  | 'anulowano'; // skaner albo wybór pliku przerwany przez użytkowniczkę
export type Wynik<T> = { ok: true; wartosc: T } | { ok: false; powod: Powod };

/** Błąd danych wejściowych funkcji domeny rzucającej wyjątek (sygnatury 05/07 bez `Wynik`; wzorzec `BladDanych` z docs/monetyzacja/limit.mjs, Z07-07, R-178).
 * Wołający rozpoznaje go po `kod`, nie po dowolnym wyjątku. */
export class BladDanych extends Error {
  readonly kod = 'BLAD_DANYCH' as const;
  constructor(komunikat: string) {
    super(komunikat);
    this.name = 'BladDanych';
  }
}
