# AR1 — stan (2026-11-28, rola 05 fix, moduły dane-lokalne-sqlite, tlo-i-sensory-ios)

Gałąź `claude/ar1-architektura-1-0-2-2026-11-28` od 19f07773. Polecenie: `docs/koordynacja/polecenia/AR1.md` @ ffb13539 (gałąź `koordynacja`). Decyzje P-1096…P-1099 (KO-234 w P-1099).

- U3 (ZM-21): odpowiedź wysłana koordynatorowi: znaczenie zapisane jawnie, bez migracji (P-1098).
- U2 + U4 (ZM-20, ZM-22): ADR-0035 (przesunięcie rodzica; −1 z Live Activity; defekt `po` dla −1).
- U6 (ZM-24): ADR-0036 (dwa `plus`, stuknięcie, `licznik.krok` migracja 0002 lokalnie); bezpiecznik 2 nie zachodzi.
- U7 (ZM-25): rejestr Apple 22a–22f; prototyp B jako zadanie 08 (`docs/architektura/1-0-2.md`).
- KO-234 (koniec Live Activity): ADR-0037; OP-38 (U8-A): odpowiedź wysłana — pola celu oczek brak, potrzebna kolumna i migracja (schemat.sql:45, :53-66).
- Wektory `docs/architektura/wektory-1-0-2.json`; kontrola `node docs/architektura/eksperymenty/1-0-2/sprawdz.mjs` → kod 0 (`sprawdz.out`).
- verify: `docs/architektura/ar1-verify.txt`.
- Następny krok: weto koordynatora (P-1096, P-1097 K1, P-1099); potem 07 (PU i testy z wektorów) → 08-A (TS), 08-B (Swift), 08 prototyp B.
