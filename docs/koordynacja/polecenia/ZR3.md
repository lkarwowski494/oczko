# ZR3 — rola 10 fix (wydanie): dane scen zrzutów pod uwagi WR2 (2026-11-20)

Model: sonnet. Pułap: 2,5 USD. Gałąź: `claude/zr3-sceny-zrzutow-2026-11-20` od integracji `claude/youthful-pasteur-kx83sn` @ 986d1fbe. Decyzja: KO-184 (do weta). Pula P: P-998…P-999.

## Kontekst
Werdykt WR2 (`docs/jakosc/werdykt-build-1221.md`, sekcja „Zrzuty sklepu — ponowny przegląd, P-992”; `docs/jakosc/werdykt-1221/og07-zrzuty-wr2.md` pkt 4): zrzuty 44677685872 DO SKLEPU Z UWAGAMI. Wybrany wariant B — jedna zbiorcza powtórka. Binarka do Apple to nadal 1221 (KO-180): **nie zmieniaj `app/` ani `src/`** poza danymi/fiksturą trybu zrzutów, jeśli bez tego się nie da (wtedy uzasadnij w P-998).

## Zadania (tylko dane scen, fikstury, podpisy en/pl i ich testy)
1. **P2 znacznik:** etykieta „Row/Rząd N ↓” ma stać na wierszu wzoru o tym samym numerze. Wybierz tańszy z wariantów i zapisz w P-998: (a) licznik fikstury tak, by rząd w robocie odpowiadał istniejącemu wierszowi wzoru (np. 20 gotowych → „Row 21” na wierszu „Row 21”), spójnie we WSZYSTKICH scenach (01 i 02 też pokażą nową liczbę); (b) wzór sklepu z numeracją obejmującą rząd 48. Rekomendacja koordynatora: (a), jeśli nie psuje narracji scen.
2. **P3 zakreślenia:** ruch palca w `00-przygotuj.yaml` i `04-zakreslenie.yaml` od początku tekstu (ok. 8–10% szerokości) do końca wiersza, wysokość trafiająca w jeden wiersz — na iPhonie i iPadzie, en i pl; żadne zakreślenie nie może kończyć się w środku słowa ani stać między wierszami.
3. **U4 (P3):** podpis sceny 04 („notuj”/„write”) — dopasuj podpis en/pl do tego, co kadr pokazuje (bez obietnicy notatki), w `podpisy-zrzutow.json` lub odpowiedniku; pozostałe języki tylko jeśli plik ich wymaga do spójności testów.
4. Testy: istniejące testy scen/podpisów zielone; dodaj test pilnujący zgodności etykiety znacznika z wierszem (na danych sceny/fikstury), jeśli da się to sprawdzić bez macOS.
5. `npm run verify` zielone, kontrola 2 (`node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog`) zielona, push. **Bez dispatchu** — zrzuty uruchomi koordynator.

## Zakazy
Bez App Store Connect, bez `main`, bez force-push, bez dispatchu, bez zmian klas/progów/listy PU, nigdy `--no-verify`. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919); przed commitem `git diff --cached`. GitHub tylko przez MCP `mcp__github__*`.

## Raport
SHA, wybrany wariant P2 i dlaczego, lista plików, wyniki verify i kontroli 2, ryzyka niesprawdzalne bez macOS, koszt.
