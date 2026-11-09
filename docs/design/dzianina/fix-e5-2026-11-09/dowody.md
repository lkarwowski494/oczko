# Fix E5 roli 04 — dowody (2026-11-09)
Gałąź `claude/kopia-04-fix-e5-2026-11-09` od 8ec4a579. Zmiany tylko w `docs/design/`. Odczyt `src/` i `app/` do potwierdzenia stanu (wyjątek nazwany jak P-598).

| ID | Zmiana w projekcie | Przed / po (390, ten sam motyw i rozmiar) |
|---|---|---|
| 004 | karta „Dziś” od AX3: liczba z „+1” 100 pt na górze | `przed/dzis-390-jasny-ax5.png` / `po/dzis-390-jasny-ax5.png` (też `-ciemny-ax5`, `dzis-limit-*`) |
| 016 + LIC-04 | stała strefa nad treścią, dolny odstęp = strefa; AX3+: liczba pod paskiem | `przed/licznik-390-ciemny-ax5.png` / `po/licznik-390-ciemny-ax5.png`; nowy stan `po/licznik-cel-390-jasny.png` |
| 015 | iPad poziomo kolumna 280, „+1” 168×200; pionowo „+1” 480×52; wąskie 199×52 | `po/ipad-poziomo-jasny.png`, `po/ipad-pionowo-jasny.png`, `po/ipad-waskie-ciemny.png` (przed: warsztat `04-studio/2026-11-09-e5/dowody/zrzuty/ipad-44-ipad-poziomo.png`) |
| 009 | menu pozycje 44, arkusz jako lista grupowana | `przed/projekt-menu-390-jasny.png` / `po/projekt-menu-390-jasny.png`; nowy stan `po/licznik-menu-390-jasny.png` |
| 010 | wiersze min. 44 (radio, wiersze projektu) | `przed/formularz-narzedzie-390-ciemny.png` / `po/formularz-narzedzie-390-ciemny.png` |
| P-590 | dzień dziergany bez faktury | `przed/historia-390-jasny.png` / `po/historia-390-jasny.png` |
| 006, 014 | tylko spec i tokeny (makieta już miała „‹ Nazwa” w `akcentTekst`) | `../design-spec.md` sekcja „Fix E5” |

Arkusze: `przed-po.png`, `przeglad.png`. Kontrast: `node ../narzedzia/kontrast.mjs kontrast-pary.json` → kod 0 (256 par, bez nowych barw). Zrzuty wzorcowe: `node ../narzedzia/dzianina-zrzuty.mjs ekrany.html wzorce-zrzuty` kod 0 (96 plików, w tym 8 nowych). Ekrany niezmienione w tym fixie (oferty, oferty-czeka, zdjęcie, wzór, formularz-część) przywrócone z HEAD: obecny renderer daje różnice pikseli także tam, gdzie makieta się nie zmieniła — nowe znalezisko niżej.

Nowe znaleziska (nie naprawiane): (N1) linia bazowa `wzorce-zrzuty/` nie jest odtwarzalna bit w bit — ponowny render niezmienionych ekranów różni się (np. `zdjecie-390-jasny` ok. 20 tys. pikseli o różnicy > 40); do sprawdzenia, czy to wersja Chromium, czy wcześniejsza zmiana makiety bez regeneracji. P2, brzegowe.
