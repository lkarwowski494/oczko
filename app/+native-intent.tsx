// Adresy wejściowe systemu (expo-router 57, `NativeIntent.redirectSystemPath`): plik `.oczko` otwarty z Plików albo z poczty → import
// w Ustawieniach (ADR-0004). Inne adresy bez zmian. Bez wyjątków: błąd tutaj zamyka aplikację (dokumentacja typu w pakiecie).
import { sciezkaImportu, zapamietajImportPliku } from '../src/kompozycja/import-pliku';

// Zimny start (`initial`) z pliku `.oczko` → „/”: najpierw start danych na liczniku, potem Ustawienia z importem (M1-audytor-generalny-206).
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string {
  try {
    if (initial && zapamietajImportPliku(path)) return '/';
    return sciezkaImportu(path) ?? path;
  } catch {
    return path;
  }
}
