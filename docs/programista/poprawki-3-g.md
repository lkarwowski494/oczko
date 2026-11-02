# Poprawki 3, sesja G (rola 08, tryb fix; 2026-11-02)

Gałąź: `claude/kopia-poprawki-g-2026-11-02` (baza: robocza 2a83370). Polecenie: `oczko-warsztat` 255950b `koordynacja/role-2026-11-01/08-poprawki-3.md`, sekcja G. Na roboczą nie pushowano. Zatwierdzone: P-361 (poz. „strażnik w testflight.yml”), aneks partii 8 poz. 8 (P-360).

## Wynik
| ID | Klasa | Commit | Test | Przed → po |
|---|---|---|---|---|
| G-2 · strażnik ikony zegarka w `testflight.yml` (P-350) | D | a99bdd6 | `tests/jakosc/ikona-zegarka-prebuild.test.ts` › „testflight.yml (P-350 …)” | czerwony („Expected: > 8, Received: -1” — brak kroku) → zielony; krok po `expo prebuild`, przed numerem buildu, podami i archiwum, z `set -o pipefail` |
| G-1 · menu licznika oczek bez Goal, Repeat, trybu (aneks 8, poz. 8; 025) | D (już naprawione) | 79de393 | `tests/ekrany/menu-oczka.test.tsx` (12 testów) | **bez czerwonego „przed”**: zachowanie wdrożył c034efc (flaga `oczka` w `MenuProjektu.tsx:28,31–36,38`; trasa `app/menu.tsx` przekazuje `oczka: w.rodzaj === 'oczka'`). Nowy test dopina pokrycie, którego brakowało (Repeat `menu-powtorzenie`, Reminders z liczbą planów `menu-przypomnienia`, sprawdzenie po tekście en i testID, porównanie ze zwykłym licznikiem). Czułość sprawdzona mutacją: usunięcie `!s.oczka` z Goal, Repeat i Reminders → 4 czerwone testy (3 nowe + 1 z `licznik-oczek.test.tsx`); plik przywrócony. |

## Dowód bramki
`env -u NODE_PATH npm run verify` kod 0 — 328 zestawów, 3228 testów (baza: 327 / 3215). `tabela-08.md` zregenerowana (nowy plik testów).

## Uwagi
- G-1: polecenie traktuje to jako brakującą funkcję; w kodzie ukrycie istnieje od 07-jakosc-025. Mockup `licznik-oczka-menu` pokazuje też pozycje „History” i inne teksty menu (np. „Rename”, „Lock counter”, „Reset to 0”) — makieta opisuje je jako „ilustrację” (`aneks8.html`, adnotacja przy menu), więc ich nie zmieniano; „History” jest w aplikacji ikoną w pasku nawigacji, nie pozycją menu.
- G-2: niczego nie uruchomiono na macOS; krok sprawdzony testem kontraktu (YAML) i istniejącym testem skryptu na prawdziwym `project.pbxproj` z prebuild.
- Przegląd subagentem (ścieżka wrażliwa: `.github/workflows/`): **nieodbyty** — w tej sesji zmiana workflowu to jeden krok kopiowany 1:1 z `jakosc-ios.yml:146–150`; przegląd zostawiony koordynatorowi (do decyzji).
