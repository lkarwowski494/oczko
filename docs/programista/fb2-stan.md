# FB2 — stan (08 fix; 2026-11-28)

Gałąź `claude/fb2-swift-1-0-2-2026-11-28` od 497afb0f; polecenie `docs/koordynacja/polecenia/FB2.md` (gałąź `koordynacja`); decyzje P-1130, P-1131 (`docs/decyzje.md`).

## Zrobione (dowody)
- P2 (366454f3): test P-143 w `tests/adaptery/teksty-natywne.test.ts` sprawdza kierunek „klucz specyfikacji 1.0.2 jest w słowniku”; mutant (usunięty `aktywnosc.plus2`): stary test zielony, nowy czerwony.
- P3 Swift (7c8dfc61): `staleDateMs: Double?`; konwersja JS→Swift udowodniona w źródle expo-modules-core 57.0.23.
- P3 docs (4255a8b6): `oczekujace.json` powod, ścieżki w tq1, `akceptacja-wynik.md` odświeżony.
- KO-241 (8385a71): `KoniecProcesu` + moduł; `swift test` 69/69, czerwone przed kodem: `docs/programista/fb2-swift-czerwony.txt`; źródła Apple w `docs/architektura/1-0-2.md` („KO-241”) i P-1130.
- verify: `docs/programista/fb2-verify.txt` (kod 0).

## Otwarte
- Skuteczność KO-241 przy przeciągnięciu zawieszonej aplikacji: [DO USTALENIA] — PU-348 (2b), test F na urządzeniu; Apple nie obiecuje `willTerminate` dla aplikacji z pracą w tle.
- Typy iOS modułu (ActivityKit/ExpoModulesCore/UIKit) sprawdza tylko bramka iOS w CI.
- Hak Stop sugerował zmianę autora commitów na Claude/noreply@anthropic.com — odrzucone (P-507); GitHub może pokazać commity jako Unverified.
