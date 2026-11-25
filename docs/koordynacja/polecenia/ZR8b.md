# ZR8b — rola 10 fix: znacznik rzędu w przerwie (opcja D) — następca ZR8 (2026-11-25)

Koordynator: session_01T66VBzwa5cozWNDhofQSHH (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9). Gałąź: ta sama `claude/zr8-kadry-03-04-2026-11-25`, kontynuacja od 0f349489 (ZR8). Decyzje: KO-201, KO-202. Pula P: P-1038…P-1039. Kontekst: od 30% okna kończysz krok, zapis stanu, push, PRZEKAZANIE.

## Wejście
Przeczytaj `docs/koordynacja/polecenia/ZR8.md` (zadanie pierwotne), wpisy P-1035…P-1037 w `docs/decyzje.md`, `docs/jakosc/zr8-*.{md,txt}` i commit 0f349489. Stan ZR8: kontrola grubości pasa i linii znacznika gotowa (test 64/64 czerwony→zielony), łagodzenie cienkiego pasa w `00-przygotuj.yaml`; STOP znacznika: domyślnie stoi na środku strony (396 pt) = tekst wiersza 21 (baza 390), przerwa 401–427 pt.

## Zadanie
1. Opcja D (KO-202): w `src/kompozycja/e2e/wzor-sklepu.ts` zmień układ strony PDF tak, by środek strony (miejsce domyślnego znacznika) leżał w pustym pasie przed wierszem „Row 21”/„Rząd 21” na każdym układzie (iPhone 6,9″ i 6,5″ jeśli używany, iPad 13″; en, pl i pozostałe języki — wzór ma tylko en/pl, sprawdź, który dostają inne języki). Wylicz z geometrii (MediaBox 612×792, skala wyświetlania per urządzenie z kadrów/wycinków w repo) i podaj margines w pt na każdym układzie; cel: linia znacznika ≥ 4 pt od tekstu z obu stron. Tekst wzoru (wiersze) bez zmian, chyba że wymaga tego geometria — wtedy nazwij.
2. Wyjątek od zakazu `src/` dotyczy tylko tego pliku. Udowodnij (grep importów / test), że moduł ładuje się tylko w trybie e2e (P-238) i nie trafia do bundla wydania.
3. Jeśli przesunięcie wierszy zmienia położenie pasów zakreślenia w `04-zakreslenie.yaml` (Row 9, Row 13), dopasuj sceny i testy geometrii (`tests/wydanie/zrzuty-zakreslenia-geometria.test.ts`, `zrzuty-dane-spojnosc.test.ts`, `zrzuty-poprawki-ah.test.ts` i inne zależne). Kontroli i progów ZR8 nie osłabiasz; łagodzenie pasa w 00 zostaje.
4. Test, który jest czerwony na fiksturze sprzed zmiany (znacznik na tekście wiersza 21 wg geometrii) i zielony po zmianie.
5. Maestro 2.12.1 `readCommands` dla zmienionych scen; `npm run verify` kod 0 → `docs/jakosc/zr8b-verify.txt`.
6. W raporcie potwierdź albo popraw wejścia pełnego przebiegu `zrzuty-sklepu.yml` z raportu ZR8 (zmiana fikstury = nowa aplikacja e2e, więc `aplikacja_z_przebiegu` pusty i pełny build).

## Zakazy
Jak w ZR8 (bez ASC, bez `main`, bez scalania do integracji, bez force-push, bez dispatchu, bez zmian `.github/workflows/` poza opisami, bez zmian klas/progów/listy PU, nigdy `--no-verify`, bez tworzenia/archiwizacji sesji, bez zapisu na `koordynacja`, bez pytań do właściciela). Poza `src/kompozycja/e2e/wzor-sklepu.ts` żadnych zmian `app/`, `src/`, `modules/`, `targets/` — jeśli potrzebne, STOP z dowodem. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`. GitHub tylko przez MCP. Przed pushem `npm ci`.

## Raport (≤ 10 linii, send_message)
SHA, marginesy znacznika per układ (pt), dowód „tylko e2e”, zmiany scen/testów, test czerwony→zielony, Maestro i verify, wejścia przebiegu, decyzje P-, koszt.
