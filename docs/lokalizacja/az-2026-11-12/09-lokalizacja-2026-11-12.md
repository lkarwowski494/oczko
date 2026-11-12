# Audyt: Lokalizacja — Oczko — 2026-11-12 (sesja AZ: recenzja niezależna AW)
Commit: acf31b18 (zakres 3d9ca08..acf31b1, gałąź `claude/az-recenzja-aw-2026-11-12` = `claude/aw-podpisy-2026-11-12`) · Tryb: audit · Środowisko: Linux, Node, `npm ci` kod 0, ImageMagick 6 jest, czcionki Noto doinstalowane z apt (fonts-noto-core, fonts-noto-cjk) tylko w kontenerze sesji; brak macOS/Xcode (prawdziwe zrzuty z symulatora niesprawdzone — renderowałem ramki na sztucznych PNG).
Prompt roli: przeczytany do linii `=== KONIEC PROMPTU ROLI ===`; ostatni nagłówek `##` promptu: „Kontrola dowodów i sekretów przed oddaniem raportu”.
Wyjątek nazwany (polecenie AZ): raport leży w `docs/lokalizacja/az-2026-11-12/` i jest commitowany na gałąź AZ (tryb audit domyślnie nie commituje); pliki podpisów i kod nietknięte.

## Podsumowanie
Recenzja niezależna sesji AW (P-771, P-772): 27 języków × 7 podpisów zrzutów sklepu. Komplet, limit 40 znaków, glify i układ w 2 wierszach potwierdzone na żywo (render 189 ramek, kod 0). Terminy ekranów zgodne ze słownikami aplikacji we wszystkich 27 językach. Brak P0 i P1. Znalazłem 3 znaleziska P2 (8 podpisów w 7 językach): idiom „z czasem” czytany jako „kiedyś / z biegiem czasu” albo „czasami” (ru, uk, hr, hu, ms), dwuznaczne słowo zmieniające sens (de „Tipp”, hr „po uputama”), koreański 06 sugerujący cofnięcie wszystkiego naraz (twierdzenie spoza `en.md`). Zmiana testu ramek de → bg nie osłabia kontroli. **Werdykt scalenia: TAK** (P2 do poprawy przed wgraniem `asc-zrzuty`, zgodnie z warunkiem P-771).

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 09-lokalizacja-001 | P2 | D | Podpis 06 w ru, uk, hr, hu, ms czyta się jako „z czasem / czasami”, a nie „z godziną” | zweryfikowane (f8914bb1) |
| 09-lokalizacja-002 | P2 | D | de 02 „Ein Tipp” (= wskazówka) i hr 04 „po uputama” (= według instrukcji) zmieniają sens | zweryfikowane (f8914bb1) |
| 09-lokalizacja-003 | P2 | D | ko 06 „모든 변경을 … 한 번에 실행 취소” daje się czytać jako cofnięcie wszystkich zmian naraz | zweryfikowane (f8914bb1) |

### Tabela języków (zadanie 1)
Kryteria: poprawność, zgodność z en/pl, brak nowych twierdzeń względem `docs/wydanie/metadane/en.md`, terminy z `src/i18n/slowniki/<język>.json` (licznik, wzór, historia, cofnij, projekty, dni robótkowe, rząd), ≤ 40 znaków.

| Język | Wynik | Poprawka (dokładny tekst) |
|---|---|---|
| cs | OK | — |
| sk | OK | — |
| hu | poprawka | 06: `Minden módosítás ideje, visszavonható` (37) |
| ro | OK | — |
| hr | 2 poprawki | 04: `Označavajte i pišite izravno na uputama` (39); 06: `Vrijeme svake promjene i poništavanje` (37) |
| uk | poprawka | 06: `Час кожної зміни й відміна дотиком` (34) |
| es | OK | (06 do sprawdzenia, sekcja niżej) |
| es-419 | OK | — |
| pt | OK | — |
| pt-BR | OK | „Receita” = termin aplikacji (P-772 pkt 2) |
| de | poprawka | 02: `Einmal tippen, eine Reihe mehr` (30) |
| fr | OK | (01, 02 do sprawdzenia) |
| it | OK | „Spiegazione” = termin aplikacji; (06 do sprawdzenia) |
| nl | OK | (06 do sprawdzenia: propozycja `Elke wijziging met tijd, ongedaan maken`, 39) |
| sv | OK | — |
| da | OK | — |
| nb | OK | — |
| fi | OK | — |
| tr | OK | — |
| el | OK | — |
| id | OK | (06 „berwaktu” do sprawdzenia) |
| ms | poprawka | 06: `Masa setiap perubahan dan buat asal` (35) |
| vi | OK | — |
| ru | poprawka | 06: `Время каждого изменения и отмена` (32) |
| ja | OK | — |
| ko | poprawka | 06: `변경마다 시간 기록, 탭 한 번으로 실행 취소` (25) |
| zh-Hant | OK | (07: podział wiersza „你的 / 手作日一覽無遺”, układ: rola 10) |

Razem: 8 poprawek w 7 językach (hr 2; hu, uk, de, ms, ru, ko po 1); 20 języków OK. (Korekta 2026-11-12: pierwsza wersja raportu podawała błędnie „9 w 8” i „19 OK” — błąd liczenia; tabela była od początku pełna, nl 06 jest tylko w „Do sprawdzenia”.) To drugi przegląd AI w świeżym kontekście (próbka n = 189, wszystkie podpisy), nie przegląd rodzimego użytkownika języka.

### Zmiana testu ramek de → bg (zadanie 2)
Nie osłabia kontroli. Zmienił się tylko język fikstury bez podpisów; asercje bez zmian (`tests/wydanie/ramki-sklepu.test.ts:73`, `tests/wydanie/ramki-sklepu.test.ts:79`). Dowód konieczności: przy podpisach @ acf31b1 skrypt dla de nie ostrzega i robi ramkę, dla bg ostrzega i pomija (dowody/ramki-de-bg.txt).

bg pozostaje językiem bez lokalizacji sklepu, czego pilnuje osobny test (`tests/wydanie/zrzuty-jezyki.test.ts:27`, „for (const x of ['bg', 'sl', 'sr', 'lt', 'lv', 'et']) expect(p.jezyki).not.toContain(x);”). Gdyby bg dostał kiedyś podpisy, test padnie głośno, nie przejdzie po cichu. Oba testy zielone z ImageMagickiem: 18/18 (dowody/jest-podpisy-ramki.txt).

### Aneks: poprawki AW @ f8914bb1 (od acf31b18), 2026-11-12
- Rozbieżność „9 w 8” vs tabela „8 w 7”: błąd liczenia w raporcie AZ. 9. pozycji nie ma; nl 06 to pytanie z „Do sprawdzenia” (propozycja `Elke wijziging met tijd, ongedaan maken`), nie poprawka.
- acf31b18..f8914bb1 zmienia 8 podpisów (`docs/wydanie/metadane/podpisy-zrzutow.json`) i `docs/lokalizacja/aw-stan.md`; wszystkie 8 dosłownie równe tekstom z tabeli, najdłuższy podpis 40 znaków, render 49 ramek (hu, hr, uk, de, ms, ru, ko) kod 0, jest 18/18 (dowody/f8914bb-poprawki.txt, zrzuty/poprawki-f8914bb.png).
- Znaleziska 09-lokalizacja-001, -002, -003: naprawione-do-weryfikacji → zweryfikowane. **Werdykt scalenia f8914bb1: TAK**, P0 0, P1 0, P2 0 (pozycje „Do sprawdzenia” bez zmian, do przeglądu człowieka z P-772).

## Linia bazowa i założenia
Zakres zawężony poleceniem AZ do podpisów zrzutów sklepu i jednego testu, więc linia bazowa dotyczy tego obszaru. Najlepszy w klasie podpis zrzutu: w każdym języku brzmi jak napisany w nim, używa tych samych terminów co interfejs (sklep i aplikacja się nie rozjeżdżają), niczego nie obiecuje ponad tekst bazowy i mieści się w ramce bez braków glifów.
- Rynki i języki: 27 języków = lokalizacje sklepu bez en/pl; 6 języków aplikacji bez lokalizacji sklepu (bg, sl, sr, lt, lv, et) słusznie bez podpisów (status w pliku). Wynik: zgodne.
- Miejsca tekstu: tylko podpisy na ramkach. Sprawdzone, inne miejsca poza zakresem.
- Gramatyka: forma zwracania się spójna w obrębie języka; błędy idiomów → 001, 002.
- Formaty: w podpisach nie ma liczb poza „1” w ja („1タップ”, zgodne z en „one tap”). Sprawdzone, brak.
- Układ: render 27 × 7 (zrzuty/podpisy-a.png, zrzuty/podpisy-b.png): każdy podpis w 1–2 wierszach, bez ucięć. hr renderuje się wyraźnie mniejszą czcionką (jeden rozmiar na język, wyznaczany przez najdłuższy podpis 06) — poprawka 06 z 001 (37 zn. zamiast 40) to łagodzi.
- Glify: Bree Serif ma wszystkie 95 znaków języków łacińskich spoza listy krojów zastępczych (dowody/glify-bree.txt); el, ru, uk, vi → Noto Sans, ja, ko, zh-Hant → Noto Sans CJK; brak „tofu” na renderach.
- Dostępność, mechanizm i18n: nie dotyczy (obraz w sklepie).
- Proces: tłumaczenie oznaczone („przekład maszynowy… [DO PRZEGLĄDU]”) — zgodne z zasadą roli 2. Drugi przegląd AI: ta recenzja. Przegląd człowieka: krok właściciela według progu.
- Treści: podpisy nie niosą treści krytycznej.
Soczewki: użytkownik drugiego rynku (czy podpis mówi to, co en) — źródło 001–003; tłumacz bez ekranu — źródło 002. Rejestr założeń: bez propozycji zmian.

## Pokrycie
| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| `docs/wydanie/metadane/podpisy-zrzutow.json`, 189 podpisów | tak, każdy | odczyt + render (dowody/ramki-27-jezykow.txt, zrzuty/podpisy-a.png, zrzuty/podpisy-b.png) |
| terminy vs `src/i18n/slowniki/*.json` (27 języków, 12 kluczy) | tak | odczyt kluczy `licznik.*`, `wzor.*`, `projekty.tytul`, `dni.*`, `wspolne.cofnij` |
| twierdzenia vs `docs/wydanie/metadane/en.md` | tak | tabela twierdzeń w `en.md` |
| `tests/wydanie/ramki-sklepu.test.ts` (diff) | tak | dowody/jest-podpisy-ramki.txt, dowody/ramki-de-bg.txt |
| `docs/decyzje.md` P-771, P-772, `docs/lokalizacja/aw-stan.md` | tak | odczyt diffu |
| prawdziwe zrzuty z symulatora iOS | nie | brak macOS; render na sztucznym tle 1320×2868 |
| iPad (2064×2752, poziom) | nie | tylko klasa 6.9; pole podpisu liczone proporcjonalnie, ryzyko niskie |
| repo `trening` (analogia P-315) | nie | poza poleceniem AZ |

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/lokalizacja/az-2026-11-12/09-lokalizacja-2026-11-12.md . --rola 09-lokalizacja` → wynik w dowody/sprawdz-raport.txt (kod 0 przed commitem). `git status --porcelain` przed commitem: tylko nowe pliki w `docs/lokalizacja/az-2026-11-12/` (dowody/git-status.txt).

## Stosowalność listy kontrolnej
| Pozycja | Status | Wynik |
|---|---|---|
| LOK-01 | dotyczy (D-026 „szeroka”) | ok: 27 języków sklepu + en/pl; 6 bez sklepu bez podpisów |
| LOK-02 | nie dotyczy: konfiguracja aplikacji poza zakresem AZ | — |
| LOK-03 | nie dotyczy: kod nie zmieniony w zakresie | — |
| LOK-04 | dotyczy częściowo (komplet podpisów na język) | ok: 7/7 w 27 językach, test `uklad-podpisow` zielony |
| LOK-05 | nie dotyczy: podpisy bez liczby mnogiej | — |
| LOK-06 | dotyczy (liczby) | ok: brak liczb poza „1” w ja, zgodne z en |
| LOK-07 | nie dotyczy: brak dat i jednostek | — |
| LOK-08 | dotyczy (układ) | ok: render 189 ramek; uwaga zh-Hant 07 w „Do sprawdzenia” |
| LOK-09, LOK-10, LOK-12, LOK-13 | nie dotyczy: mechanizm aplikacji, treść krytyczna, VoiceOver, powiadomienia poza zakresem | — |
| LOK-11 | dotyczy | znaleziska 001, 002, 003 |
| LOK-14 | dotyczy (glify) | ok: dowody/glify-bree.txt, rendery |
| LOK-15 | dotyczy (bramka) | ok: `uklad-podpisow.test.ts` i `ramki-sklepu.test.ts` w `npm run verify` |

## Znaleziska (szczegóły)

### 09-lokalizacja-001 · Podpis 06 w ru, uk, hr, hu, ms czyta się jako „z czasem / czasami”, a nie „z godziną”
- Pozycja listy kontrolnej: LOK-11
- Poziom: P2
- Realność: realny · Pewność: wysoka
- Rodzaj: D
- Dowód: `docs/wydanie/metadane/podpisy-zrzutow.json:311` „Каждое изменение со временем и отмена” (ru „со временем” = z biegiem czasu); `:149` uk „з часом” (to samo); `:135` hr „s vremenom” (= z czasem, kiedyś); `:116` hu „idővel” (= z czasem); `:293` ms „ada masa” (= czasami). en: „Every change with its time”.
- Mechanizm: kalka „with time” na idiom o innym znaczeniu; przejrzane wszystkie 27 podpisów 06 → 5 trafień (ru, uk, hr, hu, ms); cs „s časem”, sk „s časom” czytają się poprawnie.
- Powraca: nie
- Wzorzec lub źródło: zasada roli 2 (przegląd); moduł `tlumaczenie`, kryterium (1) sens.
- Kroki w aplikacji: strona produktu w App Store danego kraju, zrzut 06.
- Opcje: poprawić 5 podpisów tekstami z tabeli (koszt: minuty) — albo zostawić do przeglądu człowieka (ryzyko, że trafią do sklepu). Rekomendacja: poprawić teraz.
- Test akceptacyjny: podpisy 06 = teksty z tabeli języków; `uklad-podpisow.test.ts` zielony.
- Status: zweryfikowane (f8914bb1)

### 09-lokalizacja-002 · de 02 „Ein Tipp” (= wskazówka) i hr 04 „po uputama” (= według instrukcji) zmieniają sens
- Pozycja listy kontrolnej: LOK-11
- Poziom: P2
- Realność: realny · Pewność: wysoka
- Rodzaj: D
- Dowód: `docs/wydanie/metadane/podpisy-zrzutow.json:190` „Ein Tipp zählt eine Reihe dazu” (rzeczownik „Tipp” to po niemiecku zwykle „rada”; czynność to „tippen”); `:133` „Označavajte i pišite po uputama” („pisati po uputama” = pisać według instrukcji, nie na wzorze).
- Mechanizm: słowo o dwóch znaczeniach wybrane bez kontekstu ekranu; przejrzane podpisy 02 i 04 we wszystkich językach → 2 trafienia.
- Powraca: nie
- Wzorzec lub źródło: zasada roli 4 (klucz ma kontekst).
- Kroki w aplikacji: strona produktu de (zrzut 02), hr (zrzut 04).
- Opcje: poprawki z tabeli — albo pytanie do rodzimego użytkownika języka. Rekomendacja: poprawić teraz, przegląd człowieka i tak przed wgraniem.
- Test akceptacyjny: de 02 = `Einmal tippen, eine Reihe mehr`, hr 04 = `Označavajte i pišite izravno na uputama`.
- Status: zweryfikowane (f8914bb1)

### 09-lokalizacja-003 · ko 06 daje się czytać jako cofnięcie wszystkich zmian naraz
- Pozycja listy kontrolnej: LOK-11
- Poziom: P2
- Realność: brzegowy · Pewność: średnia
- Rodzaj: D
- Dowód: `docs/wydanie/metadane/podpisy-zrzutow.json:329` „모든 변경을 시간과 함께, 한 번에 실행 취소” — „모든 변경을 … 한 번에 실행 취소” = „wszystkie zmiany … cofnij za jednym razem”; en: „one-tap undo”, `en.md` dowodzi tylko cofnięcia (F-02, F-47), nie cofnięcia wszystkiego.
- Mechanizm: „one-tap” przełożone jako „naraz” zamiast „jednym stuknięciem”; inne języki (ja „1タップで”, zh-Hant „一點即可”) poprawne.
- Powraca: nie
- Wzorzec lub źródło: polecenie AZ „żadnych nowych twierdzeń”; App Review 2.3 (metadane zgodne z aplikacją).
- Kroki w aplikacji: strona produktu ko, zrzut 06.
- Opcje: `변경마다 시간 기록, 탭 한 번으로 실행 취소` — albo pytanie do rodzimego użytkownika języka. Rekomendacja: poprawka.
- Test akceptacyjny: ko 06 = tekst z tabeli.
- Status: zweryfikowane (f8914bb1)

## Do sprawdzenia (pewność ≤ 80%)
Pytania do człowieka znającego język (albo do przeglądu z P-772):
- nl 06 „Elke wijziging met tijd, direct ongedaan” — brak „maken”, eliptyczne; propozycja `Elke wijziging met tijd, ongedaan maken` (39).
- fr 01 „Retrouvez exactement votre place” gubi „kontynuuj”; fr 02 „Une touche” (klawisz) zamiast „un toucher”/„d’un toucher”.
- de 06 „und Rückgängig”, it 06 „e annulla”, es 06 „con su hora y deshacer” — nazwa przycisku wstawiona w zdanie, składniowo chropawe.
- id 06 „berwaktu” — rzadkie słowo.
- zh-Hant 07: renderer łamie „你的 / 手作日一覽無遺” (jedno słowo w pierwszym wierszu, zrzuty/podpisy-b.png) — sprawa układu (`scripts/ci/uklad-podpisow.mjs`, rola 10), nie przekładu.
- Prawdziwe zrzuty iPhone i iPad z symulatora (pomiar na obrazie w CI, `zrzuty-sklepu.yml`) — wynik tego renderu potwierdzi pierwszy przebieg macOS.

## Co działa dobrze i należy zachować
- Terminy ekranów w podpisach = terminy interfejsu we wszystkich 27 językach (w tym it „Spiegazione”, pt-BR „Receita”); żadnego rozjazdu sklep–aplikacja.
- Żadnych nowych twierdzeń poza ko 06; podpisy bez cen, „free” i marek.
- Status języka jawnie oznacza przekład maszynowy i wymóg przeglądu przed wgraniem.
- Krój: lista języków z krojem zastępczym kompletna; Bree pokrywa resztę.
- Fikstura bg w teście ramek jest pilnowana osobnym testem planu zrzutów.

## Decyzje dla właściciela
Brak decyzji po stronie właściciela (P-087: decyduje koordynator). Dla koordynatora: (a) przyjąć 8 poprawek z tabeli przed wgraniem `asc-zrzuty` — rekomendacja; albo (b) scalić bez zmian i dać je przeglądowi człowieka z P-772 (ryzyko: idiomy z 001 przejdą, jeśli przegląd będzie pobieżny). Uwaga procesowa: przed AW status języków wymagał przekładu „po akceptacji en przez właściciela”; en ma nadal `[DO AKCEPTACJI]`, więc zmiana en oznacza powtórkę 27 × 7.

## Proponowane polecenie naprawy
`node tools/assemble.mjs 09-lokalizacja --tryb fix --zadania 09-lokalizacja-001,09-lokalizacja-002,09-lokalizacja-003`
