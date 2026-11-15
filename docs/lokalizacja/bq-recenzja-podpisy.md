# Audyt: Programista — Oczko, tryb `podpisy` (kod BO) — 2026-11-15
Commit: 6f17ac72 (gałąź `claude/bo-podpisy-api-2026-11-15`, zakres `761b9551..6f17ac72`) · Tryb: audit (recenzja niezależna BQ, rola 08) · Środowisko: Linux, Node 22, `npm ci` kod 0, bez sieci do API (atrapa fetch); workflowów nie wyzwalano. Raportu autora ani `docs/lokalizacja/bo-stan.md` nie czytano.

## Podsumowanie
**Werdykt: GOTOWY Z UWAGAMI do przebiegu płatnego** (stan 6f17ac72; po reaudycie 9fe3a63: **GOTOWY**, 001–005 zamknięte — sekcja „Reaudyt” na końcu). Bezpieczeństwo kosztu jest egzekwowane: szacunek i STOP przed jakimkolwiek POST batcha, `tylko_szacuj` nie wysyła nic, klucz nie trafia do logów ani artefaktu (sondy na atrapie API). Szacunek pełnego przebiegu: ≈ 1,90 USD (opus, high, przekład + krytyk, 27 języków). Uwagi dotyczą tego, co dzieje się **po** przebiegu: wznowienie po przekroczeniu czasu batcha krytyka nie ma poprawnej drogi (komunikat skryptu prowadzi na złą), odrzucona poprawka krytyka nie blokuje przyjęcia języka, a sam etap `krytyk` daje po przyjęciu fałszywy status „przekład API”. Przebieg `przeklad+krytyk` można uruchomić. Przed `przyjmij` trzeba naprawić 002 albo ręcznie przejrzeć języki z odrzuconymi poprawkami krytyka. Przy przekroczeniu czasu krytyka nie wolno wznawiać jego identyfikatorem (001).

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 08-programista-001 | P1 | D | Wznowienie po przekroczeniu czasu batcha krytyka: komunikat prowadzi na złą drogę, jedyna działająca dubluje płatny batch | zweryfikowane (9fe3a63) |
| 08-programista-002 | P1 | D | Poprawka krytyka odrzucona twardą kontrolą nie blokuje przyjęcia; zakwestionowany podpis trafia do pliku ze statusem „+ krytyk” | zweryfikowane (9fe3a63) |
| 08-programista-003 | P2 | D | Etap `krytyk` na obecnych podpisach (sesja AW, bez API) po przyjęciu dostaje status „przekład API (…) + krytyk” | zweryfikowane (9fe3a63) |
| 08-programista-004 | P3 | D | Kontrole słownikowe: fałszywe alarmy (fr „pris”, ms „siri”) odrzucają cały język; luki w „free” i cenie | zweryfikowane (9fe3a63) |
| 08-programista-005 | P3 | D | `--limit` z wartością nieliczbową znaczy „wszystkie 27 języków” | zweryfikowane (9fe3a63) |

Poziomy według polecenia BQ (P1/P2/P3); P3 = szlif (w szablonie roli: P2).

## Linia bazowa i założenia
Linia bazowa (przed odczytem testów BO): ścieżka płatna = szacunek → STOP bez zgody → batch 1 → batch 2 → artefakt; ścieżka zapisu = `przyjmij` do `docs/wydanie/metadane/podpisy-zrzutow.json` (jedyny zapis do repo). Najlepsza w klasie wersja: koszt sprawdzony przed pierwszym płatnym żądaniem, każde wznowienie idempotentne (identyfikator batcha powiązany z etapem), przyjęcie tylko tego, co krytyk zaakceptował, i status pochodzenia zgodny z tym, co naprawdę się stało.

Wymiary pokrycia:
- Ścieżki zapisu: `przyjmij` (sprawdzone sondą: tylko języki z przekładu, en i pl nietknięte, formatowanie pliku zachowane — `bq-dowody/przyjmij-diff.txt`); znaleziska 002, 003.
- Obsługa błędów: przekroczenie czasu, błąd HTTP, zły batch przy wznowieniu (sonda); znalezisko 001.
- Typy na granicach: odpowiedź modelu parsowana z tekstu (`wydobadzObiekt`), każdy podpis przez `sprawdzPodpis`; brak `as`/`any` (plik `.mjs`). Sprawdzone, brak problemu.
- System projektowy, dostępność, i18n w aplikacji: nie dotyczy (skrypt CI, nie ekran).
- Wydajność: 2 batche, brak zapytań w pętli poza `count_tokens` (bezpłatne) — sprawdzone, brak.
- Testy na właściwym poziomie: logika czysta, atrapa fetch, test przyjęcia na kopii katalogu — tak. Luki testów odpowiadają znaleziskom 001–003.
- Liczby konfiguracyjne: limit 30 USD i `MAX_TOKENS` z `przeklad-api.mjs` (jedno miejsce); `MYSLENIE_PODPISY = 1500` nazwane założeniem.

Soczewki: przerwany przebieg (001), recenzent szukający ścieżki bez testu (002, 003), programista czytający moduł pierwszy raz (005). Proponowanych zmian w `docs/zalozenia.md` brak.

## Pokrycie
| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| `scripts/i18n/przeklad-podpisy.mjs` (316 linii) | tak, cały | odczyt + `bq-dowody/sonda.txt`, `bq-dowody/kontrole.txt` |
| zmiany `scripts/i18n/przeklad-produkty.mjs` | tak | diff + `bq-dowody/produkty-rownosc.txt` (33 języki: 0 różnic słownika i żądania) |
| tryb `podpisy` w `.github/workflows/przeklad-tlumaczen.yml` | tak (odczyt) | linie 79–135, 194–203 |
| testy zakresu (6 plików) | uruchomione | `bq-dowody/jest-zakres.txt` (98/98, kod 0) |
| `scripts/i18n/przeklad-api.mjs` (klient, limit, czekanie) | tylko używane funkcje | odczyt linii 22–31, 85, 299–340 |
| przebieg na prawdziwym API, zachowanie GitHub przy `timeout-minutes` | nie (zakaz wyzwalania, brak sieci do API) | — |

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/lokalizacja/bq-recenzja-podpisy.md . --rola 08-programista` → „OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 08-programista”, kod 0 (kopia skryptu w scratchpadzie). Klucz w sondach: atrapa `sk-ant-atrapa`.

### Zadanie 1: koszt i bezpieczeństwo przebiegu płatnego
| Pytanie | Odpowiedź | Dowód |
|---|---|---|
| Limit 30 USD (P-481) egzekwowany przed wysłaniem partii | TAK | `scripts/i18n/przeklad-podpisy.mjs:235` (STOP, kod 3) przed pierwszym `api.utworz` (`:246`); limit z `scripts/i18n/przeklad-api.mjs:29` (zmienna środowiska może go tylko obniżyć); sonda: kod 3, 0 POST batcha (`bq-dowody/sonda.txt`, `limit_bez_zgody`) |
| `zgoda_koszt` egzekwowana | TAK | `.github/workflows/przeklad-tlumaczen.yml:124` → `--zgoda-koszt` tylko przy „tak”; bez niej STOP jak wyżej. Zgoda nie ma górnego pułapu (jak w innych trybach, P-481) |
| `tylko_szacuj=true` nie wysyła płatnych zapytań | TAK | `.github/workflows/przeklad-tlumaczen.yml:125`; `scripts/i18n/przeklad-podpisy.mjs:229` (`api` = null przy `--szacuj`), `:236`; sonda: 0 wywołań fetch mimo klucza w env (`szacuj`) |
| Klucz API poza logami i artefaktem | TAK | klucz tylko w env kroku `.github/workflows/przeklad-tlumaczen.yml:105`; nagłówek w `scripts/i18n/przeklad-api.mjs:308`; komunikaty błędów przez `maskuj` (`scripts/i18n/przeklad-podpisy.mjs:275`); sonda z kluczem w treści błędu 401: brak w logach i w plikach artefaktu (`klucz`) |
| Wznowienie nie dubluje partii | **NIE w pełni** | wznowienie przekładu: TAK (`:244`, bez nowego POST). Wznowienie po przekroczeniu czasu krytyka: brak poprawnej drogi; jedyna działająca dubluje batch krytyka — 08-programista-001 |

Uwaga (teoretyczna, bez znaleziska): limit działa na szacunku (≈ 1,90 USD), a nie na twardym pułapie. Gdyby każde z 54 żądań wyczerpało `MAX_TOKENS` 64000, samo wyjście kosztowałoby ≈ 34,56 USD (`bq-dowody/szacunek.txt`). Tak samo jest w trybach `metadane` i `produkty`. Przy 7 krótkich hasłach na język taki scenariusz jest nierealny.

## Stosowalność listy kontrolnej
| Pozycja | Status (dotyczy / nie dotyczy + powód / decyzja D-xx) | Wynik (ok / znalezisko ID / nie sprawdzono + powód) |
|---|---|---|
| DEV-01 | dotyczy (twarde kontrole P-809, parsowanie, scalanie poprawek) | ok: testy `tests/wydanie/podpisy-przeklad.test.ts`; luki 002, 003 |
| DEV-02 | dotyczy | ok: fb1c4fb1 (testy, czerwone) przed 6a0523a8 (kod); 2/2 commity zakresu |
| DEV-03 | dotyczy | ok: 4 zmienione testy tylko dopisują `podpisy` do listy opcji (diff), bez `.skip`/`.only` |
| DEV-04 | dotyczy | ok: zakres 98/98, kod 0 (`bq-dowody/jest-zakres.txt`); pełne `npm test -- --ci`: 608 zestawów, 7399 testów, kod 0 (`bq-dowody/npm-test.txt`) |
| DEV-05 | dotyczy (zapis pliku JSON w `przyjmij`) | ok: zapis całego pliku, tylko języki z przekładu; en, pl nietknięte (`bq-dowody/przyjmij-diff.txt`) |
| DEV-06 | nie dotyczy: brak bazy i migracji | — |
| DEV-07 | dotyczy | ok: brak podpisu = odrzucenie języka, nie wartość domyślna; `r.meta?.model ?? '?'` tylko w statusie |
| DEV-08 | dotyczy (data w statusie) | ok: data przebiegu z `dzis`, ISO |
| DEV-09 | dotyczy (odpowiedź modelu, artefakt) | ok: parsowanie i kontrola każdego pola; artefakt sprawdzany ponownie w `przyjmij` |
| DEV-10 | dotyczy | 08-programista-001 |
| DEV-11 | nie dotyczy: brak interfejsu | — |
| DEV-12 | nie dotyczy: teksty sklepu, nie `t()` | — |
| DEV-13 | dotyczy | ok: limit i `MAX_TOKENS` z jednego modułu |
| DEV-14 | dotyczy | ok: brak sekretów w diffie; klucz tylko z sekretu repo |
| DEV-15 | nie dotyczy: skrypt jednorazowy | — |
| DEV-16 | dotyczy (USD, tokeny, minuty) | ok: `czekajMin`, `interwalS`, `koszt_usd` z jednostką w nazwie |

## Znaleziska

### 08-programista-001 · Wznowienie po przekroczeniu czasu batcha krytyka: komunikat prowadzi na złą drogę, jedyna działająca dubluje płatny batch
- Pozycja listy kontrolnej: DEV-10
- Poziom: P1
- Realność: brzegowy (27 krótkich żądań zwykle mieści się w 120 min; Batch API może trwać dłużej) · Pewność: wysoka
- Rodzaj: D
- Dowód: `bq-dowody/sonda.txt` (scenariusz 4). Po przekroczeniu czasu krytyka skrypt każe użyć `--wznow msgbatch_B2` (identyfikator krytyka; `scripts/i18n/przeklad-api.mjs:327`). (a) Przy domyślnym `etap=przeklad+krytyk` identyfikator trafia do etapu przekładu (`scripts/i18n/przeklad-podpisy.mjs:244`), a `odczyty` zdejmuje oba przedrostki `pp-`/`pk-` bez sprawdzenia (`:213`): wyniki krytyka są czytane jako przekład, więc oba języki zostają odrzucone („brak ekranu”), kod 1. (b) Przy `etap=krytyk` wyniki krytyka trafiają na podpisy **z pliku** (`:225`, sesja AW), a nie na przekład z batcha 1; skrypt kończy się kodem 0 i daje `wynik` gotowy do `przyjmij`. (c) `--wznow <id przekładu>` działa, ale wysyła nowy batch krytyka (`posty_nowe: 1`), czyli drugi raz płaci za etap 2.
- Mechanizm: jeden parametr `--wznow` dla dwóch batchy, bez powiązania identyfikatora z etapem; `grep -n "let id = wznow" scripts/i18n/*.mjs` → 4 trafienia: `scripts/i18n/przeklad-podpisy.mjs:244`, `scripts/i18n/przeklad-podpisy.mjs:259`, `scripts/i18n/przeklad-metadane.mjs:338`, `scripts/i18n/przeklad-metadane.mjs:352` (wzór odziedziczony po P-501, `metadane` poza zakresem BQ). Prawdopodobieństwo zwiększa limit zadania `timeout-minutes: 180` (`.github/workflows/przeklad-tlumaczen.yml:70`) przy oczekiwaniu do 2 × 120 min.
- Powraca: nie
- Wzorzec lub źródło: zadanie BQ 4.1 („czy wznowienie nie dubluje partii”); zasada wspólna 13 (koszty).
- Kroki w aplikacji: workflow `podpisy` → batch krytyka nie kończy się w 120 min → kod 4 z poleceniem `--wznow <id krytyka>` → operator wykonuje polecenie.
- Opcje: (a) `odczyty` sprawdza przedrostek (`pp-` w etapie 1, `pk-` w etapie 2) i odrzuca zły batch; dochodzi drugi parametr `--wznow-krytyk` (albo identyfikator przekładu brany z artefaktu), a komunikat po przekroczeniu czasu podaje poprawne polecenie. Kosztem jest mała zmiana w skrypcie i teście. (b) Tylko instrukcja: po przekroczeniu czasu krytyka wznawiać identyfikatorem przekładu i zaakceptować podwójny koszt etapu 2 (≈ 1 USD), plus sama kontrola przedrostka. Rekomendacja: (a); (b) wystarcza jako wyjątek na pierwszy przebieg.
- Test akceptacyjny: atrapa z zawieszonym batchem 2 → wznowienie poleceniem z komunikatu nie wysyła nowego POST i daje wyniki krytyka nałożone na propozycję z batcha 1; batch o złym przedrostku daje błąd z nazwą etapu.
- Status: otwarte

### 08-programista-002 · Poprawka krytyka odrzucona twardą kontrolą nie blokuje przyjęcia; zakwestionowany podpis trafia do pliku ze statusem „+ krytyk”
- Pozycja listy kontrolnej: DEV-01
- Poziom: P1
- Realność: realny (limit 40 znaków: poprawka dłuższa niż 40 znaków jest prawdopodobna w de, fr, ru, el, fi) · Pewność: wysoka
- Rodzaj: D
- Dowód: `bq-dowody/sonda.txt` (scenariusz 5). Krytyk zgłasza dla `de/02-licznik` „sens odwrócony względem źródła” z tekstem 41 znaków. Poprawka zostaje odrzucona (`scripts/i18n/przeklad-podpisy.mjs:153`), ale `krytyk.blad` jest pusty, więc `wynik` = przekład bez zmian (`:267`). `przyjmij` sprawdza tylko `krytyk.blad` (`:299`) i zapisuje zakwestionowany podpis ze statusem z dopiskiem + krytyk (`:304`). Wynik sondy: `przyjmij: 0`, `podpis_de_e1` bez zmian.
- Mechanizm: `krytyk.odrzucone` liczone, ale nie używane przy przyjęciu; `grep -n "krytyk.odrzucone\|krytyk?.odrzucone" scripts/i18n/przeklad-podpisy.mjs` → 1 trafienie, tylko w tabeli podsumowania.
- Powraca: nie
- Wzorzec lub źródło: P-808 („przyjęcie lokalnie tylko po udanym krytyku”); zadanie BQ 4.2 („przyjęcie tylko po krytyku”).
- Kroki w aplikacji: przebieg płatny → `przyjmij --raport` → podpis, który krytyk uznał za błędny, trafia do ramek sklepu z oznaczeniem, że krytyk go przeszedł.
- Opcje: (a) `przyjmij` odrzuca język, gdy `krytyk.odrzucone` zawiera powód inny niż „tekst taki sam jak obecny” (bez flagi; ponowny przebieg tylko tego języka przez `tylko`). Tanio i bezpiecznie, ale wymaga drugiego przebiegu dla tych języków. (b) Przyjąć, ale ze statusem „krytyk: N odrzuconych poprawek; przegląd człowieka obowiązkowy”. Bez kosztu, za to wymaga człowieka. (c) Przy odrzuceniu poprawki wysłać krytykowi informację zwrotną i zrobić trzecią rundę. Najlepsza jakość, ale nowy etap i koszt. Rekomendacja: (a).
- Test akceptacyjny: atrapa krytyka z poprawką 41 znaków → `przyjmij` daje kod 1 dla tego języka, plik nie zmienia się; poprawka „taka sama jak obecny” nie blokuje.
- Status: otwarte

### 08-programista-003 · Etap `krytyk` na obecnych podpisach (sesja AW, bez API) po przyjęciu dostaje status „przekład API (…) + krytyk”
- Pozycja listy kontrolnej: DEV-01
- Poziom: P2
- Realność: brzegowy (etap `krytyk` wybiera się jawnie; workflow go oferuje) · Pewność: wysoka
- Rodzaj: D
- Dowód: `bq-dowody/sonda.txt` (scenariusz 6), `bq-dowody/przyjmij-diff.txt`. Status `cs` zmienia się z „przekład maszynowy z en (sesja AW, 2026-11-12, P-771)…” na „przekład API (claude-opus-5-5, 2026-11-15) + krytyk”, choć treść podpisu się nie zmienia. Propozycja pochodzi z pliku (`scripts/i18n/przeklad-podpisy.mjs:225`), a status ustala `scripts/i18n/przeklad-podpisy.mjs:304`, który nie rozróżnia etapów (`meta.etap` jest w raporcie, ale `przyjmij` go nie czyta).
- Mechanizm: jedno sformułowanie statusu dla obu źródeł propozycji; 1 trafienie (`:304`).
- Powraca: nie
- Wzorzec lub źródło: zasada wspólna 2 (dowód zamiast deklaracji: status ma mówić, co się stało).
- Kroki w aplikacji: workflow `podpisy`, `etap=krytyk` → `przyjmij` → plik twierdzi, że przekład zrobiło API.
- Opcje: (a) `przyjmij` czyta `meta.etap` i dla `krytyk` zapisuje „przekład z <poprzedni status> + krytyk API (<model>, <data>)”. Dokładnie, mała zmiana. (b) `przyjmij` odmawia raportu z `etap=krytyk` bez flagi. Prościej, ale traci użyteczny tryb. Rekomendacja: (a).
- Test akceptacyjny: raport `etap=krytyk` → status zawiera poprzednie pochodzenie i „krytyk API”, nie „przekład API”.
- Status: otwarte

### 08-programista-004 · Kontrole słownikowe: fałszywe alarmy (fr „pris”, ms „siri”) odrzucają cały język; luki w „free” i cenie
- Pozycja listy kontrolnej: DEV-01
- Poziom: P3
- Realność: brzegowy · Pewność: wysoka
- Rodzaj: D
- Dowód: `bq-dowody/kontrole.txt`. Fałszywe alarmy: „Tout est pris en compte” (fr, „pris” = „wzięty”) daje „cena lub waluta”, a „Siri projek anda” (ms, „siri” = „seria”) daje „marka” (`scripts/i18n/przeklad-podpisy.mjs:61`, `scripts/i18n/przeklad-podpisy.mjs:63`). Odrzucenie jednego podpisu odrzuca cały język, więc trzeba ponowić przebieg. Luki (podpis przechodzi): cs/sk „Bezplatný/á” (lista ma tylko polskie „bezpłatn”), fi „Maksuton”, sv/nb „Kostnadsfri”, nl „Kosteloos”, ja „無償”, pt „preço” (`scripts/i18n/przeklad-podpisy.mjs:62`, `:61`).
- Mechanizm: jedna lista wyrażeń dla wszystkich języków, bez granicy słowa przy markach; 3 wyrażenia (`:61`–`:63`).
- Powraca: nie
- Wzorzec lub źródło: P-809 nazywa listę „free” niepełną i zostawia sens krytykowi. Luki pokrywa więc krytyk i przegląd; fałszywy alarm to tylko koszt.
- Kroki w aplikacji: przebieg płatny → fr albo ms odrzucony mimo poprawnego tekstu.
- Opcje: (a) kontrole zależne od języka („pris” tylko sv/da/nb; marki z granicą słowa i wyjątkiem „siri” dla ms) plus brakujące formy. Kosztem jest kilka linii i testów. (b) zostawić i ponawiać odrzucone języki przez `tylko`. Rekomendacja: (a) przy okazji 001/002.
- Test akceptacyjny: przykłady z `bq-dowody/kontrole.txt` dają oczekiwany wynik.
- Status: otwarte

### 08-programista-005 · `--limit` z wartością nieliczbową znaczy „wszystkie 27 języków”
- Pozycja listy kontrolnej: DEV-07
- Poziom: P3
- Realność: brzegowy (pole tekstowe workflow) · Pewność: wysoka
- Rodzaj: D
- Dowód: `scripts/i18n/przeklad-podpisy.mjs:187` (`Number(…) || null`); sonda `--limit dwa` → 27 języków (`bq-dowody/sonda.txt`, `limit_niepoprawny`). Limit kosztu nadal chroni.
- Mechanizm: ten sam wzorzec w innych trybach (`grep -n "o.limit = Number" scripts/i18n/*.mjs`); poza zakresem BQ.
- Powraca: nie
- Wzorzec lub źródło: rola 08, zasada 9 (brak zostaje brakiem, zła wartość daje błąd).
- Kroki w aplikacji: przebieg dowodowy z `limit` = „dwa” → pełny przebieg zamiast dwóch języków.
- Opcje: (a) błąd konfiguracji (kod 2) dla wartości, która nie jest dodatnią liczbą całkowitą. (b) zostawić. Rekomendacja: (a).
- Test akceptacyjny: `--limit dwa` → kod 2.
- Status: otwarte

## Do sprawdzenia
- Czy kroki `if: always()` (artefakt) wykonują się, gdy zadanie przerwie `timeout-minutes: 180`. Brak dowodu w tym środowisku. Identyfikatory batchy są w logu przebiegu, ale `batch-id-*.txt` nie wchodzą do artefaktu (`.github/workflows/przeklad-tlumaczen.yml:200`, tylko `*.json`).
- Czy plan składu ramek (`tests/wydanie/uklad-podpisow.test.ts`: najwyżej 2 wiersze, bez jednoliterowego słowa na końcu wiersza) przyjmie każdy podpis ≤ 40 znaków. Skrypt tego nie sprawdza. Po `przyjmij` wykryje to `npm test`, ale dopiero po płatnym przebiegu.

## Co działa dobrze i należy zachować
- STOP kosztu przed pierwszym płatnym żądaniem, limit, którego zmienna środowiska nie podniesie, i klucz w jednym kroku workflow.
- „Komplet albo żaden” na każdym etapie (parsowanie, poprawki krytyka, wynik po poprawkach, ponownie w `przyjmij`).
- Długość liczona w punktach kodowych, zgodnie z `tests/wydanie/uklad-podpisow.test.ts:27`, z normalizacją NFC.
- `przyjmij` zachowuje formatowanie pliku i nie dotyka en, pl ani języków bez sklepu.
- Refaktor `przeklad-produkty.mjs` nie zmienia zachowania: 0 różnic w słowniku i w żądaniu dla 33 języków (`bq-dowody/produkty-rownosc.txt`).

## Decyzje dla właściciela
Brak dla właściciela (P-087). Dla koordynatora: (1) czy przebieg płatny idzie przed naprawą 001/002, z wyjątkiem nazwanym (przy przekroczeniu czasu krytyka wznawiać identyfikatorem przekładu, a przed `przyjmij` ręcznie sprawdzić `krytyk.odrzucone`), czy po naprawie. Rekomendacja: naprawa 002 przed `przyjmij`; sam przebieg może iść od razu. (2) Opcje 001–005 jak wyżej. Pula P-814…P-815 niewykorzystana.

## Proponowane polecenie naprawy
`node tools/assemble.mjs 08-programista --tryb fix --zadania 08-programista-001,08-programista-002,08-programista-003` (004 i 005 opcjonalnie w tej samej partii); wykonawca: rola 09 (autor BO) albo 08.

## Reaudyt (wąski) — 9fe3a63, 2026-11-15
Zakres: tylko poprawki BO do 001–005, diff `6f17ac72..9fe3a63` (kod 6875aa50, testy 3a8d32bc przed kodem). Odwołania w tej sekcji podaję jako „plik@9fe3a63 l. N”, bo linie dotyczą nowej wersji, a nie commita bazowego raportu. Dowody: sondy na atrapie API, `bq-dowody/sonda-reaudyt.txt` i `bq-dowody/kontrole-reaudyt.txt`; testy zakresu 107/107, kod 0 (`bq-dowody/jest-reaudyt.txt`).

| ID | Status | Dowód |
|---|---|---|
| 08-programista-001 | ZAMKNIĘTE | `--wznow` przyjmuje „B1” albo „B1,B2” (przeklad-podpisy.mjs@9fe3a63 l. 232–242, 245). Przedrostek `pp-`/`pk-` jest sprawdzany, a batch innego etapu daje kod 2 (l. 227). Po przekroczeniu czasu krytyka komunikat podaje `--wznow B1,B2` (l. 271). Sonda: wznowienie według komunikatu daje 0 nowych POST, a wynik pochodzi z propozycji batcha 1. Sam B2 oraz odwrócona kolejność dają kod 2 i 0 POST. Oczekiwanie wynosi 80 min na etap (l. 217), czyli 2 × 80 < 180. `batch-id-*.txt` jest w artefakcie (przeklad-tlumaczen.yml@9fe3a63 l. 206), a workflow sprawdza format pary (l. 128) |
| 08-programista-002 | ZAMKNIĘTE | Odrzucona poprawka blokuje przyjęcie (l. 337), z wyjątkiem poprawki „taka sama jak obecny” i duplikatu (l. 158). Sonda: poprawka 41 znaków daje `przyjmij` kod 1 i plik bez zmian; poprawka bez zmiany tekstu daje kod 0 |
| 08-programista-003 | ZAMKNIĘTE | Sam etap krytyk zachowuje dotychczasowe pochodzenie i dopisuje „krytyk API” (l. 341). Sonda: status `cs` = „przekład maszynowy z en (sesja AW…) …; krytyk API (claude-opus-5-5, 2026-11-15); [DO PRZEGLĄDU]…” |
| 08-programista-004 | ZAMKNIĘTE | „pris” jest sprawdzane tylko dla sv/da/nb (l. 63), „Siri” z granicą słowa i z wyjątkiem ms (l. 66), a lista „free” uzupełniona (l. 64). Wszystkie 13 przykładów z kontroli daje oczekiwany wynik |
| 08-programista-005 | ZAMKNIĘTE | `--limit` przyjmuje tylko dodatnią liczbę całkowitą (l. 191). Sonda: „dwa” daje kod 2 |

Nowe ryzyka w wznowieniu i `przyjmij` (żadne nie blokuje przebiegu płatnego):
- **R1 (P3, teoretyczny):** kontrola wstępna etapu `krytyk` wywołuje `sprawdzKomplet` bez kodu języka (l. 251). Kontrole zależne od języka (ms „siri”, skand. „pris”) działają tam jak dawniej. Dziś podpisy `ms` nie zawierają „siri”. Później sprawdza się to ponownie z kodem języka w `przyjmij` (l. 334).
- **R2 (P3, brzegowy):** `--etap krytyk --wznow B2`, gdzie B2 pochodzi z pełnego przebiegu, nadal przechodzi kontrolę przedrostka (`pk-`) i nakłada poprawki na podpisy z pliku zamiast na propozycję batcha 1. Komunikat skryptu już tam nie prowadzi, a status zachowuje pochodzenie. Tańsza kontrola: wystarczy zasada w runbooku „wznawiam tylko poleceniem z komunikatu”.
- **Uwaga (nie znalezisko):** poprawka krytyka odrzucona za „nieznany ekran” albo „brak powodu” też blokuje cały język. To zachowanie zachowawcze, które może kosztować ponowny przebieg jednego języka przez `--tylko`.

**Werdykt po reaudycie: GOTOWY do przebiegu płatnego** (uwagi R1 i R2 to P3 i nie wymagają naprawy przed przebiegiem).
