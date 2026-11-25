# RZ3 — rola 07 audit: recenzja niezależna ZR9 (kontrola zakreśleń P2-1, P2-2, P3-1) (2026-11-25)

Koordynator: session_01T66VByMuFaNAxNQuUgpYzA (raporty i pytania tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 2 USD (STOP 2,6). Gałąź wyniku: `claude/rz3-recenzja-zr9-2026-11-25` od 8a8fb678 (`origin/claude/zr9-kontrola-zakreslen-2026-11-25`; inny HEAD: zgłoś). Decyzje: KO-206, KO-209. Pula P: P-1051…P-1052. Kontekst: od 30% okna kończysz krok, zapis stanu w `docs/jakosc/rz3-stan.md`, push, PRZEKAZANIE.

## Rola
07-jakosc w trybie audit. Prompt roli składasz sama (wyjątek nazwany jak RZ2, WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 07-jakosc --tryb audit --plik <scratchpad>/07-audit.md`; przeczytaj w całości, jesteś tą rolą. Do repo aplikacji nic z biblioteki nie zapisujesz. Jesteś recenzentem niezależnym: `docs/jakosc/zr9-*` czytasz jako opis zamiaru, nie dowód.

## Wejście
- Kod: `git diff f0b28df6..8a8fb678` (5 commitów ZR9: b44283e8 P2-1, 3605231b P2-2, 4ac256e4 decyzje, 13626ccd P3-1 workflow, 8a8fb678 test 10-wydanie-019).
- Uwagi, które ZR9 miała usunąć: `docs/jakosc/rz2-recenzja.md` i `docs/jakosc/rz2-proby-czulosci.txt` (P2-1, P2-2, P3-1…P3-3); decyzje P-1044…P-1047 w `docs/decyzje.md`.

## Zadania
1. **P2-1** (`scripts/ci/kontrola-zakreslen.mjs`, górna granica grubości pasa): czy próby M5/M6 z `rz2-proby-czulosci.txt` dają teraz błąd; czy prawdziwe kadry 03/04 z przebiegów 45633013976 / 45633019859 nadal przechodzą (dane kadrów w testach ZR8c / pobranie artefaktu przez MCP, rozpakowanie w pustym katalogu scratchpada). Test czerwony na f0b28df6 z właściwego powodu — sprawdź uruchomieniem.
2. **P2-2** (brak linii znacznika / znacznik o nasyceniu > 30): czy nie ma już cichego OK; czy wariant nie daje fałszywego alarmu na kadrach 45633*; próby M2/M4.
3. **P3-1**: krok testów ramek w `zrzuty-sklepu.yml` uruchamia 6 plików z `OCZKO_WYMAGAJ_IMAGEMAGICK=1` — czy pliki istnieją, czy żaden test w nich nie jest pomijany przy wymuszonym ImageMagicku (warunek `skip`), czy zmiana testu 10-wydanie-019 (regex `[^\n]*`) nie osłabia kontroli. Zestaw kontroli nie zmniejszony.
4. Zmienione fikstury syntetyczne w `tests/wydanie/kontrola-zakreslen.test.ts`: czy zmiana nie maskuje regresji (porównaj z f0b28df6).
5. `npm ci && npm run verify` na 8a8fb678 → `docs/jakosc/rz3-verify.txt` z kodem wyjścia i liczbą testów. Gotowe: `docs/jakosc/rz3-recenzja.md` ze znaleziskami P1/P2/P3 (plik:linia, dowód) i werdyktem „PRZYJĄĆ / PRZYJĄĆ Z UWAGAMI / ODRZUCIĆ”; wpis P- do `docs/decyzje.md`. Commit, push. Kodu nie poprawiasz (audit): błąd = znalezisko.

## Zakazy
Bez ASC, bez `main`, bez scalania do integracji, bez force-push, bez dispatchu workflowów, bez zmian `.github/workflows/`, `app/`, `src/`, `scripts/`, testów i progów, nigdy `--no-verify`, bez tworzenia/archiwizacji sesji, bez zapisu na `koordynacja`, bez pytań do właściciela (bez AskUserQuestion); STOP-y roli → raport do koordynatora i czekasz. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez linii Co-Authored-By i Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`, przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 8a8fb678..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raport (≤ 8 linii, send_message do koordynatora)
SHA, werdykt (P1/P2/P3 z liczbami), verify (kod, liczba testów, plik), decyzje P-, koszt.
