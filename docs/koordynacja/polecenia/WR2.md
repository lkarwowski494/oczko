# WR2 — rola 07 (audit): ponowny przegląd zrzutów sklepu (P-992) (2026-11-20)

Model: sonnet. Pułap: 1,5 USD. Gałąź: `claude/wr2-zrzuty-2026-11-20` od integracji `claude/youthful-pasteur-kx83sn` @ 4e46688c. Decyzja: KO-183 (do weta). Pula P: P-996…P-997.

## Cel
Dopisek do `docs/jakosc/werdykt-build-1221.md` (sekcja „Zrzuty sklepu — ponowny przegląd, P-992”) + dowody w `docs/jakosc/werdykt-1221/`.
Materiał: przebieg zrzuty-sklepu **44677685872** (4e46688c, en,pl, iPhone 6.9 + iPad 13, og07=true; build z `EXPO_PUBLIC_ZRZUTY=1`, P-993). Artefakty `sklep-zrzuty-ramki` i `sklep-zrzuty-surowe` (pobieranie: `mcp__github__actions_list` list_workflow_run_artifacts → `actions_get` download_workflow_run_artifact → curl).
Sprawdź na **każdym** z 28 surowych i 28 w ramkach:
1. brak nakładek diagnostycznych E2E (`dow:`, `touch:`, panele) i pigułki „Strona n z m” (U2 z WR1 — zamknij albo utrzymaj);
2. **OG-07** dla scen 03/04 (P-218 ogr. 1–6, P-224) — czy treść nadal w granicach; wynik WR1 nie zwalnia z ponownego przeglądu;
3. zgodność kadru z aplikacją 1221 (różnice wyłącznie z P-993) i podpisów z kadrami (U4 „notuj”);
4. obserwacje koordynatora do oceny (P1/P2/P3 albo „bez uwag”): na iPadzie 03/04 zakreślenia zaczynają się od połowy wiersza („stitches and join…”, „knit 2, purl 2…”), a znacznik „Row 48 ↓” stoi przy linii PDF „Row 21” przy liczniku „47 / Now working row 48” — czy to myli odbiorcę albo przeczy opisowi funkcji.
Werdykt dla zrzutów: DO SKLEPU / DO SKLEPU Z UWAGAMI / DO POWTÓRZENIA.

## Zakazy
Bez App Store Connect (także bez asc-zrzuty), bez `main`, bez force-push, bez dispatchu workflowów, bez zmian klas/progów/listy PU, nigdy `--no-verify`. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919); przed commitem `git diff --cached`. GitHub tylko przez MCP `mcp__github__*`. Tylko `docs/jakosc/`.

## Raport
SHA, werdykt zrzutów, uwagi z priorytetami (w tym stan U2 i U4), wynik OG-07 03/04, koszt.
