# ZR1 — rola 10-wydanie (fix): komplet zrzutów sklepu po porażce testu ramek (2026-11-19)

Model: sonnet. Pułap: 1,5 USD. Gałąź: `claude/zr1-zrzuty-2026-11-19` od `e3e7fe9e` (integracja `claude/youthful-pasteur-kx83sn`).
Decyzja koordynatora: KO-176 (do weta). Pula P: P-989…P-990.

## Diagnoza koordynatora (sprawdź, nie przyjmuj na wiarę)
Przebieg zrzuty-sklepu 44505569101 (dispatch z integracji, en,pl; iphone,ipad): plan, build i 4 zadania zrzutów **zielone**, artefakty `zrzuty-surowe-{iphone,ipad}-{1,2}` (ok. 1,7–1,95 MB każdy, 7 dni). Zadanie „komplet” (job 135555182646) czerwone:
1. Krok „Test ramek…”: `tests/wydanie/ramki-sklepu.test.ts:76` — oczekiwano `/^1320x2868 srgb$/`, otrzymano `"1320x2868 srgb  3.0"`. Runner ubuntu ma teraz ImageMagick 7.1.2-18 (log kroku instalacji), gdzie `%[channels]` zwraca `srgb  3.0`. Test ma 3 takie asercje (wiersze 76–78). Skrypty produkcyjne (`ramki-sklepu.sh`, `kontrola-zakreslen.mjs`) używają tylko `%w %h` — sprawdź, czy nic innego nie zależy od formatu `%[channels]`.
2. Skutek, nie druga przyczyna: krok „Kanał alfa precz” nie ma `if: always()`, więc po porażce testu nie przeniósł `surowe/` do `sklep-zrzuty-surowe/`; krok ramek (always) zobaczył pusty katalog, artefakt `sklep-zrzuty-surowe` = 195 B (sam znacznik dat).

## Zadanie
A. Test: asercje przyjmują oba formaty (IM6 `srgb`, IM7 `srgb  3.0`), ale nadal odrzucają alfę (`srgba` / 4 kanały). Bez osłabiania sprawdzenia „bez alfy”. Dodaj przypadek, że obraz z alfą jest odrzucany przez dopasowanie, jeśli go nie ma.
B. Ponowny komplet bez ponownych zrzutów na macOS: dodaj do `zrzuty-sklepu.yml` wejście `zrzuty_z_przebiegu` (numer przebiegu TEGO workflowu): plan ustawia zero zadań macOS i bez builda, a zadanie „komplet” pobiera `zrzuty-surowe-*` z tego przebiegu (`run-id`, `github-token`) zamiast z bieżącego. Wzór: istniejące `uzupelnij_z_przebiegu` / `aplikacja_z_przebiegu`; analogia Trening `store-screenshots.yml`, jeśli ma podobne. Pusty artefakt źródłowy = czerwony plan z jawnym `::error::`. Test dla nowej ścieżki w istniejącym stylu testów workflowu.
C. Lokalnie: `npm ci`, `npm test` dla zmienionych testów; jeśli możesz zainstalować ImageMagick 7 (lub dostępną wersję), uruchom `OCZKO_WYMAGAJ_IMAGEMAGICK=1 npx jest tests/wydanie/ramki-sklepu.test.ts`, wynik w raporcie. `npm run typecheck`, `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog`.
D. Push gałęzi. **Nie** dispatchuj workflowów — zrobi to koordynator (`zrzuty_z_przebiegu=44505569101`).

## Zakazy
Bez App Store Connect, bez `main`, bez force-push, bez usuwania gałęzi i artefaktów, bez zmian klas/progów PU, nigdy `--no-verify`. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919); przed commitem `git diff --cached`. GitHub tylko przez MCP `mcp__github__*`. Bez kwarantanny (rola 10 może czytać kod).

## Raport (ostatnia wiadomość)
SHA, lista plików, wyniki testów (liczby z wyjścia), wynik kontroli 2, odpowiedź na pytanie z punktu 1 (inne zależności od `%[channels]`), ryzyka.
