# Recenzja niezależna CE: BX7 + BX8 (7fbb5b94..1b888e99) przed scaleniem

Rola 08-programista, tryb audit (tylko odczyt kodu autorów), sesja CE, 2026-11-16. Start: `claude/bx8-porcja2-2026-11-16` @ 1b888e99 (HEAD zgodny z poleceniem). Raportów autorów (`docs/jakosc/bx8-dowod-czerwony.txt`, sekcje BX7/BX8 w `docs/jakosc/bx-stan.md`) nie czytałem przed własną oceną ani po niej.
Środowisko: Linux, Node, `npm ci` kod 0; bez macOS i symulatora, więc żadnego scenariusza Maestro nie uruchomiłem. Ocena scenariuszy opiera się na lekturze YAML, katalogu PU, kodu i źródła Maestro 2.12.1 (wersja przypięta w `.github/workflows/jakosc-ios.yml:339`).

## Werdykt: Z UWAGAMI

KO-088 można scalić: kontrolę tylko poszerzono, co potwierdziły sonda i mutacje niżej. Scenariusze 85–102 mają tag `oczekujacy`, więc nie wchodzą do bramki i nie blokują scalenia. Cztery z nich sprawdzają tylko część „Oczekiwanego wyniku”. Przed zdjęciem tagu z tych czterech (CE-01…CE-04) trzeba je poprawić. Inaczej zielony przebieg przeniesie PU do klasy A na niepełnym albo pustym dowodzie. Najpoważniejsze jest CE-01: scenariusz 99 nie może paść.

| ID | Poziom | Realność | Plik | Skrót |
|---|---|---|---|---|
| CE-01 | P1 | realny | `e2e/scenariusze/99-pu-052-bez-prosb-o-powiadomienia-sledzenie-biblioteke.yaml:17` | `launchApp` bez `permissions` nadaje wszystkie uprawnienia, więc prośby systemowe się nie pojawią: asercje `assertNotVisible` przechodzą zawsze |
| CE-02 | P2 | realny | `e2e/scenariusze/96-pu-170-stoper-po-powrocie-z-tla.yaml:27` | „z rosnącym czasem” niesprawdzone, a nagłówek błędnie twierdzi, że Maestro nie porówna dwóch odczytów |
| CE-03 | P2 | realny | `e2e/scenariusze/102-pu-292-przywroc-usuniety-wzor-z-zakresleniami.yaml:47` | „notatki rzędów były cały czas przy liczniku” niesprawdzone (ścieżka danych) |
| CE-04 | P2 | brzegowy | `e2e/scenariusze/101-pu-296-gumka-zmazuje-jedno-zakreslenie.yaml:30` | „zostaje drugi pas” sprawdzone tylko licznikiem: gumka, która zmaże zły pas, też da „1 highlight” |
| CE-05 | P2 | realny | `e2e/scenariusze/98-pu-180-linki-z-ustawien-i-ofert-opuszczaja-aplikacje.yaml:21` | „po angielsku, bez błędu” poza scenariuszem; Pokrycie PU-180 wskazuje tylko scenariusz |
| CE-06 | P3 | teoretyczny | `tests/jakosc/bx8-numeracja-trzycyfrowa.test.ts:41` | test globu sprawdza tylko brak starego napisu, nie że glob łapie numer 100+ |
| CE-07 | P3 | — | `docs/decyzje.md:795` | P-889 („dokładnie 10 plików … nic więcej”) nieprawdziwe na HEAD: lista ma 16 plików i `.sort()` |
| CE-08 | P3 | — | `e2e/README.md:423`, nagłówki 85 i 94 | błędne odnośniki w opisach (szczegóły niżej) |
| CE-09 | P3 | brzegowy | `e2e/scenariusze/85-pu-104-przewodnik-uklad-i-grupy.yaml:36` | „6 kroków” i „9 grup” sprawdzone jako obecność, nie jako dokładna liczba |

## 1. KO-088 (2abef8a4): poszerzenie `\d\d` → `\d{2,}`

| Punkt | Werdykt | Dowód |
|---|---|---|
| (a) tylko poszerzenie | **tak** | Nowy skrypt i stary skrypt (b5ef7efe) na katalogu sprzed KO-088 (b5ef7efe, scenariusze ≤ 99) dają **bajtowo identyczny** `plan` (`cmp` 0). Stary skrypt (7fbb5b94) na katalogu z 1b888e99 ma 94 scenariusze telefonu, nowy 97. Różnica to dokładnie 100, 101 i 102; żaden plik 01–99 nie wypada. Wszystkie komendy kod 0. |
| (b) 100–102 w częściach i w kontroli | **tak** | `plan`: 101 w części 1, 100 i 102 w części 2. `czesc 1..4` kopiuje je do katalogu części, a glob `[0-9][0-9]*-*.yaml` z workflow łapie 97 plików, w tym 100–102. `kontrolaKatalogu` widzi je (`scripts/jakosc/bramka-przypadki-uzycia.mjs:187`): `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` daje kod 0, „Kontrola 2: zielona”. |
| (c) glob nie łapie nie-scenariuszy | **tak** (teoretycznie szerszy) | `[0-9][0-9]*-*.yaml` (`.github/workflows/jakosc-ios.yml:371`, `:425`) pasuje też do np. `12a-x.yaml`, ale katalog części wypełnia wyłącznie `plikiScenariuszy` (`scripts/ci/e2e-czesci.mjs:42`, regex `^\d{2,}-`). W katalogach części czterech części nie było nic poza scenariuszami, `subflows` i `osobne`. |
| (d) kolejność leksykalna | **bez skutku** | W części 2 numer 100 biegnie między 10 a 12 (`c.files.sort()`, `scripts/ci/e2e-czesci.mjs:96`). Przydział nie zależy od numeru, tylko od wagi; remis rozstrzyga deterministyczne `localeCompare` (`:90`). Nic nie zależy od kolejności: 90 scenariuszy zaczyna się od `start-czysty*`, a pozostałe 7 od `launchApp: { clearState: true }`. `POMIN`, `BRAMKA` i podsumowanie działają po nazwie. `ONLY=100` działa (`:106`, numer do pierwszego „-”). `config.yaml` ma tę samą kolejność, czego pilnuje `tests/jakosc/e2e-czesci.test.ts:74`. |
| (e) test pada bez poprawki | **tak** | Mutacje na kopii 1b888e99 (worktree w scratchpadzie, bez commita): powrót regexu w `e2e-czesci.mjs` → czerwony tylko test 1; w `bramka-przypadki-uzycia.mjs` → tylko test 2; jednego albo obu globów w workflow → tylko test 3. Bez mutacji 3/3 zielone. Uwaga: CE-06. |
| (f) inne miejsca dwucyfrowe | **brak** | `grep -rnE '\\d\\d\|\\d\{2\}\|\[0-9\]\[0-9\]\|slice\(0, ?2\)' scripts tests .github e2e`: jedyne pozostałe trafienie o nazwach to `scripts/ci/zrzuty-uzupelnij.mjs:42`, ale tam chodzi o sceny zrzutów sklepu (`01-…`, `99-zakup`), nie o scenariusze. `.github/scripts/jakosc/e2e-wyniki.mjs:27` filtruje po `.yaml` bez numeru. Atrapy `/^9[01]-/` w `tests/jakosc/e2e-czesci.test.ts:86` bez zmian (P-887). |

Testy celowane (`npx jest --ci`, 12 plików: maestro-scenariusze, przypadki-uzycia, e2e-czesci, e2e-noc, e2e-pakiet-bramki, bx8, e2e-licznik-to-be, e2e-zdania-en, bramka-przypadki-uzycia, e2e-otworz-ustawienia, e2e-kruchosc-142, e2e-yaml-skladnia): kod 0, 12/12 plików, 323/323 testy.

## 2. Scenariusze 85–102 wobec „Oczekiwanego wyniku”

Wspólne dla 16 plików: wszystkie są nowe (`git diff --name-status 7fbb5b94 1b888e99 -- e2e/`: tylko `A`, plus `M` w `config.yaml`, `czesci.json` i `README.md`). `e2e/README.md` ma same dopisania (+43, −0); żaden istniejący scenariusz ani jego asercja się nie zmieniły. Każdy plik ma tagi `przypadki-uzycia`, `oczekujacy` i `PU-NNN`. Regułę „po akcji asercja” (`e2e/README.md:13`) pilnuje `tests/jakosc/maestro-scenariusze.test.ts:68`: zielony.

| Scen. | PU | Werdykt | Uwagi |
|---|---|---|---|
| 85 | 104 | częściowo, z wyjątkami nazwanymi | „‹ Today” i „bez wyszukiwania” poza scenariuszem (P-888, BX-021). Kolejność „?” przed zębatką sprawdza test komponentowy `tests/ekrany/przewodnik.test.tsx:141`, nie scen. 69/82, jak twierdzi nagłówek (CE-08). Liczby 6 i 9: CE-09. |
| 86 | 107 | tak | Licznik „0”, menu zamknięte, wzór, powrót. „0” nie odróżnia bieżącej części od pustego licznika (projekt roboczy kończy na 0, `subflows/projekt-roboczy.yaml`), ale w scenariuszu jest jedna część, więc to drobiazg. |
| 87 | 108 | tak, z wyjątkiem nazwanym | „Jeden pasek zakładek” zastąpiony brakiem `przewodnik` i `nav-wstecz` (nagłówek :2-3). |
| 88 | 109 | tak | Ekran kosza rozpoznany po tekście „Recently deleted”, który ma też wiersz przewodnika. Następny krok (`nav-wstecz` → `przewodnik`) i tak padnie, gdy „Show” nic nie otworzy, więc kontrola działa. |
| 89 | 110 | tak | Ponad wynik: brak zakupu i eksportu. |
| 92 | 112 | tak, z wyjątkiem nazwanym | „‹ Settings” i „‹ Today” jako etykieta „Back” (P-888). |
| 93 | 113 | tak | — |
| 94 | 322 | tak | Nagłówek (:3) wskazuje „zdanie PU” o `e2e-sklep-wygas`, którego w wierszu PU-322 katalogu nie ma (CE-08). |
| 95 | 168 | tak (wynik = brak +1) | Otwarcie Centrum na symulatorze to hipoteza; asercja wyniku działa niezależnie od niej. |
| 96 | 170 | **częściowo** | CE-02 |
| 97 | 165 | tak, z hipotezą | „Klawiatura numeryczna” rozpoznana po klawiszu „Delete” — patrz „Do sprawdzenia”. |
| 98 | 180 | **częściowo** | CE-05 |
| 99 | 052 | **nie (pusty)** | CE-01; brak biblioteki zdjęć nazwany przez autorów (BX-032). |
| 100 | 008 | tak | Cały wynik: 1 po ponownym otwarciu, 2 od razu, cofnięcie → 1, po restarcie 2. |
| 101 | 296 | **częściowo** | CE-04 |
| 102 | 292 | **częściowo** | CE-03; wpis kosza „Pattern in … · until …” niesprawdzony (BX-031, nazwany). |

## 3. Bramka i katalog

- **KO-073 zachowane:** `kontrolaKatalogu(…, { wymagajTestowB: true })` daje dla każdego z 16 PU błąd „klasa B „oczekujący” nie liczy się jako test” (`scripts/jakosc/bramka-przypadki-uzycia.mjs:254-255`; sonda przez `node -e`, 102 błędy razem, w tym 16 nowych PU). Plan części: żaden z 100–102 nie jest w `bramka=`, a w 4 częściach jest 81 plików bramki = 97 − 16 `oczekujacy`.
- **Odnośniki „oczekujący: plik:linia”:** w katalogu zmieniła się tylko kolumna Pokrycie 16 wierszy (porównanie kolumn: zmiana tylko w indeksie 7). Bramka sprawdza istnienie linii i to, że linia jest asercją; kontrola 2 zielona.
- **Podsumowanie:** `docs/jakosc/przypadki-uzycia.md:12` „A=109, B=178, F=52, razem 339” bez zmian względem 7fbb5b94 i zgodne ze skryptem, bo kontrola 2 porównuje je z tabelą (`node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` → kod 0).
- **`e2e/czesci.json`:** 16 nowych wag (78–152 s) tylko dodaje; plan obejmuje wszystkie 97 scenariuszy telefonu, a wagi niczego z bramki nie wyłączają (bramka zależy od tagu, nie od wagi).

## 4. `tests/jakosc/e2e-noc-2026-11-02.test.ts` (KO-086)

Zmiana w stosunku do 7fbb5b94: regex `\d{2,}` (KO-088), nowa lista `bx7` z 16 numerami (85–89, 92–99, 100–102) rozwijanymi przez `plik(n)` (nazwa pliku z katalogu po prefiksie `n-`, jak dotąd dla 67–70) i `.sort()` na liście oczekiwanej. Pozostałe asercje (czasy 0–900 s, wagi = pomiar, [Failed] > pomiar) bez zmian. `.sort()` nie osłabia testu: `toEqual` dalej wymaga dokładnej listy, a sortowanie tylko dopasowuje kolejność do `readdirSync` (100 po 10). Odstępstwo: KO-086 i P-889 dopuszczały dokładnie 10 plików; dopisanie 97–102 i `.sort()` wykracza poza ich treść (CE-07). Kontrola nie słabnie, bo lista nadal jest wyczerpująca.

## 5. Dokumenty (P-887…P-890)

`git diff 7fbb5b94 1b888e99 -- docs/decyzje.md`: same dopisania (4 wiersze `+`, zero `-`), więc starsze decyzje nietknięte. Odnośniki z P-890 do kodu się zgadzają: `e2e-czesci.mjs:42`, `bramka-przypadki-uzycia.mjs:187`, workflow `:371` i `:425`, siedem testów (e2e-czesci, e2e-licznik-to-be, e2e-noc, e2e-pakiet-bramki, e2e-zdania-en, maestro-scenariusze, przypadki-uzycia), `slice` w `e2e-pakiet-bramki.test.ts`. P-887 zgadza się z `tests/jakosc/e2e-czesci.test.ts:86`. Niespójna jest tylko P-889 (CE-07).

## Znaleziska (szczegóły)

### CE-01 · P1 · realny · scenariusz 99 (PU-052) nie może paść
- Dowód: start przez `subflows/start-czysty.yaml` → `start-czysty-dzis.yaml` (`launchApp: { clearState: true, arguments: … }`, bez `permissions`). Maestro cli-2.12.1, `maestro-orchestra/src/main/java/maestro/orchestra/Orchestra.kt:1345-1347`: „// For testing convenience, default to allow all on app launch / val permissions = command.permissions ?: mapOf("all" to "allow")”. Dokumentacja launchApp (docs.maestro.dev/api-reference/commands/launchapp, odczyt 2026-11-16): „By default, all permissions are allowed.”
- Skutek: uprawnienia (co najmniej powiadomienia i zdjęcia) są nadane przed startem, więc iOS nie pokaże prośby nawet wtedy, gdy kod o nią poprosi. Asercje `assertNotVisible` z :17, :18 i :32–40 przechodzą zawsze. Po pierwszym zielonym przebiegu i zdjęciu tagu PU-052 (prywatność) przeszedłby do klasy A bez żadnej kontroli.
- Opcje: (a) start z `launchApp: { clearState: true, permissions: { all: unset }, arguments: … }` we własnym kroku scenariusza; scenariusz musi wtedy paść na prośbie, gdy kod ją wywoła. Koszt: kopia kroków startu jak w 04 i 12. (b) PU-052 → klasa F (test fizyczny po instalacji z TestFlight) plus test statyczny, że kod nie wywołuje `requestPermissionsAsync` i ATT poza ścieżką użytkownika. Koszt: zmiana klasy wymaga słów właściciela (zasada 22). **Rekomendacja: (a)**. Najpierw sprawdzić czerwień, np. wariantem z wymuszoną prośbą w buildzie E2E. Hipoteza BX-028 (czy Maestro w ogóle widzi alert springboardu) zostaje do przebiegu.

### CE-02 · P2 · realny · scenariusz 96 (PU-170) nie sprawdza rosnącego czasu
- Dowód: wynik PU-170 to „Stoper nadal „działa” z rosnącym czasem”, a scenariusz sprawdza tylko „running” (:20, :27). Nagłówek :3 twierdzi, że „Maestro nie porówna dwóch odczytów w asercji”, co jest nieprawdą: scen. 09 robi to w repo (`e2e/scenariusze/09-adr-0019-start-awaryjny.yaml:31-33`, `:69-70`: `copyTextFrom` → `evalScript` → `assertTrue`), a interpreter testów to obsługuje (`tests/jakosc/maestro-runner.ts:287-289`).
- Skutek: stoper, który po powrocie z tła pokazuje zamrożony czas z etykietą „running”, przejdzie scenariusz.
- Naprawa: `copyTextFrom { id: licznik-stoper }` → `evalScript: ${output.przed = maestro.copiedText}` przed tłem; po powrocie (zegar E2E biegnie dalej, `subflows/start-czysty.yaml:4`) to samo i `assertTrue: ${maestro.copiedText != output.przed}`.

### CE-03 · P2 · realny · scenariusz 102 (PU-292) pomija notatki rzędów
- Dowód: wynik PU-292 kończy się słowami „notatki rzędów były cały czas przy liczniku”. Scenariusz nie tworzy żadnej notatki rzędu i jej nie sprawdza (:17–47).
- Skutek: regresja, w której usunięcie wzoru kasuje albo ukrywa notatki rzędów (utrata danych użytkownika), przejdzie scenariusz. Czy chroni przed nią test niższego poziomu, nie ustaliłem: `tests/dane/projekt-kosz.test.ts:173` wymienia tabelę `notatka_rzedu`, ale w innym kontekście.
- Naprawa: przed usunięciem dodać notatkę rzędu, po usunięciu wzoru (zanim wejdzie się do kosza) sprawdzić ją na liczniku, a po przywróceniu sprawdzić ponownie.

### CE-04 · P2 · brzegowy · scenariusz 101 (PU-296) nie wie, który pas zmazano
- Dowód: po gumce na y=35% (:29) jest tylko „1 highlight” (:30, :34). Gumka, która usunie ostatnią kreskę zamiast trafionej, da ten sam wynik. Nagłówek :3 odsyła do zrzutu, a zrzut nie jest asercją.
- Naprawa: drugie pociągnięcie gumką po y=35% musi zostawić „1 highlight”, a pociągnięcie po y=55% musi dać „0 highlights”.

### CE-05 · P2 · realny · scenariusz 98 (PU-180) nie sprawdza treści strony
- Dowód: wynik PU-180 to „Każda strona otwiera się po angielsku, bez błędu”, a scenariusz sprawdza tylko zniknięcie elementów Oczka (:21, :27, :33, :42, :47). Nagłówek :3 przenosi resztę na `scripts/wydanie/sprawdz-adresy.mjs` (200 i zgodność z `site/`, `:59` czyta sekcje `lang="pl|en"`), ale Pokrycie PU-180 w katalogu wymienia tylko scenariusz.
- Opcje: (a) dopisać do Pokrycia PU-180 odnośnik do testu adresów i nazwać ten podział; (b) asercja tytułu strony po angielsku w Safari po każdym linku. Koszt (b): sieć w symulatorze i obca hierarchia. **Rekomendacja: (a)**.

### CE-06 · P3 · teoretyczny · test globu jest tylko negatywny
`tests/jakosc/bx8-numeracja-trzycyfrowa.test.ts:41` sprawdza brak napisu `[0-9][0-9]-*.yaml`. Inny glob, który pominie 100+ (np. `[0-9][0-9]-[a-z]*.yaml`), przejdzie. Tańsza kontrola: wyciągnąć glob z workflow i sprawdzić w bashu, że łapie `100-x.yaml` i `05-x.yaml`.

### CE-07 · P3 · P-889 nieaktualne na HEAD
`docs/decyzje.md:795` (P-889) mówi „dokładnie 10 plików … nic więcej”. Na 1b888e99 lista ma 16 plików (c021aebc: 97–99, ddc5372a: 100–102) i `.sort()`. P-890 obejmuje `.sort()` („lista NOC-6 w tej kolejności”), ale dopisania 97–102 nie ma w żadnej decyzji. Propozycja: nowa decyzja z puli, która rozszerza KO-086 na 97–102, bez edycji P-889. W tej recenzji jej nie dopisałem, bo polecenie pozwala zmieniać tylko plik recenzji.

### CE-08 · P3 · błędne odnośniki w opisach
- `e2e/README.md:423`: „scen. 98 (PU-322)”; PU-322 to scen. 94.
- `e2e/scenariusze/85-pu-104-przewodnik-uklad-i-grupy.yaml:5`: kolejność „?” przed zębatką sprawdza `tests/ekrany/przewodnik.test.tsx:141-152`; scen. 69 i 82 sprawdzają tylko obecność obu przycisków.
- `e2e/scenariusze/94-pu-322-dozywotnio-bez-planow-po-zakupie.yaml:3`: „zdanie PU” o `e2e-sklep-wygas` nie występuje w wierszu PU-322 (`docs/jakosc/przypadki-uzycia.md:244`).

### CE-09 · P3 · brzegowy · scenariusz 85 sprawdza obecność, nie liczbę
Wynik PU-104 mówi o 6 krokach i 9 grupach. Scenariusz sprawdza kroki 1–6 i 9 grup, ale nie to, że nie ma kroku 7 ani dziesiątej grupy. Tańsza kontrola: `assertNotVisible { id: przewodnik-krok-7-pokaz }` po przewinięciu.

## Do sprawdzenia (pewność ≤ 80%)
- Scen. 97 (:30, :36): klawisz „Delete” ma też klawiatura literowa iOS (etykieta „delete”). Czy Maestro 2.12.1 porównuje tekst z rozróżnieniem wielkości liter, nie ustaliłem. Jeśli nie, asercja dowodzi tylko „jakaś klawiatura”, a nie „numeryczna”. Mocniejsza kontrola: `assertNotVisible: "space"` (klawisz spacji ma tylko klawiatura literowa). Rozstrzygnie pierwszy przebieg iOS (zrzut 97-z-klawiatura).
- Scen. 100 i 101 (:45 i :33): po `subflows/restart.yaml` scenariusz czeka na `wzor-widok`. Czy aplikacja po zabiciu wraca na wzór, a nie na „Dziś”, nie sprawdziłem. Jeśli nie wraca, scenariusz będzie czerwony, nie fałszywie zielony.

## Co działa dobrze i należy zachować
- KO-088 to czyste poszerzenie z testem, który pada przy każdej z trzech mutacji osobno, i z osobnym commitem bez zmian w logice.
- Ograniczenia selektorów są nazwane w nagłówkach scenariuszy (BX-021…BX-032), a nie ukryte; PU z częściowym pokryciem zostają „oczekujący”.
- Pokrycie wskazuje linie asercji, a nie nagłówki, i bramka to wymusza.

## Proponowane polecenie naprawy
Sesja 08 fix (sonnet), na gałęzi od integracji po scaleniu: CE-01 (najpierw czerwień), CE-02, CE-03, CE-04, CE-05 (a), CE-06; CE-07 jako decyzja koordynatora; CE-08 i CE-09 przy okazji tych plików. Tag `oczekujacy` w 96, 98, 99, 101 i 102 zostaje do czasu poprawki, niezależnie od wyniku przebiegu iOS.

## Stan repo
`git status --porcelain` przed zapisem recenzji: pusty (pliki śledzone nietknięte; sondy i mutacje tylko w worktree w scratchpadzie).
