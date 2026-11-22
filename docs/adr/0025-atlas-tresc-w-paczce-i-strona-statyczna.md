# 0025. Atlas technik (1.1): katalog w paczce aplikacji (tylko do odczytu, osobno od danych użytkownika) i strona statyczna z tych samych danych — podkatalogi językowe, hreflang dwustronny z x-default, tylko języki gotowe; hosting i adres do decyzji właściciela
Data: 2026-10-26 · Status: **proponowana** (P-201: Q2 i Q3 u właściciela; domyślnie rekomendacje (a)) · Rola: 05 (build, atlas 1.1) · Zależy od: P-093 (3), P-095, P-192, P-201, ADR-0001, ADR-0017, ADR-0022, ADR-0023

## Kontekst i problem
Ten sam katalog (ADR-0023) trafia do aplikacji (A1–A3) i na stronę (S1–S3; `docs/atlas/e0-rozpoznanie.md` §3). Trzeba ustalić sposób dostarczenia treści do aplikacji, budowę strony i jej hosting na osobnej, opisowej domenie (P-093 (3)), a także zachowanie w językach bez źródła terminologii (P-095 D1).

## Czynniki decyzji
- Moduł `pakiety-tresci`: treść tylko do odczytu osobno od danych użytkownika; manifest z wersją i SHA-256.
- Google (odczyt 2026-10-26, developers.google.com/search/docs/specialty/international/localized-versions): „Each language version must list itself as well as all other language versions.”; dla niedopasowanych języków „Use the the x-default value”.
- P-095: podkatalogi językowe, bez strony na każdy skrót, język publikowany tylko z przeczytanym źródłem terminologii i przeglądem.
- GitHub Pages (odczyt 2026-10-26): „Maximum of one pages site per repository”; strona do 1 GB, 100 GB/mies. (miękko), wdrożenie ≤ 10 min; nie jako hosting działalności „primarily directed at facilitating commercial transactions”. Repo Oczka ma już stronę produktu (`site/`, `pages.yml`).
- Koszt 0 zł poza domeną (decyzja właściciela, P-093 D4).

## Rozważane opcje
Dostarczenie do aplikacji: A. w paczce aplikacji · B. pakiet pobierany z serwera.
Hosting strony (Q2): A. osobne publiczne repo z Pages; jego przepływ CI klonuje publiczne repo Oczka z tagu i uruchamia generator, bez sekretów · B. podkatalog strony produktu · C. inny darmowy hosting statyczny.
Język w aplikacji bez źródła (Q3): A. karta po angielsku z informacją o języku · B. atlas ukryty w tym języku.

## Decyzja
Domyślnie opcje A we wszystkich trzech (P-201); Q2 i Q3 rozstrzyga właściciel — zmiana nie rusza formatu ani silnika.
1. **Aplikacja: katalog w paczce** (JSON kart + manifest `atlas.json` z `format`, `wersja`, `pliki [{sciezka, bajty, sha256}]`), wczytywany tylko do odczytu, poza bazą SQLite użytkownika (ADR-0001 bez zmian). Aktualizacja treści = nowe wydanie (ADR-0021). Brak zapisu danych użytkownika przez atlas → brak ścieżek utraty danych (E2 potwierdzi tabelą).
2. **Przełącznik Q3** w konfiguracji (`ATLAS_JEZYK_BEZ_ZRODLA: 'angielski' | 'ukryj'`, domyślnie `'angielski'` do decyzji właściciela): karta w języku użytkownika tylko, gdy `jezyki_gotowe` go zawiera; inaczej według przełącznika. Wyświetlanie informacji o języku: projekt 04.
3. **Strona:** generator (`scripts/atlas/strona.mjs`, E2) z tych samych kart: `/<tag>/` (tag BCP 47 jak `jezyki_gotowe`), jedna strona na technikę i jedna na tabelę słownikową, bez stron na pojedyncze skróty; w `<head>` pełna lista `hreflang` (każda wersja wymienia siebie i pozostałe) + `x-default` na stronę wyboru języka; mapa strony z tych samych danych; rysunek SVG wstawiony do HTML (jeden plik na wszystkie języki), motyw ciemny przez klasy ról i `prefers-color-scheme`; język bez wpisu w `jezyki_gotowe` nie dostaje strony (test).
4. **Hosting (Q2, domyślnie A):** osobne publiczne repo z Pages; adres: `[DO USTALENIA: domena — właściciel, P-093 D4]` (pole `ATLAS_ADRES` w konfiguracji generatora, puste = brak `canonical` i `hreflang` z adresem bezwzględnym → generator kończy się błędem w trybie publikacji). Założenie repo i zakup domeny: konto właściciela.
5. **Odnośnik do App Store:** ID aplikacji z konfiguracji roli 10 `[DO USTALENIA]`.

### Konsekwencje
- Dobre: działa offline od pierwszego uruchomienia; brak serwera i kosztu; strona i aplikacja z jednego źródła; hreflang sprawdzalny testem.
- Złe: poprawka treści w aplikacji czeka na wydanie; drugie repo do utrzymania (tylko przepływ wdrożenia).
- Od czego zależy (warunkowa): Q2 i Q3 (właściciel); domena; ryzyko przeznaczenia Pages (R-A4) — przy odmowie opcja C z ADR i limitem.

### Potwierdzenie
- E2: test generatora strony — dla każdej strony zbiór `hreflang` = `jezyki_gotowe` karty ∪ {`x-default`}, symetria między wersjami; brak strony dla języka spoza `jezyki_gotowe`; brak strony skrótu; każdy SVG przechodzi `straznikLiter`.
- E2: test manifestu katalogu (SHA-256, odrzucenie nowszego `format`); test przełącznika Q3 (obie wartości).

## Opcje: zalety i wady
### Dostarczenie A (w paczce) — zalety: offline, bez serwera · wady: treść tylko z wydaniem.
### Dostarczenie B (pobierany pakiet) — zalety: treść bez wydania · wady: serwer i koszt, stan „brak pakietu”, integralność i podpis manifestu (moduł `pakiety-tresci`).
### Hosting A (osobne repo) — zalety: osobna domena przy 0 zł, brak sekretów (klonowanie publicznego repo) · wady: drugie repo.
### Hosting B (podkatalog strony produktu) — zalety: najszybciej · wady: sprzeczne z P-093 (3), dwie strony w jednym wdrożeniu.
### Hosting C (inny hosting) — zalety: brak limitu „jedna strona na repo” · wady: nowa usługa i konto (zasada 13).
