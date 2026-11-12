# Diagnoza 07-jakosc-003 (kontrola zastępcza W1: scen. 25 i 53 na zmianę czerwone)

Data: 2026-11-12 · rola 08, tryb fix · bez macOS: z kodu i logów przebiegu 43139118664 (2929462), pobranych `gh api` do pliku (log zadania 130930898047, artefakt e2e-czesc-3-iphone 13914233176, odczyt 2026-11-12).

## Wniosek
Render Worda w aplikacji na symulatorze **bywa wolniejszy niż 30 s**, a scenariusze czekają na `wzor-widok` dokładnie 30 s (`25-…yaml`, `53-…yaml`: `extendedWaitUntil … timeout: 30000`). Limit aplikacji to 60 s (`KonwersjaNaPdf.swift:10`), czyli scenariusz kończy się **przed** limitem aplikacji. Przyczyna wolnego renderu: `[DO USTALENIA]` (bez macOS); hipoteza: zimny start procesu WebContent na maszynie CI.

## Dowody
1. Log 130930898047: scen. 25 padł na kroku 33/33 = pierwsze `wzor-widok` po stuknięciu `e2e-wzor-word` (`FAILED … "timeout": "30000"`, linie 807-808).
2. Zrzut kroku 33 (artefakt, `step-033-assertCondition-wzor-widok.png`): ekran „Pattern”, wiersz „Test pattern · Adding the pattern…” — konwersja trwa, **nie ma błędu** `wzor.blad_czas`. Czyli w 30. sekundzie aplikacja jeszcze nie przekroczyła limitu, tylko nie skończyła.
3. Ten sam scenariusz przeszedł na 281852f (1m 55s) i padł na 2929462 (1m 54s): ten sam kod, inny czas maszyny; 53 odwrotnie (padł na 281852f, przeszedł na 2929462, 3m 20s). Diff 281852f..2929462 nie dotyka `app/ src/ modules/` (`ar-2026-11-12/dowody/d-diff.txt`).
4. W1 w pakiecie SwiftPM (`EksperymentyTests.swift`): `testW1StronaBezSieciToBrakSieci` przeszedł po **61,4 s** (log `a-w1-eksperymenty.txt:5`). Host `.invalid` powinien dać `didFailProvisionalNavigation` w ułamku sekundy; 61 s oznacza, że przeszedł dopiero licznik 60 s (`powodPrzekroczeniaCzasu` mapuje czas na brak sieci dla adresu). Zatem w tym środowisku (test bez aplikacji-gospodarza) delegat WKWebView nie dostaje żadnego wywołania w 60 s: porażka W1 (3 × 60 s = 182 s) to cecha środowiska testu, nie dowód, że plik Word jest zbyt ciężki.

## Odpowiedzi na pytania polecenia
- Czy render w aplikacji może dochodzić do limitu 60 s? **Tak, nie wykluczone**: w 30. s nadal trwał; dane o czasie powyżej 30 s nie ma (log nie mierzy). Wtedy użytkownik dostaje komunikat `wzor.blad_czas` i plik nie jest tracony (wynik błędu, brak zapisu wzoru).
- Dlaczego 25 i 53 przechodzą na zmianę? Czas renderu leży blisko progu 30 s scenariusza i zależy od obciążenia maszyny.
- Realność dla użytkownika: **brzegowy**. Zimny start WebContent na telefonie trwa sekundy (hipoteza, niezmierzona); skutek najgorszy to komunikat o czasie i ponowienie. Utraty danych brak.

## Poprawka
Nie wdrażam: dowód wskazuje próg scenariusza (30 s), a polecenie zabrania zmiany progów czasu aplikacji; plik `e2e/scenariusze/25-*`, `53-*` poza listą dozwolonych plików. 

## Opcje (do decyzji koordynatora)
- **A. Wydłużyć oczekiwanie na `wzor-widok` w scen. 25 i 53 do 70 s** (powyżej limitu aplikacji 60 s; po limicie widok i tak się nie pojawi, więc dalej wykrywa prawdziwą awarię). Koszt: najgorszy przebieg wolniejszy o 40 s na plik. Tanie, usuwa niestabilność, nie dotyka aplikacji.
- **B. Zmierzyć czas renderu** (log czasu w aplikacji E2E panelu albo `xcrun simctl` na macOS) przed zmianą progu. Dokładne, ale wymaga przebiegu CI i zmiany modułu.
- **C. Zostawić do terminu kwarantanny** (P-300). Najtańsze; kontrola zastępcza nadal losowa.
Rekomendacja: **A**, a W1 w pakiecie SwiftPM uznać za wadliwy harness (osobna decyzja: przenieść W1 do aplikacji-gospodarza albo usunąć z kwarantanny z powodem).
