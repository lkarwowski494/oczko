# Recenzja niezależna katalogu przypadków użycia (sesja BX2, 07 build, 2026-11-15)

Dwie recenzje subagentów bez uzasadnień autora katalogu, na stanie b05cfb15: **A** — trafność klas F, odnośniki klasy A (wszystkie 342), 8 miejsc `[DO USTALENIA]`, ekrany bez trasy; **B** — kompletność wobec kryterium właściciela 18:16 (inwentarz funkcji z kodu → PU). Pełne teksty niżej; ten nagłówek to stan poprawek.

## Stan poprawek (P1 obowiązkowe)
| ID | PU | Poprawka | Dowód |
|---|---|---|---|
| R-A-01 | PU-180 | F → B: dostępność stron sprawdza `sprawdz-adresy.yml`; do zaprogramowania otwarcie linku z aplikacji | wiersz katalogu; lista fizyczna 41 → 40 pozycji |
| R-A-22 | PU-143 | A → B (scenariusz 44 tylko iPad, pakiet informacyjny P-225) | reguła „nie same scenariusze iPada” w `tests/jakosc/przypadki-uzycia.test.ts` i `kontrolaKatalogu` (czerwona na katalogu sprzed poprawki) |
| R-A-23 | PU-144 | jak R-A-22 (scenariusz 46) | jw. |
| R-A-39 | PU-202 | „znany błąd” usunięty; patrz wiersz katalogu (scenariusz 21 sprawdza powrót po P-830) | wiersz katalogu |
| R-A-26 (P2) | PU-054, PU-227 | reguła: linia odnośnika A to asercja albo runFlow podprzepływu wskazanego obok; usunięty odnośnik 21:29 (tapOn) | jw. |
| R-A-40…47 | 8 miejsc `[DO USTALENIA]` | rozstrzygnięte w kodzie z `plik:linia` (tekst w kolumnie Pokrycie); PU-255 kroki zgodne z kodem („Zapisz” nieaktywny) | `grep -c "DO USTALENIA" docs/jakosc/przypadki-uzycia.md` → 0 |
| B (kryterium 18:16) | 69 funkcji bez PU | nowe PU i sekcja „Funkcje” w katalogu (funkcja → kod → PU) | sekcja „## Funkcje” |

**Otwarte P2/P3 (nie poprawione w BX2):** 10 pozycji F częściowo automatyzowalnych (sekcja 1 recenzji A: PU-009, PU-010, PU-020, PU-049, PU-055, PU-062, PU-069, PU-095, PU-130, PU-140) — przeniesienie części do B zwiększy liczbę B wymaganych przez bramkę P-837; decyzja po zaprogramowaniu obecnych B. Kontrola mechaniczna K1 (napisy przycisków w PU) z recenzji B — następny krok.

---

# Recenzja A — katalog przypadków użycia (`docs/jakosc/przypadki-uzycia.md`, stan b05cfb15, 2026-11-15)

Recenzent: rola 07-jakosc (niezależnie). Nie edytowałem repo. Skrypty pomocnicze (scratchpad): `parse.mjs` (parsuje 270 wierszy tabel, drukuje linie odnośników A), `nest.mjs` (czy linia leży w `runFlow when`/`retry`), `graf.mjs` (graf importów `app/` → `src/ekrany`).

## Podsumowanie liczb

| Sekcja | P1 | P2 | P3 | Razem |
|---|---|---|---|---|
| 1. Trafność klasy F (41 PU) | 1 | 10 | 10 | 21 |
| 2. Odnośniki klasy A (95 PU, 342 odnośniki) | 2 | 3 | 12 | 17 |
| 3. `[DO USTALENIA]` (8 miejsc) | 1 | 4 | 4 | 9 |
| 4. Ekrany bez trasy | 0 | 2 | 0 | 2 |
| **Razem** | **4** | **19** | **26** | **49** |

Fakty bazowe sprawdzone skryptem: katalog ma 270 PU (A=95, B=134, F=41, zgodnie z nagłówkiem `przypadki-uzycia.md:12`); wszystkie 342 odnośniki `plik:linia` klasy A istnieją; 340 z nich to asercje (`assertVisible`/`assertNotVisible`/`extendedWaitUntil`/`assertTrue`), 2 nie (R-A-24, R-A-25); żadna wskazana linia nie leży w warunkowym `runFlow when`/`retry`; żaden scenariusz nie ma tagu `oczekujacy`; żadna wskazana asercja nie jest `optional: true`. Wszystkie klucze tras z kolumny „Ekrany” istnieją w `app/`.

P1 w skrócie:
- R-A-01 PU-180 (F) — adresy stron już sprawdza automat (`sprawdz-adresy`), katalog przerzuca to na właściciela.
- R-A-22 PU-143 (A) — jedyny scenariusz (44) ma tag `ipad`, a pakiet iPada ma pustą bramkę (`scripts/ci/e2e-czesci.mjs:156`): porażka niczego nie czerwieni.
- R-A-23 PU-144 (A) — to samo dla scenariusza 46.
- R-A-39 PU-202 (B) — katalog opisuje „znany błąd: brak powrotu”, a kod ma „Back” (`src/ekrany/WzorZrodla.tsx:19`), scenariusz 21 go sprawdza (21:25–28): przypadek jest pokryty, klasa i opis nieaktualne.

---

## 1. Trafność klasy F

### 1a. Werdykt per PU (wszystkie 41)

| PU | Werdykt | Uzasadnienie (skrót; szczegóły w 1b) |
|---|---|---|
| PU-001 | F trafne | stan instalacji tylko w aplikacji TestFlight |
| PU-002 | F trafne | instalacja buildu z TestFlight na starszym; dane z 1.0.0 osobno w PU-003 (B) |
| PU-006 | F trafne (uwaga) | ikonę w pakiecie zegarka sprawdza już CI — R-A-16 |
| PU-009 | częściowo B | równa grubość pasów mierzalna pikselami — R-A-06 |
| PU-010 | częściowo B | tryb ciemny przez `simctl`, biała strona i kontrast mierzalne — R-A-07 |
| PU-013 | częściowo B | jak PU-009/010 na symulatorze iPada — R-A-08 |
| PU-020 | częściowo B | „wył. = brak haptyki” to logika portu, już testowana — R-A-04 |
| PU-034 | częściowo B | wzorzec `rzadZInstrukcja` już testowany — R-A-14 |
| PU-049 | częściowo B | ścieżka odmowy zgody odtwarzalna — R-A-10 |
| PU-055 | F na razie, spike B | uzasadnienie sprzeczne z 43:25 — R-A-11 |
| PU-059 | F trafne | skaner ukryty bez VisionKit (`src/ekrany/WzorGrupa.tsx:15,68`; `src/platforma/wzor.ts:51`) |
| PU-062 | powinno być B | sieć to argument scenariusza, nie buildu — R-A-02 |
| PU-064 | częściowo B (już jest) | `otworzAdres` testowany komponentowo — R-A-13 |
| PU-069 | częściowo B (już jest) | sterowanie keep-awake testowane — R-A-03 |
| PU-073 | F trafne (inny powód) | build bez podpisu, App Group nieaktywna — R-A-15 |
| PU-075 | F trafne (inny powód) | jw. — R-A-15 |
| PU-095 | częściowo B | kopia w Documents/Backup sprawdzalna — R-A-12 |
| PU-118 | F trafne | zegar systemu symulatora = zegar hosta; logika przez `oczkoE2eTeraz` (05) |
| PU-121 | F trafne | okno StoreKit piaskownicy; build E2E ma sztuczny sklep (`e2e/README.md:40`) |
| PU-126 | F trafne (uwaga) | stan Live Activity testowany komponentowo — R-A-17 |
| PU-128 | F trafne (uwaga) | jw. — R-A-17 |
| PU-130 | częściowo B | kolejność ogłoszeń testowalna — R-A-05 |
| PU-136 | F trafne (uwaga) | minimalny cel dotyku testowalny — R-A-20 |
| PU-140 | częściowo B | konfiguracja ciemnego splash i kontrast testowalne — R-A-09 |
| PU-141 | F trafne | TestFlight na iPadzie |
| PU-145 | F trafne | prawdziwe okna iPadOS; atrapa szerokości (46) poza bramką — R-A-23 |
| PU-151 | F trafne | przywrócenie zakupu z innego urządzenia (Apple ID) |
| PU-152 | F trafne (uwaga) | wynik zależy od przełącznika iCloud — R-A-18 |
| PU-154 | F trafne | płynność oceniana okiem na sprzęcie |
| PU-155 | F trafne | WatchConnectivity nie działa w symulatorze (`e2e/README.md:41`, ADR-0009) |
| PU-157 | F trafne | utrata zasięgu fizycznego zegarka |
| PU-160 | F trafne | wibracja zegarka; stan wysłany do zegarka sprawdza PU-159 (A, 15:81) |
| PU-169 | F trafne (uwaga) | stoper po powrocie z tła testowalny — R-A-19 |
| PU-174 | F trafne | naturalność zdań ocenia człowiek |
| PU-176 | F trafne | waluta z konta App Store |
| PU-180 | **powinno być B/A** | już zautomatyzowane — R-A-01 |
| PU-182 | F trafne | brak App Store w symulatorze; powrót do aplikacji sprawdza PU-181 (A, 65:60–61) |
| PU-187 | F trafne | instalacja z TestFlight; odpowiednik symulatora to PU-188 (A) |
| PU-190 | F trafne | transakcje StoreKit z Apple ID po reinstalacji |
| PU-192 | F trafne (uwaga) | to krok procedury testu, nie przypadek użycia — R-A-21 |
| PU-194 | F trafne | wygaśnięcie po stronie serwera Apple; logika wygaśnięcia w PU-125 (A, 06:50–55) |

### 1b. Znaleziska

| ID | PU | Poziom | Znalezisko | Dowód plik:linia | Propozycja poprawki |
|---|---|---|---|---|---|
| R-A-01 | PU-180 | P1 | Klasa F z uzasadnieniem „wymaga internetu i prawdziwego serwera”, a automat już sprawdza, że każdy adres z aplikacji zwraca 200 i ma treść jak `site/`. Właściciel stuka linie, które sprawdza skrypt. | `.github/workflows/sprawdz-adresy.yml:1-3`, `:23` (`node scripts/wydanie/sprawdz-adresy.mjs`); źródło adresów `src/kompozycja/adresy.ts` (wg nagłówka workflowu) | Klasa B (krok listy wydania `npm run wydanie:adresy`) z odnośnikiem do skryptu; opcjonalnie Maestro: stuknięcie linku → aplikacja traci pierwszy plan i wraca (`launchApp: { stopApp: false }`, wzór 65:58–60). F zbędne. |
| R-A-02 | PU-062 | P2 | Uzasadnienie „build E2E biegnie z `oczkoE2eSiec: brak`” jest nieprawdziwe: to argument startu podawany per scenariusz, nie tryb buildu. Bez argumentu adapter sieci działa normalnie, a runner macOS ma sieć. | `e2e/README.md:45-50` (argumenty startu, „`oczkoE2eSiec` \| `brak`”); `e2e/scenariusze/subflows/start-czysty-dzis.yaml` (podaje argument jawnie) | B: scenariusz bez `oczkoE2eSiec`, „Link do strony WWW…” z adresem strony wsparcia → `wzor-zrodlo` „Web page.*”. Zależność od zewnętrznego hosta: tag `oczekujacy`/informacyjny, nie bramka. |
| R-A-03 | PU-069 | P2 | Katalog podaje „tylko urządzenie”, a sterowanie ekranem (keep-awake włączone na liczniku i wzorze, wyłączone poza nimi i przy wyłączonej opcji) ma testy komponentowe. Katalog zaniża to, co jest przetestowane. | `src/platforma/ekran-aktywny.ts:7-11`; `tests/ekrany/ekran-nie-gasnie-trasa.test.tsx:1-6`; `tests/ekrany/ekran-nie-gasnie-dzis.test.tsx` | Rozdzielić: B/A dla logiki (odnośnik do testów z ID PU), F tylko „ekran faktycznie gaśnie po 1 min”. |
| R-A-04 | PU-020 | P2 | „Przy wyłączonej opcji brak wibracji” to logika preferencji → port `Haptyka`, testowana komponentowo. F słuszne tylko dla odczucia. | `src/kompozycja/licznik.ts:110,138` (`wibracje()`); `tests/ekrany/wzor-pasek-plus-203-204.test.tsx:109`; `tests/ekrany/autozapis-blad-zapisu.test.tsx:134-146`; `tests/ekrany/licznik-blad-zapisu.test.tsx:82` | Rozdzielić jak R-A-03; dopisać test +1/−1 na karcie „Dziś” z `wibracje: false`, jeśli brak. |
| R-A-05 | PU-130 | P2 | „Jedno nie ucina drugiego” zależy od kolejki ogłoszeń. Ogłoszenia są wstrzykiwane właśnie po to, by test widział kolejność, i idą z `queue: true`. Maestro tego nie zrobi, ale test komponentowy tak. | `src/ekrany/wspolne.ts:15`; `src/kompozycja/system.ts:19` | B (komponentowy): przy celu 3 i wartości 2 kolejność `[„… 3 …”, „Goal reached”]`, oba z kolejką. F tylko dla mowy VoiceOver. |
| R-A-06 | PU-009 | P2 | Grubość pasów da się zmierzyć pikselami: kontrola zakreśleń już wyznacza wiersze każdego żółtego pasa na zrzutach z symulatora. Brakuje porównania wysokości pasów i wysokości wiersza tekstu znanego PDF. | `scripts/ci/kontrola-zakreslen.mjs:2,26-40` | Częściowo B: rozszerzyć kontrolę o wysokość pasa (dwa pasy ±1 px; pas ≥ wysokość wiersza testowego PDF `e2e-wzor-pdf-skan`). Powiększenie palcami zostaje F (Maestro nie ma gestu pinch — nie sprawdzałem dokumentacji). |
| R-A-07 | PU-010 | P2 | Tryb ciemny ustawia CI (`simctl ui appearance dark` przy `[e2e-ciemny]`). „Strona wzoru zostaje biała” to pomiar piksela zrzutu. Kontrast tekstu pod pasem jest już policzony testem. | `.github/workflows/jakosc-ios.yml:309,329`; `tests/dzianina/zakreslacz-kontrast.test.ts:1-3` | Częściowo B: zrzut wzoru w przebiegu `[e2e-ciemny]` + kontrola „tło strony ≈ biel”; odnośnik do testu kontrastu. F tylko ocena okiem. |
| R-A-08 | PU-013 | P3 | Jak R-A-06/07, na symulatorze iPada (pakiet `ipad`). | jw. | Jak R-A-06/07. |
| R-A-09 | PU-140 | P2 | Ciemne tło startu wynika z konfiguracji (splash `dark`), którą sprawdzi test statyczny; kontrast palet ma test. F słuszne tylko dla „białego błysku” w czasie rzeczywistym. | `app.json:8,101-103`; `tests/ekrany/motyw-kontrast.test.tsx:1-5`; `.github/workflows/jakosc-ios.yml:329` | Częściowo B: test konfiguracji splash (dark `backgroundColor`), zrzuty ekranów w `[e2e-ciemny]`. |
| R-A-10 | PU-049 | P2 | Ścieżka „Nie pozwalaj → Otwórz Ustawienia” to gałąź `brak_zgody` po `requestCameraPermissionsAsync`. Odmowę można ustawić na symulatorze (`xcrun simctl privacy <SIM> revoke camera com.apps4brew.knitting`) albo stuknąć alert systemowy (Maestro stuka okna systemowe w 28 i 65). Samo zdjęcie aparatem jest F. | `src/platforma/zdjecia.ts:39-40`; `e2e/scenariusze/28-nfr-off-001-bez-sieci.yaml:52-53` | Częściowo B: scenariusz odmowy (komunikat i „Open Settings”). Do potwierdzenia jednym przebiegiem: czy symulator pokazuje okno zgody na aparat (nie sprawdzałem). |
| R-A-11 | PU-055 | P2 | Uzasadnienie „okno Pliki to osobny proces poza zasięgiem Maestro” przeczy scenariuszowi 43: Maestro widzi i zamyka systemowy arkusz udostępniania, który też jest procesem systemu. | `e2e/scenariusze/43-br-prj-015-s2-udostepnienie-karty.yaml:25,27` | Spike: `UIDocumentPicker` z plikiem wgranym do „Na moim iPhonie” symulatora. Do wyniku spike'u zostawić F, ale z poprawnym uzasadnieniem. |
| R-A-12 | PU-095 | P2 | „Kopia sprzed usunięcia w Oczko › Backup” to plik w `Documents/Backup` kontenera aplikacji. Sprawdzi go krok workflowu (`simctl get_app_container … data`) albo Maestro po podpisie kopii w „Data and sync”. F słuszne tylko dla arkusza „Zachowaj w Plikach” (spike jak R-A-11). | `src/dane/baza/sciezki.ts:16`; `app.json:53-54`; `src/ekrany/StanDanych.tsx:36` | Częściowo B: po „Delete all data” sprawdzenie pliku w Backup (workflow) albo podpisu `stan_danych.kopie_opis`. |
| R-A-13 | PU-064 | P3 | Gałąź „jest sieć → otwórz adres” ma testy komponentowe; F słuszne tylko dla odtworzenia filmu. | `src/ekrany/WzorFilm.tsx:19-21`; `tests/ekrany/wzor-film.test.tsx`; `tests/ekrany/projekt-trasa-film-siec.test.tsx` | Dopisać „częściowo: test” w Pokryciu. |
| R-A-14 | PU-034 | P3 | Wzorzec przypomnienia (dwa uderzenia co 90 ms) ma testy, a katalog o nich nie wspomina. | `src/platforma/haptyka.ts:2,20`; `tests/ekrany/licznik.test.tsx:177`; `tests/ekrany/wzor-pasek-plus-203-204.test.tsx:101-105` | Jak R-A-13. |
| R-A-15 | PU-073, PU-075 | P3 | F słuszne obecnie, ale z innego powodu niż podany. Maestro uruchamia inne aplikacje (`launchApp: appId`) i widzi arkusz systemowy (43:25). Rzeczywistą przeszkodą jest build E2E bez podpisu, a więc rozszerzenie bez uprawnienia App Group. | `.github/workflows/jakosc-ios.yml:230` (`CODE_SIGNING_ALLOWED=NO`); `targets/share/expo-target.config.js:17` | Poprawić uzasadnienie; logika skrzynki ma PU-074 (A, 52:27–42). Opcja: build podpisany lokalnie dla symulatora → B. |
| R-A-16 | PU-006 | P3 | Część „prawdziwa ikona” jest sprawdzana automatycznie (CFBundleIconName = AppIcon w zbudowanym pakiecie zegarka). | `.github/workflows/jakosc-ios.yml:128-176` | Dopisać do Pokrycia jako część automatyczną. |
| R-A-17 | PU-126, PU-128 | P3 | Stan przekazywany do Live Activity (adapter, kompozycja) ma testy komponentowe; F słuszne dla ekranu blokady. | `src/platforma/live-activity.ts:10-22`; `tests/ekrany/blokada-trasa.test.tsx:47` | Dopisać „częściowo: test”. |
| R-A-18 | PU-152 | P3 | „Osobne dane” zależą od przełącznika iCloud (domyślnie wyłączony); kroki go nie wymieniają, a synchronizacja istnieje (PU-098). | `e2e/scenariusze/48-br-dan-002-s3-icloud-wylaczony.yaml:25` | W krokach: „iCloud w Oczku wyłączony na obu urządzeniach”. |
| R-A-19 | PU-169 | P3 | Przerwanie rozmowy to dla aplikacji przejście w tło. Wariant „stoper działa po powrocie” da się zrobić jak scenariusz 19 (z licznikiem). | `e2e/scenariusze/19-br-prj-011-s2-powrot-z-innej-aplikacji.yaml:18-32`; `37-p-191-stoper-start-pauza-stop.yaml:18` | Częściowo B: 19 + `licznik-stoper` „running” po powrocie. |
| R-A-20 | PU-136 | P3 | Minimalny rozmiar celu dotyku (`cel.minimum`) jest stałą motywu i można go sprawdzić testem komponentowym przy AX5; F tylko „kciuk”. | `src/ekrany/Formularze.tsx:166` | Dopisać część B. |
| R-A-21 | PU-192 | P3 | „Zgłoś awarie z testu” to krok procedury właściciela, nie przypadek użycia aplikacji. | `docs/jakosc/przypadki-uzycia.md:304` | Przenieść do instrukcji testu; poza katalogiem PU. |

---

## 2. Odnośniki klasy A (95 PU)

Sprawdzone dla wszystkich 95 PU: plik i linia istnieją; tag scenariusza; czy linia jest asercją; czy dotyczy istoty oczekiwanego wyniku (ocena ręczna, kontekst ±10 linii). Bez uwag: 78 PU. Bramka pakietu `przypadki` to wszystkie scenariusze telefonu bez tagu `oczekujacy` (`scripts/ci/e2e-czesci.mjs:157`); pakiet `ipad` ma pustą bramkę (`:156`).

| ID | PU | Poziom | Znalezisko | Dowód plik:linia | Propozycja poprawki |
|---|---|---|---|---|---|
| R-A-22 | PU-143 | P1 | Wszystkie 6 odnośników to scenariusz 44 z tagiem `ipad`, a pakiet iPada ma pustą bramkę: porażka jest „informacyjna”. Klasa A sugeruje automat, który pilnuje przypadku, a on niczego nie zatrzyma. | `e2e/scenariusze/44-br-wzr-005-s2-ipad-poziomo-pionowo.yaml` (tag `ipad`); `scripts/ci/e2e-czesci.mjs:14-15,156`; `e2e/README.md:28` | Klasa B („oczekujący: iPad poza bramką, P-225 Q1a”) albo osobny znacznik w legendzie (A-informacyjnie); test spójności ma odrzucać A wskazujące tylko na scenariusze `ipad`. |
| R-A-23 | PU-144 | P1 | To samo: wszystkie 6 odnośników to scenariusz 46 (`ipad`). | `e2e/scenariusze/46-br-wzr-005-s4-waskie-okno.yaml` (tag `ipad`); `scripts/ci/e2e-czesci.mjs:156` | Jak R-A-22. |
| R-A-24 | PU-054 | P2 | 21:29 to `tapOn`, nie asercja. 21:28 to tylko widoczność przycisku „Wzór” przed stuknięciem. Istota wyniku („PDF · …”, „Page 1 of 2”) jest asercją w 21:35–36, ale katalog jej nie wskazuje. | `21-br-wzr-001-s1-pdf-z-plikow.yaml:28-29` vs `:35-36` | Pokrycie: `21:35; 21:36; 27:24`. |
| R-A-25 | PU-227 | P2 | 34:16 to `runFlow`, nie asercja. `dodaj-czesc-cel.yaml:49` sprawdza licznik po stuknięciu wiersza części „Back, .*” (:48), nie po „‹”. Powrót „‹” z projektu na licznik sprawdza 59:21–22, ale katalog tego nie wskazuje. | `34-…blizniak.yaml:16`; `subflows/dodaj-czesc-cel.yaml:48-49`; `59-br-dni-004-s1-postep-w-procentach.yaml:21-22` | Pokrycie: `subflows/dodaj-czesc-cel.yaml:16; 59:22`. |
| R-A-26 | (bramka spójności) | P2 | Test spójności katalogu deklaruje „scenariusz jest w bramce”, ale nie odrzuca tagu `ipad` (pusta bramka) i nie wymaga, by linia była asercją. Dlatego przeszły R-A-22–R-A-25. | `tests/jakosc/przypadki-uzycia.test.ts:95-114` | Dodać: linia `- assert*`/`- extendedWaitUntil` (bez `optional: true`); A nie może wskazywać wyłącznie scenariuszy z tagiem `ipad`. |
| R-A-27 | PU-015 | P3 | 21:43 (znacznik rzędu na skanie) leży przed restartem i nie dotyczy „Kontynuuj → wzór”. Właściwe są 21:49–50 (tak jak 22:32, 24:28). „Licznik pod spodem w stosie” nie jest nigdzie sprawdzony. | `21-…:43` vs `:47-50` | Zamienić 21:43 na 21:50; dodać `nav-wstecz` → `licznik-plus` po restarcie na wzorze. |
| R-A-28 | PU-233 | P3 | Odnośniki to lista przed wyborem (39:15) i Ustawienia po wyborze „auto” (39:28). Zmianę języka od razu po wyborze sprawdza niewskazane 39:18. | `39-p-190-jezyk-trwaly.yaml:15,18,28` | Dodać 39:18. |
| R-A-29 | PU-123 | P3 | 06:74 sprawdza tylko obecność wiersza „Oczko Pro”, nie wartość „On”. Istotę pokrywa pośrednio brak linii darmowych dni (06:75). | `06-br-zak-001-s1-zakup-przywrocenie.yaml:74-75` | Asercja tekstu wiersza (`.*On.*`) po restarcie. |
| R-A-30 | PU-115 | P3 | „Ta sama liczba na liście Projekty” nie jest porównana w tym samym stanie: 05:68 to „0 of 5” na limicie w innym scenariuszu niż 06:22 („4 of 5”). | `06-…:22`; `05-br-zak-006-s1-limit-zawczasu.yaml:68` | Dodać `projekty-dni-darmowe` „4 of 5…” w scenariuszu 06. |
| R-A-31 | PU-078 | P3 | 16:66 sprawdza tylko `zapas-brak-wynikow` po id, bez tekstu „No yarn called “xyz”.”. | `16-br-zap-004-s2-zapas-bez-zasiegu.yaml:65-66` | Dodać `text:` do asercji. |
| R-A-32 | PU-199 | P3 | „Licznik bez paska zakładek” nie jest sprawdzony (brak `assertNotVisible` `nav-dzis` na liczniku). | `03-br-lic-001-s2-pierwszy-rzad-jednym-stuknieciem.yaml:22-34` | Dodać `assertNotVisible: { id: "nav-dzis" }` po 03:23. |
| R-A-33 | PU-201 | P3 | Po „‹” sprawdzona jest tylko obecność `licznik-plus`, nie „ta sama wartość”. | `67-br-lic-012-s1-podpis-w-pasku-wzoru.yaml:28-29` | Dodać `licznik-wartosc` „12” po 67:29. |
| R-A-34 | PU-212 | P3 | „Gest zamknięcia wyłączony” nie jest sprawdzony; 43:23 to przycisk „Udostępnij” na karcie. | `43-…:22-23` | Swipe w dół na karcie → `ukonczenie-karta` nadal widoczna. |
| R-A-35 | PU-206 | P3 | „Nie do menu” po zapisie nie jest sprawdzone (brak `assertNotVisible` pozycji `menu-*`). | `subflows/wpisz-wartosc.yaml:19-20` | Dodać `assertNotVisible: { id: "menu-wpisz-wartosc" }`. |
| R-A-36 | PU-216 | P3 | Zamknięcie arkusza jest opcjonalne (51:26), a 51:27 sprawdza `ustawienia`, które mogą być w hierarchii pod arkuszem. Zamknięcie nie jest więc dowiedzione. | `51-br-dan-009-usun-takze-z-icloud.yaml:26-27` | Po zamknięciu `assertNotVisible: { id: "icloud-przelacznik" }`. |
| R-A-37 | PU-245 | P3 | Część „Projekt bez sesji” (ekran projektu) nie jest sprawdzona; odnośniki dotyczą tylko „Historii”. | `64-…:62-63` | Dodać asercję na ekranie projektu albo zawęzić PU. |
| R-A-38 | PU-161 | P3 | p95 ≤ 100 ms mierzone na symulatorze (Release), nie na urządzeniu. Klasa A nie mówi, że wynik nie przenosi się na iPhone'a. | `31-nfr-wyd-001-reakcja-licznika.yaml:1-3,42` | Dopisać w PU „na symulatorze”; ewentualnie F-pomiar na urządzeniu. |

---

## 3. Miejsca `[DO USTALENIA]` (8)

| ID | PU | Poziom | Znalezisko (co robi aplikacja) | Dowód plik:linia | Propozycja poprawki |
|---|---|---|---|---|---|
| R-A-39 | PU-202 (`przypadki-uzycia.md:319`) | P1 | Rozstrzygnięte, a katalog jest nieaktualny. Ekran „Dodaj wzór” bez otwartego wzoru ma widoczny przycisk „Back”, który robi `router.back()`. Opis „app/wzor.tsx:165 rysuje samą grupę źródeł bez paska ‹” i „znany błąd: brak powrotu (BW)” są nieprawdziwe. Scenariusz 21 sprawdza powrót z menu źródeł na licznik. Poprawka (2590e8f1, 15.11 17:43) jest starsza niż commit katalogu (0e5343fd, 15.11 18:18). Gest od krawędzi: nie badałem (zwykły ekran stosu). | `src/ekrany/WzorZrodla.tsx:9-19`; `app/wzor.tsx:169` (`naWstecz={() => router.back()}`); `e2e/scenariusze/21-br-wzr-001-s1-pdf-z-plikow.yaml:23-28` | Klasa A: `21:25; 21:28`; usunąć „znany błąd”. Wejście z kafla „Dodaj wzór” na „Dziś” zostaje B (niepokryte). |
| R-A-40 | PU-046 (`:78`) | P2 | Koniec sesji wybiera się kołem `UIDatePicker` (`mode="datetime"`, `display="spinner"`, testID `formularz-sesja-koniec-wybor`). Kontrakt E2E nie ma polecenia ustawiania koła. Po zmianie widać na żywo „Project time after saving: {czas}.” / „Czas projektu po zapisaniu: {czas}.”, a po zapisie znacznik „Edited” / „Poprawiona”. Można to rozstrzygnąć bez Maestro: test komponentowy `KorektaSesji` z `onValueChange`. | `src/ekrany/Formularze.tsx:171-172,182`; `src/i18n/slowniki/en.json:329,681`; `pl.json:403,829`; nagłówek `38-…:2` | B komponentowy (zmiana końca −10 min → tekst `formularz.sesja_projekt` i zapis); Maestro: `swipe` po kole minut + asercja zmiany linii (do próby). |
| R-A-41 | PU-255 (powiązane z R-A-40) | P2 | Kroki „koniec przed startem → „Zapisz”” nie zgadzają się z kodem: przy końcu przed startem „Save” jest nieaktywny, a komunikat pokazuje się od razu. Komunikat: en „The end must be after the start.”, pl „Koniec musi być po starcie.”. | `src/ekrany/Formularze.tsx:162,179,181`; `en.json:289`; `pl.json:359` | Kroki: „… → komunikat od razu, „Zapisz” nieaktywny”; asercja `enabled: false` na `formularz-zapisz`. |
| R-A-42 | PU-092 (`:149`) | P2 | Brak testID skali — rozstrzygnięte. Widok wzoru wystawia tylko `wzor-strona`. Powiększenie przychodzi zdarzeniem natywnym i jest zapisywane w `ostatnie_miejsce`, z testami komponentowymi. Odnośnik „częściowo: 21:43” wskazuje znacznik rzędu, nie stronę ani powiększenie. | `src/ekrany/WzorPrzegladarka.tsx:211`; `src/ekrany/WzorWidokNatywny.tsx:73`; `src/przypadki-uzycia/wzor-miejsce.ts:26-36,55-56`; `tests/ekrany/wzor-trasa-miejsce.test.tsx`, `tests/ekrany/start-na-wzorze.test.tsx` | Pokrycie: „częściowo: testy komponentowe (powiększenie)”; usunąć 21:43; strona po restarcie: 21:49–50. Maestro i tak nie ustawi powiększenia gestem → panel E2E z wartością skali. |
| R-A-43 | PU-153 (`:240`) | P3 | Limit to `WZOR_MAKS_MB = 200` (oznaczony `[OCENA]`), liczony jako 200 × 1024 × 1024 B, odrzucenie przy `>`. PDF 150 MB mieści się w limicie. Nad limitem: en „This file is too large” / „A pattern can be up to 200 MB. Nothing was added.”; pl „Ten plik jest za duży” / „Wzór może mieć do 200 MB. Nic nie dodano.”. Nieścisłość: komunikat mówi o MB, a kod liczy MiB. | `src/konfiguracja.ts:40`; `src/przypadki-uzycia/wzor.ts:85,102`; `src/kompozycja/wzor-dodawanie.ts:14`; `en.json:886-887`; `pl.json:1060-1061` | Usunąć `[DO USTALENIA]`; plik 150 MB generować w panelu E2E (nie w repo). |
| R-A-44 | PU-162 (`:259`) | P3 | Panel pomiaru startu nie istnieje — rozstrzygnięte. Panele E2E to tylko `e2e-pomiar-plus`, `e2e-pomiar-ladowania` i `e2e-pomiar-operacji`. Czas startu da się wziąć z wyników Maestro (`--test-output-dir`: czasy kroków `launchApp` → `extendedWaitUntil dzis-karta`) bez zmian w aplikacji. | `src/kompozycja/e2e/panele.tsx:166,170`; `src/kompozycja/e2e/pomiar-operacji.tsx:57`; `.github/workflows/jakosc-ios.yml` (krok „Scenariusze”, `--test-output-dir`) | B: odczyt czasów kroków z artefaktu Maestro albo nowy panel `e2e-pomiar-startu`. |
| R-A-45 | PU-250 (`:372`) | P3 | Domena nie ma górnego limitu (tylko liczba całkowita ≥ 0). Pole odrzuca liczbę spoza `Number.isSafeInteger`; 20 cyfr → `null` → komunikat jak przy pustym polu (potwierdzone). Tekst: en „Enter a whole number, 0 or more, for example 1,000.”, pl „Wpisz liczbę całkowitą, 0 lub większą, na przykład 1000.” (przykład wg `Intl`, sprawdzone w Node). Wartości do 9 007 199 254 740 991 są przyjmowane. Test jednostkowy dla > 2^53 nie istnieje. | `src/i18n/format.ts:52`; `src/ekrany/Formularze.tsx:35-37,45`; `src/domena/licznik.ts:16`; `en.json:68`; `pl.json:98`; `tests/i18n/parsuj-calkowita.test.ts:11-12` | Usunąć `[DO USTALENIA]`; dopisać przypadek `'12345678901234567890' → null`; decyzja produktowa, czy 16 cyfr ma przechodzić (02/04). |
| R-A-46 | PU-257 (`:379`) | P2 | W panelu E2E faktycznie nie ma pliku uszkodzonego, złego typu ani za dużego (są: PDF, PDF sklepu, skan, zdjęcie, WWW, Word ×3). Część „jednostkowy — klasyfikacja błędów” już jednak istnieje: test mapuje `uszkodzony`, `bledne_dane` i `za_duze` na teksty. Katalog podaje ją jako „do zaprogramowania”. Teksty: en „Oczko can’t open this file” / „Oczko can’t add this type of file” / „This file is too large”; pl „Oczko nie może otworzyć tego pliku” / „Oczko nie może dodać pliku tego typu” / „Ten plik jest za duży”; opisy z „Nothing was added.” / „Nic nie dodano.”. | `src/kompozycja/e2e/panele.tsx:98-139`; `src/kompozycja/wzor-dodawanie.ts:12-14`; `tests/ekrany/wzor-dodawanie.test.ts:10-12`; `en.json:882-887`; `pl.json:1056-1061` | Pokrycie: „częściowo: tests/ekrany/wzor-dodawanie.test.ts:10” (test musi wymienić PU-257); Maestro: przycisk panelu z plikiem `.pdf` bez nagłówka `%PDF-`. |
| R-A-47 | PU-259 (`:381`) | P3 | Sztuczny sklep nie reaguje na `oczkoE2eSiec` — rozstrzygnięte: `produkty()` zawsze zwraca stałe ceny. Stan `brak-sieci` powstaje tylko przy pustej liście albo odrzuceniu. Tekst: en „Prices aren’t available right now. Check your connection.”, pl „Ceny są teraz niedostępne. Sprawdź połączenie.”. Test komponentowy stanu `brak-sieci` istnieje, ale nie sprawdza tekstu. | `src/platforma/sklep-sztuczny.ts:24`; `app/oferty.tsx:28`; `src/ekrany/Oferty.tsx:142`; `en.json:491`; `pl.json:613`; `tests/ekrany/oferty.test.tsx:121-126` | Usunąć `[DO USTALENIA]`; w teście 121 dopisać asercję tekstu i ID PU-259. |

---

## 4. Ekrany `src/ekrany/*.tsx` bez trasy

Metoda: graf importów względnych (`import`, `export … from`, `require`, `import()`) od każdego pliku `app/**/*.tsx` poza `_layout.tsx` (33 trasy), z przejściem po `src/` i `app/`. Z 64 plików `src/ekrany/*.tsx` nieosiągalny jest jeden. Komponentów osiągalnych wyłącznie z `_layout` nie ma.

| ID | PU | Poziom | Znalezisko | Dowód plik:linia | Propozycja poprawki |
|---|---|---|---|---|---|
| R-A-48 | PU-063, PU-064 | P2 | `src/ekrany/Wzor.tsx` (`LinkFilmu`) to martwy kod: żaden plik `app/` ani `src/` go nie importuje, używa go tylko test. Produkcja używa `WierszFilmu` z `WzorFilm.tsx` (alert z tytułem „No internet connection” / „Brak połączenia z internetem”), a nie komunikatu w treści jak `LinkFilmu`. Test martwego kodu może dawać złudne pokrycie PU-063/PU-064. | `src/ekrany/Wzor.tsx:1-21`; `tests/ekrany/narzedzia-wzor.test.tsx:7`; `src/ekrany/WzorFilm.tsx:19-21`; `app/projekt/[id].tsx:15` (import `WzorFilm`); `en.json:846`; `pl.json:1016` | Usunąć `Wzor.tsx` i jego test (albo przepiąć test na `WzorFilm`); PU-063 w Pokryciu: `tests/ekrany/projekt-trasa-film-siec.test.tsx`. |
| R-A-49 | — (brak PU) | P2 | Poza zakresem `src/ekrany`, ale wynika z tej samej analizy: trasa `app/+native-intent.tsx` (otwarcie pliku `.oczko` z Plików albo Poczty → import) nie ma żadnego PU. Jest dla niej test komponentowy. | `app/+native-intent.tsx:1-2,7-11`; `tests/ekrany/import-zimny-start-206.test.tsx:1,16` | Nowy PU (B/A z odnośnikiem do testu 206; Maestro: `openLink` z plikiem `.oczko`, do próby). |

---

## Czego nie sprawdziłem

- Nie uruchamiałem Maestro ani symulatora (brak macOS). Możliwości Maestro i symulatora wskazane w sekcji 1 (gest pinch, koło wyboru, okno Pliki, okno zgody na aparat w symulatorze, `openLink` z plikiem) nie są zweryfikowane z dokumentacją Maestro 2.12.1 ani przebiegiem. Oznaczyłem je jako „do próby” albo „spike”.
- Nie czytałem całego `e2e/README.md` (58 KB): tylko tagi, przełączniki buildu, argumenty startu i odnośne wiersze testID.
- Klasy B oceniałem tylko tam, gdzie dotyczyło to pytań 1–4. Systemowego przeglądu 134 PU klasy B nie robiłem; przy okazji wyszło, że część pozycji „do zaprogramowania: jednostkowy/komponentowy” ma już testy (R-A-46, R-A-47, R-A-03, R-A-04).
- Nie sprawdzałem indeksu kroków instrukcji (`docs/wydanie/instrukcja-testu-1171.html`) ani kompletności przypisania kroków do PU.
- Dla 78 PU A „bez uwag” oceniałem, czy asercja dotyczy istoty wyniku, nie każdy przymiotnik opisu (np. „płynnie”, „od razu”).
- Graf importów obejmuje tylko importy ze stałą ścieżką względną; importy z wyliczaną ścieżką albo przez aliasy (`@/…`) zostałyby pominięte (grep `from '@/` w `src/` i `app/` nic nie zwraca).
- Tłumaczenia sprawdzałem tylko en i pl, dla kluczy cytowanych wyżej.

---

# Recenzja B (skrót: wstęp i kontrola mechaniczna; inwentarz → sekcja „Funkcje” katalogu, proponowane PU → katalog)


Stan repo: `b05cfb15` (2026-11-15). Katalog: `docs/jakosc/przypadki-uzycia.md` (270 PU: A=95, B=134, F=41).
Kryterium właściciela: każda funkcja z kodu ma co najmniej jeden PU z realnym użyciem: cel od początku do końca, warianty, dane, błędy. Samo „wejście i powrót” (PU-195–236) nie wystarcza.

Metoda: najpierw inwentarz z kodu (`app/**`, `src/ekrany/*`, `src/przypadki-uzycia/*`, `targets/{watch,widget,share}/*.swift`, słowniki `src/i18n/slowniki/{pl,en}.json`). Pomocnicze skrypty są w scratchpadzie: `inw.mjs`, `kontrola.mjs`, `kontrolaD2.mjs`, `kontrolaE.mjs`, `t.mjs`. Dopiero potem porównanie z katalogiem: po tekście ⟦en⟧, testID, kolumnie Ekrany i treści kroków. „PU (nawigacja)” oznacza, że funkcję obejmuje tylko wiersz „Wejście i powrót”. W kolumnie Status liczy się to jako BRAK.


## Kontrola mechaniczna

Do `tests/jakosc/przypadki-uzycia.test.ts` sprawdzono prototypami w scratchpadzie cztery kandydatki. Prototypy policzyły braki na `b05cfb15`.

| Kontrola | Co sprawdza | Dziś brakuje | Fałszywe alarmy | Ocena |
|---|---|---|---|---|
| **K1. Etykiety przycisków** (`kontrolaD2.mjs`) | Każdy klucz `t('…')` z linii z `onPress=`, `onValueChange=` albo `text: t(` (przyciski alertów) w `src/ekrany/**/*.tsx` i `app/**/*.tsx`, bez `_a11y/_opis/_tytul/_podpowiedz`. Stały początek tekstu en (do pierwszego `{{`) ma wystąpić w co najmniej jednym wierszu `| PU-`. | **27 z 123**: Delete reminder, Clear, No date, Enter the right number, Change in iOS Settings, Unlock counter, Waiting for approval, Stop and start here, Check the end time, Choose yarn, One skein less, Edit stash, Also delete from iCloud, Remove link, Video link options, Paste, Delete note, Rename, Show all, Weight category, Delete yarn, Delete needles or hook, Oczko report, Turn off, Don’t sync, Sync with this account, Go to Data and sync | 1 (`zglos.plik` to nazwa pliku, nie przycisk) → lista wyjątków z powodem. „Also delete from iCloud” to brak ⟦en⟧ w PU-101, czyli też błąd konwencji. | **Rekomendowana.** Opiera się na konwencji katalogu (napisy ⟦en⟧), łapie nowe przyciski bez osobnej mapy i ma prawie zero szumu. Po dopisaniu PU z tej recenzji spada do 0 plus 1 wyjątek. |
| K1b. Teksty zegarka i ekranu blokady | Jak K1, dla `Teksty.t("…")` w `targets/watch/Aplikacja.swift` i `targets/widget/Aktywnosc.swift` (sekcja `aktywnosc` en.json), bez `_a11y`. | 6 + 6: Unlock it in Oczko on your iPhone, Try again or count on iPhone, No free crafting days left in, Counting resumes, Now row, Open Oczko on your iPhone…; Counting paused, Unlock it in Oczko, Your rows are kept… | 1 („Now row” różni się od „Now working row” aplikacji, decyzja: dopisać albo wyjątek) | Rekomendowana jako druga część K1, ten sam mechanizm. |
| K2. Interaktywne testID | Każdy `testID` w linii z `onPress`/`onValueChange`/`onChangeText` (src/ekrany, app) występuje w wierszu PU. | 75 z 126 | wysokie: PU klasy A podają plik:linię scenariusza, nie testID; np. `licznik-minus` jest w PU-018 tylko jako „−1” | Nie teraz. Ma sens dopiero, gdy Pokrycie PU klasy A będzie podawać testID. Wtedy jako ostrzeżenie. |
| K3. testID z `e2e/README.md` | Każdy wiersz tabeli testID w README występuje w PU. | 176 z 304 | bardzo wysokie: elementy strukturalne (`arkusz-naglowek`, `menu-podzialka`), panele `e2e-*`, kafle ilustracji | Odrzucić. |
| K4. Trasy | Każda trasa `app/**` (bez `_layout`, `+native-intent`) jest w kolumnie Ekrany co najmniej jednego PU. | 0 z 32 | brak | Wykonalna, ale słaba: trasę spełnia sam PU „Wejście i powrót”. Dopisać tanio jako regresję. Nie mierzy kryterium właściciela. |
| K5. Pliki `src/przypadki-uzycia/*.ts` | Każda eksportowana funkcja (201 eksportów w 35 plikach) ma PU-ID w mapie `docs/jakosc/pu-mapa.json` albo jest na liście infrastruktury. | Dziś 100%, bo mapy nie ma. Po zbudowaniu mapy z tej recenzji zostaje ok. 14 funkcji bez PU (`usunPrzypomnienie`, `cofnijSerie` z historii, `zmienDateUkonczenia`, `ustawProbke`, `usunCzesc`/`przywrocCzesc`, `usunFilm`, `zmienNazweWzoru`, `przywrocWzor`, `zmienNotatkeWzoru`/`usunNotatkeWzoru`, `usun/przywroc Wloczke/Narzedzie`, `przelaczSesje`, `sesjaDoSprawdzenia`, `odrzucZlecenie`, `sprzatnijKosz`). | niskie, ale mapa wymaga ręcznej obsługi przy każdym nowym eksporcie | Wartościowa jako druga kontrola (domena bez UI, np. kosz po 30 dniach). Wymaga nowego pliku mapy i decyzji 07, czy dopuścić kolumnę albo plik. |

**Rekomendacja.** Teraz dopisać do testu K1 razem z K1b. To regex po liniach z `onPress|onValueChange|text: t(`, słownik `en.json`, początek tekstu przed `{{`, dopasowanie w wierszach `| PU-` i jawna lista `WYJATKI_ETYKIET` z powodem (na start `zglos.plik`). Test najpierw czerwony z 27+12 brakami, zielony po dopisaniu proponowanych PU. Spełnia P-835, bo nowy przycisk bez PU od razu daje czerwony test. K4 dopisać jako tanią regresję. K5 zaplanować z mapą `pu-mapa.json`. K2 i K3 odrzucić, bo w obecnym formacie Pokrycia dają szum.
