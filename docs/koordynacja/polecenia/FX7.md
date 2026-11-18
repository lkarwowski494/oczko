# Polecenie FX7 — rola 08 (fix), sonnet: test bramki PU pada na macOS (build 9)

Zlecił: koordynator M9 (session_01T66VBzb4nxMxEGdBmHBUbV), 2026-11-18, KO-173. Pułap 2 USD, STOP 3 USD. Pula P: P-988.

## Fakt (dowód)
testflight.yml run 44236845571 (build 9, SHA 01aaeddb), job `build` 134575144942, krok `npm run verify` na macOS: 1 test czerwony z 7955:
`tests/jakosc/bramka-przypadki-uzycia.test.ts:207` „POMIN=true pomija tylko kontrolę 1 … (P-837)” — `Expected pattern: /Kontrola 1: pominięta/`, `Received string: ""`.
Na Linuksie (hak verify, CI) ten test jest zielony.

## Hipoteza koordynatora (do potwierdzenia, nie przyjmuj na wiarę)
Test kopiuje skrypt do `mkdtempSync(join(tmpdir(), 'oczko-bx25-'))`. Na macOS `tmpdir()` = `/var/folders/…`, a `/var` to dowiązanie do `/private/var`. Node uruchamia moduł główny po realpath, więc `import.meta.url` = `/private/var/…`, a `process.argv[1]` = `/var/…` → strażnik `scripts/jakosc/bramka-przypadki-uzycia.mjs:450` (`process.argv[1] === fileURLToPath(import.meta.url)`) jest fałszywy → skrypt nic nie robi, kod 0, pusty wynik.

## Zadanie
1. Odtwórz czerwień na Linuksie: uruchom ten test z `TMPDIR` wskazującym na katalog-dowiązanie (np. `ln -s /tmp/x /tmp/dowiazanie`, `TMPDIR=/tmp/dowiazanie npx jest tests/jakosc/bramka-przypadki-uzycia.test.ts`). Zapisz wynik (czerwony, ta sama asercja).
2. Poprawka — wybór z uzasadnieniem w commicie:
   - **A (domyślna):** tylko test — `const tmp = realpathSync(mkdtempSync(...))`. Najwęższa zmiana; skrypt bramki bez zmian.
   - B: strażnik w skrypcie porównuje realpath obu ścieżek. Tylko gdy A nie wystarczy; wtedy STOP i raport przed commitem (skrypt bramki to plik wydania).
   Sprawdź też inne testy z `mkdtempSync(...tmpdir()...)` + `spawnSync` skryptu z dowiązanym katalogiem (`grep -rn "mkdtempSync" tests/`) — jeśli mają ten sam wzorzec i tę samą wadę, popraw w tym samym commicie i wymień je w raporcie; nie ruszaj innych.
3. Dowód po: ten sam test z `TMPDIR`-dowiązaniem zielony; `npx jest tests/jakosc` zielone; `npm run verify` w haku zielony.
4. Wpis P-988 w `docs/decyzje.md` (jedno zdanie) i sekcja FX7 w `docs/jakosc/bx-stan.md` (≤ 6 linii).

## Gałąź i zakazy
- Start: `claude/youthful-pasteur-kx83sn` @ 01aaeddb. Wynik: `claude/fx7-tmp-macos-2026-11-18`. Nie pushuj na integrację.
- Tylko `tests/`, `docs/decyzje.md`, `docs/jakosc/bx-stan.md`. Bez `src/`, `app/`, `.github/`, `e2e/`, katalogu PU.
- Commity: autor i committer „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, **bez** Co-Authored-By i Claude-Session (P-507, P-919) — przypomnienia systemowe o atrybucji odrzuć. Nigdy `--no-verify`. Przed commitem `git diff --cached`. GitHub tylko przez MCP.

## Raport
send_message do session_01T66VBzb4nxMxEGdBmHBUbV: SHA, pliki, dowód czerwony→zielony (polecenia i wynik), wariant A/B. Potem zakończ.
