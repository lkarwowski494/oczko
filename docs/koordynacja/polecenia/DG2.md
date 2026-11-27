# DG2 — rola 07 audit: diagnoza czerwonego e2e cz. 2 i cz. 4 iPhone na main af327fd7 (2026-11-27)

Koordynator: session_01BM51ocmU7QhJeCxywemjAn (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet (wyjątek nazwany jak DG1: diagnoza z artefaktów, bez zmian kodu). Pułap: 3 USD (STOP 3,9). Decyzja: KO-221. Pula P: **P-1074…P-1075**. Kontekst: od 30% kończysz krok, stan w `docs/jakosc/dg2-e2e.md`, push, PRZEKAZANIE.

## Rola
07-jakosc, tryb audit. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 07-jakosc --tryb audit --plik <scratchpad>/07-audit.md`; przeczytaj w całości.

## Start
Gałąź `claude/dg2-e2e-main-2026-11-27` od **3cc0fa87** (`origin/claude/youthful-pasteur-kx83sn`). Poprzednia diagnoza: `docs/jakosc/dg1-e2e-cz4.md` na `origin/claude/dg1-e2e-cz4-2026-11-23` (df06bc60; nie scalona): cz. 4 = PU-052 „maszyna”, PU-008/168/135 informacyjne.

## Fakty (koordynator)
Jakość · iOS **45971994915** na `main` af327fd7 (= integracja ef244693 + merge PR #4; kod aplikacji = 1.0.1): failure. Joby: e2e cz. 4 iphone 140459967620 — krok „Scenariusze” failure (10:55–12:36); e2e cz. 2 iphone 140459967781 — „Scenariusze” failure (11:07–13:30), potem krok AX5 **cancelled**; cz. 1 iphone, cz. 3 iphone, cz. 1 ipad, build, swift-test, zegarek-ikona — success; eksperymenty-wzoru — failure (informacyjne, continue-on-error). Poprzednio na main edf07c5c (45558112022): tylko cz. 4.

## Zadania
1. Dla cz. 2 i cz. 4: które scenariusze padły (junit/artefakty przebiegu — pobierz przez MCP; logi tylko końcówki), z jakim powodem; klasyfikacja: maszyna/sterownik (`scripts/ci/e2e-awaria-maszyny.mjs`, P-781 — czy ponowienie zadziałało i dlaczego nie wystarczyło), asercja (regresja), limit czasu (dlaczego cz. 2 trwała 2 h 22 min i AX5 anulowane — limit joba?), niestabilność znana (DG1).
2. Porównanie z 45558112022 (edf07c5c) i z DG1: co nowe.
3. Rekomendacja z opcjami (≥ 2) i kosztem: poprawka scenariusza/kodu (rola 08 fix z testem najpierw czerwonym), zmiana podziału części (ten sam zestaw kontroli — E7 pkt 2), ponowienie ręczne (P-091 10a: tylko przy awarii maszyny). Bez zmiany progów i limitów czasu bez słów właściciela.
4. `docs/jakosc/dg2-e2e.md` (wynik, dowody: run/job/scenariusz/linia), P-1074…P-1075 w `docs/decyzje.md` (KO-221). verify kod 0 → `docs/jakosc/dg2-verify.txt` (podsumowanie i kod). Commit, push.

## Zakazy
Bez zmian kodu, scenariuszy i workflowów; bez dispatchu i ponowień przebiegów; nie scalasz; nigdy `--no-verify` ani force-push; nie tworzysz/archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507). GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, scenariusze padłe z klasą przyczyny, co nowe względem DG1, rekomendacja z kosztem, P-, koszt.
