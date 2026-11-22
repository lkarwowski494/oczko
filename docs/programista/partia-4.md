# Rola 08 (programista), build, partia 4: łatka NZ-RD15, zegarek (e) + N1, warstwa 4 (ekrany)
Plik stanu sesji · start 2026-10-26 · gałąź `claude/jolly-thompson-paz6d8` · prompt: biblioteka `prompts` 97ec212, `08-programista --tryb build --moduly sqlite-expo` (47510 znaków; nie w repo)
Zakres: P-138 (start partii 4), P-136 (łatka NZ-RD15 + test 07 + kod RD-15), P-134 Q1a, P-135 (Q1a–Q7a), P-137 (N3, pora ukończenia), P-139 (aneks 05: N3, pora, RD-15 z `zrobioneTeraz`, RD-21 `przedSchematem`, pole `jezyk`), P-133 (tylko +1 na Live Activity), P-126 (1b), P-129 Q6b, P-118 Q1a, P-114 Q1a, P-036. Specyfikacja: ADR-0009 „Uzupełnienie 2026-10-26” pkt 1–7, ADR-0008 „Uzupełnienie 2026-10-26 (fix-4)”, `docs/architektura/moduly.md` „Kontrakt partii 4”, `docs/architektura/fix-4-2026-10-26.md`, `oczko-warsztat/05-architekt/2026-10-26-fix4/E2-dowody.md` „Dla 08”, `tests/wspolne/wzorce.json` → `zegarek_skrzynka` (ZG-01–ZG-10), `tests/wspolne/xctest-specyfikacja.md` §4 (X-ZG-01–11), `docs/design/design-spec.md` („Dla 08” z P-126, P-133, P-137), `docs/jakosc/e4/tabela-08.md` („4 ekrany”).

## Stan: STOP E2 (2026-10-26) — (1), (2), (3) zakończone; „Jakość · iOS” 40313538454 na 49b9f40: build, swift-test i pakiet podstawowy E2E 01–09 zielone w pierwszym podejściu; verify 1801/1801. Raport: `oczko-warsztat/08-programista/2026-10-26-partia4/E2-raport.md`
E0 przyjęty (P-140: Q1a, Q2a, Q3a). (1) 7f9d86a, 4c71855; (2) 9182662…fd4da86 (2.1 potwierdzenia, 2.2 stan v3, 2.5/2.6 Swift C1+C2, 2.7/2.10 widoki natywne i teksty 04 w języku aplikacji, 2.3 sklep, 2.4 haptyka, 2.8 pora ukończenia, 2.9 RD-21). `env -u NODE_PATH npm run verify` kod 0, **1618/1618**; `test:akceptacja` 89 (tylko ekrany, znacznik); `swift test` lokalnie (Swift 6.2 Linux) 40/40; CI iOS: w pliku dowodów. Dowody: `oczko-warsztat/08-programista/2026-10-26-partia4/punkt-kontrolny-2.md`. Do (3) przechodzą: wołający `zegarek.potwierdz` przed `odswiezEkranBlokady`, odświeżenie po przełączeniu blokady (N1) i zmianie języka (N3) — kompozycja aplikacji, krok 3A.

## E0.1 Środowisko
| Sprawdzenie | Wynik |
|---|---|
| System, Node, git | Linux 6.18 x86_64, Node v22.22.0, chmura; tożsamość git „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>” (P-132 (3)) |
| GitHub | push na gałąź roboczą; `oczko-warsztat` z zapisem (P-010), HEAD f3000f1; `prompts` 97ec212 (prompt 47510 znaków — zgodny) |
| Xcode / Swift / symulator | brak — `swift test`, build i E2E tylko w CI „Jakość · iOS” (`macos-26`); na gałęzi pushuje też 04 fix-3 (tylko `docs/design/`) |
| Repo | publiczne: bez sekretów, danych osobowych i nowych nazw innych firm/aplikacji (P-121 (5)) |

## E0.2 Stan wyjściowy (HEAD 02cd508, `npm ci`, `env -u NODE_PATH`)
| Komenda | Wynik |
|---|---|
| `npm run verify` | kod 0, 78 zestawów, **1553/1553** |
| `npm run test:akceptacja` | kod 0, 110 testów: znacznik 89 (ekrany), **asercja 20** (fix-4: `zegarek-potwierdzenia` 6, `sklep-status` 5, `haptyka-wzorce` 6, `stan-blokada` 3), zielony-ok 1 |

## E0.3 Plan (każdy push: `npx jest`, `typecheck`, `lint`, `jakosc:kontrole` zielone; krok natywny czeka na zielone „Jakość · iOS”)
Procedura DS-02 jak w partiach 1–3. Swift: test najpierw czerwony w CI na asercji (patrz Q2), potem kod.

**(1) Łatka NZ-RD15 — jeden push (P-136)**
| Krok | Zachowanie → test | Pliki |
|---|---|---|
| 1.1 | `git am --3way` łatki (konflikt `brd.json` → generator 01); `kontrola-brd --zgodnosc` kod 0; czerwień 4 testów `postep.test.ts` (dowód) | `docs/brd/*`, `tests/wektory/brd.json` |
| 1.2 | test 07 dopasowany do nowej reguły (P-134 Q1a): wejście `Z_teraz`, wyjście `stan`/`zostało`, liczność z wektorów obu kształtów; odsyłacz P-134 w komentarzu; własność fast-check bez pominięcia „d < 1 i R = 0” | `tests/domena/dni/postep.test.ts` |
| 1.3 | `celDzienny` dostaje `zrobioneTeraz` (Z_teraz); gałęzie w kolejności RD-15 (1)–(3); wołający: `celProjektu` liczy Z_teraz (ostatnia `wartosc_po` bez filtra dnia), `stanDnia` przekazuje dalej | `src/domena/postep.ts`, `postep-dnia.ts`, `src/dane/repozytoria/kalendarz.ts` |

**(2) Zegarek (e) i kontrakt partii 4 — przed ekranami (P-135, P-138)**
| Krok | Zachowanie → test | Pliki |
|---|---|---|
| 2.1 | (e) telefon: `WynikPartii.potwierdzone` (zegarek: w `zdarzenie` po COMMIT albo R-021; poczekalnia nie); `Zegarek.potwierdz` (lista `ZEGAREK_POTWIERDZENIA_MAKS`, ponowne id na koniec); `zegarekWyslij(stanJson, potwierdzone)`; wołający przed `odswiezEkranBlokady` → `zegarek-potwierdzenia.test.ts` (6 czerwonych) → `tests/dane/`; mechanicznie `potwierdzone` w `tests/dane/dziennik*.test.ts`; porty z „Kontrakt partii 4” do „Porty domeny” i `porty.ts` | `src/domena/porty.ts`, `src/przypadki-uzycia/dziennik.ts`, `ekran-blokady.ts`, `start.ts`, `src/platforma/zegarek.ts`, `modules/oczko-dziennik-plus/index.ts`, `ios/Zegarek.swift`, `moduly.md` |
| 2.2 | N1: stan v3 `zablokowany` (`WERSJA_STANU` = 3, złote pliki v3 + `*-v2.json`, `wersja_kontraktu: 3`), `licznikEkranuBlokady` czyta kolumnę, przełączenie blokady woła `odswiezEkranBlokady` → `stan-blokada.test.ts` (3) → `tests/dane/` | `src/konfiguracja.ts`, `src/domena/zegarek.ts`, repozytoria, generator złotych plików |
| 2.3 | (a) `Sklep.kup` → `StatusZakupu` (bez `kupZeStatusem`; sztuczny `'sukces'`) → `sklep-status.test.ts` (5) → `tests/adaptery/`; `tests/adaptery/sklep.test.ts` na status (zmiana mechaniczna z powodem) | `src/platforma/sklep.ts`, `sklep-sztuczny.ts`, porty |
| 2.4 | (b) `Haptyka.zagraj(WzorzecHaptyki)` z tokenów → `haptyka-wzorce.test.ts` (6) → `tests/adaptery/`; wołający `rzad()`/`przypomnienie()` → `zagraj` | `src/platforma/haptyka.ts`, porty, wołający |
| 2.5 | Swift, pakiet `OczkoReguly`/`OczkoDziennik`: dekoder v3 (v2 → `zablokowany = false`, > 3 odrzuca; X-ST-07), `stuknij` → `.zablokowany` przed limitem (X-DZ-15, X-ZG-11), `ostatniPlusMs` tylko po +1 (wektor w `IntencjaTests`, P-138), `StanAktywnosci` z `uwaga` (brak klucza = null; X-DZ-07, X-DZ-14, migawka X-DZ-10) | `modules/oczko-reguly/Sources/**`, testy, kopie (`kopiuj-zrodla.mjs`) |
| 2.6 | Swift, skrzynka zegarka (e2–e5): `MagazynSkrzynki` (plik `.jsonl` rdzeniem `DziennikPlus`, przepisanie atomowe, sprzątanie pliku tymczasowego), `przyjmij(stan, potwierdzone)` z usuwaniem w obrębie licznika, `doWyslania(teraz, wToku)` z `zegarekPonowienieMs`, `stuknijNaZegarku` rzuca błąd zapisu; X-ZG-01–11 na wektorach ZG-01–ZG-10; `testGlowaInnegoLicznikaNieUsuwa` bez `XCTExpectFailure` | `OczkoDziennik/Zegarek.swift`, `ZegarekTests.swift`, `kopie.json` (+ `Dziennik.swift` dla watch) |
| 2.7 | Cel watch: kolejność zapis → stan → haptyka → wysyłka; ponowienie przy aktywacji, starcie, pierwszym planie, kontekście, `didFinish` z błędem, po stuknięciu; widok: stan blokady i „nie zapisano” (teksty po E2 04 fix-3, Q3); Live Activity: widok `uwaga` i stan blokady (tylko +1, P-133) | `targets/watch/Aplikacja.swift`, `Teksty.swift`, `targets/widget/Aktywnosc.swift`, `_shared/Stuknij.swift` |
| 2.8 | N3 (P-139): zmiana języka aplikacji woła `odswiezEkranBlokady` (wpięcie w Ustawienia w (3)); pora ukończenia: `zmienDateUkonczenia(z, { projektId, ukonczonoDzien })`, ta sama pora lokalna (luka DST → przesunięcie, pora podwójna → wcześniejsza, nie później niż teraz) → `ukonczenie-pora.test.ts` → `tests/dane/`; `projekt-fix3.test.ts` na nową sygnaturę | `src/przypadki-uzycia/projekt.ts`, domena (rachunek z Intl) |
| 2.9 | RD-21 (P-134 Q3a, P-139): `polozenieZnacznika` → `Wynik` z `przedSchematem`, `rzadNotatki`; wołający `src/dane/repozytoria/wzory.ts:41` → testy 07 na RD-21-W1–W9 | `src/domena/znacznik-wzoru.ts`, `wzory.ts` |
| 2.10 | P-139: pole `jezyk` w `StanAktywnosci` i klucz `jezyk` w kontekście zegarka; `Teksty.t(klucz, jezyk)` z odwzorowaniem jak w aplikacji (brak → angielski, P-115); bez podbicia wersji stanu | `src/platforma/live-activity.ts`, `zegarek.ts`, `targets/*/Teksty.swift`, `Atrybuty.swift` |
| 2.11 | Punkt kontrolny: `env -u NODE_PATH npm run verify`, zielone „Jakość · iOS” (swift test + build celów) → **STOP** | plik stanu, dowody w `oczko-warsztat/08-programista/2026-10-26-partia4/` |

**(3) Ekrany, warstwa 4 — po punkcie kontrolnym (Q1)**
15 plików testów (`tests/akceptacja/ekrany/`, 90 wywołań w tabeli 08), kompozycja expo-router (`app/`, P-114 Q1a), `src/platforma/tryb-e2e.ts`, scenariusze `e2e/` (testID), `odswiezEkranBlokady` po zapisach, `przelicz`/`rozmiarUS` → `Wynik` (P-118 Q1a), etykieta robocza (P-126 1b), teksty tylko przez `t()` z kluczami design-spec, pakiety image-picker / sharing / store-review (wiek ≥ 14 dni, wiersze ADR-0016), Intl ze strefą na Hermes w pierwszym scenariuszu E2E z datą (P-129 Q6b); przed STOP E2 jeden pełny przebieg E2E bez anulowania.

## E0.4 Luki i pytania (STOP E0)
- **Q1 Organizacja (zakres ekranów).** Szacunek: (1) ok. 1 h; (2) ok. 10–14 h agenta + 6–10 przebiegów „Jakość · iOS” (15–40 min każdy); (3) ok. 25–35 h agenta + przebiegi E2E. (a) Jedna sesja: (1) → (2) → STOP punkt kontrolny → (3) w trzech krokach (3A kompozycja, licznik, lista, aplikacja i E2E; 3B projekt, dni, ukończenie, historia, formularze; 3C oferty, Pro, ustawienia, dane, awaryjny, narzędzia, zgłoszenie) z wypchniętym plikiem stanu po każdym; decyzja o podziale na STOP punktu kontrolnego, po pomiarze (2). (b) Partia 4 = (1) + (2), STOP E2; ekrany jako partia 5 w nowej sesji. **Rekomendacja: (a)** — zasada „jedna sesja na rolę”, kontekst (2) potrzebny przy wpięciu wyzwalaczy w ekrany; podział tylko, jeśli kontekst zacznie się gubić (wtedy STOP z propozycją, jak w poleceniu).
- **Q2 Czerwień Swift przed kodem przy zielonej gałęzi.** Nowe API (magazyn, `potwierdzone`, `doWyslania`, `.zablokowany`) nie kompiluje się przed kodem (zły powód). (a) Commit 1: sygnatury Swift z najprostszym wynikiem (jak zaślepka TS) + testy X-ZG/X-ST-07/X-DZ-15 pod `XCTExpectFailure(strict: true)` → CI zielone i dowodzi czerwieni na asercji (wzór 05 fix-4 dla e3); commit 2: kod i zdjęcie `XCTExpectFailure` (strict: test przechodzący pod nim pada, więc nie zostanie po cichu). (b) Push z czerwonym `swift test`, potem kod — gałąź czerwona między pushami (blokuje 04 fix-3 i koordynatora). **Rekomendacja: (a).**
- **Q3 Teksty zegarka i Live Activity przed E2 04 fix-3** („nie zapisano”, stan blokady). (a) Logika, stany i testy teraz; w widoku zegarka i Live Activity przy blokadzie brak przycisków (jak makieta limitu), przy błędzie zapisu haptyka `bladZapisu` i istniejący klucz `aktywnosc` najbliższy znaczeniowo, nazwany w raporcie; teksty 04 podmieniam po sygnale koordynatora (jeden commit). (b) Wstrzymać 2.7 do E2 04 fix-3. **Rekomendacja: (a)** — kolejka bez utraty danych nie czeka na tekst; brak przycisków przy blokadzie spełnia N1 bez nowego tekstu.
- ~~Q4 N3 i pora ukończenia~~ — rozstrzygnięte aneksem 05 (P-139, 454f474, f19c88f) przed wysłaniem STOP; kontrakt w `moduly.md`.
- Sygnatura RD-15 z kontraktu 05 (P-139): `celDzienny({ suma, przedDzis, zrobioneTeraz, termin, dzis })`.

## Czas (zasada 9)
Agent: E0 ok. 1 h; (1)+(2) ok. 11–15 h; (3) ok. 25–35 h. Czekanie: CI iOS (każdy krok natywny), E2 04 fix-3 (teksty), odpowiedzi koordynatora. Właściciel: nic (lista TT bez zmian).

## Dziennik sesji
- 2026-10-26: E0 — prompt złożony (47510 znaków), stan wyjściowy verify 1553/1553, akceptacja 110 (20 asercji), plan (1)–(3), Q1–Q3 (Q4 rozstrzygnięte przez P-139); STOP do koordynatora. Odpowiedź: P-140 (Q1a, Q2a, Q3a).
- 2026-10-26: E1 (1) łatka NZ-RD15 + test 07 + kod RD-15, jeden push; (2) 2.1–2.10 (Swift sprawdzany lokalnie kompilatorem 6.2 dla Linuksa — odstępstwo nazwane w dowodach); punkt kontrolny STOP.
- 2026-10-26: 3A (do 301c9ca): modele odczytu licznika i listy (`widok-licznika.ts`, `widok-projektow.ts`), `ustawBlokade`, `przyTle` (R-091), `chwilaLokalna` + `tryb-e2e.ts`, testID z `e2e/README.md`, kompozycja (`src/kompozycja/`, `app/_layout.tsx`, `app/index.tsx`, `app/projekty.tsx`), pierwsze +1 świeżej instalacji, ekran blokady i zegarek po każdym zapisie (potwierdzenia zegarka przed stanem), Live Activity raz na proces. Jest 1676/1676.
- 2026-10-26: P-162 — 5 kluczy `aktywnosc.przypomnienie*` jako łatka dla 04 (sam commit 08 daje czerwony P-143; 04 wypchnęło łatkę razem ze swoimi dokumentami, 9d7e4b9). P-163 — łatka 01 RD-13 + `przypomnienieChwili`/`sygnalZmiany` + strażnik 25 jednym pushem (2dcd77d); pas i sygnał licznika tylko z tych funkcji.
- 2026-10-26: 3B: `czyProsicOOcene` + przypadek użycia prośby o ocenę (NZ-05-F5-08, P-160; klucz w `KLUCZE_URZADZENIA`), przypadki użycia menu ••• (nazwa części, cel, przypomnienie, powtórzenie), historia, karta ukończenia; ekrany Historia, MenuProjektu, Formularze, Ukonczenie, Projekt, Dni (testy 07 → `tests/ekrany/`; `ukonczenie.test.tsx:40–43` wg P-160); arkusze expo-router. Jest 1750/1750.

- 2026-10-26: 3C: ekrany ofert, okna „Uczciwe zasady”, Ustawień, trybu awaryjnego, importu/konfliktu, stanu danych, zgłoszenia, narzędzi i linku filmu (wszystkie 15 plików akceptacji ekranów w `tests/ekrany/`); dostęp Pro (sklep + pamięć KP-06, poziom dla okna), sztuczny sklep z przywróceniem i zapisem buildu E2E; eksport/import/„Usuń wszystkie dane” z panelami E2E; strażnik startu ADR-0019 (`src/niezawodnosc/start.ts`) z ekranem awaryjnym i kamieniem milowym; „Zgłoś problem”; pakiety sharing/store-review/image-picker (P-036). verify 1795/1795.
- 2026-10-26: CI: `typecheck:testy` czerwony od 2dcd77d (mój test RD-13), poprawka 2eea579; bramka przed pushem = pełny `verify`. „Jakość · iOS” od 07:27 w kolejce bez runnera (każdy push anuluje) — prośba do koordynatora o przerwę w pushach.

- 2026-10-26: E2E: 40290477970 (bezpieczny obszar e8325da, testID na tekście 6b55246, scenariusz 03 P-176 → 222fbd2), 40298771854 (katalog bazy jako `file://`, ae20b71; test jednego źródła ścieżki 138b352), 40306542928 (01: przeciążona maszyna, dotyk dotarł po 30 s; 09: proces wymuszonej awarii zabity przed zapisem stanu startu → znacznik `e2e-awaria-startu`, P-177, 49b9f40), **40313538454: 9/9 zielone**. STOP E2.
- Następny krok (po akceptacji): wg koordynatora — w kolejce do następnej partii: stała `PLIK_BAZY`, krok CI sprawdzający członkostwo `_shared/Stuknij.swift` w celu aplikacji, pas przypomnienia po stronie Swift.

### Odstępstwa i luki nazwane w (3) (do raportu STOP E2)
- Krój Libre Franklin: pliku `docs/design/fonty/LibreFranklin.ttf` (design-spec.md:13) nie ma w repo → krój systemowy (`KROJ_TYTULOWY = undefined`); zgłoszenie do 04.
- Teksty robocze 08 (Z07-05) w `en.kontekst.json` z dopiskiem „do zatwierdzenia przez 04”: zerowanie, opisy historii, powtórzenie, korekta sesji, błędy formularzy, Projekt i Dni; opis wiersza listy projektów używa `licznik.teraz` (brak klucza „row 47 of 96 · today”).
- Identyfikator urządzenia (`zdarzenie.urzadzenie`): UUID w `Application Support/urzadzenie.txt` (poza bazą); dane.md nie ustala źródła — do potwierdzenia przez 05.
- Preferencje `jezyk`, `uklad_miar` (i18n `MagazynPreferencji`) i opcja F-10: w pamięci procesu do ekranu Ustawień (3C); klucze tabeli `ustawienie` czekają na wiersze w dane.md (05).
- Dostęp Pro w kompozycji `pro: () => false` do ekranu ofert i pamięci KP-06 (3C).
- Pas przypomnienia na Live Activity i zegarku (04 fix-4, P-162): klucze są, widoki Swift z `przypomnienieChwili` po stronie natywnej — krok natywny po zielonym CI.
- expo-sharing 57.0.23 zamiast 57.0.24 z ADR-0016 (24 miała 5 dni, P-036); wiersz ADR zaktualizowany.
- Strażnik startu bez wzorca roli 12 (ADR-0019 przewidywał `src/niezawodnosc/start.ts` z wektorami 12): logika i testy 08 z przypadków ADR; „Spróbuj normalnie” ustawia licznik na próg − 1 (jedna kolejna awaria wraca do ekranu awaryjnego) — do przeglądu 12/05.
- Zarządzanie subskrypcją: adres Apple `apps.apple.com/account/subscriptions` zamiast arkusza `showManageSubscriptions` (KP-14).
- Adres polityki prywatności wg analogii z Treningiem (`apps4brew.com/oczko/privacy.html`) i identyfikator App Store w linku recenzji — [DO USTALENIA] 10/11.
- Family Sharing: zdanie w ofertach wyłączone do konfiguracji App Store Connect (P-038).
- Zgłoś problem: bez modułu Swift MetricKit (ADR-0018) — liczności i kody błędów z bazy; stan danych i konflikt iCloud nie podpięte (synchronizacja poza partią).
- Scenariusze 03 (P-176) i 09 (P-177) zmienione przez 08 — nazwane wyjątki od kontraktu 07; znacznik `e2e-awaria-startu` (pusty ekran buildu E2E po zapisie „start w toku”); okno przed JS (start zabity przed zapisem stanu nie liczy się jako nieudany) do roli 12 (P-177).
- Udostępnianie karty ukończenia i zużycie włóczki na karcie: nie podpięte (zapas i obraz karty poza partią 4).
