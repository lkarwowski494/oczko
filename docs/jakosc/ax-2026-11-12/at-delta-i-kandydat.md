# AX: delta AT 2f224a89..bd97f939 i kandydat lokalny (2026-11-12)

## Delta AT (07-jakosc-003 opcja A, P-762) — werdykt TAK
- Zmienione 4 pliki: scen. 25 w. 21 i scen. 53 w. 23/38/53: `wzor-widok` po imporcie Worda 30 → 70 s; scen. 25 w. 27 (po restarcie) zostaje 30 s; test `tests/jakosc/e2e-word-czas-limit.test.ts`; P-762 w `docs/decyzje.md`.
- Test: na 2f224a8 (z testem z bd97f939) 2 z 3 czerwone, kod 1 (`dowody/at2-test-2f224a8.txt`); na bd97f939 3/3 zielone, kod 0 (`dowody/at2-test-bd97f939.txt`).
- Uwaga P3: regex testu wymaga dokładnego formatu wiersza; przeformatowany wiersz zostanie pominięty po cichu.

## Kandydat (lokalnie, niewypchnięty)
- Gałąź lokalna `claude/kandydat-2026-11-12` od 3d9ca08: cherry-pick AT (6 commitów do bd97f939), AU (7 do 7c68f44a), BA (625350a), reset-author na tożsamość właściciela (noreply); HEAD e16e9a0f.
- Konflikt `docs/decyzje.md` przy 19cba674 i 625350a: oba boki zachowane; P-759…P-766, P-773, P-774 po jednym wierszu, bez znaczników konfliktu. Pozostałe pliki identyczne z gałęziami źródłowymi.
- `npm run verify` na e16e9a0f: kod 0 (`dowody/kandydat-verify.txt`).
- Push na nową gałąź wstrzymany do wyraźnej zgody (sesja AX ma zapis tylko na `claude/ax-recenzja-at-2026-11-12`; polecenie AX pkt 4: „nie scalasz”).
