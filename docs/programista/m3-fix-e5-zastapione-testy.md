# M3 fix E5 — testy zastąpione jawnie (rola 08, 2026-11-09, P-614, P-615)

Każdy wiersz: test zapisywał zachowanie, które zatwierdzona poprawka 04 świadomie zmienia. Asercja nie jest luzowana — zastąpiona nowym oczekiwaniem z tokenów; stare oczekiwanie w kolumnie „było”.

| Plik:test | Było | Jest | Podstawa |
|---|---|---|---|
| `tests/ekrany/licznik-ax5.test.tsx` „AX5 … liczba i „Now working” nad nazwą projektu” | nazwa projektu < liczba < „Now working” | liczba < „Now working” < nazwa projektu | 016, `licznik.ax3ax5.kolejnosc` (P-613) |
| `tests/ekrany/licznik-akcje.test.tsx` „AX5: akcje jako lista … liczba nad nazwą, bez dzianiny” | nazwa < dzianina < liczba < notatka < akcje | liczba < nazwa < notatka < akcje; `licznik-dzianina` brak | 016, `licznik.ax3ax5.kolumnaDzianiny` = ukryta |
| `tests/ekrany/m3-p4b-kolumny.test.tsx` „AX1: dzianina jako pas … od AX3 (AX5) bez dzianiny” | AX5: pas dzianiny 96 pt | AX5: brak dzianiny; pas 96 sprawdzany przy AX1 | 016, jw. |
