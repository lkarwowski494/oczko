# Fikstury: awaria sterownika XCTest w E2E (07-jakosc-001, 07-jakosc-002, 08-programista-003)

Wycinki prawdziwych plików Maestro (zasada roli 07 nr 7); bez danych osobowych, identyfikator symulatora zamaskowany (`<UUID>`).

| Plik | Pochodzenie | Co zawiera |
|---|---|---|
| `junit-device-unreachable.xml` | junit `e2e-out/01-nfr-pie-001-pierwsze-liczenie.xml`, „Jakość · iOS” #182 (run 43194659175, job 131120448387, 562dfc4), wycinek z raportu BB `docs/jakosc/bb-2026-11-12/dowody/01-wynik-i-junit.txt` (gałąź `claude/bb-diagnoza-e2e-2026-11-12`); zamknięcie znaczników dopisane | `status="ERROR"`, `maestro.DeviceUnreachableException: Device became unreachable during deviceInfo` — awaria maszyny, asercja się nie wykonała |
| `junit-asercja.xml` | nagłówek jak wyżej (ten sam scenariusz 01); treść `<failure>` z logu joba części 2 przebiegu z 12.11 02:42 UTC (raport AR `docs/jakosc/ar-2026-11-12/dowody/b-e2e-czesc2.txt:35`); czas i `status="FAILED"` złożone ręcznie | porażka asercji licznika — nie jest awarią maszyny |
| `commands-przerwany.json` | `commands.json` scenariusza 01 z #182, kroki 15–17 (indeks od 0) z raportu BB `dowody/02-maestro-log-krok.txt`; pola `metadata` skrócone do `status` | ostatni krok `tapOnElement dzis-plus` w stanie RUNNING (przerwany przez awarię sterownika) |
| `junit-k2-cdata-system-out.xml` | `junit-asercja.xml` + `<system-out>` z sekcją CDATA zawierającą surowe `<failure>DeviceUnreachableException</failure>` (sonda K2 recenzji BE, `docs/jakosc/be-2026-11-12/dowody/sonda-be.test.ts.txt`) | log z wzorcem awarii poza elementem `<failure>` — porażka asercji, nie maszyna (08-programista-003) |
| `junit-k7-asercja-deviceinfo.xml` | `junit-asercja.xml` z treścią `<failure>` `Assertion is false: "deviceInfo failed" is visible` (sonda K7, tamże) | asercja scenariusza cytująca wzorzec Treningu — nie maszyna (08-programista-003) |
