# Przewodnik po funkcjach — stan roli 08 (sesje P i T, 2026-11-10)

Rola 08 build, KO-027; specyfikacja 04: `docs/design/przewodnik-2026-11-10.md`. Gałąź `claude/p-przewodnik-kod-2026-11-10` (start 9a26512 = d8438ec + zrzut ścieżki 04).

## Zrobione
- Domena: `src/domena/przewodnik.ts` (6 kroków, 9 grup, 42 funkcje, trasy i zapasy z `tresc.json`; `przeczytaneZZapisu`, `dodajPrzeczytana`, `postep`, `celPokaz`).
- Zapis: `src/przypadki-uzycia/przewodnik.ts`, klucz `ustawienie.przewodnik_przeczytane` (stan urządzenia, P-690).
- Ekran: `src/ekrany/Przewodnik.tsx`, trasa `app/przewodnik.tsx` (P-686–P-688, P-691); iPad: kolumna `Bezpieczny` (P-694).
- Wejścia: „Dziś” `nav-przewodnik` (symbol z podpisem przed zębatką, od AX3 nad tytułem), Ustawienia `ustawienia-przewodnik` nad „Help”; „Help” → `lifepreserver` (P-685).
- i18n: 61 kluczy `przewodnik.*` × 33 języki (fala 09, P-700), „→” jako separator drogi (P-693).
- Testy: `tests/domena/przewodnik-tresc.test.ts` (44), `tests/dane/przewodnik-przeczytane.test.ts` (5), `tests/ekrany/przewodnik.test.tsx` (8), `tests/ekrany/przewodnik-okablowanie.test.tsx` (4, T) — każdy najpierw czerwony na zaślepce (asercje) albo sprawdzony mutantem, potem zielony.
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
- 04: spec §3 nie opisuje wyjątku „Pokaż” → Ustawienia (`dismissTo` tylko z wejścia z Ustawień, P-708); „ok. 70 znaków” w §5 przy kolumnie 640 pt to ok. 66 (P-694) — nie zmieniane (KO-030 dopuszcza tylko szerokość).
- 07: scenariusz 70 z twardą asercją `ustawienia-przewodnik-wartosc` (P-705) i `dismissTo` na stosie (P-704, korekta P-708) — pierwszy przebieg na macOS (build 4).
- Poza zakresem T (nie robione): Q-002 (krój tytułów, 1.0.1), przegląd rodzimy tłumaczeń.
- Zauważone, poza zakresem: przy 320 pt w uprzęży web „+1” karty „Dziś” wystaje poza ekran (układ karty, nie paska; do sprawdzenia na urządzeniu — w web inne kroje).

## Stan po sesji T (gałąź `claude/t-przewodnik-2026-11-10`, start 01f05a2)
- Klucze `przewodnik.*` mają 33 języki (fala 09, P-700); wyjątek P-692 zdjęty, w kodzie i testach go nie ma.
- Scalono R (E2E 69–70, znacznik „Jakość · iOS”, a1ebb8a); decyzje P-696, P-697, P-700 bez zmian.
- Q-001 (P-704): „Pokaż” funkcji Ustawień z przewodnika → `dismissTo('/ustawienia')`. Q-003 (P-707): test okablowania postępu i paska od AX3. R-70 (P-705): `ustawienia-przewodnik-wartosc`, twarda asercja „1 of 42”. S-slownik (P-706): pl `krok_3` „Robótka obok liczby rośnie do celu.”. KO-030: kolumna iPad 640 pt w spec §5, P-693 przyjęte.
- Bez zmian, poza zakresem: Q-002 (krój tytułów przewodnika, 1.0.1; `src/ekrany/Przewodnik.tsx:20,22,29` bez `krojTytulowy(jezyk)`).

## Stan po sesji V (gałąź `claude/t-przewodnik-2026-11-10`, start 068eaa2; rola 08 fix, KO-031 i KO-030)
- 08-programista-001 (P2, opcja a, P-708 „do weta”): `app/ustawienia.tsx` otwiera przewodnik z `z=ustawienia` (`WEJSCIE_Z_USTAWIEN`, `src/domena/przewodnik.ts`); `app/przewodnik.tsx` robi `dismissTo('/ustawienia')` tylko z tym parametrem, w pozostałych wejściach (w tym „Dziś”) `push`. Poprzednia wersja (P-704) zastępowała przewodnik ekranem Ustawień także po wejściu z „Dziś”.
- Test na stanie stosu: `tests/ekrany/przewodnik-stos.test.tsx` (3 testy; reduktor `StackRouter` expo-router 57.0.27, akcje PUSH i POP_TO, prawdziwe trasy `app/ustawienia` i `app/przewodnik`). Na 068eaa2 czerwony (wejście z „Dziś”: oczekiwano `(zakladki) > przewodnik > ustawienia`, jest `(zakladki) > ustawienia`), po poprawce zielony. `przewodnik.test.tsx`: Q-001 i test Oczko Pro z parametrem `z=ustawienia`, nowy test `push` bez parametru.
- 08-programista-002 (P3): w spec 04 §5 znacznik `[DO USTALENIA 08]` przy 640 pt zastąpiony „rozstrzygnięte P-694, KO-030”; poza tym dokumenty 04 bez zmian.
- Maestro 69 i 70: bez zmian. 69 wchodzi z „Dziś” i nie stuka „Pokaż” funkcji Ustawień; 70 wchodzi z Ustawień (`ustawienia-przewodnik`), a przejście `nav-wstecz` → `ustawienia` działa jak dotąd (`push` z parametrem, „Wstecz” cofa o jeden ekran). Żaden krok nie dotyka gałęzi `dismissTo`.
- Otwarte (bez zmian): stos na urządzeniu i parametr `z` przez prawdziwy `linkTo` — dopiero przebieg iOS (build 4); Q-002; przegląd rodzimy tłumaczeń; wejście „Dziś” w teście stosu odtworzone wywołaniem `router.push('/przewodnik')` (`app/(zakladki)/index.tsx:96`), nie renderem trasy „Dziś”.
