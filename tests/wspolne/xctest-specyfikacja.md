# Specyfikacja testów XCTest na wspólnych plikach (dla roli 08; zatwierdza 05)

Stan: rola 07, E3, 2026-10-25. Kodu Swift nie ma (brak celów natywnych, ADR-0007) — to specyfikacja, nie test. Miejsce wykonania: zadanie `xctest` w `jakosc-ios.yml` (macOS, po `expo prebuild`, strategia §5; pierwszy przebieg informacyjny, potem bramka). Reguły logiki wspólne dla `widget` i `watch` w jednym pakiecie Swift testowanym `swift test` bez symulatora (Z07-12, wzór Treningu `ios-unsigned.yml`); testy wymagające procesu aplikacji (intencja, `DziennikPlus`) jako XCTest celu po prebuild.

## Stan wykonania (08 partia 3, 2026-10-26; P-129 Q2a — zmiana miejsca X-DZ zatwierdzona przez koordynatora w miejsce 05)
- **Miejsce:** reguły (X-RG), dekoder stanu (X-ST) i rdzeń pliku dziennika (X-DZ-01–06, 11–13) w jednym pakiecie Swift `modules/oczko-reguly` (Foundation + POSIX) testowanym `swift test` bez symulatora — zadanie `swift-test` w `jakosc-ios.yml` (bramka od pierwszego zielonego przebiegu 40257126189). Cele natywne dostają kopie źródeł pakietu z kontrolą identyczności (`scripts/natywne/kontrola-swift.mjs`, jak Trening `scripts/verify-native.mjs`).
- **Poza pakietem (wymagają procesu aplikacji):** X-DZ-07 (plik niedostępny przed odblokowaniem), X-DZ-08 (intencja przy `dzienDozwolony: false`), X-DZ-09 (łańcuch rodziców intencji), X-DZ-10 (migawka nazw `LiveActivityIntent`) — w celu `widget` (3C); przebieg na symulatorze → E2E partii 4 i lista TT.
- **Stan v2:** złote pliki `stan-*.json` są wersją 2 z generatora `tests/wspolne/generator-stanow.ts` (test zgodności `tests/domena/stan-ekranu.test.ts`); pliki wersji 1 zostają jako `*-v1.json` (typy `StanEkranuBlokadyV1`, `StanZegarkaV1`).
- **Siła testów:** mutanty reguł, dziennika i dekodera w kopii pakietu: 13/13 zabitych (oczko-warsztat `08-programista/2026-10-26-partia3/logi/B-mutanty-swift.txt`).

## Zasady wspólne
- Pliki czytane z `tests/wspolne/` i `docs/…/wektory-*.json` **w repo** (zasób testu kopiowany w kroku budowania z repo, nie kopia w `targets/` — kontrola repo: brak kopii `wektory-*.json` i złotych plików poza tymi katalogami, R-032).
- Każdy test wypisuje „wykonano N z N” i **pada**, gdy N = 0, gdy wykonanych < N albo gdy plik nie ma wpisu w manifeście. Żadnego `try?` na odczycie pliku ani dekodowaniu w pętli wektorów.
- Liczności dzisiejsze (z repo, 2026-10-25): N wyliczane z plików w czasie testu — liczby niżej są kontrolą, że nic nie zniknęło (test porównuje wyliczone N z tą tabelą tylko przez `>=`).

| Zestaw | Plik | Liczność dziś | Kto czyta w Swift |
|---|---|---|---|
| Złote pliki dziennika | `tests/wspolne/wzorce.json` → `dziennik` | 3 pliki, 9 linii | `modules/oczko-dziennik-plus` |
| Złote pliki stanów | `tests/wspolne/wzorce.json` → `stany` | 7 plików (3 × `StanEkranuBlokady`, 4 × `StanZegarka`) | `targets/widget`, `targets/watch` |
| Wektory limitu | `docs/monetyzacja/wektory-limitu.json` | 35 (`startDnia` 17, `wolaStraznika` 10, `mozeZaczacDzien` 8); stałe `limit` = 5, `przerwa_ms` = 3 600 000 | pakiet reguł (intencja i zegarek, ADR-0007/0008/0009) |
| Wektory dostępu | `docs/monetyzacja/wektory-dostepu.json` | 24 (`decyzja` 18, `odczytajPamiec` 6) | zegarek (Pro bez telefonu, ADR-0009 D) |
| Wektory scalania | `docs/architektura/eksperymenty/e1/scal-wektory.json` | 8 (M-01–M-08; M-09, M-10 po fix 05) | tylko jeśli Swift scala (dziś nie: scala TS) |
| Wektory dnia (RD-16) | po ER-37 (strefy, DST, kalendarz niegregoriański) | [DO USTALENIA] | pakiet reguł (`dzien` w Swift, R-133, R-134) |

## 1. Dziennik +1 (`DziennikPlus`, ADR-0008; R-018, R-022–R-025)
| ID | Test | Wyrocznia |
|---|---|---|
| X-DZ-01 | Dla każdego pliku `dziennik[]`: odczyt Swift daje dokładnie `przyjete_id` (kolejność), `odrzucone_linie`, `ostatnia_ucieta`; wynik raportowany jako błąd diagnostyki, nie wyjątek | `wzorce.json` |
| X-DZ-02 | Koder: zdarzenia z `dziennik-plus-poprawny.jsonl` zdekodowane i zakodowane ponownie dają **te same bajty linii** (kolejność pól jak w pliku, `czasMs` w ms jako liczba całkowita, `zrodlo: "ekran_blokady"`, bez `\/`: `JSONEncoder.outputFormatting` z `.withoutEscapingSlashes`, `.sortedKeys` NIE — kolejność z typu). Jeśli Foundation na iOS 18 nie gwarantuje kolejności kluczy [DO USTALENIA 05/08 przy pierwszym przebiegu], porównanie po zdekodowaniu obu stron do słownika, a kolejność pól przestaje być częścią kontraktu (TS czyta pola po nazwie) | plik |
| X-DZ-03 | Zapis z intencji: linia dopisana przez `DziennikPlus` dla zdarzenia z pliku = linia z pliku (TS czyta to, co Swift pisze) | plik |
| X-DZ-04 | 1000 równoległych dopisań z dwóch wątków → 1000 poprawnych linii, 1000 różnych id | ADR-0008 „Potwierdzenie” |
| X-DZ-05 | Zapis linii (ADR-0008 (8A)): dla każdego wektora `dopisanie` plik z bajtami `przed` + dopisanie `linia` przez `DziennikPlus` = dokładnie bajty `po` (pusty plik i plik z `\n` na końcu: bez `\n` na początku; ucięty ogon: `\n` na początku); poprzednie linie zachowane | `wzorce.json` → `dopisanie` |
| X-DZ-06 | `skroc(doId)`: zostają linie po `doId`; linia dopisana między `odczytaj()` a `skroc()` nie ginie | R-022 |
| X-DZ-07 | Plik niedostępny (ochrona danych przed pierwszym odblokowaniem, atrapa magazynu z błędem i `isProtectedDataAvailable = false`) → intencja zwraca błąd, stan Live Activity z `uwaga: 'odblokuj'`, `wartosc` i `glowa` bez zmian; następna aktualizacja z JS i udane stuknięcie czyszczą `uwaga` (fix-4 05, P-135 Q5a) | R-025, ADR-0008 (2026-10-26) |
| X-DZ-08 | Intencja przy `dzienDozwolony: false` (`stan-ekranu-blokady-limit.json`) nie dopisuje linii | P-065 (1a) |
| X-DZ-09 | Kolejne stuknięcia intencji łańcuchują rodziców jak `dziennik-plus-poprawny.jsonl` (rodzic = poprzednie własne id, pierwszy = `glowa` ze stanu) | Z07-11 (1), M-10 |
| X-DZ-10 | Migawka nazwy i parametrów `LiveActivityIntent` oraz kluczy `StanAktywnosci` (z `uwaga`, fix-4) (zmiana = zmiana kontraktu, Live Activity żyje do 8 h przez aktualizację aplikacji) | Z07-11 (4) |
| X-DZ-11 | Linia z nieznanymi polami (`dziennik-plus-nieznane-pole.jsonl`) dekodowana bez błędu, pola pominięte | R-024 |
| X-DZ-12 | Odczyt i skrócenie (ADR-0008 (8R), (8S)): wektory `sklejenie` (przyjęte id, zgłoszone linie, odzyskane id) i `skrocenie` (bajty pliku po `skroc(do_id)`; `do_id` także w linii sklejonej) dają wynik z manifestu | `wzorce.json` → `sklejenie`, `skrocenie` |
| X-DZ-13 | Krótki zapis albo błąd `write`/`fsync` (atrapa uchwytu): plik obcięty do rozmiaru sprzed zapisu, intencja zwraca błąd, stan Live Activity bez zmian (`wartosc`, `glowa`) | ADR-0008 (8A) |
| X-DZ-14 | Błąd zapisu przy odblokowanym urządzeniu (atrapa, `isProtectedDataAvailable = true`) → intencja zwraca błąd, stan Live Activity z `uwaga: 'blad_zapisu'`; dekoder `StanAktywnosci` bez klucza `uwaga` (Live Activity sprzed aktualizacji) daje `null`, a ze znaną wartością — tę wartość (N2 z P-133, P-135 Q5a) | ADR-0008 (2026-10-26) |
| X-DZ-15 | Intencja przy `zablokowany: true` (+1) zwraca `WynikIntencji.zablokowany`, nie dopisuje linii, stan Live Activity bez zmian (N1, P-135 Q7a); sprawdzane przed limitem (stan zablokowany i `dzienDozwolony: false` → `zablokowany`) | ADR-0008 (2026-10-26) |

## 2. Stan Live Activity i zegarka (Z07-12; R-026–R-028, R-031)
| ID | Test | Wyrocznia |
|---|---|---|
| X-ST-01 | Każdy plik `stany[]` dekoduje się `JSONDecoder` do struktury Swift typu z `typ` bez wartości domyślnych (brak pola = błąd dekodowania, nie `?? false`) | `moduly.md` |
| X-ST-02 | Zakodowany ponownie przez Swift: ten sam zbiór kluczy i wartości (porównanie po zdekodowaniu do słownika) | plik |
| X-ST-03 | Rozmiar `ActivityContent` po kodowaniu Swift < 4096 B dla `*-najwiekszy.json` | rejestr Apple 1b, R-028 |
| X-ST-04 | Pułapka: plik z polem przemianowanym (`dzien_dozwolony`) nie dekoduje się — test oczekuje błędu | R-027 |
| X-ST-05 | `stan-zegarka-pro-dozywotni.json`: reguła Pro na zegarku daje „ma Pro” (null = bez końca) | R-031, W-01 |
| X-ST-06 | `stan-zegarka-pro-subskrypcja.json`: „ma Pro” dla `teraz < proWaznoscDo`, „nie ma” dla `teraz = proWaznoscDo` i `teraz + 1` (granica jak Z07-08) | KP-06, R-114 |
| X-ST-07 | Stan wersja 3 (N1, P-135 Q7a): plik v3 z `zablokowany` dekoduje się; plik v2 (`*-v2.json`) bez pola → `zablokowany = false`; v3 bez pola → błąd dekodowania; wersja 4 → odrzucona | ADR-0008 (2026-10-26) |

## 3. Reguły limitu i dostępu w Swift (ADR-0007, ADR-0009; R-032, R-098, R-099)
| ID | Test | Wyrocznia |
|---|---|---|
| X-RG-01 | Każdy wektor `startDnia`, `wolaStraznika`, `mozeZaczacDzien` z `wektory-limitu.json` daje wynik z pliku; wykonane id = id z pliku (zbiór, nie liczba) | `limit.mjs` przez wektory |
| X-RG-02 | Stałe Swift = `limit` i `przerwa_ms` z pliku (nie wpisane na sztywno) | R-032 |
| X-RG-03 | Mutant: zamiana `<` na `<=` w porównaniu przerwy (wstrzyknięta w teście przez parametr) daje czerwone na wektorze granicznym (po Z07-07: L-04c = 60 min, L-04d = 59:59,999) | R-098 |
| X-RG-04 | `func mozeZaczacDzien` jest w pakiecie dokładnie raz (kontrola repo z plikiem-pułapką, Linux) i jest używana przez intencję i zegarek | R-032 |
| X-RG-05 | Wektory dostępu `decyzja` i `odczytajPamiec` z `wektory-dostepu.json` (Pro na zegarku bez telefonu) | ADR-0009 D, P-039 |
| X-RG-06 | `dzien` w Swift: kalendarz gregoriański i cyfry ASCII niezależnie od `Locale`/`Calendar` urządzenia (`Calendar(identifier: .japanese)` w teście) | R-134, RD-16 |

## 4. Skrzynka zegarka (ADR-0009, uzupełnienie 2026-10-26; NZ-08-P3-05 (e), P-135) — `swift test` pakietu, zestaw `ZegarekSkrzynkaTests`
Wektory: `wzorce.json` → `zegarek_skrzynka` (ZG-01–ZG-10; ZG-10 wymaga stanu v3); zestaw wypisuje „wykonano N z N” po id scenariuszy (`Wykonane`). `SkrzynkaZegarka` dostaje magazyn (`MagazynSkrzynki`): w X-ZG-01–09 prawdziwy plik `skrzynka-zegarka.jsonl` w katalogu tymczasowym (rdzeń `DziennikPlus`), w X-ZG-02 atrapa rzucająca błąd przy `dopisz`. `restart` = nowa skrzynka z tego samego magazynu i ostatniego kontekstu. Dziś (partia 3) czerwone z właściwego powodu: X-ZG-03 i X-ZG-09 (e3) na asercji — `ZegarekTests.testGlowaInnegoLicznikaNieUsuwa` z `XCTExpectFailure(strict: true)` (P-135: test oczekujący; 08 usuwa `XCTExpectFailure` w commicie poprawki); pozostałe wymagają nowego API (magazyn, `potwierdzone`, `doWyslania`) — czerwień pokazuje 08 przed kodem (odstępstwo nazwane: brak kompilatora Swift w chmurze roli 05).
| ID | Co | Wyrocznia |
|---|---|---|
| X-ZG-01 | Stuknięcie zapisane w pliku przetrwa restart skrzynki (kolejka i wartość z pliku) | ZG-01 |
| X-ZG-02 | Błąd `dopisz` (pełny dysk): `stuknijNaZegarku` rzuca, kolejka, stan pokazywany i plik bez zmian; haptyka i wysyłka nie są wołane (model aplikacji zegarka) | ZG-02 |
| X-ZG-03 | Głowa kontekstu innego licznika nie usuwa zdarzenia z kolejki | ZG-03 |
| X-ZG-04 | Głowa w obrębie licznika usuwa siebie i wcześniejsze zdarzenia tego licznika; późniejsze nakładane na kontekst | ZG-04 |
| X-ZG-05 | `potwierdzone` usuwa zdarzenie, gdy głowa jest zdarzeniem telefonu (bez podwójnego liczenia) | ZG-05 |
| X-ZG-06 | `doWyslania(teraz:wToku:)`: niewysłane od razu; ponownie po `Stale.zegarekPonowienieMs`, z pominięciem `wToku` (`outstandingUserInfoTransfers`) | ZG-06 |
| X-ZG-07 | Brak potwierdzenia po wysłaniu (telefon nie zapisał): kolejka zostaje, ponowienie, potwierdzenie usuwa | ZG-07 |
| X-ZG-08 | Restart zapomina czasy wysyłki: wszystkie niepotwierdzone do wysłania | ZG-08 |
| X-ZG-09 | Potwierdzenie późniejszego zdarzenia licznika usuwa wcześniejsze tego licznika, nie rusza innego; nieznane id bez skutku | ZG-09 |
| X-ZG-10 | Przepisanie atomowe kolejki przerwane przed `rename` (atrapa): plik `skrzynka-zegarka.jsonl` = stan sprzed usunięcia, plik tymczasowy sprzątany przy odczycie | ADR-0009 (2026-10-26) pkt 1 |
| X-ZG-11 | Licznik zablokowany w kontekście: +1 i −1 na zegarku → `zablokowany`, kolejka i wartość bez zmian (N1) | ZG-10 |

## Wynik i raport
Raport XCTest (`xcresult`) jako artefakt; podsumowanie przebiegu wypisuje dla każdego zestawu „wykonano N z N”. Pierwsze uruchomienie informacyjne; bramka po pierwszym zielonym przebiegu na SHA (zasada roli 8). Do tego czasu: „Nie sprawdzono” w audycie dla R-018, R-022–R-028, R-031, R-032.
