# M3 build 2 — stan roli 08 (2026-11-09)

Polecenie: `oczko-warsztat` `koordynacja/role-2026-11-09/08e-build2.md` @ 5e5fe60 (P-629, P-630). Gałąź `claude/kopia-08-build2-2026-11-09`, baza b4518bbf.
Stan wyjściowy: `jest --ci` 562 zestawy / 6890 testów, kod 0. Po zmianach: `npm run verify` kod 0 — 564 zestawy / 6894 testy (z `jakosc:kontrole`; `tabela-08.md` zregenerowana).

| Zad. | Stan | Commit | Test przed → po |
|---|---|---|---|
| 3 · e2e 64 („…use the timer.”) | zrobione | 8729b94 | `tests/jakosc/e2e-zdania-en.test.ts`: czerwony (64: zdanie spoza słownika en) → zielony; trwała kontrola zdań en w `assertVisible` |
| 4 · e2e 34 („Next part” pod strefą akcji) | zrobione, dowód na urządzeniu | 8433acb | brak modelu geometrii w interpreterze; kontrole scenariuszy zielone. Dwa `swipe` w treści (start 55 %) do końca przewijania przed stuknięciem — `paddingBottom` treści = strefa + odstęp (`src/ekrany/Licznik.tsx:152`) |
| 2 · 024 diagnoza (instrumentacja) | zrobione, czeka na przebieg | 3bc778d | `tests/ekrany/e2e-ramki-kolumny.test.tsx`: czerwony (brak `e2e-ramki-kolumny`) → zielony; poza E2E brak tekstu i `onLayout` (`m3-fix-reaudit-024-ipad-kolumna.test.tsx`) |
| 2 · 024 poprawka | czeka na ramki z przebiegu (`workflow_dispatch` `jakosc-ios.yml`, znacznik `[e2e-ipad]`) | — | — |
| 1 · AX5-wzór — opcja A (właściciel przez koordynatora, 9.11) | zrobione, dowód wysokości wzoru na urządzeniu (E2E 30) | f2fadde (strukturalny: `WzorTytul.tsx`), następny (zachowanie) | `tests/ekrany/m3-build2-ax5-wzor.test.tsx` (fontScale 3,571): czerwony (`maxFontSizeMultiplier` undefined zamiast 1,8 dla `wzor-zrodlo` i karty wskazówki) → zielony; `wzor-zrodlo` w jednej linii |

Odczyt ramek po przebiegu: log Maestro części iPada (`e2e-ramki-kolumny kolumna x,y,w,h; …`), zrzut `44-ipad-poziomo-ramki`, hierarchia kroku `assertVisible e2e-ramki-kolumny`.
Instrumentację (`src/kompozycja/e2e/ramki.tsx`, `onLayout` w `WzorLicznik.tsx`, kroki w scen. 44, wiersz w `e2e/README.md`) usunąć po poprawce 024 i zielonym 44.

Odstępstwo: `src/ekrany/WzorLicznik.tsx` importuje `paneleE2e` z `src/platforma/tryb-e2e.ts` (dotąd tylko `app/` i `src/kompozycja/`) — `WzorPrzegladarka.tsx` (20 429 B) i `app/wzor.tsx` (20 478 B) nie mają miejsca na przekazanie przez propsy bez wydzielenia (P-364); `granice.mjs src` bez naruszeń.

Nowe znaleziska (nie naprawiane, tryb fix): tytuł-przełącznik ▾ przy ≥ 2 wzorach bez limitu skali (`WzorTytul.tsx:20`, wariant jednego wzoru ma 1,8); karty nad wzorem bez limitu skali — podgląd Worda (`WzorPrzegladarka.tsx:160`) i pasek notatki bez znacznika (`:166–167`) mogą przy AX5 zabrać wzorowi wysokość jak wskazówka (realność: brzegowy, nieodtworzone).

Następny krok: ramki 024 z przebiegu 42678725514 → poprawka 024, test, drugi przebieg, usunięcie instrumentacji.
