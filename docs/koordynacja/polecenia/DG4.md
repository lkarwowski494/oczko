# DG4 — rola 07 audit: diagnoza czerwonego Jakość · iOS 46132804091 (integracja a19146b8), e2e cz. 4 iPhone (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9). Decyzja: KO-240. Pula P: **P-1128…P-1129**. Kontekst: od 30% kończysz krok.

## Rola
07-jakosc, tryb audit. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 07-jakosc --tryb audit --moduly e2e-mobilne --plik <scratchpad>/07-audit.md`; przeczytaj w całości.

## Start
Gałąź `claude/dg4-e2e-cz4-2026-11-28` od **9404a59a** (integracja; kod aplikacji = a19146b8). Wejście: run 46132804091, job 140948237483 (e2e cz. 4 iphone), artefakt `e2e-czesc-4-iphone` (ID 15262192594, zrzuty i commands.json), `docs/jakosc/dg2-e2e.md`, `docs/jakosc/dg3-e2e.md`, `docs/jakosc/eb1-stan.md` (EB1 b5fd442a: scalenie dziennika także przy `inactive`), P-091 9a, P-1076/P-1085.

## Pytania
1. **PU-168** (gest od górnej krawędzi, potem „+1”; asercja „2” na `licznik-wartosc` nie przeszła): zgubione stuknięcie maszyny (jak DG2: backboardd) czy **regresja EB1** — scalenie dziennika przy `inactive`/`active` po powrocie z Centrum sterowania nadpisuje albo opóźnia stuknięcie? Porównaj z przebiegami przed EB1 (9aa5ee44: 46017014366 zielony) i po (b5fd442a: 46078408606), zrzut kroku 37, czas między powrotem a stuknięciem.
2. **PU-008** (zakreślenie: po przeciągnięciu brak „2 highlights”): niestabilność gestu czy regresja (od 9aa5ee44 kod wzoru się nie zmieniał — sprawdź `git diff 9aa5ee44 a19146b8 -- src/ app/ modules/`).
3. Czy klasyfikator KA1 zadziałał poprawnie (obie porażki to asercje → bez ponowienia, zgodnie z P-091 9a)?
4. Wynik w `docs/jakosc/dg4-e2e.md`: werdykt per scenariusz (maszyna / niestabilny / regresja z dowodem), rekomendacja (np. 08 fix z testem najpierw czerwonym, jeśli regresja). verify kod 0 → `docs/jakosc/dg4-verify.txt` (tylko podsumowanie). Commit, push.

## Zakazy
Tylko dokumenty; bez zmian kodu, testów i workflowów; bez dispatchu i ponowień przebiegów; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; `git config --local` przed pierwszym commitem). GitHub tylko przez MCP; logi czytasz końcówkami, artefakt pobierasz do scratchpada.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, werdykt per scenariusz z dowodem, rekomendacja, koszt.
