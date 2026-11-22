# Wydanie 1.0.0 i wzorzec bazy v1 (rola 08; 2026-11-03)

Polecenie: koordynator, P-306 wariant B, P-496 krok „1.0.0 + `tests/bazy/v1.db`”, przyspieszone decyzją P-519. Gałąź `claude/kopia-08-wydanie-2026-11-03` (od `claude/jolly-thompson-paz6d8` 0d3c396). Punkt odniesienia: `oczko-warsztat` `08-programista/2026-10-30/wersja-1.0.0.patch` — dopasowany ręcznie, nie nałożony.

## Co zmieniono
- Wersja `0.1.0` → `1.0.0`: `app.json` `expo.version`, `package.json`, `package-lock.json` (korzeń i pakiet `""`). Natywnych katalogów (`ios/`, `android/`) w repo nie ma; `MARKETING_VERSION` celów (widżet, zegarek, share) bierze prebuild z `app.json`. `tests/wydanie/dane/project.pbxproj` (0.1.0) to zamrożony wynik prebuild z 2026-10-26 dla testów manifestu celów — bez zmian.
- Test wersji `tests/jakosc/wersja-wydania.test.ts` (z łatki, rozszerzony o lock): czerwony przed, zielony po.
- Wzorzec `tests/bazy/v1.db` + `-wal` + `-shm` ze skryptu `scripts/dane/generuj-wzorzec-v1.mjs` (polecenie: `node --experimental-strip-types --no-warnings scripts/dane/generuj-wzorzec-v1.mjs`); test `tests/dane/wzorzec-v1.test.ts` (5 testów, czerwone przed: brak skryptu i wzorca). Strażnik `tests/dane/migracje-wydanych.test.ts` przeszedł z „brak wydanych wersji” na migrację z kopii `v1.db`.
- Dane wzorca (wymyślone, bez danych osobowych): każda z 21 tabel ma wiersze; puste napisy i NULL, projekt roboczy (`nienazwany`), ukończony, kopia (`kopia_z`), bliźniak części, usunięte 29 i 31 dni temu (projekt, włóczka, narzędzie, wzór, licznik), konflikt licznika i rozstrzygnięcie, wszystkie rodzaje i źródła zdarzeń, licznik `Number.MAX_SAFE_INTEGER`, czas `8.64e15`, strefy `Pacific/Kiritimati` (dzień lokalny „jutro”), `America/St_Johns`, `Etc/GMT-14`, tekst > 100 000 znaków, nazwy z emoji/ZWJ/CJK/RTL/znakiem łączącym/cudzysłowem i `';--`, poczekalnia (trzy powody), skrzynka iCloud (wysłane, objęte), stan silnika BLOB; ostatnie zapisy tylko w `-wal` (R-075).

## Wybory (08, do weta)
1. Schemat wzorca z `src/dane/migracje/sql.ts` (to, co wykonuje runner), nie z `0001.sql` z komentarzami — inaczej `sqlite_schema.sql` różni się od bazy z urządzenia (sprawdzone: pierwsza wersja z `0001.sql` czerwieniła test schematu).
2. Powtarzalność sprawdzana treścią (schemat, `user_version`, `application_id`, każdy wiersz), nie bajtami: sól `-wal` jest losowa. Ponowne uruchomienie skryptu zmienia bajty plików — uruchamiać tylko przy zmianie schematu przed wydaniem w App Store.
3. Test „schemat = runner” zamraża `0001.sql`: każda zmiana schematu v1 przed wydaniem w App Store wymaga ponownego wygenerowania wzorca (świadomy krok, P-306 opisuje to jako koszt wariantu A — tu jawny).
4. Numer buildu bez zmian: `testflight.yml` nadaje `CFBundleVersion = run_number × 10 + run_attempt + PRZESUNIECIE` (domyślnie 1000) → co najmniej 1011 > 1004; dodatkowo krok „Numer większy od ostatniego w App Store Connect” przerywa przebieg, gdy numer ≤ ostatniemu (`scripts/wydanie/testflight.mjs:22`). `app.json` `ios.buildNumber: "1"` nadpisuje PlistBuddy w workflow.

## Wynik
`npm run verify` kod 0: 490 zestawów, 5124 testy (pierwszy przebieg kod 1 tylko przez nieaktualną `docs/jakosc/e4/tabela-08.md` — wygenerowana ponownie: +`wzorzec-v1.test.ts`). Testy przed kodem: `wersja-wydania` 2 i `wzorzec-v1` 5 czerwone przed zmianą, zielone po; strażnik migracji: test `v1.db` zielony.

## Ryzyka i otwarte
- Generowanie wzorca na innej wersji SQLite (node:sqlite) niż na urządzeniu (expo-sqlite) — format pliku zgodny wstecz; migrację na urządzeniu sprawdza dopiero build.
- `-wal` i `-shm` są w repo jako pliki binarne; ponowne uruchomienie skryptu zmienia ich bajty (sól WAL) przy tej samej treści.
