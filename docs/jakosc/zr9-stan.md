# ZR9 — stan (2026-11-25, rola 10 fix, KO-206)

Gałąź: `claude/zr9-kontrola-zakreslen-2026-11-25` (baza f0b28df6). Decyzje: P-1044…P-1047 w `docs/decyzje.md`.

| Zadanie | Wynik | Dowód |
|---|---|---|
| P2-1 górna granica pasa | zrobione (`PAS_MAX_WIERSZY` = 1,6) | `zr9-dowod-czerwony.txt` (6 czerwonych z 9 na f0b28df6), 9/9 zielone |
| P2-2 brak/kolor znacznika | zrobione, wariant A (BŁĄD); wariant B odrzucony (P-1046) | j.w. |
| P3-1 testy czułości w CI | potwierdzone, workflow NIE zmieniony — czeka na odpowiedź koordynatora (P-1047) | log przebiegu 45633019859 |
| P3-2, P3-3 | ocena w P-1047 | — |
| verify | exit 0, 741 zestawów, 8287 testów | `zr9-verify.txt` |

Ryzyko jawne: pełne kadry 45633* niedostępne w sesji; sprawdzono na kadrach zr8c i zr7 (ta sama scena 03/04).
