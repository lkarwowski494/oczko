# ZK1 — stan (2026-11-28, rola 03 fix, moduł zmiany-zakresu; KO-229, KO-230)

Gałąź `claude/zk1-zakres-1-0-2-2026-11-28` od a19146b8. Prompt: `prompts` @af4c0a8, `assemble.mjs 03-zakres --tryb fix --moduly zmiany-zakresu --zadania KO-229,KO-230`.

- Zrobione: ZM-19…ZM-26 (U1–U7, U10) w `docs/scope-contract.md`; zmienione F-01 (U7), F-04, F-09, F-11, F-35; paczka dla 04 i 05, kolejność, bezpieczniki, test F: `docs/zakres-1-0-2.md`; decyzje P-1088 (KO-229), P-1089 (KO-230, właściciel „U10 zgodnie z rekomendacją”), P-1090 (formy, kolejność, bezpieczniki; do weta), P-1091 (forma U7 = A+B z RS1, koordynator, do weta).
- Kontrole: `zakres-oczko.mjs docs/scope-contract.md --brd docs/brd --apetyt 45` (warsztat `03-zakres/2026-10-22-build/`) — przed kod 0 (0 błędów, 3 uwagi), po kod 0 (0 błędów, 4 uwagi; nowa: F-09 do oceny 04). Macierz U → ZM → F → „Gotowe” i PU (skrypt w scratchpadzie sesji): przed kod 1 („U1…U10: 0 wierszy ZM”, 8 błędów), po kod 0 („OK: 8 usprawnień”); mutant (usunięte ZM-22 z wiersza F-11) → kod 1 „wiersz F-11 bez odwołania do ZM-22”.
- Otwarte (do koordynatora): weto P-1090, P-1091; sesja 05 (U2, U4, U6, prototyp B U7, pytanie U3), sesja 04 (U3, U4, U5, U6, U7, U10), 07 PU przed kodem, ER dla 01.
- Następny krok: koordynator zleca 05 i 04 według `docs/zakres-1-0-2.md` („Kolejność ról”).
