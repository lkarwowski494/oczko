# Sesja BH: recenzja niezależna BG (migracja ASC API v2) — Oczko
Koordynator: session_01T66VBwvpbet5rwcvGYuWK2 (raport, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 10-wydanie w trybie audit (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; w raporcie potwierdź linię KONIEC). Biblioteki prompts nie dołączasz. Raportu autora (poza plikami w repo) nie dostajesz celowo.
2. Start: gałąź `claude/bh-recenzja-bg-2026-11-13` od `claude/bg-asc-v2-2026-11-13` @ de5497bc (inny HEAD: zgłoś). `npm ci`. Tożsamość commitów według CLAUDE.md, bez Co-Authored-By.
3. Przedmiot: diff 2ed5215a..de5497bc (14 plików: `scripts/asc/iap-localizations.mjs`, `wycofane-endpointy.mjs`, `kontrola-wycofane.mjs`, testy `tests/wydanie/asc-iap-v2*`, workflow `asc-iap-localizations.yml`, docs `docs/wydanie/asc-v2/`, P-789…P-791). Cel KO-056: przejście z wycofanych zasobów IAP/subskrypcji (localizations v1) na v2 pod InAppPurchaseVersion/SubscriptionVersion/SubscriptionGroupVersion.
4. Zadania:
   1. Zgodność z dokumentacją Apple: każdą ścieżkę, typ zasobu, relację `version` i stan wersji sprawdź sam u źródła (developer.apple.com, najlepiej surowy JSON dokumentacji / OpenAPI), adres + data odczytu. Szczególnie: czy POST lokalizacji v2 wymaga wersji w stanie edytowalnym; czy wybór/utworzenie wersji (P-789) nie zmienia niczego w ASC poza tekstami przy dry-run.
   2. Bezpieczeństwo konta właściciela: dry-run nie wykonuje zapisów (dowód testem albo odczytem kodu `plik:linia`), apply nigdy nie usuwa, wersja w recenzji nie jest ruszana.
   3. Testy: czerwone na 2ed5215a z właściwego powodu, zielone na de5497bc (uruchom sam, kody wyjścia); czy atrapa odzwierciedla kształt odpowiedzi Apple, a nie tylko założenia autora.
   4. `npm run verify` kod 0 na de5497bc.
   5. Werdykt TAK/NIE z listą znalezisk (P0–P3, `plik:linia`, realność) w `docs/wydanie/bh-2026-11-13/recenzja-bg.md`; push.
5. Zakazy: żadnych wywołań prawdziwego App Store Connect; nie poprawiasz kodu BG (tylko raport); nie scalasz, nie wyzwalasz workflowów, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, nigdy --no-verify ani force-push, nie pytasz właściciela (bez AskUserQuestion). STOP-y roli i punkt czyszczenia → raport do koordynatora.
6. Decyzje: tryb analogia (najpierw `lkarwowski494/trening`, do weta). Pula: P-792…P-793.
7. Kontekst i koszt: od 30% okna kończysz krok, zapisujesz stan, push, PRZEKAZANIE. Pułap 6 USD; STOP 7,8 USD.
8. Raport (≤ 10 linii, send_message): PRZEKAZANIE: werdykt, SHA raportu, kody wyjścia, znaleziska P0–P2, źródła Apple.
