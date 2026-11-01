# Partia 8b (rola 08, tryb fix) — licznik

Stan: 2026-11-01 (sesja 2: koniec partii) · gałąź `claude/kopia-partia-8b-2026-11-01` (z `claude/kopia-partia-8a-2026-11-01` @ 605e9f4) · polecenie: `oczko-warsztat` `koordynacja/role-2026-11-01/08-partia-8b.md` (86744d1) · decyzje P-326–P-330.

## Stan wyjściowy
- Przed pracą (605e9f4): `env -u NODE_PATH npm test` — 252 zestawy, 2722 testy, kod 0 (2026-11-01).
- Środowisko: Linux, Node 22.23.4, bez Xcode/macOS: Swift (030) i E2E Maestro tylko jako kod + test statyczny; sprawdzenie na urządzeniu — krok właściciela.

## Klasyfikacja (E0) i kolejność
Wszystkie D (defekt); wybory P rozstrzygnięte w P-330 (011 A, 021 A, 014 S5 baner źródła, 025 reguła 04). Nie ma wyboru właściciela (koszty, konta, scalenie, wysyłka nietknięte). Ścieżki wrażliwe (zasada trybu fix: migracje, kopie, import, czyszczenie danych, zakupy): żadne z 9 ID. 024 dotyka zapisu wartości licznika, ale nie schematu — bez przeglądu subagenta.

| Kolejność | ID | Rodzaj | Plan (pliki) |
|---|---|---|---|
| 1 | 020 | D | `widok-licznika.ts` woła `powtorzenieLicznika`; `kompozycja/licznik.ts` zdarzenie końca powtórzenia ze skończonych |
| 2 | 021 | D | `cofnijOstatnie` (pomija cofnięcia i cofnięte), `historiaLicznika` (znacznik cofnięcia, `przed`), `Historia.tsx`, `app/historia.tsx` (rozwinięcie starszego wpisu → wpisanie wartości) |
| 3 | 022 | D | `app/index.tsx` / okno „Uczciwe zasady” nie na liczniku; E2E 07 przepisany |
| 4 | 009 | D | `zdarzeniaPlus` tworzy `cel-dnia` (haptyka przy osiągnięciu celu dnia) |
| 5 | 025 | D | rodzaj licznika w modelu (`WidokLicznika.rodzaj`), teksty „stitch” (klucze `licznik.*_oczka*`), bez linii „Now working row”, celu, przypomnień, strażnika, „Next part” |
| 6 | 024 | D | wpisanie wartości: limit zamiast `zapis`, separatory regionu, strażnik jak +1 (BR-ZAK-005) |
| 7 | 011 | D (wybór A) | „Reminders” w menu •••: lista, edycja, usunięcie; sygnał po wpisaniu wartości (S4) |
| 8 | 014 | D | strażnik: rodzaj licznika (oczka nie wołają), zwrot dnia limitu przy cofnięciu serii (L-06), baner z źródłem i godziną serii (S5) |
| 9 | 030 | D | `Aktywnosc.swift`: etykiety VoiceOver `karta_a11y`, `plus_a11y_przypomnienie` (test statyczny na Linuksie) |

### Decyzje E0 (do wiadomości koordynatora; bez STOP-u)
- **025, cel:** licznik oczek **nie ma celu**. Cel części jest w rzędach (`czesc.cel_rzedow`, BR-PRJ), a BR-LIC-006 mówi tylko o dwóch licznikach w projekcie. Linia celu na ekranie oczek się nie pojawia. Powrót: prośba o cel oczek w recenzjach → nowa funkcja przez rolę 03.
- **025, podsumowania:** już dziś liczą wyłącznie rzędy — zapytania filtrują `l.rodzaj = 'rzedy'` (`src/dane/repozytoria/kalendarz.ts:16`, `dni.ts:18`, `liczniki.ts:125`, `widok-ukonczenia.ts:22`, `widok-projektu.ts:57`). Dodaję tylko test regresji (oczka nie wchodzą do dnia, kalendarza ani karty ukończenia).

## Zrobione (test czerwony przed → poprawka → zielony; osobny commit)
Po każdym ID: `env -u NODE_PATH npm run verify` kod 0. Stan na koniec sesji 1: 259 zestawów, 2750 testów (przed pracą 252 / 2722).

| ID | Commit | Test (czerwony przed poprawką) |
|---|---|---|
| 020 | 6848241 | `tests/dane/powtorzenie-wektory-widok.test.ts` (5 z 8 padało: RD-12-W1–W4, W9); poprawiony `tests/dane/czesc-menu.test.ts` (utrwalał wynik kodu, 07-jakosc-032); `tests/dane/kompozycja-licznik-8b.test.ts` (koniec powtórzenia w obu trybach — straż zachowania, była zielona) |
| 021 | 22e36a1 | `tests/dane/cofniecie-podwojne.test.ts` (5 z 5 padało: drugie Undo dawało 3 zamiast 1); UI: `tests/ekrany/historia-trasa.test.tsx` (pisany razem ze zmianą propsów ekranu, więc bez osobnego przebiegu czerwonego), poprawiony `historia-menu.test.tsx`; wyrocznia kluczy `tests/narzedzia/klucze-fix10-8b.test.ts` |
| 022 | 3cc9dcb | `tests/ekrany/uczciwe-zasady-trasa.test.tsx` (okno na liczniku 1 zamiast 0; na liście 0 zamiast 1); scenariusz E2E 07 przepisany (nie uruchamiany: bez macOS) |
| 009 | 1b240e9 | `tests/dane/kompozycja-licznik-8b.test.ts` (dziesiąte +1 przy celu dnia 10 bez `cel-dnia`) |
| 025 | c034efc | `tests/ekrany/licznik-oczek.test.tsx` (3 z 4 padały; czwarty to straż podsumowań) |
| 024 | 68ddca1 | `tests/ekrany/wpisanie-trasa.test.tsx` (2 z 4 padały: limit mówił „whole number”, „1,000” odrzucane), `tests/i18n/parsuj-calkowita.test.ts` (10 z 20 przy zaślepce) |
| 011 | 6b8b460 | `tests/dane/przypomnienia-edycja.test.ts` (3 z 5), `tests/ekrany/przypomnienia-trasa.test.tsx` (4 z 5), `tests/ekrany/wpisanie-sygnal.test.tsx` (2 z 4: sygnał S4 po wpisaniu) |
| 014 | 56acc04 | `tests/dane/straznik-serii-8b.test.ts` (4 z 7), `tests/ekrany/baner-serii-zrodlo.test.tsx` (2 z 3) |
| 030 | 382b061 | `tests/jakosc/aktywnosc-a11y-statyczny.test.ts` (1 z 2: klucze `karta_a11y`, `zablokowany_a11y`, `plus_a11y_przypomnienie` nieużyte w `Aktywnosc.swift`) |

### Uwagi do zrobionych
- **021:** reguła w `src/domena/cofniecie.ts` (`celCofnieciaIndeks`, `cofnieteId`) używana przez `cofnijOstatnie` i `historiaLicznika`. Seria na końcu historii to jeden wpis z „Undo n rows” (`cofnijSerie`); seria dłuższa niż 200 zdarzeń (`OKNO_SESJI`) nie zgrupuje się. Przycisk rozwijania starszego wpisu ma glify „+”/„–” z etykietą VoiceOver = tekst wpisu — **brak klucza `en` dla tej kontrolki w `klucze.json`** (prośba do 04).
- **025:** poza polecenia 04 ukryłem w menu ••• licznika oczek także „Goal”, „Repeat” i tryb rzędu (cel, powtórzenie i „rząd w trakcie” dotyczą rzędów) — do potwierdzenia przez 04. Dla oczek strażnik serii (RD-17) i limit dnia: patrz 014 niżej.
- **Klucze en:** `klucze.json` ma kontekst plików mnogich osobno dla `_one`/`_other`; konwencja projektu trzyma jeden kontekst na nazwie bazowej, więc zachowano kontekst z `_one`, a kontekst `_other` (inny sens, np. „po «30 → 130 ·»”) pominięto. Skrypt nakładania kluczy był w scratchpadzie (nie w repo): wartości `en` 1:1, kontekst na nazwie bazowej, potem `node scripts/sprawdz-i18n.mjs src/i18n/slowniki --zrodlo en --pseudo src/i18n/pseudo/en-XA.json`.
- Po każdej zmianie testów: `node docs/jakosc/narzedzia/tabela-08.mjs --wynik docs/jakosc/e4/tabela-08.md`; kontrola repo wymaga, by każdy test importował plik z `src` bezpośrednio.

## Sesja 2 (partia 8b, część 2): 024, 011, 014, 030 zrobione
Stan na koniec: `env -u NODE_PATH npm run verify` kod 0, 267 zestawów, 2800 testów (po części 1: 259 / 2750). Gałąź `claude/kopia-partia-8b-2026-11-01`, na roboczą nie pushowano.

### Decyzje i uwagi sesji 2 (do wiadomości koordynatora; bez STOP-u)
- **024:** strażnik jak +1 działał już w `wpiszWartosc` (przez `zmien`); defekt to mapowanie błędu w trasie (`limit` → `zapis`) i parser. Nowa `parsujCalkowita` (`src/i18n/format.ts`): cyfry ASCII i cyfry regionu (ar-EG), separator tysięcy języka (pl: spacja zwykła/nierozdzielająca/wąska; de: kropka; en: przecinek), separator dziesiętny i grupy w złych miejscach = odrzucone. Komunikat limitu = istniejący `limit.arkusz_dni` w formularzu (nie nowy klucz; 04 nie dała nowego tekstu dla 024). Komunikat „z przykładem zapisu w regionie” (BR-LIC-017 „Zapis niezgodny”) — **brak klucza w `klucze.json`**, zostaje `formularz.wpisz_blad` (prośba do 04).
- **011:** zmiana i usunięcie przypomnienia to `UPDATE`/`DELETE` jednego wiersza (`czesc.ts`); schemat bez zmian (wyzwalacze iCloud `przypomnienie_icloud_u/d` już istnieją). Po zapisie, usunięciu i wpisaniu arkusz zamyka się do licznika (menu → lista → edycja to `router.replace`). Sygnał S4: `KompozycjaLicznika.wpisz` (nowa metoda) liczy `wejscie()` z poprzedniej wartości; trasa gra wibrację `rzadZInstrukcja` (tylko przy włączonych wibracjach) i ogłasza `licznik.wejscie_w_przypomnienie`. Wiersz „Delete reminder” w edycji to zwykły `Przycisk` (nie `niszczacy`), potwierdzenie przez `Alert.alert` ze stylem `destructive` (design-spec 011).
- **014:** (a) `seria()` w widoku przechodzi przez `serieLicznika` z rodzajem licznika — także w historii (licznik oczek nie grupuje serii; wcześniej wpis historii oczek mógł mieć „Undo n rows”). (b) `cofnijSerie` ma wymagany parametr `zrodlo` (`pytanie-serii` z banera, `historia` z `app/historia.tsx`); zwrot dnia limitu liczy `cofniecieSerii` (L-19) w tej samej transakcji; **„inne dodania dnia” = +1 oraz wpisania tego dnia poza serią** (domena mówi o „dodaniach”; wpisanie zużywa dzień limitu, D4, więc po wpisaniu dzień zostaje — wybór konserwatywny, do potwierdzenia przez 02/koordynatora). (c) Baner serii: `zrodlo` i `godzina` (początek serii, format regionu), teksty `licznik.seria_blokada`/`seria_zegarek`; ogłoszenie VoiceOver = ten sam tekst (brak osobnego klucza „Undo is available.” w `klucze.json`, więc bez tego zdania — prośba do 04).
- **030:** Swift tylko jako kod + test statyczny (brak Xcode/swiftc; **niekompilowane**). `etykietaPlus` (pełna `plus_a11y_przypomnienie` przy przypomnieniu), `etykietaKarty` na karcie Smart Stack jako jeden element. **Nie zastosowano `karta_a11y` na karcie ekranu blokady:** jej `Opis` niesie komunikaty stanów (blokada, limit, „nie dodano”) i statyczna etykieta by je zakryła; jeden element z przyciskiem +1 wymaga decyzji 04 (czy przycisk ma zostać osobny). Czas sesji poza etykietą (rysuje go system; statyczna etykieta by się starzała). Do sprawdzenia u właściciela na urządzeniu: VoiceOver na ekranie blokady, Dynamic Island i Smart Stack.
- **Przegląd subagenta (ścieżki wrażliwe):** 014 usuwa wiersz `dzien_limitu`, 011 kasuje wiersz przypomnienia — przegląd odbył się (świeży subagent, tylko diff `6b8b460..56acc04` dla `licznik.ts`, `widok-licznika.ts`, `czesc.ts`, zasady 10–14, szukał P0/P1): wynik „brak uwag” (2026-11-01). To odpowiedź modelu, nie dowód działania na urządzeniu.

### Otwarte (nie blokują)
- Maestro iOS nie uruchamiano (brak macOS): scenariusze E2E dla „Reminders” w menu i wpisania wartości nie są dopisane (bez zmian w `e2e/` w tej sesji).
- Klucze `en` dla 024 (przykład zapisu regionu) i „Undo is available.” (014) — prośba do 04.

## Nowe obserwacje (poza zakresem; nie naprawiane)
- `app/formularz/[rodzaj].tsx`: wszystkie błędy zapisu to `zapis` (dotyczy też `nazwa`, `cel`, `powtorzenie`) — szczegóły w 024.
- `docs/jakosc/e4/tabela-08.md` jest generowana: w tej partii regenerowana po każdym ID.
