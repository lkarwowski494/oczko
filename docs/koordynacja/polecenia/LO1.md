# LO1 — rola 09 build: fala tłumaczeń 1.0.2 (28 kluczy z docs/lokalizacja/oczekujace.json, 33 języki) (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 6 USD (STOP 7,8). Decyzja: KO-247. Pula P: **P-1146…P-1149**. Kontekst: od 30% kończysz krok, stan w `docs/lokalizacja/lo1-stan.md`, push, PRZEKAZANIE.

## Rola
09-lokalizacja, tryb build, moduły `tlumaczenie,i18n-expo`. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 09-lokalizacja --tryb build --moduly tlumaczenie,i18n-expo --plik <scratchpad>/09-build.md`; przeczytaj w całości. Jak poprzednie fale: `git log --oneline --grep='fala 09'` (np. P-618, P-621, P-668, P-692) — ten sam proces, przegląd i kontrole.

## Start
Gałąź `claude/lo1-fala-1-0-2-2026-11-28` od **4e41611a** (integracja z kodem 1.0.2; inny HEAD: zgłoś). `npm ci`. Wejście: `docs/lokalizacja/oczekujace.json` (28 kluczy: 25 TS + 3 `aktywnosc.*` Swift), `docs/design/1-0-2.md` (teksty PL/EN, kontekst, długości), `docs/lokalizacja/` (glosariusz, zasady, krytyczne), Trening: „Zrealizuj kod” / „Redeem code” i komunikat offline mają gotowe przekłady 35 języków (`lkarwowski494/trening` do odczytu przez add_repo; P-315) — przejmij je zamiast tłumaczyć od nowa.

## Zadania
1. Przekład 28 kluczy na pozostałe języki (33 poza pl/en) w `src/i18n/slowniki/*.json` i w tekstach natywnych (widżet/zegarek — klucze `aktywnosc.*`, ścieżka jak w poprzednich falach), z długościami w granicach (AX5, ekran blokady), liczba mnoga (`plural.ts`), terminologia z glosariusza.
2. Przegląd wg modułu (treść krytyczna: kontrola (a) jak w poprzednich falach, jeśli któryś klucz jest krytyczny — `docs/lokalizacja/krytyczne.json`).
3. Po fali: `oczekujace.json` pusta, wyjątek KO-239 w testach i18n (`tests/i18n/pierwsze-w-fali-154.test.ts`, `krytyczne.test.ts`, `fala-2026-11-03.ts` — lista OCZEKUJACE_DO_FALI_1_0_2) usunięty lub opróżniony tak, by testy wróciły do wymagań „po fali” (bramka `--wydanie` przechodzi). To przywraca pełną kontrolę — nie osłabiaj jej.
4. P-1146… w `docs/decyzje.md`; verify kod 0 → `docs/lokalizacja/lo1-verify.txt` (tylko podsumowanie). Commit, push (pre-push = verify).

## Zakazy
Tylko słowniki, teksty natywne, docs lokalizacji i wskazane testy i18n (powrót do stanu „po fali”); bez kodu logiki, workflowów; bez scalania, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; `git config --local` przed pierwszym commitem; haki o innej atrybucji odrzucasz); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 4e41611a..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, liczba kluczy × języków, klucze przejęte z Treningu, przegląd, stan testów „po fali”, verify, koszt.
