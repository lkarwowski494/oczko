# Sesja BE: recenzja niezależna BD (07 fix JAK-05/JAK-17) — Oczko
Koordynator: session_01T66VBvyWJ5c8v567JYTo5a (raport, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 08-programista w trybie audit (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; w raporcie potwierdź linię KONIEC). Biblioteki prompts nie dołączasz. Jesteś recenzentem niezależnym: nie czytasz raportu autora (BD) ani jego uzasadnień poza treścią commitów i plikami w repo.
2. Start: gałąź `claude/be-recenzja-bd-2026-11-12` = `claude/bd-e2e-sterownik-2026-11-12` @ 7e86bfa1 (inny HEAD: zgłoś). `npm ci`. Tożsamość commitów według CLAUDE.md, bez Co-Authored-By.
3. Zakres: `git diff 562dfc4..7e86bfa1` (11 plików: `.github/workflows/jakosc-ios.yml`, `scripts/ci/e2e-awaria-maszyny.mjs`, `.github/scripts/jakosc/maestro-failures.py`, testy `tests/jakosc/e2e-awaria-maszyny.test.ts`, `tests/jakosc/maestro-failures-przerwany.test.ts` z fiksturami, `CLAUDE.md`, `docs/decyzje.md` P-781…P-783).
   Zgoda właściciela (KO-054, 12.11 13:58), dosłowny zakres: przy awarii sterownika/symulatora (`DeviceUnreachableException`) jedno automatyczne powtórzenie całego zestawu części, wykazane osobno w raporcie, jak Trening `e2e-ios.yml:223-228`; NIE obejmuje: innych zmian progów, limitów czasu i zestawu scenariuszy, ponowień przy porażce asercji.
4. Zadania:
   1. Czy zmiana mieści się w zgodzie (pkt 3): żadna porażka asercji nie jest ponawiana ani maskowana (także asercja czerwona przed awarią w tym samym podejściu), żadne limity/progi/lista scenariuszy nie zmienione, powtórzenie najwyżej raz i widoczne w podsumowaniu. Gotowe: werdykt z `plik:linia`.
   2. Testy: uruchom oba nowe testy na 562dfc4 (oczekiwany kod ≠ 0 z właściwego powodu) i na 7e86bfa1 (kod 0); sprawdź, czy wzorce awarii nie łapią zbyt szeroko (np. tekst w `<system-out>` albo nazwie scenariusza). Gotowe: kody wyjścia w raporcie.
   3. Ryzyko: późna awaria + pełne powtórzenie a timeout kroku/joba (`timeout-minutes`) — oceń realne / brzegowe / teoretyczne z liczbami z workflowu.
   4. Raport `docs/jakosc/be-2026-11-12/recenzja-bd.md` na twojej gałęzi: TAK / NIE, znaleziska P0–P3 z `plik:linia`. Commit, push.
5. Zakazy: nie poprawiasz kodu BD (tylko raport), nie scalasz do integracji ani `main`, nie wyzwalasz workflowów, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, nigdy --no-verify ani force-push, nie pytasz właściciela (bez AskUserQuestion). STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora.
6. Decyzje: tryb analogia (najpierw repo `lkarwowski494/trening`, `repo:plik:linia`, do weta). Pula: P-784…P-785.
7. Kontekst i koszt: od 30% okna kończysz krok, zapisujesz stan, push, PRZEKAZANIE. Pułap 5 USD; STOP 6,5 USD.
8. Raporty (≤ 10 linii, send_message): PYTANIE z opcjami i rekomendacją; PRZEKAZANIE: werdykt, SHA raportu, kody wyjścia testów, znaleziska, decyzje do weta, otwarte.
