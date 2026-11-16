# Sesja BX9: PU klasy B → scenariusze Maestro, reszta porcji 2 i porcja 3 (następca BX8) — Oczko
Koordynator: session_01T66VBw2SfKb9bVmf3phpgK (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy wiadomości o zmianie koordynatora pisz do nowego). Gałąź stanu: `koordynacja` (tylko odczyt).

Obowiązuje polecenie BX7 (`git show origin/koordynacja:docs/koordynacja/polecenia/BX7.md`) — punkty 1, 3, 5, 6, 8 bez zmian; zmiany niżej mają pierwszeństwo.

2. Start: gałąź `claude/bx8-porcja2-2026-11-16` @ 1b888e99 (tylko odczyt — czeka na niej przebieg „Jakość · iOS”, push by go anulował). Pracujesz i pushujesz na **własnej gałęzi `claude/bx9-porcja2b-2026-11-16`** od 1b888e99; push od razu po każdej zamkniętej części (3–5 scenariuszy): `NODE_OPTIONS=--max-old-space-size=3072 git push -u origin claude/bx9-porcja2b-2026-11-16` (hak verify ok. 3 min — w trakcie verify nie edytujesz drzewa roboczego: push BX8 c021aebc przez to padł). `npm ci`. Tożsamość commitów P-507 jak w BX7.
4. Zadania:
   1. Przeczytaj `docs/jakosc/bx-stan.md` „BX8 — przekazanie” (wzory i pułapki pozostałych PU); resztę pliku tylko grepem.
   2. Reszta porcji 2: scenariusze od numeru **103** dla PU-066, 067, 057, 071, 162, 191, 288 (numery trzycyfrowe są widoczne dla części CI i bramki od 2abef8a4, KO-088). Potem przelicz B „do zaprogramowania” skryptem bramki i zapisz w „Podsumowaniu” katalogu.
   3. Porcja 3 (15 PU iPad/AX5 z podziału BX7), na ile pozwala kontekst. PU wymagające porównania zrzutów ze wzorcami (PU-134, 135, 137, 139, 175): najpierw sprawdź, czy interpreter i Maestro mają taką asercję; jeśli nie — znalezisko BX-NNN z propozycją, PU zostaje „do zaprogramowania”, bez zmiany klasy.
   4. Test `tests/jakosc/e2e-noc-2026-11-02.test.ts` (NOC-6): wolno dopisać do listy dokładnie nazwy nowych plików scenariuszy z tagiem `oczekujacy` (KO-086) — nic więcej w tym teście.
   5. **Nie dotykasz** (równolegle pracuje sesja FX5 na `claude/fx5-poprawki-2026-11-16`, KO-089): `src/**`, `app/**`, `modules/**`, PU-011, 044, 290, 291, 333, 334 (ich scenariusze i wpisy katalogu zrobi sesja po scaleniu FX5). Wyniku iOS nie obsługujesz, chyba że napiszę inaczej. Znaleziska od BX-034.
7. Kontekst i koszt: commituj i pushuj po każdych 3–5 scenariuszach, stan w `bx-stan.md` „BX9” na bieżąco; od 30% okna PRZEKAZANIE. Pułap 8 USD, STOP 10,4 USD. Subagenci: najwyżej 1 naraz i 2 łącznie (KO-075). Decyzje: pula P-891…P-893.
