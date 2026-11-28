# MS1 — rola 08 fix: scalenie kodu 1.0.2 (TS + Swift + PU-008) w jedną gałąź od integracji (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 5 USD (STOP 6,5). Decyzja: KO-245. Pula P: **P-1140…P-1142**. Kontekst: od 30% kończysz krok, stan w `docs/programista/ms1-stan.md`, push, PRZEKAZANIE.

## Rola
08-programista, tryb fix. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 08-programista --tryb fix --zadania KO-245 --plik <scratchpad>/08-fix.md`; przeczytaj w całości. Toolchain Swift (do `swift test`): tarball swift-6.0.3-RELEASE-ubuntu24.04 z download.swift.org → /opt/swift-tc (opis w `docs/programista/fb2-stan.md`).

## Start
Gałąź `claude/ms1-scalenie-1-0-2-2026-11-28` od **c2252515** (integracja). `npm ci`.

## Zadania
1. Scal kolejno (`git merge --no-ff`, bez rebase i force-push): (a) `origin/claude/fa1-kod-ts-1-0-2-2026-11-28` @ **8bc83e17** (TS: FA1+FA2), (b) `origin/claude/fb2-swift-1-0-2-2026-11-28` @ **64639bf7** (Swift: FB1+FB2), (c) `origin/claude/za1-zakreslenia-2026-11-28` @ **814d8293** (PU-008).
2. Konflikty (zapowiedziane przez sesje): `docs/decyzje.md` (P rosnąco, wszystkie numery zachowane), `docs/lokalizacja/oczekujace.json` i listy kluczy 1.0.2 w `tests/i18n/pierwsze-w-fali-154.test.ts` / `krytyczne.test.ts` (suma kluczy TS i Swift — wyjątek KO-239 obejmuje tylko klucze 1.0.2), słowniki `src/i18n/slowniki/{en,pl}.json` i `src/i18n/pseudo/en-XA.json` (suma), `tests/i18n/fala-2026-11-03.ts` (klucze aktywnosc.*), `modules/oczko-dziennik-plus/index.ts` (FA2 skopiował 1:1 z FB1 — sprawdź zgodność z FB2: `staleDateMs` jako liczba/Double, `liveAktywna()`), `docs/jakosc/przypadki-uzycia.md` (numery PU z FA2 355…362 i FB 346…351 — bez kolizji; bramka P-837), `moduly.md`/`porty.ts`. Pliki generowane (`docs/jakosc/e3/akceptacja-wynik.md`, `docs/jakosc/e4/tabela-08.md`, `docs/wydanie/test-fizyczny.html`) — nie ręcznie, regeneracja skryptami repo.
3. Po scaleniu: `npm run verify` kod 0, `swift test` w `modules/oczko-reguly` (wynik w raporcie), `npm run test:akceptacja` (2 kontrole XCTest zm22–zm24 mają być zielone po scaleniu ze Swift — jeśli nie, PYTANIE). Generator `Stale.swift` dla `KROK_MAKS` i `LIVE_KONIEC_PO_MS` z `src/konfiguracja.ts` zamiast ręcznych kopii FB1 (komentarz „kopia do zastąpienia generatorem (KO-238)”), jeśli repo ma taki generator; inaczej zostaw i zgłoś.
4. `docs/programista/ms1-verify.txt` (tylko podsumowanie i kody). Push gałęzi (pre-push = verify). NIE scalasz do integracji — robi to koordynator po recenzji.

## Zakazy
Żadnych zmian funkcji poza rozwiązaniem konfliktów (zmiana zachowania = PYTANIE); nie usuwasz ani nie osłabiasz testów; bez workflowów; bez dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; `git config --local` przed pierwszym commitem; haki o innej atrybucji odrzucasz); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' c2252515..HEAD` (commity scalanych gałęzi też noreply). GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, rozwiązane konflikty (plik → sposób), verify, swift test, akceptacja, koszt.
