# Raport dowodów: poprawki znalezisk BH (10-wydanie-001…004) — sesja BI, 2026-11-13
Rola 10-wydanie, tryb fix (prompt przeczytany do `=== KONIEC PROMPTU ROLI ===`). Gałąź `claude/bi-asc-v2-poprawki-2026-11-13` od `347614dc` (HEAD zgodny z poleceniem). `npm ci` kod 0. Żadnych wywołań App Store Connect, workflowów ani scalenia. Status „zweryfikowane” nadaje dopiero reaudit.

Wyjątki nazwane: (1) E0 bez osobnego STOP — klasyfikacja i plan są w poleceniu koordynatora (wszystkie cztery to D, nic typu P/M); (2) „pełny zestaw testów” po każdym ID zastąpiony `npx jest tests/wydanie` (47 zestawów), pełny `npm run verify` raz na końcu; (3) przegląd ścieżek wrażliwych subagentem: zmienione pliki to skrypt ASC (zapisy w sklepie) — przegląd nie odbył się, do uruchomienia przez koordynatora (`git diff 347614dc..HEAD -- scripts/asc tests/wydanie`).

| ID | Test (tests/wydanie/asc-iap-v2.test.ts) | Przed (347614dc / poprzedni commit) | Po | Commit |
|---|---|---|---|---|
| 10-wydanie-001 | `10-wydanie-001: …` (3 testy) | kod 1: 3 nieudane — brak `pl` w nowej wersji (`Received has value: undefined`), brak linii „przeniesienia” w dry-run (`Expected length: 4, Received length: 0`), nowa wersja tworzona mimo nieprzenośnej lokalizacji | kod 0 (`tests/wydanie`: 645 passed) | 97b493f7 |
| 10-wydanie-002 | `10-wydanie-002: …` (4 testy) | kod 1: 4 nieudane — komunikat `POST /v1/{id}` | kod 0 (649 passed) | 45f11f2f |
| 10-wydanie-003 | `10-wydanie-003: …` (5 testów) | kod 1: 1 nieudany (brak opisu REJECTED w P-789); 4 testy stanów od razu zielone — to luka pokrycia, nie defekt kodu | kod 0 (42 passed w pliku) | 95f76595 |
| 10-wydanie-004 | `10-wydanie-004: …` (2 testy) | kod 1: 2 nieudane (brak zdania w przebiegu) | kod 0 (656 passed) | 97fe0f46 |
| P-794 | — | — | — | c7fa8697 |

Pełny zestaw: `npm run verify` na `c7fa8697`+log: **kod 0**, 607 zestawów, 7380 testów (`dowody-bi/verify-bi.txt`). Surowe wyniki: `docs/wydanie/asc-v2/dowody-bi/NNN-przed.txt`, `NNN-po.txt`.

## Szczegóły
- **001** (`scripts/asc/iap-localizations.mjs`, `lokalizacjeDoPrzeniesienia`): kopiowane są wszystkie lokalizacje starej wersji, których plan nie zapisuje (obca, `czeka`, błąd planu). Dry-run wypisuje je w planie. Lokalizacja bez `name` → wersja nie powstaje, PROBLEM, kod 1. Ponowne wyszukanie mechanizmu: `grep -n "obceStare\|plan.extra" scripts/asc` → 1 trafienie (log „obce”, bez wpływu na zapis). Decyzja P-794.
- **002**: maska tylko dla segmentów z cyfrą lub myślnikiem (`/\/(?=[A-Za-z_]*[\d-])[0-9A-Za-z_-]{6,}/g`); `grep -n "replace(/" scripts/asc/*.mjs` → linia 67 ma osobną, poprawną maskę, `metadane.mjs:40` to escape regexu.
- **003**: P-789 dopisek (REJECTED/DEVELOPER_REJECTED → nowa wersja robocza; zachowanie Apple po odrzuceniu `[DO USTALENIA]`).
- **004**: zdanie w kroku 3 `przebieg-wlasciciela.md` z cytatami Apple (odczyt 2026-11-13, z `bh-2026-11-13/dowody/apple-cytaty.txt`); wniosek o widoczności oznaczony jako odczytanie opisu, nie zdanie Apple.

## Nie sprawdzono
Zachowanie prawdziwego App Store Connect (atrapa wg dokumentacji; pierwszy dowód to dry-run właściciela). Przegląd subagenta ścieżek wrażliwych (wyżej).

## Nowe znaleziska
Brak.
