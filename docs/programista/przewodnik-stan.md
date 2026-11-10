# Przewodnik po funkcjach — stan roli 08 (sesja P, 2026-11-10)

Rola 08 build, KO-027; specyfikacja 04: `docs/design/przewodnik-2026-11-10.md`. Gałąź `claude/p-przewodnik-kod-2026-11-10` (start 9a26512 = d8438ec + zrzut ścieżki 04).

## Zrobione
- Domena: `src/domena/przewodnik.ts` (6 kroków, 9 grup, 42 funkcje, trasy i zapasy z `tresc.json`; `przeczytaneZZapisu`, `dodajPrzeczytana`, `postep`, `celPokaz`).
- Zapis: `src/przypadki-uzycia/przewodnik.ts`, klucz `ustawienie.przewodnik_przeczytane` (stan urządzenia, P-690).
- Ekran: `src/ekrany/Przewodnik.tsx`, trasa `app/przewodnik.tsx` (P-686–P-688, P-691); iPad: kolumna `Bezpieczny` (P-694).
- Wejścia: „Dziś” `nav-przewodnik` (symbol z podpisem przed zębatką, od AX3 nad tytułem), Ustawienia `ustawienia-przewodnik` nad „Help”; „Help” → `lifepreserver` (P-685).
- i18n: 61 kluczy en/pl, `oczekujace.json`, wyjątek nazwany build 4 (P-692), „→” (P-693).
- Testy: `tests/domena/przewodnik-tresc.test.ts` (44), `tests/dane/przewodnik-przeczytane.test.ts` (5), `tests/ekrany/przewodnik.test.tsx` (7) — każdy najpierw czerwony na zaślepce (asercje), potem zielony.
- Zrzuty (P-695, uprząż react-native-web): `docs/programista/przewodnik-zrzuty/` — `dzis`, `ustawienia`, `przewodnik-kroki`, `przewodnik-biblioteka` × 390/320 × jasny/ciemny (pl).

## Kryteria §11 (Intuicyjność)
| Kryterium | Wynik | Dowód |
|---|---|---|
| (1) wejście widać bez szukania | spełnione przy 390 i 320 pt (jasny, ciemny); AX5 niesprawdzone (web) | `dzis-390-*.png`, `dzis-320-*.png`: „? Przewodnik” obok zębatki w pasku, bez przewijania; test `nav-przewodnik` z podpisem |
| (2) ≤ 2 stuknięcia do ekranu | spełnione | `tests/ekrany/przewodnik.test.tsx`: krok „Show” = 1, funkcja rozwiń + „Show” = 2; Apple Watch bez „Show” |
| (3) kroki na górze, rozwinięte; grupy nazwami z interfejsu | spełnione | `przewodnik-kroki-*.png`; test: nazwy grup i funkcji = klucze używane w `app/`, `src/` |
| (4) zdania krótkie, nazwy z interfejsu | spełnione (treść 04) | test cytatów w 35 słownikach; kontrola negatywna (podmieniona nazwa pl wywraca test) |
| (5) bez nakładki | spełnione | przewodnik tylko jako trasa pchana z dwóch wejść; nic nie otwiera się samo |

## Otwarte
- Urządzenie (właściciel): symbole `questionmark.circle` i `lifepreserver`, Dynamic Type AX3–AX5 (pasek nad tytułem), VoiceOver, iPad.
- 07: scenariusze E2E według §6 (testID gotowe).
- 09: 61 kluczy × 33 języki; potem usunąć `tests/i18n/wyjatek-build4.ts` i jego użycia.
- 04: kolumna 640 zamiast 672 (P-694), „→” w krokach (P-693).
- Zauważone, poza zakresem: przy 320 pt w uprzęży web „+1” karty „Dziś” wystaje poza ekran (układ karty, nie paska; do sprawdzenia na urządzeniu — w web inne kroje).
