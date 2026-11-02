# Scenariusze pod pomiar przed przebiegiem 4 (07, tryb fix, P-374) — stan

Gałąź `claude/kopia-07-pomiar-2026-11-02` (baza integracja 5, 14e57ac). Zmienione tylko `e2e/`, `tests/jakosc/`, `docs/jakosc/`; kod aplikacji nietknięty (`git diff --exit-code -- src app lib`). Stan na 2026-11-02.

## Co zmieniono
| Zmiana | Scenariusze | Test kontraktu (najpierw czerwony) |
|---|---|---|
| `import-gotowy` poza ekranem: po stuknięciu `scrollUntilVisible` (opcjonalny ≤ 20 s) → zrzut `opoznienie-import-gotowy*` → twarde przewijanie ≤ 60 s → twarda asercja; opcja 1 z 1206f70 zachowana | 08 (oba importy) | `tests/jakosc/e2e-pomiar-374.test.ts` (scen. 08), `e2e-opoznienia-137.test.ts` (długie czekanie = przewijanie) |
| Zrzut `pomiar-import*` + odczyt opcjonalny `e2e-pomiar-operacji` (`.*import [0-9]+ ms.*`) po twardej asercji | 08 | j.w. |
| Zrzut `pomiar-zdjecie` + odczyt opcjonalny `e2e-pomiar-operacji` (`.*photo [0-9]+ ms.*`); w ścieżce `opoznienie-miniatura-zdjecia` odczyt opcjonalny panelu | 17 | j.w. |
| Zrzut `pomiar-ekran-projektu` + odczyt opcjonalny `e2e-pomiar-ladowania` (`first data [0-9]+ ms`); w ścieżce `opoznienie-ekran-projektu` opcjonalnie `projekt-ladowanie`, `projekt-blad` | podprzepływ `dodaj-czesc-cel` (34, 35) | j.w. |
| W ścieżce `opoznienie-lista-po-ofertach` opcjonalnie `projekty-ladowanie`, `projekty-blad` | 07 | j.w. |
| Interpreter testowy: `optional` dla `assertVisible`, `assertNotVisible`, `scrollUntilVisible` | — | `e2e-pomiar-374.test.ts` (ostatni opis) |
| README: 8 wierszy testID, zasady 9 (pomiar) i 10 (wynik poza ekranem) | — | `e2e-pomiar-374.test.ts` (wiersze), `maestro-scenariusze.test.ts` (każde id ma wiersz) |

Inwariant P-367: żadnego twardego `assertVisible` / `extendedWaitUntil` / `tapOn` / `scrollUntilVisible` na `e2e-pomiar-*`, `projekt(y)-ladowanie|blad|ponow` (pilnuje `e2e-pomiar-374.test.ts`, z wyjątkiem `e2e-pomiar-plus`, NFR-WYD-001).

## Dowód, że testy potrafią paść
- Przed zmianą scenariuszy: 17 z 20 testów nowego pliku czerwonych na asercjach treści scenariuszy (nie na imporcie).
- Mutanty w kopii (`git worktree`, scratchpad): (1) `assertVisible e2e-pomiar-ladowania` bez `optional` → 2 testy czerwone; (2) `scrollUntilVisible import-gotowy` zastąpione `waitForAnimationToEnd` → 2 testy czerwone. Kopia usunięta, drzewo robocze bez mutacji.

## Czego nie wiadomo (do przebiegu 4)
1. **[DO USTALENIA]** Czy `import-gotowy` w #137 był poza ekranem (hipoteza R). Przewijanie to usuwa, jeśli tak; jeśli import naprawdę nie kończy się, zostanie zrzut `opoznienie-import-gotowy*` i status paneli.
2. **[DO USTALENIA]** Czy panel `e2e-pomiar-ladowania` jest w widocznej części ekranu projektu (linia 207 `app/projekt/[id].tsx`, po skrzynce); jeśli nie, odczyt opcjonalny da WARNED i liczby nie będzie ani w logu, ani na zrzucie. Scenariusze nie przewijają do panelu (przewinięcie przesunęłoby cel kolejnego `tapOn`).
3. **[DO USTALENIA]** Czy menu „Add photo” zostaje otwarte po wyborze zdjęcia testowego (z kodu `src/ekrany/Zdjecia.tsx:34-41`: `naPlik` wołane wprost z panelu, bez `ustawZrodlo(false)` — zostaje); do potwierdzenia na zrzucie `pomiar-zdjecie`.
4. `optional` w `scrollUntilVisible` istnieje w źródle Maestro (`YamlScrollUntilVisible.kt`, gałąź main, odczyt 2026-11-02: `val optional: Boolean = false`). CI instaluje Maestro bez przypięcia wersji (`jakosc-ios.yml:283`), więc starszy Maestro mógłby odrzucić klucz — pierwszy przebieg pokaże.
5. Odczyt „liczbą” to zrzut + status kroku (WARNED/COMPLETED) w logu Maestro; wartości tekstu panelu `assertVisible` do logu nie zapisuje. Zapisu liczby do logu przez `copyTextFrom` + `evalScript` nie dodano (niesprawdzalne w Linuksie, a błąd skryptu byłby nowym źródłem czerwieni).
6. Scenariusze 18 i 19 nie wchodzą na ekran projektu (18: `tapOn "Harbor.*"` otwiera licznik; 19: historia licznika), więc nie ma tam panelu do odczytu; nie dodano kroków, które zmieniłyby przebieg. Jeśli koordynator chce pomiar także tam — wymaga to dopisania wejścia na ekran projektu (zmiana scenariusza).
7. Jest/Linux: nie uruchomiono Maestro ani symulatora.
