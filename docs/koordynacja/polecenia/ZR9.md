# ZR9 — rola 10 fix: uwagi P2/P3-1 recenzji RZ2 do kontroli zakreśleń (2026-11-25)

Koordynator: session_01T66VBxMWupw4yogmNE2zYs (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9). Gałąź wyniku: `claude/zr9-kontrola-zakreslen-2026-11-25` od f0b28df6 (= integracja `claude/youthful-pasteur-kx83sn`; inny HEAD: zgłoś). Decyzje: KO-205, KO-206. Pula P: P-1046…P-1047. Kontekst: od 30% okna kończysz krok, zapis stanu w `docs/jakosc/zr9-stan.md`, push, PRZEKAZANIE.

## Rola
10-wydanie w trybie fix. Jak ZR8/ZR8c (wyjątek nazwany, WG-30): prompt roli składasz sama — `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 10-wydanie --tryb fix --plik <scratchpad>/10-fix.md`; przeczytaj w całości, jesteś tą rolą. Do repo aplikacji nic z biblioteki nie zapisujesz.

## Wejście
`docs/jakosc/rz2-recenzja.md` i `docs/jakosc/rz2-proby-czulosci.txt` (recenzja niezależna RZ2, f0b28df6): P2-1, P2-2, P3-1, P3-2, P3-3.

## Zadania
1. **Wpis decyzji RZ2** do `docs/decyzje.md`: P-1044 (kadry 03/04 z 45633013976/45633019859 — do sklepu TAK, 4 uwagi informacyjne K-1…K-4) i P-1045 (kod ZR8/ZR8b/ZR8c — PRZYJĄĆ Z UWAGAMI) z odnośnikiem do `rz2-*.md` i KO-206 — dosłownie według recenzji, bez własnej oceny.
2. **P2-1** (`scripts/ci/kontrola-zakreslen.mjs:102-111`): górna granica grubości pasa — próby M5/M6 z `rz2-proby-czulosci.txt` mają dawać błąd. Test najpierw czerwony na f0b28df6, potem zielony; prawdziwe kadry z 45633* nadal OK (test na danych kadrów z ZR8c).
3. **P2-2** (`:123, :131, :209`): brak linii znacznika ani znacznik o nasyceniu > 30 nie mogą dawać cichego OK — wynik jawny (błąd albo ostrzeżenie w raporcie `komplet`; wybierz wariant, który nie daje fałszywego alarmu na kadrach 45633*, druga opcja z kompromisem w raporcie). Próby M2/M4 jako testy czerwone → zielone.
4. **P3-1**: sprawdź, czy testy czułości uruchamiają się w CI (`OCZKO_WYMAGAJ_IMAGEMAGICK=1`, `zrzuty-sklepu.yml:470`, ImageMagick na ubuntu) — dowód z logu ostatniego przebiegu 45633019859 (końcówka logu przez MCP). Jeśli się nie uruchamiają, zgłoś w raporcie z propozycją (zmiana workflowu tylko po odpowiedzi koordynatora). P3-2 i P3-3: tylko ocena w raporcie (zmiana asercji ZR7 tylko, jeśli recenzja wskazuje błąd testu, z uzasadnieniem).
5. `npm ci && npm run verify` kod 0 → `docs/jakosc/zr9-verify.txt`. Commit, push na gałąź wyniku.

## Zakazy
Bez ASC, bez `main`, bez scalania do integracji, bez force-push, bez dispatchu workflowów, bez zmian `.github/workflows/` bez odpowiedzi koordynatora, bez zmian `app/`, `src/`, `modules/`, `targets/`, bez osłabiania progów ani zmniejszania zestawu kontroli, nigdy `--no-verify`, bez tworzenia/archiwizacji sesji, bez zapisu na `koordynacja`, bez pytań do właściciela (bez AskUserQuestion); STOP-y roli i punkt czyszczenia → raport do koordynatora i czekasz. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez linii Co-Authored-By i Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`, przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' f0b28df6..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message do koordynatora)
Po zadaniu 2: czas i szacunek reszty. Końcowy: SHA, testy czerwone→zielone (liczby), wariant P2-2 i druga opcja, P3-1 z dowodem, verify (kod, plik), decyzje P-, koszt.
