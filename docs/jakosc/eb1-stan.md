# EB1 — stan (27.11.2026, rola 08 fix, KO-223…KO-226)

Gałąź `claude/eb1-ekran-blokady-2026-11-27` od 9aa5ee44. Decyzje: P-1079…P-1082 w `docs/decyzje.md`.

- Diagnoza: ścieżka podstawowa +1 z ekranu blokady działa (test fizyczny właściciela na 1.0.1, cytaty w P-1082 pkt 5). Znaleziona ukryta utrata: poczekalnia `ekran_blokady` nie była ponawiana — naprawione (P-1079, P-1080).
- Rozwidlenie blokada↔aplikacja (konflikt `scal`) NIE zmienione: wartość w aplikacji zostaje bez zmian, licznik dostaje flagę `konflikt`, baner PU-127 nie pokazuje się; w „Zgłoś problem” widać `lockscreen: ... conflicts=M`. Do roli 05.
- Półsekundowa stara liczba: scalenie od `inactive` (P-1082 pkt 2); wymaga testu fizycznego.
- PU-126 klasa F: do ponownego testu na następnym buildzie (półsekundowa różnica).
