# Stan sesji BX (07-jakosc build, moduł e2e-mobilne) — katalog przypadków użycia jako zestaw e2e po każdym buildzie

Aktualizacja: 2026-11-15. Gałąź: `claude/bx-katalog-e2e-2026-11-15` (start: integracja `claude/youthful-pasteur-kx83sn` @ a117ded0). Polecenie: `origin/koordynacja:docs/koordynacja/polecenia/BX.md` @ 42d20ce1.

## Zadania polecenia (pkt 5)
| Nr | Zadanie | Stan | Dowód / plik |
|---|---|---|---|
| 1 | Katalog `docs/jakosc/przypadki-uzycia.md` | patrz „Liczby” niżej | bramka `tests/jakosc/przypadki-uzycia.test.ts` |
| 2 | Automatyzacja klasy B | patrz „Liczby” | scenariusze `e2e/scenariusze/7x-pu-*.yaml` z tagami `przypadki-uzycia`, `oczekujacy`, `PU-NNN` |
| 3 | Uruchamianie po każdym buildzie | zrobione (lokalnie; przebieg CI wyzwala koordynator) | `scripts/ci/e2e-czesci.mjs` (pakiet domyślny `przypadki`), `jakosc-ios.yml` (macierz 4 części), `docs/jakosc/bx-dowod-czerwony.txt`, P-834 |
| 4 | Lista fizyczna `docs/wydanie/test-fizyczny.html` | generator gotowy: `node scripts/wydanie/test-fizyczny.mjs` | publikacja Artifact — link w PRZEKAZANIU |
| 5 | Zasada utrzymania w strategii | zrobione | `docs/jakosc/strategia.md` §6 (wiersz P-835) i §12 |
| 6 | verify 0, recenzja niezależna | patrz niżej | `docs/jakosc/bx-verify.txt`, `docs/jakosc/bx-recenzja.md` |

## Decyzje (pula P-834…P-838; wpisy w `docs/decyzje.md`, do weta)
- P-834 pakiet domyślny = katalog przypadków użycia, bramka = wszystko poza `oczekujacy`, iPad przy każdym przebiegu, 4 części.
- P-835 katalog `.md` jako źródło prawdy + bramka w verify + zasada utrzymania.
- P-836 nowe scenariusze BX z tagiem `oczekujacy` do pierwszego zielonego przebiegu (wyjątek nazwany).
- P-837, P-838: wolne.

## Jak zdjąć tag `oczekujacy` (następna sesja 07 albo 08)
1. Koordynator wyzwala „Jakość · iOS” na gałęzi (push ze zmianą w `e2e/**` albo `workflow_dispatch`, znacznik dowolny — katalog biegnie zawsze).
2. Dla każdego scenariusza „zielony” w podsumowaniu części: usuń tag `oczekujacy`, w katalogu zmień klasę B → A i „oczekujący: plik:linia” → „plik:linia”, popraw linię „Podsumowanie”, wpisz wagę z logu do `e2e/czesci.json`.
3. „czerwony-informacyjnie”: zrzut kroku, klasyfikacja (aplikacja / scenariusz / maszyna); błąd aplikacji = znalezisko dla 08, scenariusz zostaje czerwony.

## Liczby i następny krok
(uzupełniane na końcu sesji)
