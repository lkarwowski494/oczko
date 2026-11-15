# Recenzja strony „Test Oczka 1161” względem listy źródłowej

- Data: 2026-11-15. Rola 07-jakosc, recenzja niezależna. Gałąź `claude/bp-instrukcja-testu-2026-11-15`, HEAD `3ca5bec`.
- Porównano: `docs/wydanie/instrukcja-testu-1161.html` (strona) ze źródłem `docs/wydanie/test-urzadzenia-build5.md` (lista buildu 5, obowiązuje dla 1161: `docs/jakosc/werdykt-build-1161.md`, kod 1161 = kod 1151).
- Metoda:
  - `grep -cE '^\s*- \[ \] \*\*[TZG]-[0-9]+' docs/wydanie/test-urzadzenia-build5.md` → 121;
  - skrypt node: wyciąga `var DANE = {...}` ze strony (`JSON.parse`), parsuje źródło (sekcja `### N.`, nagłówek kroku `urządzenie · min · temat`, punkty „Zrób/Wynik/Uwaga” bez „Źródło”), porównuje ID, kolejność, sekcję, urządzenie, minuty, czekanie, oznaczenie „dodatkowy”; dla każdego kroku sprawdza, czy każdy cytat `„…”` ze źródła występuje znak w znak na stronie (zrob + powinno + szczegoly + wpisz + uwaga) i odwrotnie, oraz różnice w liczbach; zestawienie obok siebie wszystkich 121 kroków przeczytane w całości;
  - wzorce w treści kroków: rozszerzenia plików, `P-NNN`, `KO-`, `TT-`, `U\d`, `BR-/F-/ZM-`, `e2e`, `:linia`, backtick, SHA, numery buildów;
  - Playwright/Chromium 390×844 (strona owinięta w szkielet z `<meta name="viewport" content="width=device-width,initial-scale=1">`): przewijanie poziome (`scrollWidth`), błędy konsoli, przyciski tak/nie/pomiń, `localStorage` po przeładowaniu, „Kopiuj wynik” (schowek) i „Pokaż tekst”, oba tryby i 3 podejścia; dodatkowo 320 px.

## Werdykt
**ZGODNA Z UWAGAMI** — wszystkie 121 kroków są na stronie we właściwej sekcji, trybie i podejściu, z tymi samymi urządzeniami, czasami, czynnościami, wartościami i napisami aplikacji; nie ma znalezisk P1, są 4 drobne przeinaczenia kontekstu „buildu poprzedniego/starszego”, przewijanie poziome na 390 px w podejściach 1 i 3 oraz uwagi formalne.

## Liczby
| Zakres | Źródło | Strona |
|---|---|---|
| Wszystkie kroki | 121 (118 + 3 dodatkowe) | 121; brak zgubionych, brak duplikatów, kolejność identyczna |
| Kroki dodatkowe | T-49, T-101, T-137 | T-49 „dodatkowy”, T-101 „dodatkowy”, T-137 „dodatkowy, po ok. 8 dniach” (chip przy kroku, wyłączone z sumy czasu) |
| Tryb krótki (wymaganie: T-01, T-02, 1a, T-136 + T-04 i sekcja 14) | — | 13: T-01, T-02, T-04, Z-01…Z-06, T-105, T-106, T-107, T-136; ok. 40 min (39 min kroków + 1 min przygotowania wzoru) |
| Podejście 1 (sekcje 1–9 z 1a i 8a) | 182 min kroków | 77 kroków, ok. 3 h 2 min (182 min) |
| Podejście 2 (sekcje 10–15) | „93 min kroków + 10 min czekania” | 28 kroków, ok. 1 h 44 min (94 + 10 = 104 min) |
| Podejście 3 (sekcje 16–18) | 41 min | 16 kroków, ok. 41 min |
| Cały tryb pełny | „316 min + 10 min czekania” | ok. 5 h 27 min (317 + 10) |

Różnica 1 min w podejściu 2 to błąd rachunku w źródle (sekcje 10–15: 6 + 16 + 20 + 26 + 15 + 11 = 94 min bez T-101), nie strony.

Urządzenie, minuty, czekanie (T-113: 1 + 10), sekcja: 121/121 zgodne (porównanie skryptem).

## Znaleziska
| ID kroku | Co w źródle (cytat) | Co na stronie (cytat) | Ocena | Waga |
|---|---|---|---|---|
| Z-01 (Szczegóły) | „(w buildzie 4 nowy pas było widać dopiero po ponownym otwarciu)” | „(w poprzednim buildzie nowy pas było widać dopiero po ponownym otwarciu)” | przeinaczone: dla 1161 poprzedni build to 1151, który już ma poprawkę (kod 1161 = 1151); błąd był w 1141. Na wynik kroku nie wpływa (to nawias kontekstowy) | P2 |
| Z-03 (Szczegóły) | „Jeśli po T-02 masz zakreślenia zrobione w buildzie 4 lub starszym: tamte pasy zostają mocniej żółte” | „Jeśli po T-02 masz zakreślenia zrobione w starszym buildzie: tamte pasy zostają mocniej żółte” | przeinaczone: zakreślenia z 1151 mają już krycie 0,45 i nie będą mocniejsze; poprawnie „w buildzie 1141 lub starszym” | P2 |
| Z-02 (temat), Z-05 (temat) | „krok **U2** (04-002)”, „(U2 na iPadzie)” | „czy oba pasy są równe (krok U2)”, „Z-01–Z-04 na iPadzie (U2 na iPadzie)” | kod wewnętrzny „U2” został w treści kroku (pozostałe kody U/TT strona usunęła) | P2 |
| Tryb krótki (opis zakresu) | „Jeśli pełny test buildu 4 był zrobiony i koordynator tak zdecyduje, wystarczy wersja krótka” | „Wystarcza, jeśli pełny test poprzedniego buildu był zrobiony.” | przeinaczone: warunek dotyczy pełnego testu buildu 4 (1141), a poprzedni build to 1151, którego nikt nie testował w całości; brak też „koordynator zdecyduje” | P2 |
| T-43, T-44, T-48 (Zrób); T-125 (Szczegóły) | adres w pogrubieniu | `**https://apps4brew.com/oczko/support.html**` (i privacy.html) jako niełamliwy ciąg | kosmetyczne w treści, ale skutek na stronie: przewijanie poziome na 390 px — podejście 1: `scrollWidth` 449 przy zwiniętych szczegółach; podejście 3: 452 po rozwinięciu „Szczegóły wyniku” T-125; na 320 px tak samo. Przyczyna potwierdzona: po dodaniu `overflow-wrap:anywhere` do `.krok li, .krok p` szerokość wraca do 390. Tryb krótki i podejście 2 bez przewijania | P2 |
| Zanim zaczniesz → Napisy | (brak; wersja krótka w źródle: T-01, T-02, 1a, T-136, bez T-05) | „Tryb krótki nie ma kroku T-05: przełącz tak samo albo szukaj polskich odpowiedników napisów.” | dopisane, uzasadnione (bez tego właściciel z polskim telefonem nie znajdzie angielskich napisów) | P2 |
| Zanim zaczniesz → Co przygotować | „Pliki w aplikacji Pliki na iPhonie … dowolny PDF wzoru” | „W aplikacji Pliki na iPhonie i iPadzie: dowolny PDF wzoru” | dopisane „i iPadzie”, wynika z Z-05 i T-96 | kosmetyczne |
| Zanim zaczniesz → Czego nie testujesz | — | „Zakupu „Yearly” i „Lifetime” (powód w „Zakup Pro w TestFlight”)” | w trybie krótkim blok „Zakup Pro w TestFlight” jest ukryty (`data-tylko="pelny"`), więc odesłanie prowadzi do niewidocznego bloku | kosmetyczne |
| T-16, T-22, T-49, T-107, G-21 (Zrób) | jeden akapit czynności | punkty po 177–197 znaków (T-16: dwa punkty z 3–4 czynnościami każdy; T-22, T-49, T-107, G-21: jeden punkt) | kosmetyczne: wymóg „krótkie punkty” niespełniony; czynności i kolejność zachowane | P2 |
| T-02, T-32, T-45, T-55, T-61, G-06, T-72, G-30 (Powinno być) | pełny „Wynik” | „Powinno być” = pełny wynik, 3–4 zdania, 196–258 znaków, bez „Szczegółów” | kosmetyczne: wymóg „jedno–dwa zdania” niespełniony; treść zgodna ze źródłem | P2 |

Wstępy sekcji (wszystkie zgodne co do sensu): sekcja 2 bez „(szybka seria to osobny przypadek, T-11)”, sekcja 11 bez „Wyłączenie tak samo” — skrócenia bez wpływu na wynik.

Usunięcia zgodne z wymaganiami (nie liczone jako znaleziska): wszystkie „Źródło” i „automat”, ścieżki (`src/domena/ocena.ts:26` w T-55, `app/oferty.tsx:44-49` w T-74, `en.json:42` w T-24, `en.json:18` w T-25), kody U/TT (T-41, T-42, T-45, T-16, T-46, T-48, T-49, T-73, T-80, T-90, T-96, T-97, T-98, T-99, T-101, T-106, T-107, T-130, T-133, T-135), P-673 (T-120), P-700 (G-26), „Trening L-051” (T-91), „(defekt 019)”, „(04-001)”, „(07-jakosc-001)”, „(P-708…)”, „(nowe w buildzie 4)” w tematach, „(nowe w buildzie 3, bez zmian w 4)” (T-65), notatka o rozjeździe „About our content” (T-66; to uwaga dla roli 04, nie sprawdzenie), `[DO USTALENIA]` (T-110 → „progu nie ma — tylko zapis pomiaru”). „build 5” → „build 1161” (T-02, T-95), „build 1–4” → „starszy build” (T-01) — zgodne z wymaganiem 1161.

## Sprawdzenia szczegółowe
1. **Liczba i przydział:** 121 = 121, te same ID i kolejność; sekcja każdego kroku zgodna; podejścia 77 + 28 + 16 = 121; tryb krótki zgodny z wymaganiem koordynatora.
2. **Treść kroków:** każdy cytat `„…”` ze źródła występuje znak w znak na stronie we wszystkich 121 krokach (jedyny brak: „About our content” w T-66 — usunięta notatka dokumentacyjna). Nowe cytaty na stronie to tematy ze źródła, wpisy „tak/nie” i skróty z wielokropkiem („No free crafting days left…” w „Powinno być” T-71; pełny napis jest w „Szczegółach”). Wszystkie liczby i nazwy projektów (Scarf test, Sweater test, Scan test, Watch test, Highlight test, Test merino, 10, 8, 6, 3, 437, 399.59, 22/10/50, 110, 3,25, 12/6/8, 30 s, 10 min, 7 dni) zachowane. Kolejność czynności w „Zrób” bez zmian. Gdzie „Powinno być” jest skrótem (T-03, Z-01, Z-03, Z-06, T-25, T-35, G-01–G-05, T-71, G-20, G-21, G-23, T-111, G-25, G-26, T-125), „Szczegóły wyniku” zawierają pełny wynik ze źródła, a skrót nie przeinacza sensu.
3. **Zanim zaczniesz:** instalacja 1161, pliki, ustawienia iPhone'a (blokada 1 min), zegarek sparowany, zakup Pro, 3 podejścia z warunkami (T-70/T-71 przed T-72, 6 dni, T-137 po 8 dniach), zgłaszanie, kroki niewykonalne, „Czego nie testujesz” — zgodne ze źródłem, skrócone; dopisane tylko pozycje wymienione w tabeli i opis działania strony (zapis w przeglądarce, pole numeru buildu). Linki do `tekst.docx`, `tabela.docx`, `obraz.docx` wskazują commit `761b955`, na którym pliki istnieją (`git cat-file -e` → ok).
4. **Ścieżki i kody w treści kroków:** brak ścieżek plików, numerów linii, `P-NNN`, `KO-`, `TT-`, SHA. Zostały: „U2” (Z-02, Z-05), adresy stron do wpisania (T-43, T-44, T-48, T-125 — dane testu, nie źródła), nazwy plików `.docx` (T-41, T-49 — pliki do wybrania).
5. **Uruchomienie (Chromium, 390 px):** błędów i ostrzeżeń konsoli 0. Tak/nie/pomiń: `aria-pressed` i `data-stan` się zmieniają, licznik postępu „3 z 13 · 1 tak · 1 nie · 1 pominięte”, stan i uwagi w `localStorage` (`oczko-test-1161-v1`) przetrwały przeładowanie. „Kopiuj wynik” → komunikat „Skopiowano…”, schowek = jedna wiadomość: nagłówek z buildem, trybem/podejściem i datą, wyniki `T-01 tak; T-02 nie — …; T-04 nie sprawdzono — …` i lista „Bez odpowiedzi (N)”; „Pokaż tekst” daje ten sam tekst. W trybie pełnym wiadomość obejmuje tylko bieżące podejście. Przewijanie poziome: tryb krótki i podejście 2 — brak; podejście 1 i 3 — jest (tabela, wiersz T-43/T-44/T-48/T-125).

## Kroki sprawdzone bez uwag (100)
T-01, T-03, T-04, T-05, Z-04, Z-06, T-10, T-11, T-12, T-13, T-14, T-15, T-17, T-20, T-21, T-23, T-24, T-25, T-19, T-26, T-27, T-28, T-29, T-30, T-31, T-33, T-34, T-35, T-40, T-41, T-42, T-38, T-46, T-47, T-50, T-51, T-52, T-53, T-54, T-56, T-57, T-58, T-60, T-62, T-63, T-64, T-65, T-66, G-01, G-02, G-03, G-04, G-05, G-07, G-08, G-09, T-70, T-71, T-73, T-74, T-80, T-81, T-85, T-86, T-87, G-20, T-90, T-91, T-92, G-22, T-93, T-95, T-96, G-23, T-97, T-98, T-99, T-100, T-101, T-105, T-106, T-110, T-111, T-113, T-114, T-115, T-120, G-25, T-121, G-26, T-122, T-126, T-130, T-131, T-132, G-11, T-133, T-135, T-136, T-137

Treść zgodna, uwagi tylko formalne (17): T-02, T-16, T-22, T-32, T-43, T-44, T-45, T-48, T-49, T-55, T-61, G-06, T-72, T-107, G-21, T-125, G-30.
Uwagi do treści (4): Z-01, Z-02, Z-03, Z-05.

## Naniesione po recenzji (autor, sesja BP, 2026-11-15)
- Z-01, Z-03, Z-06: „poprzedni/starszy build” → „build 1141” (jak „build 4” w źródle).
- Opis trybu krótkiego: „jeśli pełny test buildu 1141 był zrobiony i koordynator tak zdecyduje” (jak w źródle).
- Tematy Z-02 i Z-05 bez kodu „U2”; generator odrzuca teraz każdy kod `U<liczba>` w treści.
- `overflow-wrap: anywhere` w krokach i blokach „Zanim zaczniesz”: pomiar Chromium 320 i 390 px, jasny i ciemny, tryb krótki i podejścia 1–3 z rozwiniętymi „Szczegółami” — `scrollWidth` = szerokość okna, konsola bez błędów.
- „Zrób” T-16, T-22, T-49, T-107, G-21 rozbite na krótsze punkty (te same czynności i kolejność; w T-49 strzałka „→ Oczko” zapisana jako „→ Udostępnij → Oczko”, jak w T-48).
- „Powinno być” T-02, T-32, T-45, T-55, T-61, G-06, T-72, G-30 skrócone do 1–2 zdań; pełny wynik ze źródła w „Szczegóły wyniku”.
- „Czego nie testujesz”: powód dla „Yearly”/„Lifetime” wpisany wprost (blok o zakupie jest ukryty w trybie krótkim); „Co przygotować”: PDF w Plikach iPhone'a, na iPadzie z Plików iPada albo przez Udostępnij (jak T-96).
- Na prośbę koordynatora („każdy krok wykonalny bez zgadywania”): blok „Gesty i miejsca w iOS” (przełącznik aplikacji, ekran główny, Centrum sterowania, Centrum powiadomień, blokada, korona zegarka, Udostępnij). To pomoc w obsłudze iOS, nie nowe kroki testu.
- Bez zmian: suma podejścia 2 liczona z kroków (94 min) — niezgodność 93 vs 94 jest w źródle.

## Wersja 3 — „Oczko na zegarku” i sprawdzenie numeru buildu (koordynator, 2026-11-15 ok. 08:46 UTC)
Powód: właściciel nie ma Oczka na zegarku i ma na telefonie build 1061. Źródła przeczytane 2026-11-15 (`curl` + tekst strony):
- support.apple.com/pl-pl/109023 („Pobieranie aplikacji na Apple Watch”, data publikacji 21 września 2026): „Na iPhonie otwórz aplikację Watch. Stuknij kartę Mój zegarek. Stuknij opcję Aplikacje, a następnie przewiń do aplikacji, którą chcesz dodać. Aplikacje do zainstalowania znajdują się w sekcji Dostępne aplikacje. Aby dodać aplikację do zegarka, stuknij opcję Instaluj.” Angielskie napisy z support.apple.com/en-us/109023 (14 września 2026): „Tap the My Watch tab. Tap Apps … Available Apps section. … tap Install.” Uwaga: przycisk po polsku to „Instaluj”, nie „Zainstaluj”.
- testflight.apple.com („Testing Apps with TestFlight”, sekcja Apple Watch): „If the app is an iOS app that includes an Apple Watch app, install the iOS app first, then go to the App Details page in the Information section. If the Apple Watch app is available and compatible with your watch, there will be a button to install, update, or open it.”; wymaganie „watchOS apps: Apple Watch running watchOS 9 or later”.
- Aplikacja zegarka jest w buildzie 1161: `docs/jakosc/werdykt-1161/kontrola-ipa-1161.txt` (`/Watch/OczkoZegarek.app`, `com.apps4brew.knitting.watchkitapp`).
- „Do 5 minut” — z kroku T-04 listy źródłowej.

Niepotwierdzone, więc niewpisane na stronę: „Automatyczna instalacja aplikacji” (nie znalazłem strony Apple w czasie pracy), zegarek „odblokowany, na ładowarce, blisko telefonu” jako warunek instalacji (nie ma tego na przeczytanych stronach), polska nazwa sekcji „Information” w TestFlight.
Rozjazd do roli 07 przy następnej liście: T-04 w liście źródłowej mówi o „przełączniku przy Oczko” w aplikacji Watch; aktualna strona Apple — o przycisku „Instaluj” w „Dostępne aplikacje”. Krok T-04 na stronie bez zmian (zakres), sposób z Apple w „Zanim zaczniesz”.
Sprawdzenie numeru: w bloku instalacji liczba w nawiasie musi być 1161; inna (np. 1061, 1151) → najpierw T-01 i T-02, potem „Install”/„Update” 1161. Pomiar Chromium po zmianie: 320 i 390 px, oba motywy, wszystkie zakresy — `scrollWidth` = okno, konsola bez błędów.

## Recenzja polskich napisów (2026-11-15)
Rola 07-jakosc, recenzja niezależna, HEAD `8f2c4d6`. Plik pomocniczy autora `instrukcja-testu-1161-napisy.json` nie był używany: każdą parę sprawdzono wprost w `src/i18n/slowniki/en.json` i `pl.json` (oraz `locales/systemowe/en.json`/`pl.json`).

### Metoda
- Wyciąg danych: `node` — `JSON.parse` z `var DANE = {...}` strony; każda para to cytat „pl” zakończony tuż przed `⟦en⟧` albo `⟪…⟫` (parser cofa się po cudzysłowach z liczeniem zagnieżdżeń, bo napisy typu „Dodaj przypomnienie („co N rzędów”)” mają cudzysłów w środku). Wynik: **674 pary** we wszystkich 121 krokach i wstępach sekcji (671 `⟦en⟧` + 3 `⟪sprawdź na ekranie⟫`); żadnego `⟦…⟧` bez poprzedzającego cytatu.
- Dopasowanie (skrypt node): słowniki spłaszczone do kluczy z kropkami; dla każdej pary szukam kluczy, których wartość en = napis en dokładnie albo jako szablon `{{…}}` (zmienne przechwycone z napisu; wieloznaczniki strony `…`, `N`, `{…}` traktowane jak dowolna wartość; skrót z „…” na końcu = prefiks). Dla klucza mnogiego biorę wariant pl według reguły CLDR z `src/i18n/plural.ts` (`one` = 1, `few` = 2–4 bez 12–14, `many` = reszta), z liczbą jak w kodzie (`count`; `probka.z_danych_cm` → `p`, `projekty.dni` → `limit`), i porównuję z napisem pl strony po podstawieniu zmiennych. Złożenia sprawdzane po częściach: strzałka + tytuł (`‹ Dziś`, `Pokaż ›`), etykieta VoiceOver łączona przecinkami (`Przewodnik.tsx:111`), „Pokaż: X” (`przewodnik.pokaz_a11y`), „Krok 1 z 6. …” (`przewodnik.krok_a11y` + `przewodnik.krok_1`).
- Gdy pasowało kilka kluczy o różnych wartościach pl (16 napisów), wybór sprawdzony w kontekście kroku i w kodzie ekranu.
- Napisy bez pary: z tekstu kroków, wstępów i bloku „Zanim zaczniesz” (część statyczna, `<span class="en">`) usunięte pary, potem lista wszystkich ciągów łacińskich ze słowami angielskimi i wszystkich cytatów „…” bez nawiasu — przejrzana ręcznie.
- Sens treści: rekonstrukcja wersji angielskiej z bieżącej strony („pl” ⟦en⟧ → „en”) porównana pole po polu z DANE commita `bc49657` (ostatnia wersja przed polskimi napisami).
- Playwright `chromium.launch()` bez opcji, fragment owinięty w `<!doctype html>` + `<meta name="viewport" content="width=device-width,initial-scale=1">`, okno 390×844; wszystkie „Szczegóły wyniku” rozwinięte; tryb pełny (podejścia 1–3), krótki, krótki w trybie ciemnym.

### Sprawdzone kroki
Obowiązkowe (14): T-11, T-24, T-25, T-32, T-53, T-55, T-70, T-71, T-72, T-130, G-01, G-20, Z-01, Z-06.
Losowe (18; ziarno 20261115, mulberry32, Fisher–Yates na pozostałych 107 ID w kolejności strony, pierwsze 18): T-100, G-02, G-08, T-86, T-87, T-113, T-97, G-07, T-66, T-93, G-30, T-114, T-15, T-135, Z-05, T-04, T-111, T-14.
Automatyczne dopasowanie objęło dodatkowo wszystkie pozostałe kroki (121/121).

### Liczby
| Zakres | Pary | Zgodne | Niezgodne | Oznaczone „sprawdź na ekranie” |
|---|---|---|---|---|
| Próbka 32 kroków | 281 | 281 (272 automatycznie + 9 ręcznie) | 0 | 0 |
| Wszystkie kroki i wstępy | 674 | 671 (653 automatycznie + 18 ręcznie) | 0 | 3 (T-02 „Install”, „Update”; T-85 „button”) |

Potwierdzone ręcznie (automat nie dopasował, bo krótki literał szablonu, fragment albo złożenie): T-15 `formularz.znaczenie_w_trakcie_opis`; T-25/T-107 `menu.przypomnienie`; T-25 „Rząd 8: decrease at both ends” `licznik.przypomnienie` (zmienna `tekst` po angielsku — to tekst wpisany przez testującego); T-57 „… · do …” `kosz.*`; G-02, G-06, G-11, G-21 „N z 42” `przewodnik.postep_wiersza`; T-70, T-137 „Zostało 4 z 5” — fragment `projekty.dni_many` (w pl „Zostało” stoi na początku zdania); T-71 `limit.zawczasu_*` (ten klucz ekran pokazuje w miejscu +1: `Licznik.tsx:233`, `Dzis.tsx:128`; nie `aktywnosc.limit`); T-72 „Kontynuuj: Miesięcznie” `oferty.kup` + `oferty.miesieczny` (`Oferty.tsx:37`, `:110`).
Wybór klucza w kontekście — poprawny we wszystkich 16 niejednoznacznych napisach, m.in.: T-11 „Cofnij 4 rz.” = `licznik.cofnij_few` (przycisk banera serii, `Licznik.tsx:170`), nie `historia.cofnij_serie_few` „Cofnij 4 rzędy”; T-55, T-58 „Ukończone” = `projekty.ukonczone` (sekcja listy, `ListaProjektow.tsx:88`), nie `projekt.data_ukonczenia` „Ukończono” (etykieta daty); T-53 „Z 22 oczek…” = `probka.z_danych_cm_few` (22 → few), „110 oczek” = `*_many`; T-11 „Dodano 4 rzędy…” = `licznik.baner_seria_few`; Z-01 „1 zakreślenie”/„2 zakreślenia” = `wzor.zakreslenia_one/_few`; T-22 „Oczka” ⟦Stitches⟧ = `formularz.rodzaj_oczka`, T-23 „Rzędy” ⟦Rows⟧ = `formularz.rodzaj_rzedy`. Uprawnienie aparatu (T-35) = `locales/systemowe/pl.json` `NSCameraUsageDescription` znak w znak.

Polskie napisy spoza pl.json (wymyślone tłumaczenie): **brak**. Cytaty bez nawiasu w G-25 (po polsku), G-26 (niemiecki, japoński) są wartościami `pl.json`, `de.json`, `ja.json`.
Nazwy wpisywane przez testującego zostały po angielsku, zgodnie z regułą: Back, Front, **Stitches** jako nazwa licznika (T-22, T-57, wstęp sekcji 3) obok opcji „Liczy” → „Oczka” ⟦Stitches⟧, Ribbing, Sweater/Scarf/Scan/Watch/Highlight test, Test merino, „cast on 3 mm” (T-29, T-61), „decrease at both ends” (T-25, T-107).
Sens treści: 121 kroków, te same ID i kolejność, 20 sekcji; po rekonstrukcji angielskiej wszystkie pola 121 kroków i wstępy sekcji są identyczne z `bc49657`, poza T-53, gdzie pogrubione „110 stitches” stało się parą **„110 oczek”** ⟦110 stitches⟧ (poprawnie).
Przeglądarka (390 px): `scrollWidth` = 390 w trybie pełnym (podejścia 1, 2, 3), krótkim i krótkim ciemnym; żaden element nie wychodzi poza okno; konsola: 0 błędów i 0 ostrzeżeń; nieudanych żądań 0. Napisy angielskie: 489 + 120 + 62 = 671 elementów `.en` w krokach (podejścia 1–3), wszystkie widoczne, 13,6 px przy 17 px tekstu (0,8 em), w nawiasie („…”); w bloku statycznym 8 `.en`; surowych znaków `⟦⟧⟪⟫` w wyrenderowanym tekście 0; `[sprawdź na ekranie]` 2 + 1.

### Znaleziska
| ID kroku | Napis en | Napis na stronie | Oczekiwany pl (klucz) | Waga |
|---|---|---|---|---|
| T-55 (Powinno być, Szczegóły) | 2 skeins (w źródle bez cudzysłowu) | „W zapasie są 2 skeins” — po angielsku, bez pary i bez oznaczenia | „2 motki” ⟦2 skeins⟧ — `zapas.motki_few` (lista włóczek; T-50 ma już „3 motki” ⟦3 skeins⟧) | P2 |
| Zanim zaczniesz → Jak zgłaszać wynik | Back, Today, Guide (przykład uwagi) | „Back wrócił na Today, nie do Guide” — po angielsku, bez oznaczenia | np. „Wstecz wróciło na Dziś, nie do Przewodnika” — `wspolne.wstecz` „Wstecz”, `dzis.tytul` „Dziś”, `przewodnik.tytul` „Przewodnik” | P2 |
| T-85 (Powinno być) | button (VoiceOver) | „button” [sprawdź na ekranie] | „przycisk” — polski VoiceOver czyta rolę systemową, nie napis aplikacji; przy polskim telefonie testujący nie usłyszy „button”, a strona mówi, że oznaczenie dotyczy braku w plikach aplikacji | P2 |
| T-02; Zanim zaczniesz → Instalacja, Oczko na zegarku | Install, Update, Previous Builds, Information (TestFlight) | „Install”/„Update”/„Previous Builds”/„Information” [sprawdź na ekranie] | polskie nazwy TestFlight (reguła: napisy iOS po polsku); w repo nie ma źródła, a recenzent nie mógł ich potwierdzić — oznaczenie jest uczciwym zastępstwem, ale warto wpisać polskie nazwy po pierwszym zrzucie z TestFlight | P2 |
| Zanim zaczniesz → Co przygotować | Auto-Lock (iOS) | „Ekran i jasność → Automatyczna blokada” | „Autoblokada” — tak nazywa się ta pozycja w polskim iOS (według wiedzy recenzenta, nie z pliku w repo; do potwierdzenia na ekranie) | P2 |

Bez wagi: blok „Oczko na zegarku” ma angielskie napisy w cudzysłowie angielskim (“My Watch”), reszta strony („…”); T-72 odsyła do „Czego nie testować”, a nagłówek bloku brzmi „Czego nie testujesz” (z listy źródłowej); T-90, T-91 „Większe rozmiary” (iOS) — polskiej nazwy systemowej nie potwierdziłem; T-57 „… · do …” to format wiersza w „Ostatnio usunięte” (`kosz.*`), a krok mówi o „oknie usuwania” (tam jest `usun.projekt_opis` „…do {{data}}”) — rozjazd odziedziczony ze źródła, para pl/en sama w sobie jest poprawna.

### Werdykt
**ZGODNA Z UWAGAMI** — wszystkie 671 par „pl” ⟦en⟧ (281/281 w próbce 32 kroków) to dosłowne wartości `pl.json` dla właściwego klucza i właściwej formy liczby mnogiej, bez wymyślonych tłumaczeń i bez zmiany sensu 121 kroków; zostało 5 drobnych znalezisk P2 (dwa angielskie napisy bez oznaczenia, polski VoiceOver i nazwy systemowe iOS/TestFlight), żadnego P1.
