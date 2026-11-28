# FA2 — rola 08 build: kod 1.0.2 TypeScript, część 2 (następca FA1) (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 8 USD (STOP 10,4). Decyzje: KO-238, KO-239 (właściciel: testy i18n dopuszczają tylko wymienione klucze 1.0.2), KO-241 (willTerminate — natywne robi FB2), KO-243 (zlecenie). Pula P: **P-1133…P-1137**. Kontekst: od 30% kończysz krok, stan w `docs/programista/fa2-stan.md`, push, PRZEKAZANIE.

## Rola
08-programista, tryb build, moduł `sqlite-expo`. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 08-programista --tryb build --moduly sqlite-expo --plik <scratchpad>/08-build.md`; przeczytaj w całości.

## Start
Kontynuujesz gałąź `claude/fa1-kod-ts-1-0-2-2026-11-28` od **6a40d695** (wynik FA1; inny HEAD: zgłoś). `npm ci`. Najpierw przeczytaj **`docs/programista/fa1-stan.md`** (co zrobione, kolejność reszty) i polecenie FA1 (`git show origin/koordynacja:docs/koordynacja/polecenia/FA1.md`) — zakres i zakazy FA1 obowiązują Ciebie.

## Zadania (z fa1-stan.md)
1. 15 czerwonych testów z `tests/akceptacja/` (ekrany U6/U7, ZM-26/28, ZM-23 oferty, ZM-27(b) menu; 2 XCTest-kontrole należą do FB1/FB2 — nie ruszasz), testy R2–R5 (kompozycja liveAktywna i kolejność scalenie → decyzja, strażnik RD-17 na stuknięciach, odliczanie U7-A z wstrzykniętym zegarem, etykiety PU-099) najpierw czerwone, potem kod; wiersze PU-Z03…Z11 → PU-355…362.
2. Uzgodnienia z częścią Swift (FB1/FB2, gałąź `claude/fb2-swift-1-0-2-2026-11-28`): `src/platforma/live-activity.ts` woła `liveStart`/`liveAktualizuj` z opcjonalnym `staleDateMs` i `liveAktywna()` (typy w `modules/oczko-dziennik-plus/index.ts` są u FB1 — po scaleniu); `stan.krok` zapisujesz tylko gdy ≠ 1; `KROK_MAKS`, `LIVE_KONIEC_PO_MS` w `src/konfiguracja.ts`; złoty plik stanu `krok: 2` w `tests/wspolne`. Testy i18n: cherry-pick z FB1 commitu zmieniającego `tests/i18n/pierwsze-w-fali-154.test.ts` i `krytyczne.test.ts` (KO-239), potem dopisujesz swoje klucze PL/EN do `docs/lokalizacja/oczekujace.json` i do listy w tych testach.
3. **Prototyp B = NIE** (PB1): przypominacz U7 tylko forma A na ekranie licznika; żadnego widoku zależnego od isStale; klucze `podpowiedz_*` dla formy B nie są w 1.0.2.
4. verify kod 0 → `docs/programista/fa2-verify.txt`. Małe commity, push (pre-push = verify).

## Zakazy
Jak w FA1 (bez Swift w `modules/*/ios`, `modules/oczko-reguly`, `targets/`; bez workflowów; nie osłabiasz testów — zmianę istniejącego testu uzasadniasz decyzją P- z odnośnikiem do ADR/ZM; bez scalania, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela). Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; `git config --local` przed pierwszym commitem; haki o innej atrybucji odrzucasz). GitHub tylko przez MCP. Przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 9404a59a..HEAD`.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, testy zazielenione (które zostały czerwone i dlaczego), zmienione istniejące testy z decyzją, verify, koszt.
