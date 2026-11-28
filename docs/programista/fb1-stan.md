# FB1 — stan (08 build, część Swift 1.0.2; 2026-11-28)

Gałąź `claude/fb1-kod-swift-1-0-2-2026-11-28` od 9404a59a; polecenie `docs/koordynacja/polecenia/FB1.md` @ a7c90146 (gałąź `koordynacja`), decyzje P-1124…P-1127 (`docs/decyzje.md`).

## Zrobione (dowody)
- `swift test` w kontenerze (toolchain Swift 6.0.3, `/opt/swift-tc`, poza repo): stan wyjściowy 54/54, po zmianach 62/62. Czerwień z właściwego powodu: `docs/programista/fb1-swift-czerwony.txt`.
- Wektory 07 (`docs/architektura/wektory-1-0-2.json`): IN-01…IN-11, PS-01…PS-07, SD-01…SD-04 w `modules/oczko-reguly/Tests/OczkoRegulyTests/IntencjaKrokMinusTests.swift` (szkic 07 przeniesiony, DS-02); D-04 (dwie linie jednym zapisem) w `tests/wspolne/wzorce.json` + `DziennikTests.swift`; „+2” na zegarku, krok w stanie, haptyka PS: `KrokZegarekTests.swift`.
- Kontrola TS manifestu XCTest przeniesiona do głównego zestawu: `tests/adaptery/xctest-krok-minus-1-0-2.test.ts`.
- Wiersze PU: PU-346, PU-347, PU-348, PU-350 (kolumna Pokrycie: `plik:linia`), strona `docs/wydanie/test-fizyczny.html` wygenerowana.
- Kod: `Stan.swift` (krok, −1 nie zmienia dnia), `Intencja.swift` (k linii), `Dziennik.swift` (`dopisz([linie])` jednym write), `Zegarek.swift` (skrzynka k linii), `Haptyka.swift` (PS), `Przypomnienia.swift` (`przypomnienieSkoku`), `Aktywnosc.swift` (`dataNieaktualnosci`); kopie natywne (`scripts/natywne/kopiuj-zrodla.mjs`, kontrola 0 błędów); widżet (`targets/widget/Aktywnosc.swift`: „−1”, „+2”, `teraz_dwa`), zegarek (`targets/watch/Aplikacja.swift`), `Wykonanie.swift` (k identyfikatorów, `staleDate`), most (`OczkoDziennikPlusModule.swift`: `staleDateMs?`, `liveAktywna`; `index.ts`: typy opcjonalne).

## Czego nie zrobiono / otwarte
- Karta zwinięta przy `isStale` (P-1110): czeka na werdykt prototypu B (koordynator przekaże).
- Kod iOS (widżet, zegarek, moduł) sprawdzony tylko `swiftc -parse`; typy i układ sprawdzi bramka iOS w CI (ryzyko układu „−1 | liczba | opis | +1” + drugi wiersz pod spodem: patrz `Opis(czesc:)`).
- Dwa testy „stanu po fali” czerwone przy niepustej liście oczekujących (PYTANIE do koordynatora, P-1126): `tests/i18n/pierwsze-w-fali-154.test.ts`, `tests/i18n/krytyczne.test.ts:163`.
- Do 08-A/FA1: wywołanie `liveStart/liveAktualizuj(…, staleDateMs)` i `liveAktywna()` z `src/platforma/live-activity.ts`; `KROK_MAKS` i `LIVE_KONIEC_PO_MS` w `src/konfiguracja.ts` (wtedy generator `Stale.swift`); złoty plik stanu z `krok: 2` (generator TS); regeneracja `docs/jakosc/e3/akceptacja-wynik.md` po scaleniu z FA1 (przeniesiony test z `tests/akceptacja/kontrole/`).
- Do 04: etykieta VoiceOver „+2” = `plus2` + `teraz_dwa` (bez osobnego klucza); układ „−1” wg `Opis(czesc:)`.
- Do 09: 3 klucze `aktywnosc.*` w 33 językach (lista oczekujących).
