# CA — recenzja niezależna (BY-001…003)

Recenzent: subagent bez mojego uzasadnienia; wejście: `git diff 1e410c9a..HEAD -- app src tests` (stan sprzed poprawek niżej), treść trzech znalezisk BY i zasady 10–14. Data: 2026-11-15. Wynik: **1 × P1, 2 × P2**; brak uwag do danych, i18n, sekretów, anulowania wyboru z `dodaj`, `useBezpiecznyPowrot`, reguły nazwy zapasowej.

| Poziom | Uwaga recenzenta | Rozstrzygnięcie |
|---|---|---|
| P1 | `tests/ekrany/m3-fix-e5-wzor-ax5.test.tsx` (007) czerwony: fixture dawał części projektu roboczego nazwę „Counter from Nov 10” (tekst etykiety), a po BY-002 taka nazwa jest pokazywana jako wpisana | Przyjęte: błąd fixture'a, nie kodu — realny projekt roboczy ma część nazwaną dniem RRRR-MM-DD. Fixture zmieniony na `'2026-11-10'`, asercja bez zmian; test 007 przechodzi |
| P2 | Wyścig BY-003: dwa szybkie stuknięcia kafla zakładały dwa projekty (sprawdzenie poza kolejką) | Przyjęte, odtworzone testem (n = 2, czerwony), naprawione wspólną obietnicą „w toku” (`zakladanie`), test zielony |
| P2 | Analizator `wyjscia-tras` uznaje komponent za mający wyjście, jeśli znacznik jest gdziekolwiek w jego funkcji (także w innej gałęzi lub w alercie) | Znane ograniczenie, opisane w `ca-odlozone.md`; równoważy je mutant na `WzorZrodla.tsx` i test czerwony na a117ded0. Bez zmiany |
| uwaga | „Back” w menu woła `router.back()` bezpośrednio, nie przez hook; okno między stuknięciem a odmontowaniem | Brzegowe (animacja); bez zmiany |
| uwaga | Podwójny `router.push` przy podwójnym stuknięciu kafla — istniał wcześniej | Poza zakresem |

Pełny `npm run verify` na pierwszym przebiegu zatrzymał kontrola rozmiaru: `src/kompozycja/licznik.ts` 21,3 KB > 20 KB (limit ADR-0003). Naprawa strukturalna osobnym commitem (`stanEkranu`, `etykietaRobocza`, `miesiac`, `Jezyk` do `licznik-stan.ts`, re-eksport, bez zmiany zachowania).
