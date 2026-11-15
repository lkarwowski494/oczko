# Stan sesji BX/BX2 (07-jakosc build, moduł e2e-mobilne) — katalog przypadków użycia, bramka KO-065, scenariusze klasy B

Aktualizacja: 2026-11-15 (BX2). Gałąź: `claude/bx-katalog-e2e-2026-11-15`. Polecenia: `origin/koordynacja:docs/koordynacja/polecenia/BX.md` (zakres, słowa właściciela), `…/BX2.md` @ df7b1ccc (zadania 1–4, P-837 wariant (a)). Historia BX: `git log -- docs/jakosc/bx-stan.md`.

## Liczby (katalog `docs/jakosc/przypadki-uzycia.md`)
- **338 PU: A=126, B=161, F=51** (BX3: +30 A w sekcji „Stany puste, błędy i przerwania” i +3 A: PU-016, 080, 315; P-849). B z testem (scenariusz `oczekujacy`): 16 (sekcja „Nawigacja”, scenariusze 71–84); B „do zaprogramowania”: 145 — tyle czerwieni bramkę KO-065 (kontrola 2, P-837 (a)).
- Sekcja „## Funkcje”: 216 funkcji z kodu → PU (P-848); 69 funkcji bez PU dostało PU-271…PU-338 (57 B, 11 F). Sekcja „## Ekrany bez własnej trasy”: `Wzor` (martwy kod, znalezisko BX-001).
- Lista fizyczna `docs/wydanie/test-fizyczny.html`: 51 pozycji, ok. 154 min (szacunek z `MIN_KAT`, nie pomiar). Artifact z BX (41 pozycji) nieaktualny — do ponownej publikacji.
- `[DO USTALENIA]` w katalogu: 0 (8 rozstrzygniętych w kodzie, recenzja BX2 R-A-39…47).

## Zrobione w BX2
1. Recenzja niezależna (2 subagenty) → `docs/jakosc/bx-recenzja.md`: A 4×P1 / 19×P2 / 26×P3, B 69 funkcji bez PU. P1 poprawione (PU-180 F→B, PU-143/144 A→B, PU-202 opis); reguły „linia A to asercja”, „A nie tylko iPad”, sekcja „Funkcje” w `kontrolaKatalogu` i teście katalogu.
2. KO-065: zadanie `bramka-przypadki` w `testflight.yml` (bez `continue-on-error`, `if:`, flagi; `build.needs: [bramka, bramka-przypadki]`), skrypt `scripts/jakosc/bramka-przypadki-uzycia.mjs` (`bramka`, `recenzja <build>`, `katalog`), testy `tests/jakosc/bramka-przypadki-uzycia.test.ts` (czerwień przed kodem `docs/jakosc/bx2-dowod-czerwony.txt`), protokół `docs/jakosc/test-fizyczny/<N>.md`, wyjątek 1171 `wyjatki.json` (P-838), lista fizyczna: „Pomiń” z obowiązkowym uzasadnieniem, „Kopiuj wynik” w formacie protokołu (`protokolWyniku`), `lista-1-0.md` F1a (przed App Review).
3. Scenariusze B „Nawigacja”: 71–84 (PU-198, 200, 202, 205, 209, 211, 217, 219, 224, 225, 226, 228, 229, 234, 235, 236), tagi `przypadki-uzycia` + `oczekujacy` + `PU-NNN`, wagi szacowane w `e2e/czesci.json`, testID w `e2e/README.md`. Nie biegły na symulatorze (Linux).
Decyzje: P-837 (wariant (a): bramka czerwona, dopóki każdy B nie ma testu — **nie (b)**, rekomendacja BX odrzucona, KO-068), P-838, P-847, P-848 — `docs/decyzje.md`, do weta.

## Ryzyka scenariuszy 71–84 (do pierwszego przebiegu)
- 83 (PU-234): `text` na `ustawienia-miary` czyta wartość dostępności wiersza — niepotwierdzone na iOS (wzór 39:18).
- 76 (PU-211): dwa arkusze z `formularz-zapisz` w stosie — stuknięcie z tekstem.
- PU-205: kod pokazuje „Add reminder…” albo „Reminders” zależnie od planów (`src/ekrany/MenuProjektu.tsx:69-73`); scenariusz sprawdza stan bez planów.

## Jak zdjąć tag `oczekujacy`
1. Koordynator wyzwala „Jakość · iOS” na gałęzi (push ze zmianą w `e2e/**` albo `workflow_dispatch`).
2. Scenariusz „zielony”: usuń tag `oczekujacy`, w katalogu B → A, „oczekujący: plik:linia” → „plik:linia” (linia asercji), popraw „Podsumowanie”, wagę z logu do `e2e/czesci.json`.
3. „czerwony-informacyjnie”: zrzut kroku, klasyfikacja (aplikacja / scenariusz / maszyna); błąd aplikacji = znalezisko `BX-NNN` dla 08, scenariusz zostaje czerwony.

## STOP koordynatora (15.11 ok. 19:30 UTC)
Koszt 31,04 USD > próg 26 USD (pomiar koordynatora), kontekst 30%. Stan na 8f0c1424 (wypchnięty; verify w haku 7506/7506). „Jakość · iOS” na tej gałęzi wyzwolony przez koordynatora 19:24 (`workflow_dispatch`) — wynik nieodebrany. **Merge integracji `claude/youthful-pasteur-kx83sn` @ 06077b85 NIE zrobiony** (pierwszy krok następnej sesji: zwykły merge, bez rebase).

## Następny krok (07 build, start od tego pliku)
0. `git merge origin/claude/youthful-pasteur-kx83sn` (06077b85 albo nowszy); `npm ci`; push z `NODE_OPTIONS=--max-old-space-size=3072` (pierwszy push bez niego: hak czerwony, przyczyna niepotwierdzona).
1. Wynik przebiegu „Jakość · iOS” (19:24) dla scenariuszy 71–84 → zdjęcie tagów albo znaleziska.
2. Scenariusze B: sekcja „Stany puste, błędy i przerwania”, potem reszta (178 „do zaprogramowania”; testy jednostkowe/komponentowe tam, gdzie Pokrycie tak mówi — test w `tests/` wymienia ID PU i wiersz przechodzi w A).
3. P2 recenzji A: 10 pozycji F częściowo automatyzowalnych (PU-009, 010, 020, 049, 055, 062, 069, 095, 130, 140); kontrola K1 napisów przycisków (recenzja B) najpierw informacyjnie.
4. Ponowna publikacja listy fizycznej (Artifact, 51 pozycji).

## BX3 (08 build, 15.11) — stan
- Merge integracji 06077b85 (9faaf74a; konflikt tylko `docs/decyzje.md`). Recenzja kodu bramki: `bx-recenzja.md` „Kod bramki”; P1-1…3,5 poprawione (czerwień `bx3-dowod-czerwony.txt`); **P1-4 otwarte** (kontrola 1 czyta tylko conclusion zadania).
- „Stany puste, błędy i przerwania”: 30 B → A (P-849); nowe testy PU-250, 252, 254, 255, 257, 259, 266, 267, reszta to znaczniki PU przy istniejących testach. Sekcja nie ma już B „do zaprogramowania”.
- Następny krok: wynik „Jakość · iOS” 43752186631 → zdjęcie tagów `oczekujacy` (71–84); potem sekcje katalogu według „Pokrycia” (najtańszy poziom; testy w `tests/` z PU-ID w nazwie i komentarzu); P2 recenzji bramki.
