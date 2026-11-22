# E4 Przekazanie (rola 07-jakosc, build) · 2026-10-25 · STOP E4
Wejście: E0–E3 przyjęte (P-090, P-091, P-092, P-096). Strategia: [`strategia.md`](strategia.md) (jedyne źródło definicji ukończenia funkcji).

## Definicja ukończenia (build), punkt po punkcie
| Punkt kontraktu roli 07 | Stan | Dowód |
|---|---|---|
| Każde ryzyko: skutek, prawdopodobieństwo, wyrocznia z typem i źródłem (albo `[DO USTALENIA]` przekazane), poziom testu, miejsce | spełnione | [`e1-ryzyka.md`](e1-ryzyka.md): 185 wierszy, skrypt kompletności kolumn 3–8: 0 niekompletnych (2026-10-25); `[DO USTALENIA]` → zgłoszenia [`zgloszenia.md`](zgloszenia.md) |
| Każde kryterium z kontraktu zakresu ma test z ID albo zapisany powód; każdy test ładuje się i pada na asercji albo znaczniku (fragment wyniku) | spełnione | 201/220 kryteriów z testem, 19 z powodem i kontrolą zastępczą ([`strategia.md`](strategia.md) §9); `npm run test:akceptacja`: 980 testów, 974 na `NIEZAIMPLEMENTOWANE:`, 6 `[ZIELONY-OK]`, 0 z złego powodu ([`e3/akceptacja-wynik.md`](e3/akceptacja-wynik.md), fragment przy każdym teście); raport czerwieni ma własny test 11/11 |
| Macierz możliwości z dowodem; nic z „niedostępne” nie opisane jako sprawdzone | spełnione | [`e0-rozpoznanie.md`](e0-rozpoznanie.md) §1; wszystko z macOS opisane wynikiem przebiegu CI z ID (run 40223597670: build zielony, E2E czerwone), nie z kontenera |
| Każde narzędzie i próg to decyzja z ≥ 2 opcjami; brak liczb bez decyzji lub pomiaru | spełnione | DS-01–DS-13 (P-092); Stryker `break: null` do pomiaru bazowego (DS-05); pokrycie bez progu (DS-06); limity czasu z pomiaru: Linux 20 min (zmierzone ~2 min), build iOS 90 min (zmierzone 14,5 min), E2E `30 + 4 × scenariusze` z planu części; wagi E2E oznaczone jako szacunek do odświeżenia |
| Plan CI: widoczność repo, runnery, minuty z adresem cennika i datą, limity zależne od danych; nowa kontrola najpierw informacyjna | spełnione | [`strategia.md`](strategia.md) §5 (repo publiczne, 0 USD, docs.github.com odczyt 2026-10-25; ryzyko nazwane przy repo prywatnym); `Jakość · Linux` pierwszy zielony 40223883481 → bramka; `Jakość · iOS` informacyjny (`continue-on-error` w E2E) |
| Każda pozycja listy kontroli automatycznych roli 05 ma miejsce w planie albo powód | spełnione | [`strategia.md`](strategia.md) §10: 13/13 pozycji 05, lista roli 12, lista roli 09 |
| Dane testowe z wycinków prawdziwych plików mają opis pochodzenia i są bez danych osobowych | spełnione częściowo (nazwane) | PDF wzoru: `tests/dane/wzory/corbould-1879-s16-17.pdf` (+ `.opis.md`, domena publiczna, metadane usunięte; test `tests/jakosc/dane-testowe.test.ts` 3/3, kontrola sprawdzona na oryginale z metadanymi). **Brak:** plik Word (BR-WZR-007/S2) — w kontenerze nie ma narzędzia do zapisu `.docx` z tekstu z domeny publicznej; dodaje 07 albo 08 przy implementacji BR-WZR-007 (ADR-0011), z opisem pochodzenia. Archiwa `.oczko` i bazy `vN.db`: od wydania 1.0 (§4) |
| Lista stref zdefiniowana raz, przejścia wyliczane | spełnione | `tests/narzedzia/strefy.ts` (DS-09, 8 stref), `tests/narzedzia/czas.ts` (`przejsciaCzasu`), test 8/8; RD-16: 204 przypadki wokół przejść i północy, bez dat wpisanych ręcznie |

Wymiary pokrycia: rejestr ryzyk (E1, 4 soczewki); wyrocznie (§3 „Zasady pisania testów”); dane testowe (§4, wyżej); platforma (E2E 32 scenariusze, lista §8 TT-01–TT-11); dostępność (RNTL po roli i etykiecie, `performAccessibilityAudit` §10 pkt 11, AX5 osobnym krokiem E2E); bramki CI (§5); niestabilne testy (§7); siła testów (mutanty E1 7/18 przeżywa wektory → zgłoszenia Z07-07, Z07-08, Z07-13; testy E3 zabijają 9/10 w próbie na wzorcach; każda kontrola z pułapką); dowody wydania (§11).

## Dla roli 08
**Procedura:** Testy istnieją; nie piszesz ich od nowa. Dla każdego: zamień znacznik `NIEZAIMPLEMENTOWANE` w zaślepce na najprostszy wynik zgodny z typem, uruchom test i zapisz czerwień na asercji, potem implementuj. Test z katalogu oczekujących (`tests/akceptacja/`) przenieś do głównego zestawu (`tests/domena`, `tests/dane`, `tests/ekrany`) w commicie, który go zazielenia (DS-02). Błędny test zgłaszasz roli 07.

- **Tabela test → kryterium → plik do wdrożenia → kolejność:** [`e4/tabela-08.md`](e4/tabela-08.md) (45 plików testów; generator `node docs/jakosc/narzedzia/tabela-08.mjs --wynik docs/jakosc/e4/tabela-08.md`). Kolejność: 1 domena → 2 dane → 3 adaptery platformy i Swift (`tests/wspolne/xctest-specyfikacja.md`, złote pliki `tests/wspolne/`) → 4 ekrany; w obrębie warstw kolejność funkcji z kontraktu zakresu („Kolejność budowy MVP”).
- **Przepływy:** scenariusze `e2e/scenariusze/` i kontrakt testID, przełączniki buildu E2E i argumenty startu w `e2e/README.md` (ekran bez tych `id` = czerwone E2E).
- **Definicja ukończenia funkcji według rodzaju zmiany:** [`strategia.md`](strategia.md) §6; bramka `npm run verify` (lokalnie `env -u NODE_PATH`, jak CI).
- **Zasady:** teksty tylko przez `t()` (testy ekranów zazielenią się po dodaniu kluczy z `design-spec.md`); przełączniki testowe tylko w `src/platforma/tryb-e2e.ts` i adapterze sklepu (kontrole `TRYB-E2E`, `SZTUCZNY-SKLEP`); kod 0.1.0 poza zakresem kontroli do jego usunięcia (DS-13, krok porównania P-078).

## Testy zależne od poprawek (sesja fix 01, 02, 05 przed rolą 08: P-090 Q3a, P-091 11a, P-096)
37 z 45 plików testów wymienia zgłoszenie albo importuje sygnaturę z propozycji 07 (kolumna „Zależy od poprawek” w [`e4/tabela-08.md`](e4/tabela-08.md)). Zestawienie według zgłoszeń (liczba plików testów):
| Rola | Zgłoszenia | Wystąpienia w plikach testów | Co może się zmienić w teście |
|---|---|---|---|
| 05 | Z07-22 (sygnatury przypadków użycia, danych, ekranów, nowych funkcji domeny) | 18 | nazwy i typy importów; testy zostają przy tej samej wyroczni |
| 05 | Z07-11, Z07-13, Z07-15, Z07-21 (intencja ekranu blokady, `scal`, migracje, start) | 7 | R-018 (docelowy łańcuch rodziców), M-09 i złe dane w `scal`, runner migracji aplikacji |
| 04 | Z07-05, Z07-04 (stany bez makiety, BR-LIC-012) | 12 | etykiety VoiceOver zamiast zapytań po roli |
| 02 | Z07-07, Z07-08, Z07-09 (granice limitu i dostępu, „ukończony dzień”, L-19) | 5 | dodatkowe wektory; strona granicy `wygasa = teraz` |
| 01 | ER-24, ER-27, ER-34, ER-36–ER-40, ER-42 | 11 | RD-10 według P-084 (testy już według wektorów 06), RD-16 zima/DST, BR-DAN-006/S4 według P-091 6a, RD-15 po terminie, RD-17-W6, RD-12-W4 |

## Zgłoszenia (kontrakt roli, E4 pkt 3)
- **Do 06 (brakujące wektory):** sprawdzone, brak — wektory treści pokrywają RD-03, RD-04, RD-10, RD-11 w zakresie wersji 1; `rozdzielczosc_wpisu` w `docs/tresci/wektory.json` („0,1 o. [DO USTALENIA z 04/05]”) należy do 04/05.
- **Do 04 i 03 (kryteria niesprawdzalne):** ER-36 (przez 01), Z07-03, Z07-04, Z07-05, Z07-10, Z07-06 (progi OP-16, OP-17).
- **Do 05 (ścieżki utraty danych bez zabezpieczenia):** R-018 (fałszywy konflikt po kilku stuknięciach z ekranu blokady, Z07-11), R-036 (`scal` przepełnia stos od 10 000 zdarzeń, Z07-13), Z07-14 (jedna zła pozycja blokuje partię synchronizacji), Z07-12 (stan Live Activity i zegarka bez danych limitu), schemat CloudKit w Production (R-051, P-091 1); wszystkie z testem czerwonym albo zgłoszeniem.
- **Do 10:** Z07-20; stary `testflight.yml` (wyjątek nazwany, ADR-0014, P-096); adres polityki prywatności dla testu ekranu „Ustawienia” (dziś `example.invalid`) przy stronie z P-093; lista §8 przy TestFlight.
- **Do 09:** Z07-23 (poprawka `sprawdz-i18n.mjs` do przeglądu); test z ID NFR-JEZ-001 przy E2–E4.
- **Do 12:** Z07-21; kontrola `KOPIA-SAMEGO-DB` ma wyjątek nazwany dla `src/dane/kopia-ratunkowa.ts` (ADR-0020).

## Nie sprawdzono (ryzyko szczątkowe, do audytu 07)
Zegarek na prawdziwym urządzeniu (właściciel bez Apple Watch; testerki według planu koordynatora), +1 z ekranu blokady przy zablokowanym telefonie (ZAL-030; TT-09), restart bez odblokowania, bateria, raport awarii z TestFlight (P-079), zakupy w piaskownicy do czasu listy §8, scenariusze E2E na symulatorze do czasu ekranów roli 08.
