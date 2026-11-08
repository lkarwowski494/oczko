# Testy akceptacyjne: stan przed kodem
Wygenerowano: 2026-11-08T20:19:26.778Z · `node scripts/jakosc/akceptacja-raport.mjs`

Razem 3: asercja 3; błędy raportu: 0.

| Plik | Test | Stan | Fragment wyniku |
|---|---|---|---|
| tests/akceptacja/ekrany/licznik-to-be.test.tsx | ZM-04 / P-580: pięć akcji pod liczbą w kolejności makiety (Notatka, Wzór, Cel, Stoper, Historia) — „Wzór” także bez wzoru | asercja | Error: expect(received).toBe(expected) // Object.is equality |
| tests/akceptacja/ekrany/licznik-to-be.test.tsx | P-580 (a): „Projekt ›” (`licznik-projekt-wejscie`) to osobny przycisk nad nazwą; `licznik-projekt` niesie nazwę | asercja |  |
| tests/akceptacja/ekrany/licznik-to-be.test.tsx | P-583: na liczniku wstecz `nav-wstecz`, bez wejścia do listy `nav-projekty` | asercja |  |
