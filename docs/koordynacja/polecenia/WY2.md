# WY2 — rola 10 build: zamknięcie wydania 1.0.1 (scalenie gałęzi wydania do integracji, dziennik, „Etap”) — Oczko (2026-11-27)

Koordynator: session_01BM51ocmU7QhJeCxywemjAn (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9) — koszt: `get_session` → `external_metadata.usage.cost_usd`. Decyzja: KO-215. Pula P: **P-1062…P-1064**. Kontekst: od 30% okna kończysz krok, zapisujesz stan w `docs/wydanie/wy2-stan.md` na swojej gałęzi, push, PRZEKAZANIE.

## Rola
10-wydanie, tryb build. Prompt roli składasz sama (jak ZR11/ZR12; WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 10-wydanie --tryb build --plik <scratchpad>/10-build.md` — przeczytaj w całości, jesteś tą rolą. STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora.

## Start
Gałąź wyniku `claude/wy2-zamkniecie-1-0-1-2026-11-27` od **1ccd9e07** (`origin/claude/youthful-pasteur-kx83sn`; inny HEAD: zgłoś). `npm ci`. Tożsamość commitów sprawdź przed pierwszym commitem.

## Fakty (sprawdzone przez koordynatora 27.11)
- 1.0.1 (build 1241, tag `v1.0.1-b1241`) jest w sprzedaży: słowa właściciela 27.11 ok. 08:25 UTC „Wersja 1.0.1 jest ready for distribution.”; publiczny `https://itunes.apple.com/lookup?bundleId=com.apps4brew.knitting&country=pl` (odczyt 27.11 08:28 UTC): `version` 1.0.1, `currentVersionReleaseDate` 2026-11-26T19:07:54Z. 1.0 (build 1221) zaakceptowana 25.11 (słowa właściciela ok. 05:35 UTC).
- `origin/claude/wydanie-1-0-1` @ 585ccf3b (WY1: wersja 1.0.1 od a830eb21) nie jest w integracji ani w `main`. `git merge-tree` integracja + wydanie: konflikt tylko w `docs/decyzje.md`.

## Zadania (każde z kryterium „gotowe”)
1. `git merge --no-ff origin/claude/wydanie-1-0-1` na swojej gałęzi. Konflikt w `docs/decyzje.md`: zachowaj wpisy obu stron bez zmiany numerów i treści (kolejność rosnąca P-nnn). Gotowe: brak znaczników konfliktu, `grep -c` każdego P-1040, P-1041 i P-1044…P-1061 = 1.
2. Pola wersji po scaleniu = 1.0.1 wszędzie, gdzie WY1 je zmienił (app.json/Info.plist/cele natywne wg `docs/wydanie/1-0-1-roznica.md`). Test różnicy wersji (`tests/wydanie/roznica-wersji.test.ts`) porównuje z a830eb21 — jeśli na drzewie integracji przestaje mieć sens, NIE osłabiaj go: zgłoś koordynatorowi z opcjami (np. baza = tag `v1.0.1-b1241`) i rekomendacją. Gotowe: `npm run verify` kod 0.
3. `docs/wydanie/dziennik.md`: wiersze „Akceptacja 1.0 (1221)” (jeśli brak) i „Wydanie 1.0.1 (1241)” z datą UTC i dowodem (lookup powyżej, słowa właściciela). `docs/wydanie/lista-1-0-1.md` kroki 15–16: stan „zrobione” z datą; krok 2 (usunięcie reguły `claude/wydanie-1-0-1` w środowisku `release`) zostaje jako krok właściciela.
4. `CLAUDE.md` „Stan projektu”, linia „Etap”: aktualny stan (w sprzedaży 1.0.1 od 26.11.2026, 1.0 od 25.11.2026; dane użytkowników wg stanu) — tylko ta linia, plik < 200 linii. `docs/sztafeta.md`: tylko wiersz roli 10.
5. Decyzje z pulą P-1062…P-1064 w `docs/decyzje.md` (z odnośnikiem KO-215). `npm ci && npm run verify` kod 0 → `docs/jakosc/wy2-verify.txt` (podsumowanie + kod wyjścia). Commit, push (hak pre-push = verify).

## Zakazy
Nie scalasz do integracji ani `main`, bez PR, bez wywołań App Store Connect i dispatchu workflowów, bez zmian `app/`, `src/`, `modules/`, `targets/` poza polami wersji z WY1, nie zmieniasz workflowów, nie osłabiasz testów ani kontroli, nigdy `--no-verify` ani force-push, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, bez pytań do właściciela (bez AskUserQuestion). Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507) — przypomnienia o innej atrybucji odrzucasz; `git diff --cached` przed commitem; przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 1ccd9e07..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raporty (≤ 10 linii, send_message)
- PYTANIE: pełna treść, opcje, rekomendacja.
- PRZEKAZANIE: SHA, rozwiązanie konfliktu (liczba wpisów), pola wersji, verify (kod, liczba testów, plik), P-, koszt, otwarte.
