# Sesja BF: poprawki znalezisk recenzji BE (e2e awaria sterownika) — Oczko
Koordynator: session_01T66VBvyWJ5c8v567JYTo5a (raport, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 07-jakosc w trybie fix (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; w raporcie potwierdź linię KONIEC). Biblioteki prompts nie dołączasz.
2. Start: gałąź `claude/bf-e2e-poprawki-2026-11-12` @ ac0ba37e (= BD 7e86bfa1 + raport BE; inny HEAD: zgłoś). `npm ci`. Tożsamość commitów według CLAUDE.md (sprawdź przed pierwszym commitem), bez Co-Authored-By.
3. Wejście: `docs/jakosc/be-2026-11-12/recenzja-bd.md` i `dowody/` (znaleziska 001–003). Zgoda właściciela KO-054 (12.11 13:58), dosłowny zakres: przy awarii sterownika/symulatora jedno automatyczne powtórzenie całego zestawu części, wykazane osobno w raporcie; NIE obejmuje innych zmian progów, limitów czasu i zestawu scenariuszy ani ponowień przy porażce asercji.
4. Zadania (każde: test najpierw czerwony na ac0ba37e z właściwego powodu, potem zielony):
   1. 001 (P2), opcja b recenzenta: podsumowanie 1. podejścia (część, scenariusz, przyczyna awarii) zapisane do `$GITHUB_STEP_SUMMARY`/raportu PRZED startem 2. podejścia, tak by przekroczenie limitu kroku w 2. podejściu nie gubiło wpisu. Limitów (`timeout-minutes`) NIE zmieniasz.
   2. 002 (P3): status „w ponowieniu” z 1. podejścia zostaje w podsumowaniu; sprawdź i opisz (bez zmiany zestawu), skąd 3. uruchomienie scenariusza w pełnym pakiecie — jeśli to ponowienie przy asercji, usuń je tylko w granicach KO-054, inaczej zgłoś jako PYTANIE.
   3. 003 (P3): wzorce awarii liczone tylko z elementu `<failure>`/`<error>` (nie z `system-out`/CDATA) i bez fałszywego trafienia na treść asercji z „deviceInfo failed” (sondy K2, K7 z `dowody/sondy.txt` jako fikstury).
   4. `npm run verify` kod 0 (hak pre-push), push; podaj SHA. Decyzje w `docs/decyzje.md` z puli.
5. Zakazy: nie scalasz do integracji ani `main`, nie wyzwalasz workflowów (ci.yml wyzwala koordynator), nie zmieniasz progów, limitów czasu ani listy scenariuszy, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, nigdy --no-verify ani force-push, nie pytasz właściciela (bez AskUserQuestion). STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora.
6. Decyzje: tryb analogia (najpierw `lkarwowski494/trening`, `repo:plik:linia`, do weta). Pula: P-786…P-788.
7. Kontekst i koszt: od 30% okna kończysz krok, zapisujesz stan, push, PRZEKAZANIE. Pułap 4 USD; STOP 5,2 USD.
8. Raporty (≤ 10 linii, send_message): PYTANIE z opcjami i rekomendacją; PRZEKAZANIE: SHA, kody wyjścia testów (przed/po), verify, decyzje do weta, otwarte.
