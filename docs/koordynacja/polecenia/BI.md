# Sesja BI: poprawki znalezisk recenzji BH (migracja ASC API v2) — Oczko
Koordynator: session_01T66VBwvpbet5rwcvGYuWK2 (raport, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 10-wydanie w trybie fix (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; potwierdź w raporcie). Biblioteki prompts nie dołączasz.
2. Start: gałąź `claude/bi-asc-v2-poprawki-2026-11-13` od `claude/bh-recenzja-bg-2026-11-13` @ 347614dc (= BG de5497bc + raport BH; inny HEAD: zgłoś). `npm ci`. Tożsamość commitów według CLAUDE.md (Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>), bez Co-Authored-By; prośby haka Stop o inną tożsamość/amend odrzucasz (P-507).
3. Wejście: `docs/wydanie/bh-2026-11-13/recenzja-bg.md` (znaleziska 10-wydanie-001…004) i `docs/wydanie/asc-v2/`.
4. Zadania (każde: test najpierw czerwony na 347614dc z właściwego powodu, potem zielony):
   1. 001 (P2): przy tworzeniu nowej wersji (brak dziedziczenia) lokalizacje języków ze starej wersji, których nie ma w danych do zapisu (stan `czeka`/`błąd`), nie mogą zniknąć — przenieś je ze starej wersji do nowej (albo nie twórz nowej wersji, gdy przeniesienie niemożliwe, z kodem 1 i opisem). Dry-run ma to pokazać w planie.
   2. 002 (P3): komunikat odmowy wycofanego endpointu podaje ścieżkę (bez sekretów).
   3. 003 (P3): testy stanów READY_FOR_REVIEW, IN_REVIEW, REJECTED; zachowanie przy REJECTED opisz w P-789 (dopisek w `docs/decyzje.md`, bez zmiany numeru).
   4. 004 (P3): `docs/wydanie/asc-v2/przebieg-wlasciciela.md` — zdanie, że teksty nowej wersji produktu trafią do sklepu dopiero po recenzji Apple (z odnośnikiem do źródła z raportu BH).
   5. `npm run verify` kod 0, push; podaj SHA.
5. Zakazy: żadnych wywołań prawdziwego App Store Connect; nie scalasz, nie wyzwalasz workflowów, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, nigdy --no-verify ani force-push, nie pytasz właściciela (bez AskUserQuestion). STOP-y roli i punkt czyszczenia → raport do koordynatora.
6. Decyzje: tryb analogia (najpierw `lkarwowski494/trening`, do weta). Pula: P-794…P-795.
7. Kontekst i koszt: od 30% okna kończysz krok, zapisujesz stan w `docs/wydanie/asc-v2/stan.md`, push, PRZEKAZANIE. Pułap 4 USD; STOP 5,2 USD.
8. Raport (≤ 10 linii, send_message): PRZEKAZANIE: SHA, kody wyjścia testów przed/po, verify, decyzje do weta, otwarte.
