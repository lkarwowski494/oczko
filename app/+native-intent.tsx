// Adresy wejściowe systemu (expo-router 57, `NativeIntent.redirectSystemPath`): plik `.oczko` otwarty z Plików albo z poczty → import
// w Ustawieniach (ADR-0004). Inne adresy bez zmian. Bez wyjątków: błąd tutaj zamyka aplikację (dokumentacja typu w pakiecie).
import { sciezkaImportu, startDanychZakonczony, zapamietajImportPliku } from '../src/kompozycja/import-pliku';

// Plik `.oczko` przed końcem startu danych (zimny start albo proces obudzony w tle) → „/”: najpierw start danych na liczniku, potem
// Ustawienia z importem (M1-audytor-generalny-206); po starcie danych od razu Ustawienia.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string {
  try {
    if ((initial || !startDanychZakonczony()) && zapamietajImportPliku(path)) return '/';
    return sciezkaImportu(path) ?? path;
  } catch {
    return path;
  }
}
