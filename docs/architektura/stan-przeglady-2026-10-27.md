# Rola 05, tryb fix (przeglądy), 2026-10-27 · stan i plan
Zadania: plan-prac 1.3 (P-272) — przegląd U1 i U3 partii 7 (P-245) z U4, U7, U8; port `ProjektMigawki` (P-243 S1a); `ZlecenieImportu` rodzaj `film` (P-246, P-248 D1a); reguła wersji pól iCloud przy migracji schematu (P-264); adnotacje „do przeglądu 05” (P-259, P-247 U6a). Prompt: `oczko-warsztat` 71c83e0 `koordynacja/role-2026-10-27/05-architekt-fix.md` (673 linie, przeczytany w całości). Sesja session_01T66VBxEUVZa1a385Aya8Wy, kopia `claude/kopia-05`. Decyzje na STOP: koordynator (P-087). Kod (`src/`, `tests/`, `modules/`) czytany tylko jako materiał z `claude/kopia-partia-7` (458deea) i `claude/kopia-partia-6` (7e58f01); zmiany kodu idą jako polecenia dla 08.

**Stan: zakończona — STOP E2 przyjęty (koordynator wg P-087, 2026-10-27 09:30 UTC, z oceną P-273); dopisany kontrakt flagi `film` (P-276). E1 zakończony (dokumenty) — decyzje P-274: Q1a, Q2a, Q3a, Q4a, Q5 A+C (koordynator wg P-087, 2026-10-27 09:11 UTC). P-273 oceniony (niżej). Polecenia kodu dla 08 p7 — sekcja „Polecenia dla 08”; wysyła je koordynator. „Video link” → 04 (koordynator).**

## E0. Środowisko
| Sprawdzenie | Wynik |
|---|---|
| System, Node, git | Linux 6.18 (chmura), Node v22.22.0; tożsamość „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”; start na 388d6d4 (P-272) |
| GitHub | push na `claude/kopia-05`; na roboczą tylko `docs/` po verify; `oczko-warsztat` 71c83e0 (odczyt); `trening` (odczyt, P-087/P-271) |
| Swift, Xcode | brak — zachowanie CKSyncEngine sprawdzalne tylko w oknie maszyn albo na urządzeniu |
| Sieć | jest: sqlite.org, dokumentacja Apple (JSON), odczyty 2026-10-27 niżej |
| `npm ci` | kod 0 |
| Trening (P-087) | brak iCloud, rozszerzenia i blokady orientacji per ekran (`trening/docs/48-zgloszenie-1-0.md:199` „aplikacja nie używa interfejsów iCloud”; `trening/app.json:7` `"orientation": "portrait"`). Analogia tylko dla reguły wersji: protokół zegarka z `WATCH_PROTOCOL` i `WATCH_PROTOCOL_MIN` (`trening/lib/watch/protocol.ts:14-17`) oraz zachowywanie nieznanych pól ustawień przy migracji (`trening/lib/state/migrate.ts:24-25`, audyt J1) |

## Źródła (odczyt 2026-10-27)
- sqlite.org/lang_createtrigger.html: „If the "UPDATE OF column-name" syntax is used, then the trigger will only fire if column-name appears on the left-hand side of one of the terms in the SET clause of the UPDATE statement.” oraz „Due to an historical oversight, columns named in the "UPDATE OF" clause do not actually have to exist in the table being updated.”
- Odtworzenie (node:sqlite, SQLite 3.50.4, skrypt w scratchpadzie `u3.mjs`): `UPDATE … SET wartosc` nie odpala wyzwalacza `UPDATE OF nazwa, zmieniono_ms`; `UPDATE … SET nazwa` i UPSERT `DO UPDATE SET nazwa` odpalają; `UPDATE OF nazwaa` (literówka) tworzy się bez błędu i nigdy nie odpala.
- developer.apple.com, `CKModifyRecordsOperation.savePolicy`: „The default value is ifServerRecordUnchanged”; „Use changedKeys to save only the fields of the record that contain changes.”
- developer.apple.com, `RecordSavePolicy.allKeys`: „It’s possible for a server record to contain keys that aren’t present locally. Another client might add keys to the record after you fetch it.”
- developer.apple.com, `CKRecord.allKeys()`: „The array contains only those keys with values that aren’t nil.”
- Strony `CKSyncEngine` i `RecordZoneChangeBatch` nie opisują polityki zapisu silnika — założenie P-264 (serwer zachowuje pola, których nadawca nie ustawił) zostaje [DO POTWIERDZENIA] w oknie maszyn albo na urządzeniu.
- `node_modules/react-native-screens/ios/RNSScreenWindowTraits.mm:100-125` (4.26.2): obrót żądany, gdy orientacja interfejsu jest poza maską, albo gdy urządzenie i interfejs są w masce, ale w różnych orientacjach.

## E0. Przegląd i klasyfikacja
| ID | Ocena | Rodzaj | Co dalej |
|---|---|---|---|
| P-245 U1 (kod błędu `wyslij`) | Działa: Swift `BladWysylki` → `code` (`modules/oczko-icloud/ios/OczkoIcloudModule.swift:6-7`), adapter → `{ kod }` (`src/platforma/icloud.ts:69-71`), sterownik → `przyczyna` (`src/przypadki-uzycia/synchronizacja.ts:37-40`). Kontrakt tylko w komentarzach. Ryzyko: `brakMiejsca` ustawia zdarzenie `sentRecordZoneChanges`; czy przychodzi przed powrotem `sendChanges()`, dokumentacja nie mówi [DO POTWIERDZENIA, ZM-06] | D, P2 | przyjąć; kontrakt błędu w `moduly.md` (05); typ `BladSynchronizacji` w `porty.ts` (08, opcjonalnie) |
| P-245 U3 (wyzwalacz licznika) | Realny koszt, nie błąd danych: każde +1 = zapis `licznik.wartosc/glowa` (`src/dane/repozytoria/liczniki.ts:45-46`) → `licznik_icloud_u` (`docs/architektura/schemat.sql:277`) → drugi rekord w wysyłce | D, P2 | Q1 |
| U4 (kolumna nieznana) | Odbiór pomija kolumny spoza tabeli (`src/dane/repozytoria/icloud.ts:93`) — dobrze. **Nowe:** rekord z kolumną z `pomin` jest odrzucany w całości (`src/domena/icloud/odwzorowanie.ts:46`), więc gdy nowsza wersja zacznie synchronizować kolumnę, którą 1.0 liczy lokalnie, urządzenie 1.0 przestanie przyjmować zmiany tego licznika | D, P2, brzegowy | Q3 (część reguły P-264) |
| U7 (start silnika w kompozycji) | Przyjęte, ale **nowe:** `przygotuj()` czeka na `o.icloud.start()` (`src/kompozycja/licznik.ts:146-148`), a ten na `statusKonta()`, `uruchom()` i `wyslij()` = `sendChanges()` przez sieć (`src/przypadki-uzycia/synchronizacja.ts:114-124`). Przy włączonym iCloud i słabej sieci pierwszy ekran czeka na wysyłkę; skrzynka partii 6 tego nie robi (`void`, linia 147) | D, P1, realny przy włączonej synchronizacji | Q2 |
| U8 (`Licznik.tsx`) | Bez nowych ustaleń; podział pliku przed kolejną zmianą = plan-prac 1.6 (P-268) | — | — |
| P-243 S1a (`ProjektMigawki`) | Przyjęte: zapis atomowy z odczytem kontrolnym (`src/platforma/migawka.ts`), wiersz w `prywatnosc.md` jest, indeks `wzor_projekt` dla liczby wzorów. `ostatniaPracaMs: number \| null` przy `ostatnia_praca_ms NOT NULL` — zostaje (czytnik tolerancyjny). Brak reguły rozwoju koperty: Swift dekoduje `wzory: Int` jako wymagane (`targets/share/Wspolne/Skrzynka.swift:11-16`) | D, P2 | reguła w `moduly.md` (05): nowe pola koperty opcjonalne w dekoderze albo nowa `MIGAWKA_WERSJA` |
| P-246 S4a, P-248 D1a (`film`, `sciezki`) | Przyjęte: `film` nie jest wzorem (`src/przypadki-uzycia/skrzynka.ts:20,44`), adres walidowany (`src/przypadki-uzycia/film.ts:10-11`). **Nowe:** (a) manifest `zlecenie.json` bez wersji, a niepoprawny manifest = zlecenie niepełne, kasowane po `SKRZYNKA_PORZUCONE_H` (`src/platforma/skrzynka.ts:38-41`) — zlecenie zostawione przed aktualizacją aplikacji i odczytane ostrzejszym walidatorem zniknęłoby bez śladu; (b) „Video link” do projektu z filmem zastępuje stary link bez pytania (`src/przypadki-uzycia/film.ts:23`) | (a) D, P2, brzegowy; (b) P (04) | (a) Q4; (b) do 04 |
| P-247 U6a (`urzadzenie_rodzaj`) | Przyjęte (schemat, `stany.json`, kolizja M-14 go nie porównuje — dobrze). Luka inwentarza: `prywatnosc.md` nie wymienia identyfikatora urządzenia (UUID) ani rodzaju urządzenia w zdarzeniu, a oba jadą do iCloud użytkownika | D, P2 | `prywatnosc.md`, `dane.md` (05) |
| P-259 (orientacja) | Przyjęte. Z wzoru na iPhonie nie otwiera się żaden modal (`app/wzor.tsx` tylko `router.back()`), więc `portrait_up` innych ekranów nie obróci wzoru w trakcie. ADR-0026: opcja A i „Złe: nowa zależność” opisują usunięty pakiet; `moduly.md` „iPad i orientacja” opisuje adapter, którego nie ma | D, P2 (dokumenty) | uporządkowanie ADR-0026 i `moduly.md` (05) |
| P-264 (reguła wersji pól) | Opcje w Q5 | P→koordynator | Q5, nowy ADR-0027 |

## P-273 (dopisek koordynatora 09:07): przegląd zmiany ADR-0019 przez 08 p6 (kopia 3b954b1, adnotacja 1bf3646)
- Zmiana: `wyjscieDoTla` (`src/niezawodnosc/start.ts`, 3b954b1) zeruje licznik, gdy start normalny jest w toku; nasłuch AppState „background” tylko w starcie normalnym (`app/_layout.tsx`); plik etapu `poczatek`/`kontener`/`kamien` do „Zgłoś problem”.
- Trening (P-087): to samo rozwiązanie — `trening/docs/40-lekcje.md:143` akcje (2) „wyjście do tła w trakcie ładowania zeruje licznik” i (3) kod etapu startu. Akcji (1) (świeża instalacja nigdy w trybie awaryjnym) 08 nie przeniosło z uzasadnieniem: próg liczy poprzednie starty, więc jeden przerwany start nie wystarcza (test `l029-start-po-instalacji`) — zgodne z kodem `poczatekStartu`.
- Wyścigi: kamień i wyjście do tła zapisują ten sam stan końcowy (`{ nieudane: 0, wToku: false }`), więc kolejność zapisów nie ma znaczenia; stan „inactive” (Centrum sterowania, połączenie) nie zeruje.
- **Ryzyko szczątkowe (nazwane, brzegowe):** zawieszenie startu bez wyjątku (np. pętla albo blokada w JS po starcie natywnym) — użytkownik wychodzi do ekranu głównego, licznik się zeruje i strażnik nigdy nie pokaże trybu awaryjnego; wykrywa tylko awarie, które kończą proces na pierwszym planie. Tańsza kontrola zastępcza: etap startu w zgłoszeniu (już jest) i krok U9. Zaostrzenie (np. zerowanie tylko po etapie `kontener`) odrzucam: przypadek L-029 to właśnie wolny start przed otwarciem bazy.
- **Ocena: przyjąć** (D, bez zmian kodu); adnotacja w ADR-0019 wystarcza, właściciel obszaru: 12 (C-002).

## Pytania E0 (koordynator wg P-087)
- **Q1 (U3).** (a) wyzwalacz `AFTER UPDATE OF <kolumny synchronizowane> ON licznik` (kolumny tabeli minus `pomin`), w `schemat.sql` i `0001.sql` razem (v1 niewydany, P-184), test: +1 nie dopisuje licznika do skrzynki, zmiana każdej kolumny synchronizowanej dopisuje (łapie literówkę, której SQLite nie zgłasza); (b) `WHEN` z porównaniem `OLD.x IS NOT NEW.x` każdej kolumny (filtruje też zapisy bez zmiany wartości, dłuższy SQL); (c) zostawić. **Rekomendacja (a)** — 08 p7.
- **Q2 (U7, nowe).** (a) `void o.icloud.start().catch(…)` jak skrzynka, test: `przygotuj()` kończy się, gdy `wyslij` atrapy nie wraca; (b) zostawić `await` z limitem czasu. **Rekomendacja (a)** — 08 p7.
- **Q3 (U4, nowe).** (a) kolumny `pomin` w rekordzie z sieci pomijane jak nieznane, nie odrzucenie rekordu; (b) zostawić i zapisać zakaz: kolumna z `pomin` 1.0 nigdy nie staje się synchronizowana. **Rekomendacja (a)** — 08 p7, zmiana jednej linii z testem.
- **Q4 (manifest zlecenia, nowe).** (a) reguła w `moduly.md`: format `zlecenie.json` zmienia się tylko dodająco, czytnik toleruje brak nowych pól; pole `wersja` dopiero przy pierwszej zmianie niezgodnej; (b) `wersja: 1` od razu (Swift rozszerzenia + TS, 08 p6). **Rekomendacja (a)** — bez kodu przed 1.0.
- **Q5 (P-264).** Reguła przy pierwszej migracji schematu, która dodaje kolumnę synchronizowaną:
  - (A) wersja schematu w rekordzie i w kontrakcie: rekord niesie `wersja_schematu` nadawcy (brak pola = 1, więc 1.0 nic nie zmienia), `icloud-tabele.json` dostaje przy kolumnie `od_wersji`; odbiorca zeruje brakującą kolumnę tylko, gdy `od_wersji` ≤ wersja nadawcy, inaczej zostawia wartość lokalną. Działa bez względu na to, czy serwer zachowuje pola;
  - (B) polegać na serwerze (CloudKit zachowuje klucze, których nadawca nie ustawił — wspiera to opis `allKeys`, ale polityka CKSyncEngine nieopisana), sprawdzenie w oknie maszyn;
  - (C) zakaz kolumn NULL-owalnych w migracjach tabel synchronizowanych: nowe kolumny tylko `NOT NULL DEFAULT`, więc brak pola nigdy nie zeruje.
  - **Rekomendacja (A)**, z (C) jako regułą domyślną tam, gdzie NULL nie jest potrzebny; zapis w nowym ADR-0027 i `moduly.md`; przed 1.0 warunek: Q3 (a).

## E1. Commity (gałąź `claude/kopia-05`; na roboczą tylko `docs/`)
| ID | Commit | Pliki |
|---|---|---|
| P-264, P-274 Q5 | d1116e6 | `docs/adr/0027-icloud-wersja-pol-przy-migracji-schematu.md` (nowy), `docs/adr/0005-…` (uzupełnienie 2026-10-27) |
| P-243 S1a, P-246/P-248, P-274 Q4a | 2169528 | `docs/architektura/moduly.md` „Cel `targets/share`” — reguły rozwoju koperty migawki i manifestu zlecenia |
| P-259 | 9ffe337 | `docs/adr/0026-…`, `docs/architektura/moduly.md` „iPad i orientacja” |
| P-245 U1/U3, P-274 Q1a–Q3a, P-247 U7/U6a | 8635b3b | `docs/architektura/moduly.md` „Przegląd 05 partii 7” |
| P-247 U6a | 538df87 | `docs/architektura/prywatnosc.md`, `docs/architektura/dane.md` |

## Polecenia dla 08 p7 (kod; testy przed kodem, czerwone z właściwego powodu)
1. **Q1a (U3) — `UPDATE OF` dla licznika.** `schemat.sql` i `src/dane/migracje/0001.sql` (+ `generuj-migracje.mjs`): `CREATE TRIGGER licznik_icloud_u AFTER UPDATE OF czesc_id, nazwa, rodzaj, znaczenie, dlugosc_powtorzenia, zablokowany, kolejnosc, zmieniono_ms, usunieto_ms ON licznik WHEN …` (lista = kolumny `licznik` poza `pomin` i poza kluczem `id`, który się nie zmienia). Testy oczekiwane (`tests/dane/icloud-skrzynka.test.ts`): (a) przy `wlaczona = 1` jedno +1 (`dodajRzad`) dopisuje do `zmiana_icloud` tylko `zdarzenie`, nie `licznik` — czerwony dziś; (b) dla każdej kolumny `licznik` spoza `pomin` (lista z `pragma_table_info` minus kontrakt) `UPDATE licznik SET <kolumna> = …` dopisuje `licznik` — łapie literówkę w `UPDATE OF`, której SQLite nie zgłasza; (c) test „trzy wyzwalacze na tabelę” bez zmian zielony.
2. **Q2a (U7) — start silnika bez czekania.** `src/kompozycja/licznik.ts` (`przygotuj`): `void o.icloud.start().catch(() => undefined)` jak skrzynka. Test oczekiwany (`tests/dane/kompozycja-icloud.test.ts`): atrapa silnika, której `wyslij` (albo `statusKonta`) nigdy się nie kończy, przy `wlaczona = 1` — `przygotuj()` zwraca `{ cel: 'licznik' }` (czerwony dziś: czeka bez końca, limit czasu testu). Drugi: błąd `start()` nie zmienia wyniku `przygotuj()`.
3. **Q3a (U4) — `pomin` w rekordzie z sieci pomijane.** `src/domena/icloud/odwzorowanie.ts` (`wierszZRekordu`): kolumna z `pomin` nie daje `bledne_dane`, tylko nie trafia do wiersza (nazwa nadal musi spełniać `NAZWA_KOLUMNY`). Testy oczekiwane (`tests/domena/icloud/icloud-odwzorowanie.test.ts`): rekord `licznik` z polem `wartosc` → wiersz bez `wartosc`, `ok: true` (czerwony dziś); rekord z polem `wersja_schematu` (kolumna nieznana) stosowany w `zastosujPartie` bez wpisu `blad` (zielony już dziś — test regresji U4 i ADR-0027 pkt 3); wektory Swift (`Pakiet/wektory.json`) bez zmian, bo Swift niczego nie filtruje.
4. **Q5 (ADR-0027) w 1.0: bez kodu.** Brak pola `wersja_schematu` = 1, więc 1.0 nie wysyła go i nie zmienia `cloudkit/schemat.ckdb`. Kod `wersja_schematu`/`od_wersji` dopiero przy pierwszej migracji dodającej kolumnę NULL-owalną do tabeli synchronizowanej (test z ADR-0027 „Potwierdzenie”).
**Polecenie dla 08 p6 (P-276):** flaga `film: boolean` w `ProjektMigawki` — `porty.ts` + blok „Porty domeny” w `moduly.md` jednym commitem, `odswiezMigawke` (`p.film_adres IS NOT NULL`), dekoder Swift rozszerzenia; test przed kodem: migawka projektu z filmem ma `film: true`, bez filmu `false` (kontrakt: `moduly.md`, „Rozwój koperty”, punkt „Flaga `film`”).

5. Opcjonalnie (P2, przy najbliższej zmianie `porty.ts`): typ `BladSynchronizacji = { kod: 'brak_miejsca' | 'siec' | 'inny' }` obok portu `Synchronizacja` i użycie go w adapterze, atrapie i `przyczynaZ` (dziś kontrakt tylko w komentarzach i `moduly.md`).

## Plan E1 (po decyzjach) — wykonany
1. ADR-0027 (reguła wersji pól iCloud), `moduly.md` (kontrakt błędu `wyslij`, U3, reguły koperty migawki i manifestu zlecenia, sekcja orientacji), ADR-0026 (uporządkowanie po P-259), `prywatnosc.md` i `dane.md` (U6a) — osobne commity z ID.
2. Polecenia dla 08 p7 (Q1–Q3) i 08 p6 (Q4 b, jeśli wybrane) z testem czerwonym przed poprawką; pytanie (b) filmu do 04.
3. Na roboczą tylko `docs/`, po `git pull --rebase` i zielonym `env -u NODE_PATH npm run verify`.

## E2. Dowody (STOP)
| ID | Zmiana | Dowód | Commit |
|---|---|---|---|
| P-264 / P-274 Q5 | ADR-0027 (A+C), uzupełnienie ADR-0005 | `kontrola-adr.mjs docs/adr --min 21`: „ADR: 27, błędy: 0” (0027: opcje 3) | d1116e6 |
| P-243 S1a, P-246, P-248 D1a, P-274 Q4a | reguły rozwoju koperty migawki i manifestu zlecenia | przegląd kodu kopii p6 (wyżej); tylko dokument | 2169528 |
| P-259 | ADR-0026, `moduly.md` „iPad i orientacja” | źródło RNS 4.26.2 (`RNSScreenWindowTraits.mm:100-125`), test `tests/domena/wzor/orientacja-ekranu.test.ts` istnieje, `package.json` bez `expo-screen-orientation` (grep 0) | 9ffe337 |
| P-245 U1/U3, P-247 U7, P-274 Q1a–Q3a | `moduly.md` „Przegląd 05 partii 7” | odtworzenie `UPDATE OF` na SQLite 3.50.4 (wyżej); kod → polecenia dla 08 | 8635b3b |
| P-247 U6a | `prywatnosc.md`, `dane.md` | `src/kompozycja/kontener.ts:54-57` (UUID w `urzadzenie.txt`), `docs/architektura/schemat.sql:79-80` | 538df87 |
| P-273 | ocena: przyjąć, ryzyko szczątkowe nazwane | sekcja P-273 wyżej | c79e72a |

- Bramka przed pushem na roboczą: `env -u NODE_PATH npm run verify` kod 0, **2537/2537** (220 zestawów) na 45e275f; push `b994546..45e275f` (tylko `docs/`, CI iOS nie rusza).
- Kontrola dowodów i sekretów (`sprawdz-raport.mjs` ze scratchpada): wobec repo Oczka — błędy tylko dla 5 odwołań `trening/…` (inne repo); wobec katalogu nadrzędnego z `trening/` — 0 błędów cytatów, odwołania istnieją; wzorce sekretów: brak.
- Bez zrzutów: zmiany niewidoczne w aplikacji. Status „zweryfikowane” nadaje reaudit.
- Nowe znaleziska przekazane: Q2 (P1), Q3, Q4 (P2) — decyzje P-274; „Video link” zastępuje film bez pytania → 04 (koordynator).

## Punkt czyszczenia
Rola 05, tryb fix (przeglądy 2026-10-27), prompt `oczko-warsztat` `koordynacja/role-2026-10-27/05-architekt-fix.md`, plik stanu: ten plik na `claude/kopia-05`. Następny krok: brak dla 05; kod Q1a–Q3a robi 08 p7, flagę `film` 08 p6 (sekcja „Polecenia dla 08”).
