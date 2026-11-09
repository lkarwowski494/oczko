# M3 build 2 — stan roli 08 (2026-11-09)

Polecenie: `oczko-warsztat` `koordynacja/role-2026-11-09/08e-build2.md` @ 5e5fe60 (P-629, P-630). Gałąź `claude/kopia-08-build2-2026-11-09`, baza b4518bbf.
Stan wyjściowy: `jest --ci` 562 zestawy / 6890 testów, kod 0. Po zmianach: `npm run verify` kod 0 — 564 zestawy / 6894 testy (z `jakosc:kontrole`; `tabela-08.md` zregenerowana).

| Zad. | Stan | Commit | Test przed → po |
|---|---|---|---|
| 3 · e2e 64 („…use the timer.”) | zrobione | 8729b94 | `tests/jakosc/e2e-zdania-en.test.ts`: czerwony (64: zdanie spoza słownika en) → zielony; trwała kontrola zdań en w `assertVisible` |
| 4 · e2e 34 („Next part” pod strefą akcji) | zrobione, dowód na urządzeniu | 8433acb | brak modelu geometrii w interpreterze; kontrole scenariuszy zielone. Dwa `swipe` w treści (start 55 %) do końca przewijania przed stuknięciem — `paddingBottom` treści = strefa + odstęp (`src/ekrany/Licznik.tsx:152`) |
| 2 · 024 diagnoza (instrumentacja) | zrobione, czeka na przebieg | 3bc778d | `tests/ekrany/e2e-ramki-kolumny.test.tsx`: czerwony (brak `e2e-ramki-kolumny`) → zielony; poza E2E brak tekstu i `onLayout` (`m3-fix-reaudit-024-ipad-kolumna.test.tsx`) |
| 2 · 024 poprawka | czeka na ramki z przebiegu (`workflow_dispatch` `jakosc-ios.yml`, znacznik `[e2e-ipad]`) | — | — |
| 1 · AX5-wzór | STOP do koordynatora: `docs/design/` nie rozstrzyga układu nagłówka i wskazówki wzoru przy AX5 (design-spec Dzianina:57 tylko pasek −1/rząd/+1 od AX1; archiwum „Wzór, rysik i iPad” W1a bez reguły) | — | — |

Odczyt ramek po przebiegu: log Maestro części iPada (`e2e-ramki-kolumny kolumna x,y,w,h; …`), zrzut `44-ipad-poziomo-ramki`, hierarchia kroku `assertVisible e2e-ramki-kolumny`.
Instrumentację (`src/kompozycja/e2e/ramki.tsx`, `onLayout` w `WzorLicznik.tsx`, kroki w scen. 44, wiersz w `e2e/README.md`) usunąć po poprawce 024 i zielonym 44.

Odstępstwo: `src/ekrany/WzorLicznik.tsx` importuje `paneleE2e` z `src/platforma/tryb-e2e.ts` (dotąd tylko `app/` i `src/kompozycja/`) — `WzorPrzegladarka.tsx` (20 429 B) i `app/wzor.tsx` (20 478 B) nie mają miejsca na przekazanie przez propsy bez wydzielenia (P-364); `granice.mjs src` bez naruszeń.

Następny krok: odpowiedź koordynatora na STOP AX5 (opcja) i ramki 024 z przebiegu.
