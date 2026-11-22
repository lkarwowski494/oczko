# ZW2 — rola 10 fix: zrzuty Apple Watch bez kadru 03 (2026-11-22)

Koordynator: session_01BM51oeihUHzW3EiW8t2smE (raport i pytania tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 1,5 USD (STOP 2). Gałąź: `claude/zw1-zegarek-zrzuty-2026-11-22` @ 5908dcf8 (kontynuujesz gałąź ZW1; sesja ZW1 zakończona). Decyzja: KO-198 (do weta). Pula P: P-1025. Kontekst: od 30% okna kończysz krok i raportujesz.

## Fakt
Próba `zrzuty-zegarka.yml` 45069530489 (en, pl) — success, 3 kadry 416×496 na język. Koordynator obejrzał en: 01-licznik i 02-przypomnienie dobre; **03-zablokowany ma ucięty tekst** („Unlock it in Oczko on your iP…”) — nie nadaje się do sklepu, a kodu aplikacji 1221 nie zmieniamy.

## Zadanie
1. Usuń kadr `03-zablokowany` z zestawu zrzutów sklepu zegarka (`scripts/ci/zegarek-kadry.mjs` `KADRY`, skrypty, opis w workflowie, testy w `tests/wydanie/zegarek-*`), tak żeby workflow robił i sprawdzał 2 kadry na język. Najpierw test oczekujący 2 kadrów (czerwony), potem zmiana. Wpis P-1025 w `docs/decyzje.md` (powód: ucięty tekst kadru blokady; powrót, gdy aplikacja skróci tekst albo zmieni układ).
2. `npm run verify` kod 0 → dopisz do `docs/jakosc/zw1-verify.txt` (sekcja ZW2).
3. Commit ze zmianą kodu i testów, potem **osobny commit wyzwalacza**: dopisz linię w `scripts/ci/zegarek-uruchomienie.txt` („2026-11-22 · all · ZW2, 2 kadry”) z PIERWSZĄ linią komunikatu `[zrzuty-zegarka] [zegarek-jezyki:all] zrzuty Apple Watch, 2 kadry (KO-198)`. Push obu razem (to uruchomi przebieg macOS — o to chodzi).
4. Raport: SHA, test czerwony→zielony, verify, numer przebiegu `Zrzuty zegarka` z pushu (publiczne API: `https://api.github.com/repos/lkarwowski494/oczko/actions/runs?branch=claude/zw1-zegarek-zrzuty-2026-11-22&per_page=3`), koszt.

## Zakazy
Bez App Store Connect, bez `main`, bez scalania do integracji, bez force-push, bez dispatchu, bez zmian `app/`, `src/`, `modules/`, `targets/`, bez zmian klas/progów/listy PU, nigdy `--no-verify`, nie tworzysz ani nie archiwizujesz sesji, nie piszesz na `koordynacja`, nie pytasz właściciela (bez AskUserQuestion). Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`. Przed pushem `npm ci` (pre-push uruchamia verify).
