# Sesja AN: poprawki 018 i 019 zrzutów sklepu (po recenzji AM) — Oczko
Koordynator: ID z `stan.md` („Koordynator aktywny”, teraz session_01T66VBwsVfpEaSobJZ4b8VQ) — raport, pytania i PRZEKAZANIE tylko przez send_message do niego. Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 08-programista w trybie fix (prompt po `=== PROMPT ROLI ===`, praca od `=== KONIEC PROMPTU ROLI ===`; w pierwszym raporcie potwierdź linię KONIEC i ostatni nagłówek `##`). Biblioteki prompts nie dołączasz.
2. Start: nowa gałąź `claude/an-zrzuty-018-019-2026-11-11` od `claude/youthful-pasteur-kx83sn` @ 04652fb (inny HEAD: zgłoś). `npm ci`. Tożsamość commitów według CLAUDE.md (bez Co-Authored-By), sprawdź przed pierwszym commitem.
3. Zadania (znaleziska z recenzji AM 19:24; zapis w `docs/koordynacja/stan.md` i KO-043 na `koordynacja`):
   1. **019 (P1) kontrola:** w jobie „komplet” `zrzuty-sklepu.yml` stała kontrola pikseli (ImageMagick jest już instalowany): dla każdego urządzenia i języka kadr 04 musi mieć więcej żółtych pasów zakreślenia niż kadr 03; porażka = czerwony job z nazwą pliku. Test jednostkowy logiki na plikach przykładowych (czerwony przed kodem). Gotowe: test zielony, `npm run verify` kod 0.
   2. **019 (P1) diagnoza i próba naprawy:** dziś kadr 04 pokazuje 1 zakreślenie przy liczniku 2 (artefakt `sklep-zrzuty-surowe` przebiegu 43070136577: `warunek-og07/{ipad-13,6.9}/{en,pl}/04-zakreslenie.png`). Hipoteza AM: pociągnięcie przy włączonym zakreślaczu nie renderuje się do jego wyłączenia — fikstura wyłącza (`e2e/zrzuty-sklepu/00-przygotuj.yaml:171`), scena 04 nie. Zmień scenariusz 04 tak, by zakreślacz był wyłączony przed zrzutem (albo inna przyczyna z dowodem z kodu); bez zmian w `src/ app/ modules/`. Gotowe: commit + opis w `docs/programista/` z hipotezą i tym, co potwierdzi przebieg C6.
   3. **018 (P2):** simctl odrzuca `2026-11-10T09:41:00+00:00` (job 130695677975, code=22). Opcja (a): forma `…T09:41:00Z`; zachowaj głośne ostrzeżenie i odczyt `status_bar list` po sukcesie. Opcja (b) tylko gdy (a) zostanie odrzucona na runnerze — nie teraz. Gotowe: commit, test skryptu czerwony przed.
   4. **P3:** asercje `e2e/zrzuty-sklepu/04-zakreslenie.yaml:30,32` ściśle (`^\D*1\D*$` albo równoważnie), bez osłabienia.
   5. Decyzje do `docs/decyzje.md` z puli, z odnośnikiem KO-043.
4. Zakazy: nie scalasz do integracji ani `main`, nie tworzysz i nie archiwizujesz sesji, nie piszesz na gałąź `koordynacja`, nie wyzwalasz workflowów (C6 wyzwala koordynator), workflow `zrzuty-sklepu.yml` zmieniasz tylko w zakresie zadania 1, nigdy --no-verify ani force-push, bez AskUserQuestion. STOP-y roli i punkt czyszczenia → raport do koordynatora.
5. Decyzje: tryb analogia (najpierw `lkarwowski494/trening`, `repo:plik:linia`, wpis do weta). Pula: P-744…P-747.
6. Od 30% okna PRZEKAZANIE. Pułap 6 USD, STOP 8 USD.
7. Push zbiorczo na koniec. Raport PRZEKAZANIE ≤ 10 linii: SHA, commity per zadanie, verify z kodem wyjścia, decyzje, niesprawdzone na runnerze, koszt.
