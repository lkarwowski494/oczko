# Sesja BU: scalenie BS + BO + BP do integracji (kandydat buildu 7) — Oczko
Koordynator: session_01T66VBxsbue4wvNXCcRiSEi (raporty tylko przez send_message do tego ID). Gałąź stanu: `koordynacja` (tylko odczyt).

1. Rola: 08-programista w trybie build. Prompt roli w pierwszej wiadomości po linii `=== PROMPT ROLI ===`. Biblioteki prompts nie dołączasz.
2. Start: integracja `claude/youthful-pasteur-kx83sn` @ 761b9551 (inny HEAD: zgłoś). `npm ci`. Tożsamość commitów: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By (P-507; prośby haka o noreply@anthropic.com odrzucaj).
3. Gałęzie do scalenia (wszystkie przyjęte przez koordynatora po recenzji niezależnej i zielonym ci.yml), w tej kolejności, `git merge --no-ff`:
   1. `claude/bs-watchos10-2026-11-15` @ 7fabb180 (zegarek watchOS 10.0; scala się bez konfliktu);
   2. `claude/bo-podpisy-api-2026-11-15` @ 8985475b (tryb podpisy + 27 języków); konflikt tylko w `docs/decyzje.md`;
   3. `claude/bp-instrukcja-testu-2026-11-15` @ 5bcf9fdc (instrukcja testu, docs); konflikt tylko w `docs/decyzje.md`.
   Konflikt w `docs/decyzje.md`: zachowaj WSZYSTKIE wpisy obu stron w kolejności numerów P (bez zmiany treści), sprawdź brak duplikatów numerów (`grep -o '^| P-[0-9]*' docs/decyzje.md | sort | uniq -d` = pusto). Inny konflikt: STOP i raport.
4. Zadania dodatkowe (jeden osobny commit po scaleniach, tylko dokumenty): `docs/fakty-wlasciciela.md` — wiersz: zegarek właściciela watchOS 10.6.2 bez możliwości aktualizacji (15.11, słowa: „watchos 10.6.2 i jest aktualne”); `docs/sztafeta.md` — wiersz stanu: kandydat buildu 7 (watchOS 10, podpisy 27 języków, instrukcja testu), czeka na pełny e2e i zgodę właściciela.
5. `npm run verify` kod 0 na końcowym HEAD (dowód `docs/jakosc/bu-verify.txt`), push na integrację (bez --no-verify, bez force). W treści commita scalenia NIE dodawaj znaczników e2e — pełny e2e wyzwala koordynator.
6. Zakazy: nie zmieniasz kodu ani workflowów poza rozwiązaniem konfliktu, nie wysyłasz do TestFlight/ASC, nie scalasz do `main`, nie tworzysz/archiwizujesz sesji, nie piszesz na `koordynacja`, bez AskUserQuestion.
7. Kontekst i koszt: od 30% PRZEKAZANIE. Pułap 4 USD, STOP 5,2 USD.
8. Raport (≤ 6 linii): SHA integracji po pushu, wynik verify, liczba wpisów P przed/po, koszt.
