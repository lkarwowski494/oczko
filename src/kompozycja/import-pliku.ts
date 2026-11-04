// Otwarcie pliku `.oczko` z Plików albo z poczty (ADR-0004 „Typ pliku `.oczko`”): system przekazuje adres pliku jako ścieżkę wejściową
// expo-router (`+native-intent`, redirectSystemPath). Plik `.oczko` → Ustawienia z importem tego pliku (te same kroki co „Import”:
// liczności przed decyzją, scal albo zastąp); inne adresy bez zmian.
export function sciezkaImportu(path: string): string | null {
  if (!/^file:\/\//i.test(path) || !/\.oczko$/i.test(path)) return null;
  try {
    return `/ustawienia?import=${encodeURIComponent(decodeURIComponent(path.replace(/^file:\/\//i, '')))}`;
  } catch {
    return null; // zły zapis adresu: bez przekierowania (wyjątek w redirectSystemPath zamyka aplikację)
  }
}

// M1-audytor-generalny-206 (05-architekt-001): przy zimnym starcie trasa „/” (start danych: migracja, scalenie +1) musi ruszyć przed
// importem, więc plik czeka tu, a `redirectSystemPath` otwiera „/”; licznik po `przygotuj()` odbiera go i otwiera Ustawienia z importem.
let oczekujacyImport: string | null = null;

/** Zimny start z pliku `.oczko`: zapamiętuje ścieżkę pliku i zwraca `true`; inny adres → `false`. */
export function zapamietajImportPliku(path: string): boolean {
  const s = sciezkaImportu(path);
  if (s === null) return false;
  oczekujacyImport = decodeURIComponent(s.slice('/ustawienia?import='.length));
  return true;
}

/** Ścieżka pliku czekającego na import (raz; potem `null`). */
export function odbierzImportPliku(): string | null {
  const s = oczekujacyImport;
  oczekujacyImport = null;
  return s;
}

// Przegląd ścieżek wrażliwych do 206: proces obudzony w tle (Live Activity, zegarek, CloudKit) zużywa adres startowy, więc plik przychodzi
// z `initial: false` przed końcem startu danych (stos bywa niezamontowany i link przepada) — o skrzynce rozstrzyga start danych, nie `initial`.
let startDanych = false;

/** Start danych zakończony (licznik po udanym `przygotuj()`); od tej chwili plik idzie od razu do Ustawień. */
export function oznaczStartDanych(): void {
  startDanych = true;
}
/** `true`, gdy start danych w tym procesie już się zakończył. */
export function startDanychZakonczony(): boolean {
  return startDanych;
}
/** Stan procesu od nowa (testy). */
export function zerujStanImportu(): void {
  oczekujacyImport = null;
  startDanych = false;
}
