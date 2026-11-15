# BW — recenzja niezależna (WL-1171-01)

Recenzent: subagent bez mojego uzasadnienia; wejście: `git diff a117ded0..HEAD` (commity b3975dd1, 2590e8f1), treść zgłoszenia, reguła „wstecz” (design-spec:136), zasady 10–14. Data: 2026-11-15. Wynik: **brak P1/P2; 3 × P3**.

Co sprawdził: powrót w trzech wejściach (kafel „Dziś”, „Wzór” licznika, ekran projektu z `dodaj`); refaktor bez zmiany zachowania; brak podwójnego „Back” w przeglądarce wzoru (test 3); AX5 (`m3-fix-e5-wzor-ax5`, 66 testów powiązanych zielonych); limit 20 KB (`app/wzor.tsx` 20276 B); granice `granice.mjs` OK; `tsc` kod 0; samodzielny przegląd 28 tras `app/` i komponentów `src/ekrany/` pod kątem ekranów bez powrotu — inwentarz niczego nie pomija.

| Poziom | Uwaga | Rozstrzygnięcie |
|---|---|---|
| P3 | `src/kompozycja/wzor-import-trasy.ts:84`, `app/wzor.tsx`, `src/ekrany/WzorZrodla.tsx`: „Back” aktywny też w oknie „import w toku” z `dodaj`; stuknięcie podczas `czekajNaSiec` zamyka trasę, a potem `if (c.dodajParam) c.wstecz()` robi drugie `router.back()` (zdejmuje ekran projektu). Czytanie kodu, bez uruchomienia. | Brzegowy; ta sama ścieżka istniała wcześniej przez gest od krawędzi (w gałęzi bez wzoru gest nie jest wyłączany), więc „Back” nie tworzy nowego rodzaju błędu. Nie naprawiane w tym zgłoszeniu (minimalny zakres); zgłoszone koordynatorowi jako osobne znalezisko (flaga „opuszczono ekran” w `dodajZrodlo`). |
| P3 | Brak testu dla wejścia z `dodaj` i stanu importu. | Razem z powyższym; test powstanie przy naprawie tego znaleziska. |
| P3 | `app/wzor.tsx:5` nieużywany import `View` (sprzed zmiany; lint obejmuje tylko `src/dane`). | Zostawiony (poza zakresem). |

Uwaga informacyjna: „Back” z menu źródeł wraca na Licznik, nie na „Dziś” (P-588, etykieta = tytuł poprzedniego ekranu) — zgodne z projektem, opisane w inwentarzu i P-830.
