# FX6 — diagnoza czerwonych bramkowych 64 i 69 (iOS 43806685504, 08 fix) — stan z 2026-11-16

Dowody: artefakt `e2e-czesc-3-iphone` (ID 14202224920) przebiegu 43806685504 (SHA 7fbb5b94, część 3, iPhone); odczyt: `commands.json`, `screen-hierarchy/*.json`, zrzuty `screenshots/*.png`, `logs/device-xctest.log`, `logs/device-simulator.log`, `logs/maestro.log` obu scenariuszy. Kod: d7642f33 (przodek: 7fbb5b94). Brak maszyny macOS w tej sesji, więc bez własnego przebiegu.

## FX6-02 · scenariusz 69 (P-687), krok 25: `licznik-wartosc` „0” po „−1”
- Stan w chwili porażki (`screen-hierarchy/step-026-assertCondition-0.json`, zrzut `step-026`): `licznik-wartosc` = „1”, „Now working row 2”, brak komunikatu błędu; `e2e-nawigacje` = „pattern presses: 0 (last: none); counter screen mounts: 1” (ekran nie przemontowany, nowy panel nie zmienił stanu licznika).
- Układ: panel `e2e-nawigacje` leży na y 486–519; „−1” (`licznik-minus`) na [16,752][88,824] — rozłączne, panel niczego nie zasłania. Stuknięcie poszło w środek przycisku (`Tapping 52.0, 788.0`, xctest 06:15:18.450); „+1” w jego środek (`243.0, 740.0`, 06:15:12.357).
- W logu symulatora oba stuknięcia dotarły do UIKit aplikacji (`Sending UIEvent … to window`, 06:15:12.376/.503 dla „+1”, 06:15:18.472/.586 dla „−1”). „+1” zadziałało (wartość 1), „−1” nie zmieniło wartości przez 17,9 s odpytywania.
- Kod: `naMinus` (src/kompozycja/licznik.ts:274) i `odejmijRzad` (src/przypadki-uzycia/licznik.ts:74) nie mają bramki czasowej ani warunku „po +1”; z 1 daje 0. Ten sam podprzepływ (`projekt-roboczy.yaml`) przeszedł w tym samym przebiegu w scenariuszu 64 (kroki 18–26) i w innych.
- Klasyfikacja: **(c) niestabilność** (nie (a): nie znaleziono ścieżki w kodzie, która ignoruje „−1”; nie (b): scenariusz sam robi start-czysty i projekt roboczy). Pewność średnia — nie wykluczone, że „−1” utknęło w aplikacji (kolejka zapisów albo odczyt po zapisie), czego z logów nie widać (brak tekstów JS i liczników „−1”).

## FX6-01 · scenariusz 64 (BR-DNI-001/S1), krok 28 → podprzepływ „nazwa projektu Harbor”
- Próba 1 (krok 44, zrzut `step-044`): w polu „Project” tylko „H”, pole „Part” puste. xctest dostarczył kolejno `H` (10,4 s, bo „Checking existence of Keyboard” trwało 10 s przy pierwszym znaku), `a`, `r`, `b`, `o`, `r` (po 1–2,4 s każdy, wszystkie COMPLETED), a w polu został sam „H”.
- Próba 2 (krok 54, zrzut `step-054` + hierarchia): pole „HarborH”, kursor między „r” a końcowym „H”. Wszystkie 6 znaków doszło, ale `eraseText 40` nie usunął „H” z próby 1 (kursor na początku tekstu po stuknięciu → backspace nic nie kasuje), więc „Harbor” wpisano przed starym „H”.
- Maszyna: `waitForAnimationToEnd` 14 s (krok 35), pierwszy `inputText` 12 s (krok 37); mediana czasu stuknięcia w tym scenariuszu 3,1 s (w innych scenariuszach części 1,5–3,2 s, więc 64 jest w górze zakresu, ale nie poza nim).
- Kod: `Pole` (src/ekrany/Arkusz.tsx:151) to zwykły kontrolowany `TextInput` (`value` + `onChangeText`, bez obciążającej logiki na znak); `FormularzNazwy` (src/ekrany/Formularze.tsx:201) trzyma stan lokalnie. Nowy panel e2e nie jest renderowany na tym ekranie (tylko w app/licznik.tsx).
- Klasyfikacja: **(c) niestabilność** symulatora (znaki 2–6 próby 1 zgubione, wzorzec znany dla kontrolowanego `TextInput` przy opóźnionym wątku JS); nie (a): w kodzie formularza nie ma resetu pola ani remontu; nie (b): scenariusz zaczyna od clearState.
- Uwaga o wspólnym podprzepływie `nazwij-projekt.yaml` (poza moimi plikami): `eraseText: 40` zaczyna od kursora; po stuknięciu w pole z tekstem kursor nie zawsze jest na końcu (próba 2). Ewentualna poprawka (np. stuknięcie w prawą krawędź pola przed `eraseText`) wymaga zgody koordynatora; nie wykonana.

## Wspólna przyczyna?
Nie ten sam podprzepływ i nie ten sam stan licznika po poprzednim scenariuszu (oba zaczynają od `start-czysty`, clearState). Wspólne: zdarzenie wejścia (stuknięcie albo znak) zostało dostarczone do UIKit i COMPLETED po stronie Maestro, a skutek w stanie aplikacji nie nastąpił w zadanym czasie; w obu przypadkach maszyna była wolna (kroki 1,5–14 s). Różnica względem f3b3a8cb: tylko `PanelNawigacji` i licznik naciśnięć „Wzór” (brak wpływu na „−1” i na formularz — patrz wyżej).

## Decyzje (pula P-908…P-911; do przeniesienia do `docs/decyzje.md` po scaleniu)
- **P-908 (2026-11-16, 08 fix FX6, warunkowa):** FX6-01 i FX6-02 sklasyfikowane jako (c) niestabilność; bez zmian w kodzie, scenariuszach i asercjach, bez ponowień (P-091 10a, KO-084). Warunek: dwa kolejne przebiegi zielone dla 64 i 69 albo nowy dowód z aplikacji; odrzucone: (a) bez ścieżki w kodzie, (b) bez zależności od poprzedniego scenariusza.
- **P-909 (propozycja do koordynatora; wdrożona w FX6b, patrz niżej — inny podział niż w planie: jeden moduł `wejscia-stan.tsx` zamiast `minus-stan.tsx`):** diagnostyka jak BX-019 (`PanelNawigacji`): licznik naciśnięć „−1” i numer kolejności odświeżeń stanu licznika na ekranie licznika (e2e), żeby rozdzielić „stuknięcie nie dotarło do JS” od „JS odebrał, wynik nie trafił na ekran”. Koszt: nowy plik w `src/kompozycja/e2e/` + test, wpis w `panele.tsx`; bez wpływu na bundle poza buildem E2E.

## Czego nie sprawdzono
- Wyników 64 i 69 w przebiegach 43810499611 (część 3 w toku o 06:42 UTC, doszła dopiero do początku scenariuszy) i 43814487099 (anulowany) — nieodczytane.
- Przebiegu lokalnego (Linux bez Xcode).

## Ścieżki dowodów (artefakt 14202224920 „e2e-czesc-3-iphone” → `e2e-out.zip` → `e2e-out/`)
Skrót katalogu scenariusza: `<S>` = `<nr-nazwa>/<data_godzina>/<tytuł scenariusza>/`.
- Scenariusz 64: `64-br-dni-001-s1-kalendarz-dzien-podsumowanie/2026-11-16_055904/…/` — `commands.json` (kroki 33–53: retry, `inputText`, asercje), `screenshots/step-034-retry.png`, `step-044-assertCondition-Harbor.png` (pole „H”), `step-054-assertCondition-Harbor.png` („HarborH”), `screen-hierarchy/step-044-…json`, `step-054-…json`, `logs/device-xctest.log` (06:01:06 stuknięcie w pole; 06:01:22 eraseText; 06:01:25–06:01:35 pierwszy inputText „H” 10,4 s; potem a, r, b, o, r), `logs/maestro.log` (06:02:06.892 próba 1 FAILED, 06:02:44.102 próba 2 FAILED). Plik zbiorczy: `e2e-out/64-br-dni-001-s1-kalendarz-dzien-podsumowanie.xml`.
- Scenariusz 69: `69-p-687-przewodnik-z-dzis-pokaz/2026-11-16_061333/…/` — `commands.json` (krok 19 „+1” tapOnElement, 20 asercja „1”, 24 „−1” tapOnElement, 25 asercja „0” FAILED 17 941 ms), `screenshots/step-026-assertCondition-0.png`, `screen-hierarchy/step-026-assertCondition-0.json`, `logs/device-xctest.log` (`Tapping 243.0, 740.0` 06:15:12.357; `Tapping 52.0, 788.0` 06:15:18.450), `logs/device-simulator.log` (UIEvent do okna aplikacji: 06:15:12.376/.503 oraz 06:15:18.472/.586). Plik zbiorczy: `e2e-out/69-p-687-przewodnik-z-dzis-pokaz.xml`.
- Statystyka czasu stuknięć (mediana ms / maks., liczone z `commands.json` wszystkich scenariuszy części 3): 64: 3105 / 4246; 69: 2010 / 3171; pozostałe 1543–3230 / 2129–8233.

## Hipotezy wykluczone (z dowodem)
- Nowy panel `e2e-nawigacje` zasłania „−1” albo przesuwa układ: wykluczone, panel y 486–519, „−1” y 752–824 (hierarchia 69); na formularzu 64 panelu nie ma.
- Przemontowanie ekranu licznika w trakcie 69: wykluczone, „counter screen mounts: 1”.
- Stuknięcie w złe miejsce: wykluczone, współrzędne = środek przycisków; UIEvent dotarł do okna aplikacji.
- Awaria maszyny/sterownika (`DeviceUnreachableException`): brak w logu; sam symulator wolny (kroki 1,5–14 s).
- Bramka czasowa „−1” po „+1” w kodzie: brak (`src/przypadki-uzycia/licznik.ts:74`, `src/kompozycja/licznik.ts:274`).
- Zależność od poprzedniego scenariusza: wykluczona, oba zaczynają od `start-czysty` (clearState).
- Reset pola/remont formularza w 64: brak w `Formularze.tsx:201`, `Arkusz.tsx:151`.
- Niewykluczone: „−1” utknęło w aplikacji (kolejka zapisów, odczyt po zapisie, nieuporządkowane `odswiez()` w `src/ekrany/Aplikacja.tsx:55`) — logi nie niosą stanu JS; rozstrzyga diagnostyka niżej.

## Plan diagnostyki (opcja 2, decyzja koordynatora; robi FX6b na tej samej gałęzi)
- Nowy plik `src/kompozycja/e2e/minus-stan.tsx` (wzór: `nawigacje-stan.tsx`): stan w pamięci procesu `{ nacisniecia, ostatniWynik: 'ok'|'zablokowany'|'blad'|null, odswiezenia: number, ostatnieOdswiezenieSkonczone: number }`, `zliczMinus()` (przed `p.naMinus()`), `zapiszWynikMinus(w)`, `zliczOdswiezenie(numerWydania, numerZakonczenia)`, `PanelMinus` z `testID="e2e-minus"` i tekstem po angielsku jak pozostałe panele (bez `t()`), `zerujMinus()` dla testów.
- Wpis w `src/kompozycja/e2e/panele.tsx` (eksport `PanelMinus`, `zliczMinus`, …), użycie w `app/licznik.tsx` obok `PanelNawigacji` (`paneleE2e ? <paneleE2e.PanelMinus /> : null`) i wywołania w `src/ekrany/Licznik.tsx` (`minus()`, linie 77–84) oraz `src/ekrany/Aplikacja.tsx` (`odswiez`, linie 55–59: numer wydania przy starcie i przy zastosowaniu wyniku) — tylko przez `paneleE2e?.…` (poza buildem E2E bez efektu).
- Testy przed kodem: `tests/ekrany/e2e-minus-stan.test.tsx` (panel liczy naciśnięcia i wyniki; zero w stanie wyjściowym; poza buildem E2E brak panelu) oraz test uporządkowania `odswiez()` w `Aplikacja` (starsze wydanie kończące się później nie nadpisuje nowszego) — czerwony najpierw; jeżeli czerwony na obecnym kodzie, to defekt (a) i poprawka w `Aplikacja.tsx`.
- Po zielonym `npm run verify` jeden push; scenariusze 64/69 bez zmian (diagnostyka tylko w aplikacji E2E; lista plików poza `e2e/` — zgodnie z KO-089/091).
- Odrzucone: zmiana `nazwij-projekt.yaml` (opcja 3) — wspólny podprzepływ, bez zgody koordynatora.

---

# FX6b — wynik (2026-11-16, 08 fix; gałąź `claude/fx6-bramkowe-64-69-2026-11-16` od 14804846)

## Diagnostyka na następny przebieg iOS (P-909, wzór BX-019)
Nowy moduł `src/kompozycja/e2e/wejscia-stan.tsx` (stan w pamięci procesu, bez `t()`; ładowany tylko przez `paneleE2e`, P-238), eksport w `src/kompozycja/e2e/panele.tsx`. Dwa panele, tylko build E2E; zachowanie aplikacji bez zmian (panele tylko liczą).
- **`e2e-licznik-wejscia`** (ekran licznika, slot `sprawdzStopera` pod kreskami, obok `e2e-nawigacje`: zwykły `Text` bez stylu, poza `licznik-wartosc`/„−1”/„+1”; wg FX6 slot leży na y 486–519, „−1” na 752–824). Tekst:
  `counter input: plus N, minus N; saves ok: plus N, minus N; saves failed: N; state value: N|none; refresh: started N, applied N, skipped N`
  - `counter input` = wywołania obsługi „+1”/„−1” w `useStanLicznika` (`src/ekrany/Aplikacja.tsx`), czyli stuknięcia, które dotarły do JS **i** przeszły sprawdzenie blokady na ekranie (stuknięcie przy zablokowanym liczniku pokazuje komunikat, nie liczy się);
  - `saves ok` / `saves failed` = zakończone wywołania `dodajRzad` / `naMinus` z wynikiem ok / błędem (`failed` łącznie dla obu);
  - `state value` = ostatnia wartość `skonczone` wpisana do stanu ekranu (z „+1”, „−1” albo z odczytu stanu), `none` przed pierwszym wpisem;
  - `refresh` = odczyty stanu z kompozycji po „+1”/„−1” i akcjach: rozpoczęte, zastosowane, pominięte jako nieaktualne (patrz FX6b-01).
- **`e2e-nazwa-wejscia`** (formularz nazwy, **za polami**, po opisie i komunikacie błędu — nie przesuwa pola „Project”): 
  `name form: project events N, last length N|none; part events N, last length N|none` — liczba zdarzeń `onChangeText` odebranych w JS i długość ostatniej wartości dla każdego z pól.
- Odczyt: stuknięcie „−1” bez zmiany wartości: `minus 0` = nie dotarło do JS; `minus 1, saves ok minus 0` = zapis się nie skończył; `saves ok minus 1`, a `state value` bez zmiany = wynik nie trafił do stanu; `state value` zmienione, a `licznik-wartosc` nie = renderowanie/ekran. Pole nazwy: `project events 6, last length 6`, a w polu „H” = znaki odebrane w JS, zgubione na ekranie; `events 1` = reszta nie dotarła do JS.
- Hierarchia przy porażce: panele są zwykłymi `Text` z `testID`, więc trafiają do `screen-hierarchy/step-*.json` jak `e2e-nawigacje` w FX6; **ryzyko**: panel nazwy leży za polami w przewijanej treści arkusza, pod klawiaturą — czy hierarchia XCTest go wyliczy, wykaże dopiero przebieg [DO USTALENIA]. Gdyby nie — dopisać do scenariusza 64 tylko krok `copyTextFrom`/zrzutu (poza zakresem FX6b, wymaga zgody).
- Do `e2e/README.md` (dopisze sesja BX po scaleniu; mnie nie wolno) — wiersz tabeli paneli: `e2e-licznik-wejscia` (ekran licznika, liczniki wejść „+1”/„−1”, zapisów, wartość ze stanu, odczyty stanu; diagnostyka scen. 69, FX6b) i `e2e-nazwa-wejscia` (formularz nazwy, zdarzenia zmiany tekstu i długość wartości; diagnostyka scen. 64, FX6b).
- Testy: `tests/ekrany/e2e-wejscia-stan.test.tsx` (panel licznika na prawdziwej kompozycji i bazie node:sqlite: liczniki po +1/−1, brak zagnieżdżenia w „−1”/„+1”/liczbie, panel nazwy za polem), `tests/ekrany/e2e-wejscia-stan-wydanie.test.tsx` (poza E2E brak paneli). Strażnik bundla: `npm run jakosc:slady-wydania` — „OK: build wydania bez śladów” i „OK: build E2E ma panele” (z `e2e-nazwa-wejscia` w bundlu E2E), 1 min.

## Ocena z kodu (bez macOS): co może zatrzymać wątek JS albo zgubić zdarzenie
| # | Hipoteza | Dowód | Użytkownik może zobaczyć? |
|---|---|---|---|
| H1 | Synchroniczne zapisy sqlite blokują JS | Synchroniczne wywołania tylko przy otwarciu połączenia: `src/dane/baza/adapter-expo.ts:27–30` (`openDatabaseSync`, `execSync` ×2, raz na proces/otwarcie). „+1”/„−1” idą przez `db.runAsync`/`getAllAsync` (`adapter-expo.ts:36–38`) w kolejce. Brak `runSync`/`getAllSync`/`withTransactionSync` w `src/`, `app/`, `modules/` (grep) | teoretyczny (dla stuknięcia); start aplikacji jednorazowo — poza zakresem 64/69 |
| H2 | Animacje licznika/przewodnika zajmują JS | `Dzianina.tsx:53` `Animated.timing … useNativeDriver: true` (wątek natywny); jedyny `setInterval` na ekranie: `Stoper.tsx:36` (1 s, tylko sam stoper). W kodzie ekranu licznika nie ma przewodnika (grep „przewodnik” w `src/ekrany/Licznik*.tsx`, `app/licznik.tsx`: 0 trafień); przewodnik z 69 stoi na „Dziś”, poza ekranem „+1”/„−1” | teoretyczny |
| H3 | Ponowne montowanie ekranu licznika gubi stuknięcie | `app/licznik.tsx:56` `key={wersja}`; w 69 „counter screen mounts: 1” (FX6, hierarchia `step-026`) — wykluczone dla tego przebiegu; remont możliwy tylko przy zmianie `wersja` (`naPartie`/`poZmianie`/`poDostepie`/`poZegarku`), w 69 nie zachodzi | brzegowy (iCloud/zegarek w tle), tu wykluczony |
| H4 | Kontrolowany `TextInput` (`Arkusz.tsx:151`: `value` + `onChangeText`, `Formularze.tsx:201`) traci znaki przy wolnym JS | RN 0.86.3 odsyła do natywnego pola `props.value`, gdy różni się od ostatniego tekstu natywnego (`node_modules/react-native/Libraries/Components/TextInput/TextInput.js:203`); natywna strona porównuje liczniki zdarzeń (`RCTBaseTextInputView.mm:178` `eventLag = _nativeEventCount - _mostRecentEventCount`; `RCTTextInputComponentView.mm:351–354`) i pomija nadpisanie tekstu przy opóźnieniu. Czy ochrona wystarcza przy opóźnieniu rzędu 1–10 s, ze źródła nie wynika | brzegowy: człowiek pisze wolniej niż xctest, ale zgubienie znaku widać od razu; nie potwierdzone na urządzeniu [DO USTALENIA — rozstrzygnie `e2e-nazwa-wejscia`] |
| H5 | Odczyt stanu po „+1” kończy się po „−1” i nadpisuje nowszą wartość starszą | **Defekt, odtworzony testem (FX6b-01, niżej)**: `Aplikacja.tsx` `odswiez()` nie sprawdzał kolejności | brzegowy (odczyty z `stan()` ≥ 3 zapytań każdy; zmiana kolejności wymaga opóźnień rzędu setek ms); na ekranie: „−1” cofa się do starej wartości i zostaje, jeśli nowszy odczyt wcześniej zdążył się zastosować |

## FX6b-01 · (a) defekt aplikacji, brzegowy: starszy odczyt stanu licznika nadpisuje nowszy (FX6b, D)
- Mechanizm: `useStanLicznika` (`src/ekrany/Aplikacja.tsx`): „+1” wpisuje wartość i woła `odswiez()`; „−1” wpisuje nową wartość i woła kolejny `odswiez()`. Odczyt z „+1” zastosowany po „−1” (odczyty kończą się w kolejności niezależnej od startu) przywracał wartość sprzed „−1”; przy odczycie z „−1” kończącym się pierwszy zostawał tak do następnej zmiany.
- Test (czerwony najpierw na kodzie sprzed poprawki, z właściwego powodu — oczekiwano „0”, ekran „1”): `tests/ekrany/licznik-odswiezenie-kolejnosc.test.tsx`; po poprawce zielony.
- Poprawka (minimalna): numer ostatniej zmiany stanu (`wydanie`, `useRef`); odczyt, który nie jest najnowszy, jest pomijany; wpisy z „+1”/„−1” podnoszą numer. Ścieżka „Dziś” (`Aplikacja`, nie `EkranLicznika`) i bezpośrednie `p.dzialania.odswiez()` poza `useStanLicznika` bez zmian.
- Związek z 69: **nie dowodzi**, że to przyczyna czerwieni (w 69 „−1” nie zmieniło wartości przez 17,9 s; starszy odczyt tego nie tłumaczy, bo kolejny odczyt po „−1” by ją przywrócił) — to defekt niezależny, znaleziony przy ocenie H5. Czy 69 ma inną przyczynę, rozstrzygnie `e2e-licznik-wejscia`.

## Decyzje (pula P-908…P-911, ciąg dalszy; do przeniesienia po scaleniu)
- **P-909 (2026-11-16, FX6b, 08 fix, koordynator zlecił):** wdrożona diagnostyka `e2e-licznik-wejscia` i `e2e-nazwa-wejscia` (wyżej); tylko build E2E; scenariuszy 64/69 nie zmieniono. Warunek: następny przebieg iOS z porażką 64 albo 69 — odczyt paneli z `screen-hierarchy`.
- **P-910 (2026-11-16, FX6b, warunkowa):** FX6b-01 naprawiony jako (a) brzegowy defekt aplikacji w `useStanLicznika` (numer wydania stanu); odrzucone: blokada kolejności w kompozycji (`stanPoZapisie`) — dotykałaby wspólnego kodu ekranu „Dziś”.
- **P-911 (propozycja do koordynatora, nie wdrożona):** jeśli `e2e-nazwa-wejscia` pokaże zdarzenia w JS, a pole „H” — poprawka pola `Pole` (`Arkusz.tsx:151`): bezpośrednio `defaultValue` + odczyt przez ref przy zapisie (niekontrolowane) albo aktualizacja stanu w `onChange`; koszt: zmiana wspólnego komponentu wszystkich formularzy i testów. Równolegle `nazwij-projekt.yaml`: stuknięcie w prawą krawędź pola przed `eraseText` (kursor na końcu) — wspólny podprzepływ, wymaga zgody.
