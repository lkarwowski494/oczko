# Sesja BQ: recenzja niezależna trybu `podpisy` (kod BO) przed płatnym przebiegiem API — Oczko
Koordynator: session_01T66VBxsbue4wvNXCcRiSEi (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu: `koordynacja` (tylko odczyt).

1. Rola: 08-programista w trybie audit. Prompt roli jest w pierwszej wiadomości po linii `=== PROMPT ROLI ===`; przeczytaj go w całości. Biblioteki prompts nie dołączasz. Nie czytasz raportu autora ani `docs/lokalizacja/bo-stan.md` przed własną oceną (świeże spojrzenie).
2. Start: gałąź `claude/bo-podpisy-api-2026-11-15` @ 6f17ac72 (tylko odczyt; inny HEAD: zgłoś). Wynik zapisz na własnej gałęzi `claude/bq-recenzja-podpisy-2026-11-15` (od 6f17ac72). Instalacja: `npm ci`. Tożsamość commitów: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By (P-507).
3. Zakres: diff `761b9551..6f17ac72` (12 plików): `scripts/i18n/przeklad-podpisy.mjs`, zmiany w `scripts/i18n/przeklad-produkty.mjs`, tryb `podpisy` w `.github/workflows/przeklad-tlumaczen.yml`, testy.
4. Zadania (każde z „gotowe”):
   1. Koszt i bezpieczeństwo przebiegu płatnego (P1, przed wszystkim): czy limit 30 USD (P-481) i `zgoda_koszt` są egzekwowane przed wysłaniem partii; czy `tylko_szacuj=true` nie wysyła płatnych zapytań; czy klucz API nie trafia do logów ani artefaktu; czy wznowienie nie dubluje partii. Gotowe: każdy punkt TAK/NIE z `plik:linia`.
   2. Poprawność: twarde kontrole (≤ 40 znaków liczone jak w `podpisy-zrzutow.json`, ceny, marki, „free”), przyjęcie tylko po krytyku, en/pl nienaruszone, zmiana wspólnych funkcji w `przeklad-produkty.mjs` bez zmiany zachowania trybu `produkty` (testy). Gotowe: lista znalezisk P1/P2/P3 z `plik:linia` i scenariuszem błędu.
   3. Werdykt: GOTOWY / GOTOWY Z UWAGAMI / NIEGOTOWY do przebiegu płatnego. Plik `docs/lokalizacja/bq-recenzja-podpisy.md`, commit, push.
5. Zakazy: nie zmieniasz kodu BO (tylko raport), nie scalasz, nie wyzwalasz workflowów, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, nigdy --no-verify ani force-push, bez AskUserQuestion. STOP-y roli i punkt czyszczenia → raport do koordynatora.
6. Decyzje: brak przewidzianych; gdyby były — pula P-814…P-815, tryb „analogia” (lkarwowski494/trening), do weta.
7. Kontekst i koszt: od 30% okna kończysz krok i PRZEKAZANIE. Pułap 5 USD, STOP 6,5 USD.
8. Raport (≤ 10 linii, send_message): werdykt, P1/P2 z `plik:linia`, SHA, koszt.
