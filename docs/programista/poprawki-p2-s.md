# Poprawki P2, sesja S (rola 08, tryb fix; 2026-11-02)

Polecenie: `oczko-warsztat` 6d78e83 `koordynacja/role-2026-11-01/08-poprawki-p2-s.md`. Baza: integracja 5 (e72cd04). Decyzje: P-373 (P2-5b wariant B), P-374 (P2-3 wariant A, osobna gałąź).

## Stan
| ID | Gałąź | Stan |
|---|---|---|
| P2-5b | `claude/kopia-poprawki-s-2026-11-02` | zrobione: `WzorLicznik.tsx` — w trybie „rząd w trakcie” podpis `licznik.jednostka_w_trakcie` („current row”, testID `licznik-podpis`) w pasku pod wzorem i w kolumnie obok; tryb „skończone” bez zmian. Test `wzor-przegladarka.test.tsx` „P2-5b” 2 czerwone (brak `licznik-podpis`) → zielone; test „skończone bez podpisu” zielony. |
| P2-3 | `claude/kopia-poprawki-s2-2026-11-02` (od P2-5b) | w toku, patrz plik na tej gałęzi |

`env -u NODE_PATH npm run verify` kod 0: 348 zestawów, 3374 testy (3371 u koordynatora + 3 nowe). `tabela-08.md` zregenerowana.

## Uwagi
- Tożsamość git `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>` (polecenie); hook końca sesji zgłasza te commity jako „Unverified” i żąda zmiany na noreply@anthropic.com z przepisaniem historii — nie wykonano (polecenie zabrania zmiany tożsamości i force-pusha).
