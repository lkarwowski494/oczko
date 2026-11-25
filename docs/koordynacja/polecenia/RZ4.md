# RZ4 — rola 07 audit: recenzja niezależna ZR10 (tryb „zastąp” w asc-zrzuty — pierwsze usuwanie w App Store Connect) (2026-11-25)

Koordynator: session_01T66VByMuFaNAxNQuUgpYzA (raporty i pytania tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 2,5 USD (STOP 3,3). Gałąź wyniku: `claude/rz4-recenzja-zr10-2026-11-25` od 9869751a (`origin/claude/zr10-zrzuty-zastap-2026-11-25`; inny HEAD: zgłoś). Decyzja: KO-210. Pula P: P-1053…P-1054. Kontekst: od 30% okna kończysz krok, zapis stanu w `docs/jakosc/rz4-stan.md`, push, PRZEKAZANIE.

## Rola
07-jakosc w trybie audit. Prompt roli składasz sama (wyjątek nazwany jak RZ2, WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 07-jakosc --tryb audit --plik <scratchpad>/07-audit.md`; przeczytaj w całości, jesteś tą rolą. Recenzent niezależny: `docs/jakosc/zr10-*` i P-1048…P-1050 czytasz jako opis zamiaru, nie dowód. Atrapa serwera w testach to model z dokumentacji, nie prawdziwy serwer — oceniaj ją względem dokumentacji Apple.

## Wejście
`git diff f0b28df6..9869751a` (1 commit, 11 plików): `scripts/asc/zrzuty.mjs`, `scripts/asc/iap-localizations.mjs` (wspólny klient: `allowDelete`, `isPlacementDeletePath`), `.github/workflows/asc-zrzuty.yml` (wejście `zastap`), testy `tests/wydanie/zrzuty-zastap*.{ts,mjs}`, zmiana `tests/wydanie/asc-metadane.test.ts`, `docs/wydanie/sklep.md`, `docs/jakosc/zr10-api.md`.

## Zadania (priorytet: utrata danych w sklepie)
1. **Granica usuwania:** czy jakakolwiek ścieżka kodu może usunąć coś poza placementem APP_SCREENSHOT na lokalizacji wersji w stanie PREPARE_FOR_SUBMISSION (obraz biblioteki, placement opublikowanej 1.0, inny typ placementu, inna grupa urządzeń, inna lokalizacja niż w wierszu planu). Czy `allowDelete` włącza się tylko przy `tryb=apply` i `zastap=true`. Czy strażnik ścieżki jest szczelny (ścieżki z `links.next`, kodowanie, wielkość liter). Czy inne skrypty używające wspólnego klienta nie dostają DELETE.
2. **Kolejność i ponowienie:** nowe obrazy `uploaded: true` przed zdjęciem starych; błąd w połowie → stan opisany i ponowny przebieg dochodzi do celu; co się dzieje, gdy GET placementów nie zwraca `referenceName` (P-1050 [DO USTALENIA]) — czy wtedy nie ma ryzyka zdjęcia nowych placementów w pętli albo pustej grupy.
3. **Zgodność z dokumentacją Apple** (developer.apple.com/documentation/appstoreconnectapi — App Asset Library, placements, ordering): metody, ścieżki, ciała żądań, limit zrzutów w grupie, zachowanie przy wersji nieedytowalnej. Cytaty z adresem do `docs/jakosc/rz4-recenzja.md`.
4. **Testy:** czy 36 testów jest czerwonych na f0b28df6 z właściwego powodu (uruchom), czy zmiana `asc-metadane.test.ts` nie osłabia kontroli, czy przypadki brzegowe z p. 1–2 mają test (brak = znalezisko).
5. `npm ci && npm run verify` na 9869751a → `docs/jakosc/rz4-verify.txt` (kod, liczba testów). Gotowe: `docs/jakosc/rz4-recenzja.md` — znaleziska P1/P2/P3 (plik:linia, dowód), werdykt „PRZYJĄĆ / PRZYJĄĆ Z UWAGAMI / ODRZUCIĆ” i lista, co sprawdzić w pierwszym dry-runie na prawdziwym ASC; wpis P- do `docs/decyzje.md`. Commit, push. Kodu nie poprawiasz.

## Zakazy
Bez wywołań App Store Connect, bez dispatchu workflowów, bez `main`, bez scalania, bez force-push, bez zmian `.github/workflows/`, `app/`, `src/`, `scripts/`, testów i progów, nigdy `--no-verify`, bez tworzenia/archiwizacji sesji, bez zapisu na `koordynacja`, bez pytań do właściciela (bez AskUserQuestion); STOP-y → raport do koordynatora i czekasz. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez linii Co-Authored-By i Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`, przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 9869751a..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raport (≤ 8 linii, send_message do koordynatora)
SHA, werdykt (P1/P2/P3 z liczbami, każde P1 jednym zdaniem), verify (kod, liczba testów), lista kontrolna dry-runu, decyzje P-, koszt.
