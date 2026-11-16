# CF — recenzja niezależna FX5 (373a3123..3bfec918) przed scaleniem

Data: 2026-11-16 · Rola: 08-programista, tryb audit (recenzja) · Start: `claude/fx5-poprawki-2026-11-16` @ 3bfec918 (HEAD zgodny) · Środowisko: Linux, Node, `npm ci` kod 0; bez macOS/Xcode/swift (Swift tylko statycznie). Raport autora (`docs/jakosc/fx5-stan.md`) przeczytany dopiero po zadaniach 1–5.

## Werdykt: **Z UWAGAMI** — do scalenia z integracją; bez P1

Kod BX-005 i BX-024 zgodny z zadaniem, testy łapią usunięcie poprawek (mutacje niżej). Uwagi dotyczą pokrycia testami (PU-333, rola nagłówka) i jednego dokumentu wyprowadzonego z błędnego opisu PU-044 (instrukcja testu 1171, T-32).

| ID | Poziom | Realność | Tytuł |
|---|---|---|---|
| CF-01 | P2 | realny | Instrukcja testu 1171, krok T-32, każe szukać celu dnia na karcie „Dziś” — sprzeczne z `scope-contract.md:9` i kodem; ten sam błąd co opis PU-044 |
| CF-02 | P2 | realny (dla decyzji o bramce) | Test Swift PU-333 pokrywa 1 z 5 elementów „Oczekiwanego wyniku” w całości, 2 częściowo, 2 wcale |
| CF-03 | P3 | brzegowy | Rola dostępności `header` nagłówka menu wzorów bez asercji (mutacja bez roli — testy zielone) |
| CF-04 | P3 | realny (dla autora scenariusza) | Katalog PU-334 każe szukać w panelu `"jezyk":"de"`, a panel pisze ` · lang de` |
| CF-05 | P3 | teoretyczny | Test PU-011: „4 highlights” to echo liczby z atrapy widoku natywnego; kolejność zapisów pilnuje inny test |

## Zadanie 1 — BX-005 (d83df1b9, 3bfec918): **OK**
- Kod: `src/ekrany/WzorMenu.tsx:39` — `<Text style={[w.podpis, w.naglowek]} accessibilityRole="header">` z `p.t('wzor.przelacz_naglowek', { projekt: p.projekt })`; styl `w.podpis` = `typografia.podpis` + `k.olowek` (`WzorMenu.tsx:33`), `w.naglowek` = `odstep.l`/`odstep.s` (`:34`). Wartości tylko z motywu: `typografia.podpis` = `typografiaDzianiny.tresc2` (`src/ekrany/motyw.ts:101`), `olowek` = `tekst2` (`motyw.ts:43`); bez liczb wpisanych ręcznie. Wcięcie `odstep.l` jak pozycje menu.
- Specyfikacja: Dzianina (`docs/design/design-spec.md`) nie opisuje menu wzorów; obowiązuje decyzja Kreski `docs/design/archiwum/2026-11-08-kreski/design-spec.md:958` (wariant A „Patterns in {{projekt}}”, styl systemu 7c, `:954`) i makieta `docs/design/fix7-2026-10-26/wzor.html:387` (13 pt `olowek` nad listą) — kod zgodny.
- Klucz: `wzor.przelacz_naglowek` w 35/35 słownikach (`src/i18n/slowniki/*.json`, bez `*.kontekst.json`), każdy z `{{projekt}}`; kontekst `en.kontekst.json:771`. Fallback niepotrzebny.
- Długa nazwa / Dynamic Type: `Text` bez `numberOfLines` — zawija, nie ucina; skaluje się jak pozostałe pozycje menu (też bez `maxFontSizeMultiplier`). Uwaga Kreski „menu systemowe skraca samo” (`fix12-2026-11-02/klucze.json:24`) nie ma zastosowania — menu jest własne (`WzorMenu.tsx:10-16`); zawijanie nie gubi treści. Zrzutu AX5 nie robiłem.
- Nazwa projektu: `app/wzor.tsx:195` `licznik.nazwaProjektu(lw)` (`src/kompozycja/licznik.ts:243`: projekt roboczy → etykieta robocza, inaczej nazwa).
- E2E: `grep -rln "wzor-czeka\|wzor-przelacz\|Switch pattern\|Patterns in" e2e/scenariusze` → 0 z 96 plików. Żaden scenariusz nie otwiera menu wzorów — **brak scenariuszy z ryzykiem** (indeksy, `tapOn` po tekście).
- 9 plików testów: `git diff --word-diff=porcelain` → 8× `+projekt: 'Harbor',`, 1× `+projekt="Harbor"`, 0 usuniętych słów. Żadna asercja nie osłabiona.
- Mutacje (kopia `git worktree` w scratchpadzie, bez commita):
  - usunięcie nagłówka → `pu-wzor-przelacz-290` czerwony: „Unable to find an element with text: Patterns in Sweter” (kod 1);
  - `projekt: widok.nazwa` zamiast `nazwaProjektu` → czerwony (kod 1);
  - usunięcie `accessibilityRole="header"` → zielony (kod 0) → **CF-03**.
- Przebieg bazowy: `npx jest --ci tests/ekrany/pu-wzor-przelacz-290.test.tsx tests/ekrany/e2e-zegarek-stan.test.tsx` → 2/2 zestawy, 9/9 testów, kod 0.

## Zadanie 2 — BX-024 (0b5bd811), `src/kompozycja/kontener.ts`: **OK**
- Zmiana w `kontener.ts:89` dotyczy tylko gałęzi `ZEGAREK_SZTUCZNY && paneleE2e` (`zegarekSztuczny` → `zegarekSztucznyZJezykiem(jezyk)`); gałąź produkcyjna `zegarek(undefined, jezyk)` bez zmian, adapter `src/platforma/zegarek.ts` nietknięty (brak w diffie).
- To samo źródło języka: `kontener.ts:73` `const jezyk = () => i18n.jezyk()` trafia do obu gałęzi (`:89`); adapter wysyła `jezyk ? jezyk() : null` (`zegarek.ts:16`), atrapa tak samo (`src/kompozycja/e2e/panele.tsx:185`). Test „to samo źródło…” (`tests/ekrany/e2e-zegarek-stan.test.tsx:55-64`) sprawdza 3. argument natywnego `zegarekWyslij` i panel z jednej funkcji `jezyk` — PU-334 nie sprawdza atrapy oderwanej od adaptera.
- Panel poza wydaniem: moduł paneli ładowany `require` w gałęzi `process.env.EXPO_PUBLIC_E2E === '1'` (`src/platforma/tryb-e2e.ts:17`); pilnują: `scripts/wydanie/slady-testowe.mjs` (wzorzec `e2e-`, wołany w `scripts/wydanie/kontrola-ipa.sh:70`) i test listy wzorców `tests/wydanie/slady-testowe.test.ts:42` (każdy `testID="e2e-…"` ma wzorzec).
- Sonda (eksport bundla iOS na tym commicie, `npx expo export --platform ios`):
  - bez `EXPO_PUBLIC_E2E`: `slady-testowe.mjs` kod 0; `e2e-zegarek-stan` 0×, „Watch state” 0× (nazwa własności `zegarekSztucznyZJezykiem` 1× — tylko dostęp do pola w `kontener.ts`, kod paneli nieobecny);
  - z `EXPO_PUBLIC_E2E=1 EXPO_PUBLIC_WATCH_FAKE=1`: `slady-testowe.mjs` kod 1 (6 wzorców, `e2e-` 24×), `e2e-zegarek-stan` 1× — kontrola padłaby, gdyby panel trafił do wydania.

## Zadanie 3 — BX-029 / PU-011 (63606465): **OK z uwagą CF-05**
- „Oczekiwany wynik” (`docs/jakosc/przypadki-uzycia.md:33`): oba pasy od razu, liczba +2 („4 highlights”), po restarcie wszystkie 4.
- Test `tests/ekrany/pu-wzor-przelacz-290.test.tsx:108-134`: prawdziwa trasa `/wzor`, prawdziwy `zapiszRysunek` na bazie `node:sqlite` (`tests/dane/pomocnicze/kompozycja-licznika.ts:1`); dwa `onRysunek` bez przerwy (≤ 1 s); asercje: 1 wiersz `rysunek` strony, `plik_sha256` = drugi rysunek, brak sieroty pierwszego pliku, po odmontowaniu i ponownym otwarciu dokument z rysunkiem „zakreslenia:4”.
- Mutacje kodu produkcyjnego:
  - `WzorWidokNatywny.tsx:70` gubi drugie zdarzenie, gdy pierwszy zapis trwa → czerwony (kod 1);
  - UPSERT `DO NOTHING` w `src/przypadki-uzycia/wzor.ts:245` → czerwony (kod 1);
  - bez kolejki klucza (`wzor.ts:222`) → test PU-011 zielony; tę mutację łapie `tests/dane/wzor-rysunki-odzysk.test.ts:159` (M1-105, kod 1). Zgodne z raportem autora.
- CF-05: liczba „4 highlights” pochodzi z `onZakreslenia` atrapy (`pu-wzor-przelacz-290.test.tsx:119-121`); liczenie pasów robi widok natywny (Swift), poza Jest. Część JS (zapis i odczyt) pokryta w całości.

## Zadanie 4 — PU-333 (0c87a32a): **statycznie poprawny; pokrycie częściowe (CF-02)** · nieuruchamialny na Linuksie (brak `swift`); w CI job `swift-test` (`.github/workflows/jakosc-ios.yml:44`)
- API: `SkrzynkaZegarka.init(magazyn:kontekst:potwierdzone:) throws` (`modules/oczko-reguly/Sources/OczkoDziennik/Zegarek.swift:46`), `stuknijNaZegarku(_:teraz:strefa:id:urzadzenie:sklep:) throws -> WynikIntencji` (`Zegarek.swift:81`), `pokazywany`/`oczekujace` (`:38`, `:40`), `PrzebiegStukniecia.zapisNieudany` (`Haptyka.swift:18`), `wzorzecHaptykiZegarka(_:_:)` (`Haptyka.swift:23`), `WynikIntencji.zapisz` (`Intencja.swift:11`), `MagazynTestowy.bladDopisz` (`ZegarekSkrzynkaTests.swift:11`). Nazwy, etykiety argumentów i `try` zgodne; `guard case .zapisz = try …` jak w `IntencjaTests.swift:74`.
- Pakiet: plik w `Tests/OczkoRegulyTests`, cel `OczkoRegulyTests` ma `path: "Tests/OczkoRegulyTests"` (`modules/oczko-reguly/Package.swift`) — test wchodzi do `swift test`.
- Pokrycie „Oczekiwanego wyniku” (`przypadki-uzycia.md:318`):

| Element | Asercja w teście | Kod, który to realizuje | Da się w tym pakiecie? |
|---|---|---|---|
| liczba bez zmian | **tak**: `pokazywany` == przed, plik i kolejka bez zmian (`ZegarekSkrzynkaTests.swift:120-122`) | `Zegarek.swift:84-88` (`dopisz` przed zmianą stanu) | — (jest) |
| wibracja „ponów” | **częściowo**: tylko odwzorowanie `wzorzecHaptykiZegarka(.plus/.minus, .zapisNieudany) == .bladZapisu` (`:124-125`); `przebieg = .zapisNieudany` ustawia sam test w `catch` (`:118`) | wyjątek → `zagraj(rodzaj, .zapisNieudany)` `targets/watch/Aplikacja.swift:72-75`; `.bladZapisu` → `.retry` `:100` | nie bez przeniesienia decyzji „wyjątek → przebieg” do `OczkoDziennik` (czysta funkcja) |
| „Nie dodano rzędu n” | **nie** | `Aplikacja.swift:237` (widok), `:115` (ogłoszenie VoiceOver); tekst `targets/watch/Teksty.swift` | nie: widok SwiftUI i `Teksty` poza pakietem; wybór klucza i `n` (`rzadWRobocie`) dałoby się wynieść do pakietu jako czystą funkcję |
| „Spróbuj ponownie lub licz na iPhonie.” | **nie** | `Aplikacja.swift:239`, `:116` | jw. |
| komunikat znika po udanym stuknięciu | **częściowo**: kolejne stuknięcie daje `.zapisz`, kolejka `["z1","z3"]` (`:127-130`) — warunek wstępny, nie stan komunikatu | `niezapisano = nil` `Aplikacja.swift:81` (i `:165` przy nowym kontekście) | nie bez wyniesienia stanu `niezapisano` (przejście stanu) do pakietu |

  Wniosek dla bramki: z obecnym kodem test Swift w `modules/oczko-reguly` nie może pokryć tekstów ani stanu komunikatu — leżą w `ModelZegarka` (`targets/watch/Aplikacja.swift:21-25`), poza pakietem. Opcje: (a) wynieść czystą funkcję „przebieg i komunikat po stuknięciu” do `OczkoDziennik` (kopie w celach jak dziś, `scripts/natywne/kontrola-swift.mjs`) i dopisać asercje — koszt: zmiana kodu zegarka i nowy test; (b) zostawić PU-333 jako „do zaprogramowania”/F z testem częściowym — koszt: teksty i znikanie komunikatu sprawdza tylko test na zegarku. Rekomendacja: (a) przy najbliższej partii zegarka; do tego czasu (b), bez wpisu „z testem:” (bramka `scripts/jakosc/bramka-przypadki-uzycia.mjs:172` i tak go nie przyjmie).

## Zadanie 5 — `tabela-08.md` (c0804df9), `e2e/README.md`: **OK**
- `node docs/jakosc/narzedzia/tabela-08.mjs --check docs/jakosc/e4/tabela-08.md` → „błędów: 0”, kod 0. Diff c0804df9 w tabeli: 2 wiersze (liczby testów 2→6 i 2→3, nowy plik src `src/platforma/zegarek`) — wynik generatora.
- Uwaga procesowa (wyjątek nazwany, moja pomyłka): pierwsze wywołanie podałem z `--wynik`, które nadpisało `tabela-08.md` regeneracją; `git status --porcelain` po nim pusty — regeneracja identyczna z commitem, co samo potwierdza brak ręcznych edycji.
- `e2e/README.md`: 1 wiersz usunięty, 1 dodany (`e2e/README.md:361`, panel `e2e-zegarek-stan`); nic poza nim.

## Zadanie 6 — podstawa decyzji właściciela (PU-291, PU-044): **cytaty zgodne; brak zapisu przeciwnego w BRD, `docs/design/`, `scope-contract.md` → bez P1**
PU-291 (`docs/jakosc/fx5-stan.md:10`):
- `docs/design/fix7-2026-10-26.md:36` — R1a: migawka „(id, nazwa, ostatnia praca, czy ma wzór)” ✓.
- `src/domena/porty.ts:56` — `ProjektMigawki` z `wzory: number`, bez nazw wzorów ✓.
- `src/i18n/slowniki/en.json:932` — `udostepnij.kolejny` „{{projekt}} already has a pattern…” ✓; rozszerzenie używa tylko kluczy `udostepnij.*`, `wzor.rodzaj_*`, `wzor.strony_*` (w tym `udostepnij.wzory_*` = liczba), `targets/share/Teksty.swift:12` ✓.
- `docs/brd/wymagania-projekt.md:330-350` — BR-WZR-007, 4 scenariusze, żaden o nazwach wzorów w arkuszu ✓; `docs/brd/odkrywanie.md:210` — „kopiuje jeden plik do skrzynki importu; import tworzy nowy wzór” ✓.
- `src/przypadki-uzycia/migawka.ts:16-18` — `count(*)` wzorów, bez nazw ✓ (autor podał `:17-20`; zakres o linię przesunięty, treść zgodna).
- Zapis przeciwny: brak (`docs/adr/0011-import-wzorow-rozszerzenie-pdf.md:59` — migawka projektów; `docs/design/` — bez wymagania nazw wzorów w arkuszu).

PU-044 (`docs/jakosc/fx5-stan.md:11`):
- `docs/scope-contract.md:9` — karta „Kontynuuj” „pokazuje tylko licznik, część, cel części i +1”; na „Dziś” tylko wymienione elementy ✓.
- `docs/brd/wymagania-dni.md:146-153` — BR-DNI-006 „jako kolejność listy projektów, nie osobny ekran”, „przy projektach z terminem widać cel na dziś” na liście ✓. Dodatkowo BR-DNI-005 (`wymagania-dni.md:99-110`): cel dnia „Gdy użytkownik otwiera projekt” — na ekranie projektu, nie na „Dziś” ✓.
- `docs/design/testid.md:12` — linia 2 wiersza w toku przy terminie: `projekty.dzis_*` ✓.
- `src/ekrany/Projekt.tsx:138` — `projekt-linia-terminu` ✓ (tekst z `projekt.termin_dzis`, `src/kompozycja/projekt.ts:82`); `en.json:208-209` — „Today: {{zrobione}} of {{count}} row(s)” ✓; `src/ekrany/Dzis.tsx:111-117` — karta: tytuł, podpis część/rząd/cel, liczba; bez celu dnia ✓.
- Zapis przeciwny w BRD/design/scope: brak. **Jest natomiast w dokumencie wyprowadzonym** → CF-01.

## Znaleziska
### CF-01 · P2 · realny — instrukcja testu 1171 (T-32) powtarza błędny opis PU-044
`docs/wydanie/instrukcja-testu-1171.html:355` (T-32, „powinno”): „a na „Dziś” ⟦Today⟧ i w projekcie „Do …, dziś 0 z N rzędów””; tak samo `docs/wydanie/test-urzadzenia-build3.md:77`. Karta „Dziś” celu dnia nie pokazuje (`scope-contract.md:9`, `Dzis.tsx:111-117`), więc właściciel zgłosi fałszywą porażkę T-32. Opcje: (a) poprawić „powinno” T-32 razem z PU-044 (cel dnia w wierszu „Projekty” i na ekranie projektu) — mała zmiana dokumentu roli 07/10; (b) zostawić i dopisać uwagę przy T-32 w wyniku testu — tańsze, ale właściciel traci czas. Rekomendacja: (a) w tej samej sesji, która poprawi opis PU-044.

### CF-02 · P2 · realny — PU-333: test Swift pokrywa część wyniku
Tabela w zadaniu 4. Do decyzji o bramce/klasie: z 5 elementów 1 pełny, 2 częściowe, 2 bez asercji; brakujące realizuje `targets/watch/Aplikacja.swift` (poza pakietem testów).

### CF-03 · P3 · brzegowy — rola `header` bez testu
`src/ekrany/WzorMenu.tsx:39`; mutacja bez `accessibilityRole="header"` → testy zielone. Naprawa: `screen.getByRole('header', { name: 'Patterns in Sweter' })` w `pu-wzor-przelacz-290.test.tsx:62`.

### CF-04 · P3 · realny dla autora scenariusza — rozjazd formatu panelu w katalogu
`docs/jakosc/przypadki-uzycia.md:319` (PU-334, kolumna testu): „`e2e-zegarek-stan` zawiera „"jezyk":"de"””, a panel pisze ` · lang de` (`src/kompozycja/e2e/panele.tsx:194`, `e2e/README.md:361`). Scenariusz pisany z katalogu padnie. Naprawa: zmienić wpis katalogu na `.*lang de.*` przy najbliższej zmianie wiersza PU-334.

### CF-05 · P3 · teoretyczny — granica testu PU-011
Opis w zadaniu 3. Bez działania przed scaleniem.

## Dowody (komendy, kody wyjścia)
| Komenda | Kod |
|---|---|
| `npm ci` | 0 |
| `npx jest --ci tests/ekrany/pu-wzor-przelacz-290.test.tsx tests/ekrany/e2e-zegarek-stan.test.tsx` | 0 (9/9) |
| mutacje BX-005: brak nagłówka / zła nazwa / bez roli | 1 / 1 / 0 |
| mutacje PU-011: gubi drugie / UPSERT `DO NOTHING` / bez kolejki klucza (PU-011; M1-105) | 1 / 1 / 0; 1 |
| `npx expo export --platform ios` (wydanie; E2E) | 0; 0 |
| `node scripts/wydanie/slady-testowe.mjs` (bundle wydania; bundle E2E) | 0; 1 |
| `node docs/jakosc/narzedzia/tabela-08.mjs --check docs/jakosc/e4/tabela-08.md` | 0 |
| `git status --porcelain` przed zapisem tej recenzji | pusto |

Logi w scratchpadzie sesji (poza repo). Pełnego `verify` poza hakiem nie uruchamiałem.

## Decyzje
Brak nowych decyzji P-900…P-901 — recenzja nie wymagała rozstrzygnięć; wybór opcji dla CF-01 i CF-02 należy do koordynatora.
