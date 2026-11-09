# M3 build 2 — stan roli 08 i przekazanie 024 (2026-11-09)

Polecenie: `oczko-warsztat` `koordynacja/role-2026-11-09/08e-build2.md` @ 5e5fe60 (P-629, P-630). Gałąź `claude/kopia-08-build2-2026-11-09` (baza b4518bbf, ostatni kod 61adee2).
Tożsamość commitów: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez trailerów (P-507). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip.
Stan wyjściowy: `jest --ci` 562 zestawy / 6890 testów, kod 0. Ostatni `npm run verify` (61adee2): kod 0 — 565 zestawów / 6897 testów (z `jakosc:kontrole`).

## Zrobione

| Zad. | Stan | Commit | Test przed → po |
|---|---|---|---|
| 3 · e2e 64 („…use the timer.”) | zrobione (koordynator: cherry-pick na integrację) | 8729b94 | `tests/jakosc/e2e-zdania-en.test.ts`: czerwony (64: zdanie spoza słownika en) → zielony; trwała kontrola zdań en w `assertVisible` |
| 4 · e2e 34 („Next part” pod strefą akcji) | zrobione, dowód na urządzeniu (cherry-pick na integrację) | 8433acb | interpreter nie liczy geometrii; kontrole scenariuszy zielone. Dwa `swipe` w treści (start 55 %) do końca przewijania — `paddingBottom` treści = strefa + odstęp (`src/ekrany/Licznik.tsx:152`) |
| 1 · AX5-wzór, opcja A (właściciel, 9.11) | zrobione, przyjęte; wysokość wzoru potwierdzi E2E 30 | f2fadde (strukturalny: `src/ekrany/WzorTytul.tsx`), 61adee2 (zachowanie) | `tests/ekrany/m3-build2-ax5-wzor.test.tsx` (fontScale 3,571): czerwony (`maxFontSizeMultiplier` undefined zamiast 1,8) → zielony; `wzor-zrodlo` w jednej linii, karta wskazówki z limitem 1,8 |
| 2 · 024 diagnoza (instrumentacja) | zrobione; przebieg 42678725514 (`[e2e-ipad]`, e6bd782) | 3bc778d | `tests/ekrany/e2e-ramki-kolumny.test.tsx`: czerwony (brak `e2e-ramki-kolumny`) → zielony; poza E2E brak tekstu i `onLayout` (`tests/ekrany/m3-fix-reaudit-024-ipad-kolumna.test.tsx`, ostatni test) |
| 2 · 024 poprawka | **do nowej sesji 08** | — | — |

## 024 — przekazanie

**Wada (przebieg 5, run 42601620032, scen. 44, zrzut `oczko-warsztat` `redesign/M3-2026-11-05/zrzuty/p5/ipad-poziomo-WADA-024.png`):** iPad poziomo, kolumna `wzor-kolumna-licznika` (`src/ekrany/WzorLicznik.tsx`, gałąź `if (obok)`) pokazuje kartę liczby i „Now working row 1”, ale w hierarchii nie ma `wzor-kolumna-przyciski` ani −1/+1. Jest nie odtwarza (brak Yoga); test struktury i jawnych rozmiarów: `m3-fix-reaudit-024-ipad-kolumna.test.tsx`.

**Instrumentacja (tylko build E2E, P-238):**
- `src/kompozycja/e2e/ramki.tsx` — hak `useRamkiE2e(nazwy, okno)` i `TekstRamek` (testID `e2e-ramki-kolumny`, absolutnie na górze kolumny, bez stuknięć); eksport w `src/kompozycja/e2e/panele.tsx`.
- `src/ekrany/WzorLicznik.tsx` — import `paneleE2e` z `src/platforma/tryb-e2e.ts`, stała `RAMKI_KOLUMNY`, `onLayout={z('…')}` na kolumnie, bloku liczby, wypełniaczu (testID `wzor-kolumna-wypelniacz`), parze przycisków, −1, „+1”.
- `e2e/scenariusze/44-br-wzr-005-s2-ipad-poziomo-pionowo.yaml` — przed pierwszym „+1”: `takeScreenshot 44-ipad-poziomo-ramki`, `assertVisible e2e-ramki-kolumny`, `copyTextFrom`, `evalScript console.log`.
- `e2e/README.md` — wiersz `e2e-ramki-kolumny`.

**Format tekstu:** `kolumna x,y,w,h; blok …; wypelniacz …; przyciski …; minus …; plus …; okno WxH fs S` — `onLayout` (pt, zaokrąglone) **względem rodzica**: kolumna względem kontenera ekranu wzoru, blok/wypełniacz/przyciski względem kolumny, minus/plus względem pary; „-” = brak zdarzenia `onLayout` (widok niezmierzony, np. nie zamontowany).

**Gdzie czytać (run 42678725514):** `gh api repos/lkarwowski494/oczko/actions/runs/42678725514/artifacts` → artefakt `e2e-czesc-1-ipad`: (1) log Maestro — linia z `e2e-ramki-kolumny kolumna …` (z `console.log`); (2) zrzut `44-ipad-poziomo-ramki.png`; (3) hierarchia `screen-hierarchy/step-*.json` kroku `assertVisible e2e-ramki-kolumny` — tekst elementu i ramki `wzor-kolumna-*`. Jeśli `assertVisible e2e-ramki-kolumny` padł, tekst jest w hierarchii kroku błędu (albo brak — wtedy sama kolumna nie ma wysokości/jest poza ekranem: patrz ramki w hierarchii).

**Jak interpretować (hipotezy do potwierdzenia ramkami, nie zgadywać):**
- `kolumna` y + h > `okno` H → kolumna wyższa niż ekran, para pod dolną krawędzią (np. rodzic bez ograniczenia wysokości) — poprawka w kontenerze/kolumnie (`flex: 1`/`maxHeight`).
- `przyciski` / `minus` / `plus` = „-” → para nie zamontowana albo bez układu — sprawdzić warunki renderu.
- `przyciski` h = 0 albo w ≈ 0 → para ściśnięta (flexShrink/flexBasis) mimo `flexShrink: 0`.
- `wypelniacz` h duże i `przyciski` y ≥ H kolumny → wypełniacz zabiera miejsce parze.
- Porównaj z wymiarami z tokenów: kolumna `tokeny.cele.paskaWzoru.kolumna.szerokosc`, „+1” `plusWysokosc` 200 (168–240).

**Plan poprawki:** (1) test czerwony z właściwego powodu odtwarzający mechanizm wskazany ramkami (struktura/style w Jest; geometria tylko na urządzeniu); (2) minimalna poprawka w `WzorLicznik.tsx`; (3) `npm run verify` kod 0 (po nowym teście regeneruj `node docs/jakosc/narzedzia/tabela-08.mjs --wynik docs/jakosc/e4/tabela-08.md`); (4) push, SHA do koordynatora → przebieg `[e2e-ipad]`; (5) po zielonym 44 **usuń instrumentację** osobnym commitem: `ramki.tsx`, eksport w `panele.tsx`, import `paneleE2e` + `RAMKI_KOLUMNY` + `onLayout` w `WzorLicznik.tsx` (testID wypełniacza może zostać), 4 kroki w scen. 44, wiersz README, test `e2e-ramki-kolumny.test.tsx` i ostatni test w `m3-fix-reaudit-024-ipad-kolumna.test.tsx`; `verify` kod 0.

**Uwaga od koordynatora:** na integracji zmiana nazwy `src/ekrany/liczba.ts` → `liczbaKomorki.ts` (kolizja wielkości liter z `Liczba.tsx`, TS1261 na macOS) — nie dodawaj importów `./liczba`. Push na tę gałąź nie uruchamia `jakosc-ios.yml` (gałąź spoza listy `push`); przebieg tylko `workflow_dispatch` przez koordynatora.

## Odstępstwa i znaleziska

- Odstępstwo: `WzorLicznik.tsx` importuje `paneleE2e` z `src/platforma/tryb-e2e.ts` (dotąd tylko `app/` i `src/kompozycja/`) — przekazanie propsami wymagałoby wydzielenia z `app/wzor.tsx` (20 478 B); `granice.mjs src` bez naruszeń. Znika z instrumentacją.
- Nowe znaleziska (nie naprawiane, tryb fix): tytuł-przełącznik ▾ przy ≥ 2 wzorach bez limitu skali (`src/ekrany/WzorTytul.tsx:20`, wariant jednego wzoru ma 1,8) — P2; karty nad wzorem bez limitu skali — podgląd Worda (`src/ekrany/WzorPrzegladarka.tsx:160`) i pasek notatki bez znacznika (`:166–167`) mogą przy AX5 zabrać wzorowi wysokość jak wskazówka — brzegowe, nieodtworzone, do 04.

Następny krok (nowa sesja 08): ramki z run 42678725514 → poprawka 024 wg planu wyżej.
