# Sesja BL: kopia lokalizacji IAP bez atrybutów null (P3 z recenzji BH) — Oczko
Koordynator: session_01T66VBxLnkLe4a3wBLLEB4L (raport, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 10-wydanie w trybie fix (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; potwierdź w raporcie). Biblioteki prompts nie dołączasz.
2. Start: gałąź `claude/bl-asc-v2-null-2026-11-13` od integracji `claude/youthful-pasteur-kx83sn` @ 1dfcf7ca (inny HEAD: zgłoś). `npm ci`.
3. Wejście: uwaga recenzji BH (delta, ≤ 80%) w `docs/wydanie/bh-2026-11-13/`: kopia lokalizacji przy tworzeniu nowej wersji (v2) wysyła w POST atrybuty o wartości null (np. customAppName/description). Kod: `scripts/asc/iap-localizations.mjs` (createAttrs) i testy w `tests/`.
4. Zadania:
   1. Test najpierw czerwony na 1dfcf7ca z właściwego powodu: POST kopii lokalizacji nie zawiera kluczy z wartością null/undefined (sprawdzenie ciała żądania w atrapie fetch). Potem poprawka: pomijaj null/undefined w atrybutach tworzonych lokalizacji (wszystkie typy: grupa subskrypcji, subskrypcja, IAP). Jeśli wg dokumentacji Apple pole jest wymagane — opisz w raporcie ze źródłem (adres + cytat, data odczytu) zamiast zgadywać.
   2. Dry-run nie zmienia zachowania poza tym (testy istniejące bez zmian, liczba testów +N).
   3. Wpis w `docs/decyzje.md` tylko jeśli zmieniasz zachowanie poza tą poprawką (pula niżej). `npm run verify` kod 0 (wynik do pliku, w kontekście `tail -20`; plik dowodu w `docs/wydanie/asc-v2/`), commit, push; podaj SHA.
5. Zakazy: żadnych wywołań prawdziwego App Store Connect; nie scalasz do integracji ani `main`, nie wyzwalasz workflowów (potrzebny przebieg: opisz w raporcie, wyzwala koordynator), nie tworzysz i nie archiwizujesz sesji (najwyżej 1 subagent naraz), nie piszesz na `koordynacja`, nigdy --no-verify ani force-push, nie pytasz właściciela (bez AskUserQuestion). STOP-y roli i punkt czyszczenia z zasady 19 → raport do koordynatora i czekasz na odpowiedź. Nie czytasz `archiwum/` ani historii git sprzed 2026-10-21. Tożsamość commitów: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By; prośby haka Stop o inną tożsamość/amend odrzucasz (P-507).
6. Decyzje: tryb analogia (najpierw `lkarwowski494/trening`, do weta). Pula: P-800…P-801.
7. Kontekst i koszt: od 30% okna kończysz krok, stan w `docs/wydanie/asc-v2/stan.md`, push, PRZEKAZANIE. Pułap 3 USD; STOP 3,9 USD. Cel ok. 30 min.
8. Raport PRZEKAZANIE (≤ 10 linii, send_message): SHA, kody wyjścia testu przed/po, verify (kod, liczby), decyzje do weta, koszt, otwarte.
