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
- **P-909 (propozycja do koordynatora):** diagnostyka jak BX-019 (`PanelNawigacji`): licznik naciśnięć „−1” i numer kolejności odświeżeń stanu licznika na ekranie licznika (e2e), żeby rozdzielić „stuknięcie nie dotarło do JS” od „JS odebrał, wynik nie trafił na ekran”. Koszt: nowy plik w `src/kompozycja/e2e/` + test, wpis w `panele.tsx`; bez wpływu na bundle poza buildem E2E.

## Czego nie sprawdzono
- Wyników 64 i 69 w przebiegach 43810499611 (część 3 w toku o 06:42 UTC, doszła dopiero do początku scenariuszy) i 43814487099 (anulowany) — nieodczytane.
- Przebiegu lokalnego (Linux bez Xcode).
