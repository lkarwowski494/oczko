# 07-jakosc: plan testów iPada i wzorów na partię 6 (przekazanie 01 fix-6, P-224) — 2026-10-26
Wejście: P-218 (ograniczenia patentowe 1–6, Q2a, Q3a), P-221 Q4a (osobny nocny pakiet E2E iPada), P-224; BRD `docs/brd/wymagania-projekt.md` BR-WZR-004 (:281), BR-WZR-005 (:296), BR-WZR-008 (:347), `docs/brd/wymagania.md` NFR-UKL-001 (:117), OG-07 (`docs/brd/odkrywanie.md:182`). Plan, nie scenariusze: kod wzorów i iPada powstaje w partii 6 (08), układy — 04. Scenariusze piszę po „Dla 08” roli 04 (testID), jak w partii 5.

## Co działa gdzie (iPad)
| Potrzeba | Symulator iPada (CI `macos-26`) | Uwagi |
|---|---|---|
| Orientacja pion/poziom | Maestro `setOrientation` (w interpreterze już jest) | scenariusz 23 robi to na iPhonie |
| Rysik vs palec (BR-WZR-004, BR-WZR-008 S4) | **nie**: Maestro wysyła dotyk palcem; rodzaju dotyku „rysik” nie znalazłem w Maestro ani w XCUITest [DO USTALENIA: sprawdzić w dokumentacji Xcode 26 w oknie maszyn] | lista „tylko urządzenie” |
| Dłoń na ekranie (BR-WZR-004 S1) | nie (odrzucanie dłoni to sprzęt + PencilKit) | „tylko urządzenie” |
| Wąskie okno (Split View / okno iPadOS 26) | Maestro nie układa okien; XCUITest — [DO USTALENIA] | Q2 |
| 0 obciętych / nakładających się (NFR-UKL-001) | Maestro nie mierzy układu; XCUITest `performAccessibilityAudit` (typy `textClipped`, `hitRegion`, iOS 17+) wymaga natywnego celu testów UI (moduł e2e-mobilne, „Dostępność”) | Q3 |

## Scenariusze (numery 44+ zarezerwowane, tag `ipad`, pakiet nocny iPada — P-221 Q4a)
| Kryterium | Scenariusz / test | Poziom | Uwagi |
|---|---|---|---|
| BR-WZR-005 „iPad poziomo i pionowo” | wzór (PDF testowy) + licznik, +1 poziomo → wartość i `wzor-widok` widoczne; `setOrientation: PORTRAIT` → +1 → to samo | E2E iPad | asercja: oba elementy widoczne po każdym +1 (układ 04) |
| BR-WZR-005 „Obrót z ustawionym znacznikiem” | znacznik na rzędzie 13 strony 3 → obrót → `wzor-strona` „Page 3 of …”, znacznik na rzędzie 13 (testID 04), licznik ta sama wartość | E2E iPhone **i** iPad | pozycja znacznika ułamkiem strony (ADR-0011) ma test domenowy; E2E sprawdza połączenie |
| BR-WZR-005 „Wąskie okno” + NFR-UKL-001 | wg Q2 | wg Q2 | |
| BR-WZR-008 „iPad bez rysika” (część palcem) | zakreślacz palcem na iPadzie → `wzor-zakreslenia` „1 highlight”, po restarcie bez sieci nadal | E2E iPad | część „potem rysik” → urządzenie |
| BR-WZR-004 S1, S2; BR-WZR-008 S4 (rysik) | logika `pencilOnly` po pierwszym dotyku rysikiem — test jednostkowy Swift modułu wzoru (Q1a P-221: PDFView + PencilKit), jeśli 05/08 wydzielą ją jako czystą funkcję | XCTest / `swift test` | całość: lista „tylko urządzenie” TT z krokami dla właściciela (iPad + Pencil [DO USTALENIA: czy właściciel ma Apple Pencil]) |
| NFR-UKL-001 | wg Q3 | wg Q3 | PR-01–PR-06 × pion, poziom, wąskie okno |

## Przegląd ekranów wzoru pod kątem P-218 (1)–(6) przed wydaniem (OG-07)
Dopisuję do audytu wydania (moduł `wydanie`, strategia §8/§10) listę kontrolną z dowodem dla każdego punktu — ocena projektu, nie opinia prawna:
| Ograniczenie | Jak sprawdzam | Dowód |
|---|---|---|
| (1) jeden wzór = jedno źródło, bez łączenia | schemat: `wzor` ma jedno źródło (`pdf_sha256`); kod: brak scalania stron/fragmentów z kilku wzorów; E2E: dodanie drugiego wzoru nie łączy treści | grep + zapytanie schematu + zrzut |
| (2) bez edycji treści, adnotacje osobną warstwą, bez OCR z edycją | PDF oryginału bajt w bajt po adnotacjach (SHA przed/po), adnotacje w osobnej tabeli/pliku; grep: brak OCR (Vision text recognition) z edycją | test danych SHA + grep |
| (3) jeden wzór naraz z jednym znacznikiem; na iPadzie obok licznik, nie drugi wzór | E2E iPad: ekran wzoru ma jeden `wzor-widok`; znacznik jeden na wzór (schemat/test) | zrzut + test |
| (4) film tylko jako odnośnik poza wzorem | brak odtwarzacza w ekranie wzoru (grep AVPlayer/expo-video w module wzoru) | grep |
| (5) treść zależna od postępu tylko od użytkownika i licznika | brak pobierania/generowania treści wzoru; przypomnienia i notatki — od użytkownika | przegląd kodu + NFR-OFF-001 |
| (6) nowa funkcja wzoru wraca do tabeli OG-07 | lista funkcji wzoru w wydaniu vs tabela OG-07 w BRD | porównanie list |

## Pytania (do koordynatora, P-087)
- **Q1 Pakiet nocny iPada w CI.** (a) Ten sam workflow `jakosc-ios.yml`, osobne zadanie `e2e-ipad` uruchamiane tylko w przebiegu nocnym/ręcznym (tag `ipad`, symulator iPada, build ten sam — `supportsTablet: true` daje jeden build uniwersalny); bramka jak F07-15 tylko dla scenariuszy `podstawowy` (iPad bez bramki do pierwszego zielonego). (b) Osobny workflow nocny iPada (cron) — prostszy podział, ale drugi build (+~15–40 min macOS). **Rekomendacja: (a)** — jeden build, repo publiczne (minuty bez opłat), mniej maszyn przy niedoborze (P-187).
- **Q2 Wąskie okno.** (a) Argument startu buildu E2E `oczkoE2eSzerokoscOkna=<pt>` (np. 375) — aplikacja rysuje się w kontenerze tej szerokości, więc układ RN dostaje szerokość kompaktową; nazwany wyjątek: nie sprawdza klasy rozmiaru systemu ani paska wielozadaniowości (ryzyko szczątkowe P-041 → lista urządzenia). (b) XCUITest steruje oknem iPadOS 26 [DO USTALENIA: czy API to umożliwia] — wymaga natywnego celu testów. (c) Tylko lista „tylko urządzenie”. **Rekomendacja: (a) + krok urządzenia (c)** — tania kontrola w CI, prawdziwe okno u właściciela.
- **Q3 NFR-UKL-001 „0 obciętych i nakładających się”.** (a) Natywny cel XCUITest z `performAccessibilityAudit(for: [.textClipped, .hitRegion])` na PR-01–PR-06 w trzech układach — decyzja 05 (prebuild + cel testów UI w Expo); (b) zrzuty Maestro w trzech układach + przegląd 04 względem makiet (wzorzec zatwierdzony) — bez automatycznej miary; (c) (b) teraz, (a) w 1.1. **Rekomendacja: (c)** — partia 6 już jest duża; zrzuty dają dowód do wydania, audyt automatyczny wraca z decyzją 05.

## Szacunek
Czas agenta: scenariusze 44–48 i lista TT ok. 1,5 h po „Dla 08” roli 04; zadanie CI `e2e-ipad` ok. 1 h (z testem jak `e2e-bramka`); lista kontrolna OG-07 w strategii 30 min. Czekanie: kod 08 partii 6, makiety 04, okno maszyn macOS. Od właściciela: odpowiedź, czy ma iPada i Apple Pencil (lista „tylko urządzenie”).

## Decyzja
**P-225** (koordynator wg P-087, 2026-10-26): Q1a (zadanie `e2e-ipad` w `jakosc-ios.yml`, ten sam build, nocą/ręcznie, bez bramki do pierwszego zielonego), Q2 (a)+(c) (argument `oczkoE2eSzerokoscOkna` + krok na urządzeniu), Q3c (zrzuty + przegląd 04 teraz, audyt XCUITest w 1.1). Pytanie o iPada i Apple Pencil — u właściciela przez koordynatora. Scenariusze po „Dla 08” roli 04 fix-7.
**P-226**: właściciel ma iPada, nie ma Apple Pencil — lista „tylko urządzenie”: układy iPada, zakreślanie palcem, NFR-UKL-001; rysik tylko testem jednostkowym `pencilOnly`, reszta to nazwane ryzyko szczątkowe (strategia §9).
