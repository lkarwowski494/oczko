# Sesja BX8: 44 PU klasy B → scenariusze Maestro, dokończenie porcji 1 i porcja 2 (następca BX7) — Oczko
Koordynator: session_01T66VBxLHEZaQH4GbFzu2PU (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy wiadomości o zmianie koordynatora pisz do nowego). Gałąź stanu: `koordynacja` (tylko odczyt).

Obowiązuje polecenie BX7 (`git show origin/koordynacja:docs/koordynacja/polecenia/BX7.md`) — punkty 1, 3, 5, 6, 8 bez zmian; zmiany niżej mają pierwszeństwo.

2. Start: gałąź `claude/bx7-porcja1-2026-11-16` @ 373a3123 (tylko odczyt — trwa na niej przebieg „Jakość · iOS”, push by go anulował). Pracujesz i pushujesz na **własnej gałęzi `claude/bx8-porcja2-2026-11-16`** od 373a3123; push od razu po każdej zamkniętej części (bez czekania na „PUSH WOLNY”): `NODE_OPTIONS=--max-old-space-size=3072 git push -u origin claude/bx8-porcja2-2026-11-16` (hak verify ok. 3 min). `npm ci`. Tożsamość commitów P-507 jak w BX7.
4. Zadania:
   1. Przeczytaj `docs/jakosc/bx-stan.md` „BX7” (podział 15/14/15, znaleziska BX-021…BX-025, pułapki).
   2. Dokończ porcję 1: PU-044, 052, 165, 180 (PU-334 zablokowany BX-024 — zostaje). Numery scenariuszy od 97 (90–91 wolne, P-887).
   3. Porcja 2 (14 PU z listy BX7; PU-333 to test Swift — nie Maestro: opisz, czym go pokryć, bez zmiany klasy).
   4. Test `tests/jakosc/e2e-noc-2026-11-02.test.ts` (NOC-6): wolno dopisać do listy dokładnie nazwy nowych plików scenariuszy z tagiem `oczekujacy` (KO-086) — nic więcej w tym teście.
   5. Wyniku iOS porcji 1 nie obsługujesz (zrobi to następca po mojej wiadomości), chyba że napiszę inaczej.
7. Kontekst i koszt: BX7 doszła do 30% okna po ok. 10 PU — commituj i pushuj po każdych 3–5 scenariuszach, stan w `bx-stan.md` „BX8” na bieżąco; od 30% PRZEKAZANIE. Pułap 8 USD, STOP 10,4 USD. Subagenci: najwyżej 1 naraz i 2 łącznie (KO-075). Decyzje: pula P-890…P-893.
