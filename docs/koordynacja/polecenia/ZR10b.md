# ZR10b — rola 10 fix: uwagi RZ4 do trybu „zastąp” (fail-closed) + P3-1 RZ3 (2026-11-25)

Koordynator: session_01T66VByMuFaNAxNQuUgpYzA (raporty i pytania tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9) — **koszt mierzysz przez `get_session` (usage.cost_usd) po każdym zadaniu i podajesz w raporcie** (WG-37). Gałąź wyniku: `claude/zr10b-zastap-fail-closed-2026-11-25` od 0efaafa2 (`origin/claude/rz4-recenzja-zr10-2026-11-25` = ZR10 + RZ4; inny HEAD: zgłoś). Decyzja: KO-212. Pula P: P-1055…P-1057. Kontekst: od 30% okna kończysz krok, zapis stanu w `docs/jakosc/zr10b-stan.md`, push, PRZEKAZANIE.

## Rola
10-wydanie w trybie fix. Prompt roli składasz sama (wyjątek nazwany jak ZR8, WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 10-wydanie --tryb fix --plik <scratchpad>/10-fix.md`; przeczytaj w całości, jesteś tą rolą.

## Wejście
`docs/jakosc/rz4-recenzja.md` (RZ4-01, RZ4-02, RZ4-07, §6), `docs/jakosc/rz3-recenzja.md` P3-1 (P-1052; ten plik jest na integracji), P-1048…P-1054.

## Zadania (każde: test czerwony najpierw, potem kod)
0. **Scal integrację:** `git merge origin/claude/youthful-pasteur-kx83sn` (553ab67f = ZR9 + RZ3) do gałęzi wyniku; konflikty (zwykle `docs/decyzje.md` — zachowaj oba wpisy w kolejności numerów) rozwiąż ręcznie. Wynik ma być potomkiem 553ab67f (scalenie do integracji fast-forward).
1. **RZ4-01, wariant 1 (fail-closed):** `listPlacements` odrzuca wpis, gdy `attributes.placementGroup` ≠ grupa wiersza albo `placementType` ≠ `APP_SCREENSHOT`; **brak atrybutu → odmowa zastąpienia tej grupy** (wiersz z jasnym powodem, kod ≠ 0 w apply, w dry-run widoczne). Atrapa: druga grupa w tej samej lokalizacji + tryb ignorowania filtrów (sonda C z RZ4 §8) → 0 DELETE poza własną grupą; mutanty M11/M12 mają ginąć.
2. **RZ4-07 (ochrona wersji w sklepie):** przed jakimkolwiek DELETE skrypt pobiera placementy tej samej lokalizacji w wersji opublikowanej (READY_FOR_SALE, jeśli istnieje) i **odmawia**, gdy którykolwiek id do zdjęcia występuje też tam (współdzielenie placementów = odmowa, fail-closed). Gdy nie da się odczytać wersji opublikowanej (błąd API) → odmowa. Dry-run wypisuje wynik tej kontroli („placementy 1.0 rozłączne: tak/nie”). Test z atrapą: wspólny id → 0 DELETE.
3. **RZ4-02:** testy atrapy: przetwarzanie nowego obrazu `FAILED` → 0 DELETE; obraz nieprzetworzony (bez `uploaded`/stan pośredni do limitu czekania) → 0 DELETE. Mutant M13 ma ginąć.
4. **P3-1 RZ3 (P-1052):** test 10-wydanie-019 / ZR9 P3-1 sprawdza też, że każdy z 6 plików testów w kroku ramek `zrzuty-sklepu.yml` istnieje na dysku.
5. Lista kontrolna dry-runu w `docs/wydanie/sklep.md` uzupełniona o kontrole z p. 1–2. Wpis decyzji P-1055…, `npm ci && npm run verify` kod 0 → `docs/jakosc/zr10b-verify.txt`. Commit, push (hak pre-push uruchamia verify ~5 min — bez `--no-verify`).

## Zakazy
Bez wywołań App Store Connect i dispatchu workflowów, bez `main`, bez scalania do integracji (robi koordynator), bez force-push, bez zmian `app/`, `src/`, `modules/`, `targets/`, bez osłabiania kontroli ani testów, nigdy `--no-verify`, bez tworzenia/archiwizacji sesji, bez zapisu na `koordynacja`, bez pytań do właściciela (bez AskUserQuestion); STOP-y → raport do koordynatora i czekasz. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez linii Co-Authored-By i Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`, przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 0efaafa2..HEAD` bez trailerów (commit scalenia też). GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message do koordynatora)
SHA, testy czerwone→zielone (liczby), mutanty M11/M12/M13 (zabite?), co pokazuje dry-run (nowe wiersze), verify (kod, liczba testów), decyzje P-, koszt z get_session.
