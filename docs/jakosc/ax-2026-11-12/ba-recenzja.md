# Audyt: Programista — Oczko — 2026-11-12 (sesja AX: recenzja niezależna BA)
Commit: 625350a (zakres 3d9ca08..625350a, 1 commit, `claude/ba-zakreslacz-2026-11-12`) · Tryb: audit (recenzja; zlecenie koordynatora session_01T66VBwtoK6C7tLVC34ZUz4, zmiana koordynatora potwierdzona w `stan.md` gałęzi `origin/koordynacja` @ 4229aff9, wiersz 18 „Koordynator aktywny”) · Środowisko: Linux, Node v22.23.4; bez macOS/Xcode (Swift i PencilKit nieuruchamialne; rendering niesprawdzony).

Prompt roli jak w sesji AX (do linii `=== KONIEC PROMPTU ROLI ===`; ostatni `##`: „Kontrola dowodów i sekretów przed oddaniem raportu”). ID znalezisk ciągną numerację z raportu AX (`08-programista-2026-11-12.md`: 001–004), żeby się nie dublowały.

## Podsumowanie
BA robi to, co mówi KO-052 opcja B: jedna stała `ZAKRESLACZ_ALFA = 0.45` w `modules/oczko-wzor/ios/WidokWzoru.swift:42`, token `wzor.zakreslaczAlfa` i test równości. Format zapisu rysunków się nie zmienia, migracja nie jest potrzebna. Test jest czerwony na 3d9ca08 (3 z 4, kod 1, na asercjach) i zielony na 625350a (4/4, kod 0). Rachunek 5,14:1 odtworzyłem niezależnie, ale to wynik modelu. Pomiar roli 04 przy alfie koloru 1,0 nie pasuje do tego modelu, więc rzeczywisty efekt w PencilKit jest nieznany. Pokaże go dopiero kandydat. Pełna bramka na 625350a zielona (Jest 7298/7298). Brak P0 i P1; werdykt scalenia BA do integracji: **TAK**, z warunkami (sekcja Decyzje).

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 08-programista-005 | P2 | D | Prognoza 5,14:1 i test opierają się na modelu niezgodnym z pomiarem 04; test strzeże tokenu, nie renderu | otwarte |
| 08-programista-006 | P2 | D | Kontrola pikseli zrzutów (`kontrola-zakreslen.mjs`) pada, gdy efektywna alfa pasa spadnie poniżej ok. 0,36 | otwarte |

## Linia bazowa i założenia
Najlepsza w klasie poprawka kontrastu pod zakreśleniem (a) rozwiązuje problem w miejscu, gdzie powstaje (kompozycja PencilKit nad PDF), (b) ma dowód z renderu, a nie tylko z rachunku, (c) nie zmienia zapisanych danych użytkownika, (d) nie psuje kontroli, które zależą od barwy pasa. Wzorzec z raportu 04: pas pod tekstem (`docs/design/dzianina/ekrany.html:98`), czyli opcja A, odłożona przez KO-052 do 1.0.1.

Wymiary pokrycia:
- Ścieżki zapisu: rysunki zapisują się przez `PKDrawing.dataRepresentation()` (`modules/oczko-wzor/ios/WidokWzoru.swift:496`) i odczytują przez `PKDrawing(data:)` (`:330`, `:333`). Diff tego nie zmienia; nowe pociągnięcia niosą alfę w kolorze tuszu, stare zostają bez zmian (P-773 to nazywa). Migracji nie ma i nie trzeba.
- Obsługa błędów: diff bez nowych ścieżek błędów — sprawdzone, brak.
- Typy na granicach: test czyta `tokeny.json` z `unknown` i zawęża `in` (`tests/dzianina/zakreslacz-kontrast.test.ts:25-26`); `as unknown as Rgb` tylko w pomocniku testu — styl, nie znalezisko.
- System projektowy: token dodany w `docs/design/tokeny.json` i opisany w `docs/design/design-spec.md:29` zgodnie z opcją B z raportu 04 i KO-052; stała w Swift pilnowana testem równości.
- i18n: brak tekstów — sprawdzone, brak.
- Wydajność: brak — sprawdzone, brak.
- Testy na właściwym poziomie: test w Node liczy kontrast z tokenu i czyta źródło Swift (regex); nie dotyka renderu (→ 005).
- Dostępność: cel zmiany to WCAG 1.4.3 (tekst pod pasem) — wynik tylko z modelu (→ 005).
- Liczby konfiguracyjne: 0,45 w tokenie i w Swift, równość pilnowana testem — ok.

Inne miejsca rysowania zakreślenia: `git grep "KOLOR_ZAKRESLACZA\|PKInkingTool\|\.marker\|F6E04A\|zakreslacz" 625350a -- modules src app` daje jedno użycie narzędzia (`modules/oczko-wzor/ios/WidokWzoru.swift:420`). `src/ekrany/LicznikStyl.ts:41` to tło karty pod tekstem (pas pod tekstem, jak wzorzec), więc poprawki nie potrzebuje. `#F6E04A` w `modules/oczko-icloud/Pakiet/wektory.json:97` to kolor włóczki w wektorze testowym, nie zakreślacz. Licznik zakreśleń (`modules/oczko-wzor/ios/WidokWzoru.swift:512`, typ `.marker`) nie zależy od alfy, więc asercje "N highlights" w scen. 47 zostają ważne.

Soczewki: recenzent szukający ścieżki bez testu (→ 005), użytkownik z dużym tekstem / słabszym wzrokiem (cel zmiany; dowód tylko z modelu), użytkownik, któremu zapis przerwano (format bez zmian — ok).

## Pokrycie (co sprawdzono, czego nie)
| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| Diff 625350a (6 plików) | tak | odczyt `git diff 3d9ca08 625350a` |
| Test kontrastu na 3d9ca08 i 625350a | tak | `dowody/ba-test-3d9ca08.txt`, `dowody/ba-test-625350a.txt` |
| Rachunek 5,14:1 i warianty | tak (rachunek) | `dowody/ba-kontrast.txt` |
| Raport 04 i pomiar pikseli (`docs/design/av-2026-11-12/dowody/c-kontrast.txt` @ e4f75e5) | tak (odczyt; obrazów nie mierzyłem ponownie) | `git show e4f75e5:…` |
| Próg kontroli pikseli zrzutów | tak (rachunek na kodzie @ 7c68f44a) | `dowody/ba-prog-kontroli.txt` |
| Scalenie z AT 2f224a8, AU 7c68f44a | tak | `dowody/ba-merge-tree.txt` |
| Pełna bramka na 625350a | tak | `dowody/ba-bramka-625350a.txt` |
| Render PencilKit z alfą 0,45 (iOS) | nie: brak macOS | — |

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/jakosc/ax-2026-11-12/ba-recenzja.md <worktree 625350a> docs/jakosc/ax-2026-11-12 --rola 08-programista` (odwołania sprawdzane względem drzewa BA):
```
OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 08-programista
kod wyjścia: 0
```
Sekrety: brak wzorców w diffie BA i w raporcie.

## Stosowalność listy kontrolnej
| Pozycja | Status (dotyczy / nie dotyczy + powód / decyzja D-xx) | Wynik (ok / znalezisko ID / nie sprawdzono + powód) |
|---|---|---|
| DEV-01 | dotyczy (rachunek kontrastu w teście) | ok co do wzoru WCAG; model renderu → 08-programista-005 |
| DEV-02 | dotyczy | 1/1: test w tym samym commicie; czerwień odtworzona (`dowody/ba-test-3d9ca08.txt`) |
| DEV-03 | dotyczy | ok: brak `.skip`/`.only`; asercje konkretne |
| DEV-04 | dotyczy | na 625350a: typecheck 0, typecheck:testy 0, lint 0, kontrole 0, Jest `--ci` 601/601 zestawów, 7298/7298 testów, kod 0 (`dowody/ba-bramka-625350a.txt`) |
| DEV-05 | dotyczy (zapis rysunków) | ok: zapis bez zmian (`modules/oczko-wzor/ios/WidokWzoru.swift:496`) |
| DEV-06 | dotyczy (format PKDrawing) | ok: brak zmiany formatu, brak migracji |
| DEV-07 | nie dotyczy: brak danych użytkownika w diffie | — |
| DEV-08 | nie dotyczy: brak dat | — |
| DEV-09 | dotyczy (test czyta JSON) | ok: zawężenie z `unknown` |
| DEV-10 | nie dotyczy: brak ścieżek błędów | — |
| DEV-11 | dotyczy | ok: wartość z tokenu, równość pilnowana testem |
| DEV-12 | nie dotyczy: brak tekstów | — |
| DEV-13 | dotyczy | ok: jedna wielkość, dwa miejsca (token i Swift) związane testem |
| DEV-14 | dotyczy | ok: `git diff 3d9ca08 625350a` bez wzorców sekretów (przegląd diffu) |
| DEV-15 | nie dotyczy | — |
| DEV-16 | dotyczy (alfa 0–1) | ok: nazwa `ZAKRESLACZ_ALFA`, zakres w teście |

## Znaleziska (szczegóły)

### 08-programista-005 · Prognoza 5,14:1 i test opierają się na modelu niezgodnym z pomiarem 04
- Pozycja listy kontrolnej: DEV-01
- Poziom: P2
- Realność: realny (dowód poprawki to model, nie render) · Pewność: wysoka co do niezgodności, średnia co do skutku
- Rodzaj: D
- Dowód: model testu ("źródło nad", efektywna alfa = alfa tokenu) daje przy alfie 1,0 kontrast 1,00:1 (`dowody/ba-kontrast.txt`; komentarz testu `tests/dzianina/zakreslacz-kontrast.test.ts:36` mówi, że brak tokenu oznacza pełne krycie, czyli stan sprzed poprawki). Pomiar 04 na zrzucie przy kolorze z alfą 1,0 daje 3,38:1 (`#887C29` na `#F8E876`). Z tła pasa wynika efektywna alfa ok. 0,76, z tekstu ok. 0,55 (`dowody/ba-prog-kontroli.txt`), więc PencilKit nie składa zakreślenia jak ten model. Nie wiadomo, czy alfa koloru 0,45 zastąpi własną krytość markera, czy ją pomnoży (wtedy efektywnie ok. 0,25–0,34: tekst ok. 11:1, pas do strony ok. 1,08:1 < 1,1 z własnego testu BA), czy zostanie zignorowana (wtedy bez zmiany, 3,38:1). Test przejdzie w każdym z tych przypadków, bo sprawdza wartość tokenu i tekst źródła Swift. P-773 uczciwie nazywa się "warunkowa", ale P-774 opisuje czerwień jako "brak tokenu: kontrast 1,00", co nie jest stanem sprzed poprawki na ekranie.
- Mechanizm: jeden test, jedna decyzja; `grep -n "pełne krycie" tests/dzianina/zakreslacz-kontrast.test.ts` → 1 trafienie.
- Powraca: nie
- Wzorzec lub źródło: zasada wspólna 2; test akceptacyjny 04-001 w raporcie 04 (pomiar najciemniejszego piksela pod pasem na kadrze 04 i zrzucie scen. 47).
- Kroki w aplikacji: wzór → zakreślacz → pociągnięcie po wierszu; wynik zależy od PencilKit.
- Opcje: (a) uznać 04-001 za naprawione dopiero po pomiarze pikseli na kandydacie (skrypt 04) i dopisać to w P-773 jako warunek zamknięcia — tanio, wynik po pierwszym przebiegu zrzutów; (b) dodać test XCTest renderu `PKDrawing.image(from:scale:)` z jednym pociągnięciem nad czarnym tekstem i pomiarem piksela — dowód w CI macOS, koszt nowego testu natywnego. Rekomendacja: (a) przed buildem 5, (b) razem z opcją A w 1.0.1.
- Test akceptacyjny: kadr 04 i zrzut scen. 47 na kandydacie: tekst pod pasem ≥ 4,5:1, pas do strony ≥ 1,1:1.
- Status: otwarte

### 08-programista-006 · Kontrola pikseli zrzutów pada przy efektywnej alfie pasa poniżej ok. 0,36
- Pozycja listy kontrolnej: DEV-13
- Poziom: P2
- Realność: brzegowy (zależy od niezbadanego zachowania PencilKit) · Pewność: wysoka co do progu, średnia co do skutku
- Rodzaj: D
- Dowód: `scripts/ci/kontrola-zakreslen.mjs:23` @ 7c68f44a (AU) uznaje piksel za żółty przy `b <= 190`. Pas z alfą 0,45 nad białą stroną w modelu: `251,241,174` (zapas 16 na kanale B); przy alfie 0,35 jest `252,244,192` i kontrola go nie widzi (`dowody/ba-prog-kontroli.txt`). Jeśli PencilKit mnoży alfę koloru przez własną krytość markera (0,55–0,76 z pomiaru 04), efektywna alfa to ok. 0,25–0,34, czyli poniżej progu. Wtedy kadr 04 straci pasy, a krok kontroli w `zrzuty-sklepu.yml` padnie głośno (komplet zrzutów czerwony, bez cichych złych zrzutów). Workflow "Jakość · iOS", który warunkuje build 5, tej kontroli nie uruchamia.
- Mechanizm: próg barwy w jednym miejscu; `git grep -n "jestZolty" 7c68f44a -- scripts` → definicja i użycie w jednym pliku.
- Powraca: nie
- Wzorzec lub źródło: rachunek na kodzie AU (zasada wspólna 3: skutek oznaczony jako zależny od PencilKit).
- Kroki w aplikacji: brak (narzędzie wydania).
- Opcje: (a) pierwszy przebieg „Zrzuty sklepu” po scaleniu traktować jako pomiar; przy porażce kontroli decyzja 04 (próg kontroli albo alfa) — bez kosztu teraz; (b) obniżyć teraz próg kontroli (np. `b <= 205`) — zmiana w AU bez dowodu, ryzyko fałszywych pasów. Rekomendacja: (a).
- Test akceptacyjny: `kontrola-zakreslen.mjs` kod 0 na komplecie zrzutów z SHA integracji po scaleniu AU+BA.
- Status: otwarte

## Do sprawdzenia (pewność ≤ 80%)
- Nakładanie pociągnięć: przy alfie 0,45 dwa nakładające się pociągnięcia dają w modelu efektywnie 0,70, czyli 2,25:1 (`dowody/ba-kontrast.txt`). W pomiarze 04 pas 2 miał 1,16:1, co sugeruje kumulację. Czy PencilKit kumuluje krycie markera między pociągnięciami, nie sprawdziłem (brak iOS). Gwarancja ≥ 4,5:1 dotyczy więc tylko pojedynczego pociągnięcia.
- Zakreślenia zapisane przed BA zostają w pełnym kolorze tuszu (P-773). Na jednym wzorze stare i nowe pasy będą się różnić krytością; to uwaga do kroku U2 właściciela, nie defekt danych.
- Tryb ciemny: czy PencilKit odwraca kolor tuszu w ciemnym motywie i jak wtedy działa alfa — poza diffem, nie sprawdzono.

## Co działa dobrze i należy zachować
- Minimalny diff: jedna stała, jeden token, jeden test; format `PKDrawing` i ścieżka zapisu nietknięte.
- Test równości stałej Swift z tokenem (`tests/dzianina/zakreslacz-kontrast.test.ts:40-46`) wiąże dwa miejsca jednej wielkości.
- P-773 nazywa warunek („PencilKit stosuje alfę koloru znacznika, do potwierdzenia na iOS”) i analogię z Treningiem z zapisem wyszukiwania.

## Decyzje dla właściciela
Brak decyzji właściciela (P-087: decyduje koordynator):
1. Scalenie BA (625350a) do `claude/youthful-pasteur-kx83sn`: **TAK**. Konflikt jest tylko w `docs/decyzje.md` z AT (2f224a8) i AU (7c68f44a): wszyscy dopisują wiersze na końcu tabeli, ID rozłączne (P-759–P-761, P-763–P-766, P-773–P-774) — rozwiązanie: zachować wszystkie wiersze w kolejności ID (`dowody/ba-merge-tree.txt`). Alternatywa: wstrzymać do testu renderu (005 b) — koszt: kandydat bez poprawki P1.
2. Warunek zamknięcia 04-001: pomiar pikseli na kandydacie (005 a) i kontrola zrzutów po scaleniu AU+BA (006 a). Przy wyniku < 4,5:1 albo porażce kontroli: powrót do 04 (opcja A albo inna alfa).

## Proponowane polecenie naprawy
Brak kodu do naprawy przed scaleniem. Po pomiarze na kandydacie, jeśli porażka: `node tools/assemble.mjs 04-studio-projektowe --tryb fix --zadania 04-studio-projektowe-001` (decyzja alfy albo opcja A), następnie `node tools/assemble.mjs 08-programista --tryb fix --zadania 08-programista-005,08-programista-006`.
