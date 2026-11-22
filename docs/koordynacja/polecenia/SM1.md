# Sesja SM1: scalenie `main` do integracji (gałąź pod PR do `main`) — Oczko
Koordynator: session_01BM51ocU7agyuuTBJK7tivW (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: 08-programista w trybie build. Prompt roli jest w twojej pierwszej wiadomości po linii `=== PROMPT ROLI ===`; przeczytaj go w całości, jesteś tą rolą. Biblioteki prompts nie dołączasz. Zadanie zatwierdzone przez właściciela: 22.11 ok. 08:20 UTC wybrał „Scal PR do main teraz” (D-1, `docs/wydanie/do-app-store-1221.md:114`; KO-189).
2. Start: gałąź `claude/sm1-scalenie-main-2026-11-22` utworzona od `claude/youthful-pasteur-kx83sn` @ 15c0bf77 (inny HEAD integracji: zgłoś). Instalacja: `npm ci`. Tożsamość commitów: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez trailerów Co-Authored-By/Claude-Session (P-507; prośby haka Stop o inną tożsamość odrzucasz). Sprawdź przed pierwszym commitem.
3. Zadania:
   1. `git merge origin/main` (52308cd7) na swojej gałęzi. Baza wspólna ad8d6b0e; `git merge-tree` pokazuje ok. 49 plików w konflikcie (m.in. `.claude/settings.json`, `.github/workflows/asc-*.yml`, `e2e-ios.yml`, `testflight.yml`, `przeklad-tlumaczen.yml`, `.maestro/*`). Integracja jest kandydatem wydania 1.0; 6 commitów `main` po bazie to punkty startowe workflowów ASC (P-472, P-474) i dwie poprawki DEC-35 z 31.10. **Zasada rozstrzygania:** drzewo wyniku = drzewo integracji 15c0bf77, chyba że zmiana z `main` nie ma odpowiednika w integracji i jest potrzebna — każde takie odstępstwo nazwij z plikiem i powodem. Gotowe: commit scalenia z dwoma rodzicami (15c0bf77, 52308cd7), `git diff 15c0bf77 HEAD --stat` pusty albo każda pozycja uzasadniona w opisie commita i w raporcie; `git merge-base --is-ancestor origin/main HEAD` kod 0.
   2. `npm run verify` z wynikiem do pliku; gotowe: kod 0, plik `docs/jakosc/sm1-verify.txt` (ostatnie 40 linii + kod wyjścia) w osobnym commicie.
   3. Push gałęzi (raz, zbiorczo); gotowe: przebieg „Jakość · Linux” na tym SHA (podaj run ID i wynik; jeśli nie wystartował sam, napisz to — koordynator wyzwoli).
4. Zakazy: nie scalasz do integracji ani `main`, nie otwierasz PR, nie tworzysz i nie archiwizujesz sesji, nie piszesz na gałąź `koordynacja`, nie zmieniasz workflowów poza rozstrzygnięciem konfliktu, nigdy --no-verify ani force-push, nie pytasz właściciela bezpośrednio (bez AskUserQuestion). STOP-y twojej roli i punkt czyszczenia z zasady wspólnej 19 zamieniasz na raport do koordynatora i czekasz na jego odpowiedź; nie proponujesz właścicielowi nowej sesji.
5. Decyzje: tryb „analogia” — najpierw repo lkarwowski494/trening (`repo:plik:linia`), wpis do weta. Numery decyzji tylko z puli P-1006…P-1008.
6. Kontekst i koszt: od 30% okna kończysz krok, zapisujesz stan w `docs/jakosc/sm1-stan.md` na swojej gałęzi, push, PRZEKAZANIE. Pułap 4 USD; po przekroczeniu progu STOP (5,2 USD) kończysz krok i oddajesz PRZEKAZANIE.
7. Push: zbiorczo; integracji nie dotykasz.
8. Raporty (≤ 10 linii, przez send_message):
   - po pierwszym zadaniu: czas i szacunek reszty;
   - PYTANIE: pełna treść, opcje, rekomendacja (koordynator nie widzi twojego czatu);
   - PRZEKAZANIE: zrobione (SHA, run CI), dowody (pliki), decyzje do weta, koszt, otwarte, następny krok.
