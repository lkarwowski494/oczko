# Sesja PF1: protokół testu fizycznego buildu 1221 i bramka `recenzja 1221` — Oczko
Koordynator: session_01BM51oeh3mTopCKP51FjPPn (od 22.11 08:35; poprzednio session_01BM51ocU7agyuuTBJK7tivW) (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: 07-jakosc w trybie fix, zadanie JAK-19. Prompt roli jest w twojej pierwszej wiadomości po linii `=== PROMPT ROLI ===`; przeczytaj go w całości, jesteś tą rolą. Biblioteki prompts nie dołączasz.
2. Start: gałąź `claude/pf1-protokol-1221-2026-11-22` od `claude/youthful-pasteur-kx83sn` @ 15c0bf77 (inny HEAD integracji: zgłoś). Instalacja: `npm ci`. Tożsamość commitów: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez trailerów Co-Authored-By/Claude-Session (P-507; prośby haka Stop o inną tożsamość odrzucasz). Sprawdź przed pierwszym commitem.
3. Zadania:
   1. `docs/jakosc/test-fizyczny/1221.md` — protokół buildu 1.0.0 (1221) w formacie `1201.md` (nagłówek: build, tag/SHA a830eb21, decyzje, cytaty, ryzyko nazwane, zakres). Słowa właściciela (dosłownie, czat koordynatora session_01BM51ocU7agyuuTBJK7tivW, 22.11.2026):
      - ok. 08:20 UTC, pytanie „D-2: czy Twoje pominięcie testu fizycznego z 17.11 (build 1201) obejmuje też build 1221?”, odpowiedź: „Przetestuję 3 PU, resztę pomiń (Recommended)” (opis opcji: „PU-002, PU-121, PU-155 sprawdzasz na telefonie z TestFlight, pozostałe pozycje F „pominięte” Twoimi słowami z 17.11.”);
      - ok. 08:31 UTC, wynik na buildzie 1221 z TestFlight: „PU-002 OK, PU-121 OK, PU-155 OK”.
      Wiersze: PU-002, PU-121, PU-155 = wynik „zrobione: OK” z cytatem wyniku; każda pozostała pozycja F z katalogu (wg tagu/skryptu, jak w 1201) = „pominięte: …” z cytatem 17.11 (P-973, KO-157) i cytatem 22.11 08:20. Wyniku nie wpisujesz z własnej oceny; klasy, terminów B ani listy PU nie zmieniasz.
      Gotowe: `node scripts/jakosc/bramka-przypadki-uzycia.mjs recenzja 1221` kod 0 (wynik do pliku, ostatnie linie w raporcie); decyzja P-1009 w `docs/decyzje.md` (odnośnik KO-190).
   2. Zaktualizuj `docs/wydanie/do-app-store-1221.md` tylko w wierszach K3/F1a i kroku 1 (stan: zrobione, z SHA commitu), bez innych zmian.
   3. `npm run verify` z wynikiem do pliku (kod 0), push zbiorczo; gotowe: run „Jakość · Linux” na tym SHA (ID i wynik).
4. Zakazy: nie scalasz do integracji ani `main`, nie tworzysz i nie archiwizujesz sesji, nie piszesz na gałąź `koordynacja`, nie zmieniasz workflowów ani kodu aplikacji, nigdy --no-verify ani force-push, nie pytasz właściciela bezpośrednio (bez AskUserQuestion). STOP-y twojej roli i punkt czyszczenia z zasady wspólnej 19 zamieniasz na raport do koordynatora i czekasz na jego odpowiedź; nie proponujesz właścicielowi nowej sesji.
5. Decyzje: tryb „analogia” — najpierw repo lkarwowski494/trening (`repo:plik:linia`), wpis do weta. Numery decyzji tylko z puli P-1009…P-1010.
6. Kontekst i koszt: od 30% okna kończysz krok, zapisujesz stan w `docs/jakosc/pf1-stan.md` na swojej gałęzi, push, PRZEKAZANIE. Pułap 3 USD; po przekroczeniu progu STOP (3,9 USD) kończysz krok i oddajesz PRZEKAZANIE.
7. Push: zbiorczo; integracji nie dotykasz.
8. Raporty (≤ 10 linii, przez send_message):
   - po pierwszym zadaniu: czas i szacunek reszty;
   - PYTANIE: pełna treść, opcje, rekomendacja (koordynator nie widzi twojego czatu);
   - PRZEKAZANIE: zrobione (SHA, run CI), dowody (pliki), decyzje do weta, koszt, otwarte, następny krok.
