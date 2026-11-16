# BX13 — dodatek 1 (16.11, wynik częściowy iOS 43828957399): najpierw diagnoza dwóch czerwieni bramkowych
Ten dodatek ma pierwszeństwo przed kolejnością z pkt 4 polecenia BX13. Zad. 4.1 (scen. 30) i 4.2 wstrzymane do mojej wiadomości; 4.3 i 4.4 po diagnozie.

Wynik 43828957399 (drzewo cd95fc4b = ca6862c3 na bx12), stan z ok. 10:20 UTC: build, swift-test, zegarek zielone; e2e iPad część 1 i iPhone część 2 zielone; iPhone części 1 i 3 jeszcze biegną; **iPhone część 4 czerwona** (job 133180660429), bez oznak awarii maszyny, bez ponowień:
- **31-nfr-wyd-001 (bramka, 09:18):** `Assertion is false: "p95 ([0-9]|[1-9][0-9]|100) ms, n = 20; first [0-9]+ ms", id: e2e-pomiar-plus is visible` (krok 130/130; krok wcześniejszy — licznik 21 — przeszedł). Nie wiadomo, czy p95 > 100 ms, czy napis się nie pojawił.
- **30-nfr-dos-002 (bramka, krok osobny AX5, 10:04):** `No visible element found: id: dzis-kontynuuj`; `content_size` ustawione bez błędu.
- informacyjne (oczekujące): 90 (`Element not found: nav-wstecz`, krok 45/45), 91 (`formularz-zapisz is visible` fałsz po ENTER w `wzor-nazwa-pole`; scenariusz zmieniony potem w a30f31c0), 93 (`przewodnik-grupa-poza` niewidoczny po scrollUntilVisible 30 s), 94 („On” w `ustawienia-pro` po restarcie).
- zielone w części 4: 03, 04, 06, 11, 16, 17, 19, 21, 23, 25, 33, 36, 45, 52, 65, 66, 73, 80, 82, 86, 98.

Zadanie D (pierwsze, raport od razu po każdym z dwóch scenariuszy bramkowych):
1. Pobierz artefakty zadania „e2e (część 4, iphone)” przebiegu 43828957399 (GitHub MCP, tylko odczyt: zrzuty, `commands-*.json`, hierarchia). Dla **31** ustal z artefaktu faktyczną treść `e2e-pomiar-plus` w kroku 130 (wartość p95, n, first) albo brak panelu; dla **30** ustal, co było na ekranie, gdy szukano `dzis-kontynuuj` (stan aplikacji po kroku 11 — czy poprzedni scenariusz zostawił dane, czy `clearState`/dane startowe scenariusza 30 zadziałały, czy przy AX5 element istnieje, ale poza ekranem).
2. Klasyfikacja każdego: aplikacja / scenariusz / maszyna, z dowodem (`plik:linia`, zrzut, wartość). Porównaj z historią: czy 31 i 30 były zielone w ostatnim pełnym przebiegu na integracji i co zmieniło się w zakresie `git diff <tamten SHA> cd95fc4b` w plikach, których dotykają (kod licznika, „Dziś”, haki E2E, workflow kroku AX5, kolejność w `e2e/czesci.json`).
3. Propozycja poprawki z co najmniej dwiema opcjami i rekomendacją. **Niczego nie poprawiasz przed moją odpowiedzią**: progu 100 ms nie ruszasz (P-456), scenariusza 31 nie ponawiasz i nie osłabiasz (KO-084), asercji 30 nie zmieniasz. Jeśli przyczyną jest kod produktu — to P1, zgłoś natychmiast.
4. Potem krótko (po jednym zdaniu z dowodem) 90, 93, 94: aplikacja / scenariusz; 91 pomiń, jeśli a30f31c0 zmienił krok, który padł — wtedy czekamy na 43839955415.

Drugi przebieg 43839955415 (5231cc13) biegnie; część 4 iPhone jeszcze nie wystartowała — da drugi pomiar dla 31 i 30 ok. 12:00. Nie czekasz na niego.
