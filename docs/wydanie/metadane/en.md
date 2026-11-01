# Metadane en — twierdzenia, warunki, otwarte (rola 10, E2, 2026-10-30; szkic poprawiony 2026-11-01)
**Stan 2026-11-01 (P-320): szkic, NIE zamrożone** — koordynator: metadane z gotowej aplikacji dopiero po audycie buildu kandydata; sum dla 09 nie ma (`sklep.md` §3a). Zmiany względem szkicu: (1) „a calendar of the days you knit” → „a calendar of **your crafting days**” (P-302 „crafting days”; P-304: „knit” tylko tam, gdzie mowa o drutach); (2) dopisane en-AU (= en-GB) i en-CA (= en-US) jak w Treningu (decyzja tamtego repo 21.10.2026, P-315); (3) bez zdań o zegarku i iCloud (P-300; P-316: właściciel ma zegarek, test będzie — zdanie dopiero po wyniku testu, po wyniku testu). Liczby po zmianie: opis 1731 zn., słowa kluczowe en-US 97 B. Zgodność z P-304: tytuł i opis „knitting and crochet” (B), podtytuł „Knit & crochet” (B), słowa kluczowe `knitting` i `crochet`; brak zdań o kategorii grubości z próbki. Poniższe tabele z 2026-10-30 zostają jako dowody twierdzeń.
Pola: `en.store.json` (en-US, en-GB; format EAS Metadata, niczego nie wysyła). `sprawdz-wydanie.mjs metadane en.store.json` → OK, kod 0 (2026-10-30; kopia skryptu z promptu roli, scratchpad). Liczby: nazwa 18 zn., podtytuł 26 zn., tekst promocyjny 160 zn., opis 1730 zn., słowa kluczowe en-US 94 B (en-GB 99 B). Limity: nazwa 30, podtytuł 30, promo 170, opis 4000, słowa 100 B (App Store Connect Help, odczyt 18.10.2026; sprawdź w dniu wysyłki). Brzmienie en nie jest zamrożone: wymaga audytu 04 i kroku 2.2 planu prac (P-297: ryzyko przeróbek nazwane). Przekład 35 języków dopiero po zamrożeniu.

## Twierdzenie → dowód w kontrakcie zakresu / kodzie
Wszystkie F-ID z `docs/scope-contract.md` (decyzja MVP). „Kod” oznacza ciąg w `src/i18n/slowniki/en.json` (otwarty 2026-10-30). Potwierdzenie działania w buildzie: audyt 07 (2.4) i test na urządzeniu; do tego czasu teksty są szkicem.

| Zdanie w sklepie | Dowód | Uwaga |
|---|---|---|
| +1 z wibracją, −1 | F-01, kod `licznik.plus`, `licznik.minus` | — |
| ekran nie gaśnie | F-10 | test U11 |
| historia z godziną, cofnięcie | F-02, kod `licznik.historia`, `licznik.cofnij_one` | — |
| „offers to undo” przy lawinie stuknięć; opcjonalna blokada | F-47 (kod `licznik.baner_seria_one`: „Undo?”), F-03 (`licznik.zablokowany`) | nie piszę „protection” (zgodnie z `docs/wzrost.md`) |
| otwiera się w ostatnim miejscu, notatka obok licznika | F-49, F-18, F-15 | — |
| wzór z PDF, Worda, zdjęcia/skanu, strony WWW, link do filmu | F-24, F-55; kod `wzor.skanuj`, „Choose file (PDF or Word)” | **OG-07** (P-218): weryfikacja patentowa w gotowym kodzie (plan-prac, etap 4) — do tego czasu zdania o wzorze i słowa pattern/pdf to warunek |
| „Share” z innych aplikacji | rozszerzenie „Udostępnij do Oczka” (P-217, ADR-0011), U5 | — |
| znacznik rzędu na wzorze, zakreślanie palcem, Apple Pencil na iPadzie | F-26, F-56, F-28; kod `wzor.zakreslacz`, `wzor.rysik_podpowiedz` | „Apple Pencil”: znak towarowy Apple użyty opisowo; ryzyko 2.3.7 nisko, rozstrzyga recenzent [OCENA]. Test z Pencil: krok właściciela przy TestFlight |
| wzór i licznik na jednym ekranie | F-25 | — |
| części, kilka liczników, powtórzenia, cele | F-14, F-04, F-05, F-08; kod `formularz.powt_tytul`, `formularz.cel_tytul` | — |
| przypomnienia „every 6th row, 8 times” | F-06; kod `formularz.przyp_opis` | przypomnienie na ekranie licznika, nie powiadomienie |
| rozmiar drutu/szydełka, próbka, zdjęcia, notatki | F-17, F-16, F-15; kod `formularz.narzedzie_tytul`, `projekt.probka` | — |
| stoper sesji, kalendarz dni z robótką („your crafting days”) | F-21, F-59 | po P-302 bez „days you knit” |
| zapas włóczki i narzędzi, kalkulator próbki | F-37, F-38; kod `narzedzia.probka` | — |
| „Recently deleted” 30 dni | F-33; kod `projekty.kosz` | — |
| bez konta, reklam i śledzenia; offline | F-36, NFR-PRY-001; `docs/architektura/prywatnosc.md` | — |
| eksport wszystkiego, import kopii | F-32; kod `ustawienia.eksport`, `ustawienia.import` | — |
| 5 „crafting days” w miesiącu (P-302), Pro znosi limit, praca w toku nie jest przerywana | F-63, `docs/monetyzacja.md` „Opis w sklepie”; kod `oferty.bez_pro`, `limit.arkusz_dni` | **sklep mówi „crafting days”, a aplikacja (klucze `limit.*`, `oferty.bez_pro`, `projekty.dni`, `licznik.ostatni_darmowy`, `ukonczenie.dni`, `dni.dni_robotki`) do zmiany przez 08 — przed wysyłką tekst sklepu i interfejsu muszą być zgodne (2.3)** |
| miesięczna, roczna i jednorazowa; odnowienie do anulowania | `docs/monetyzacja.md` (V4); kod `oferty.odnawianie_miesiac` | **bez cen w opisie** (2.3.7: „pricing information”); obowiązek ujawnień 3.1.2 spełnia ekran ofert |

## Celowo nieobecne w tekście bazowym (warunki)
| Treść | Dlaczego | Wariant po warunku |
|---|---|---|
| synchronizacja iCloud | `ICLOUD_W_1_0 = false` (`src/konfiguracja.ts:29`): przełącznik ukryty w buildzie App Store do czasu ZM-06 (test telefon ↔ iPad, P-218 Q5a). F-27 jest MVP, ale w wydaniu zależy od testu | po ZM-06: do „YOUR DATA STAYS YOURS” dopisać: „Optional iCloud sync keeps your projects on your iPhone and iPad.” (+ polityka prywatności i App Privacy, `sklep.md` §4) |
| Live Activity na ekranie blokady, Apple Watch | F-11, F-12 są MVP, ale `docs/wzrost.md` i P-146 wymagają potwierdzenia przez 07 audit i test; właściciel nie ma zegarka (P-290: „nie sprawdzono”) | po audycie 07: „Count from the Lock Screen and on Apple Watch.” (zegarek bez testu = bez zdania w sklepie, wystarczy opis w notatce) |
| ceny | 2.3.7 | nigdy w metadanych |
| „free app”, „trial” | MS-47, 2.3.2 | — |
| Siri, szacunek czasu, dodawanie/ujmowanie oczek, słownik | F-13, F-22, F-40, F-44: PÓŹNIEJ | wzrost 1.1 |
| Family Sharing | `FAMILY_SHARING = false` (`src/kompozycja/adresy.ts:10`) do kroku ASC 2 | po kroku 2 i 08 |

## Słowa kluczowe
en-US: `knitting,stitch,tracker,pattern,pdf,yarn,stash,needles,project,tally,gauge,notes,crochet,reminder` (97 B). en-GB: `knitting,stitch,tracker,pattern,pdf,yarn,wool,stash,needles,project,tally,gauge,crochet,reminder` (96 B; bez `notes` dla miejsca). Zmiana względem propozycji 11: `hook` → `crochet` (P-302, patrz niżej). Bez nazwy aplikacji i innych aplikacji; bez powtórzeń słów z nazwy (skrypt: bez UWAG). Baza: propozycja `docs/wzrost.md` (P-148 E1-3a); własnego badania fraz w tej sesji nie było. Warunek `pattern`, `pdf`: OG-07.

### Czy „knitting” musi zostać w słowach albo podtytule (P-302; odczyt 2026-10-30)
- Apple, App Store Connect Help „Platform version information”: słowa kluczowe „each greater than two characters”, „up to 100 bytes”; „Your app is searchable by app name and company name, so you shouldn't duplicate these values in the keyword list.” Opis: „will be used for web engine search results once you release your app” — tekst nie mówi, że opis jest indeksowany w wyszukiwarce App Store.
- Apple, developer.apple.com/app-store/product-page/: słowa kluczowe „help determine where your app displays in search results”; opis: „Don’t add unnecessary keywords to your description in an attempt to improve search results.” Strona o podtytule nie mówi nic o indeksowaniu.
- **Wniosek:** u źródła pierwotnego potwierdzone jest indeksowanie tylko nazwy, nazwy firmy i pola słów kluczowych. Wcześniejsze zdanie tego dokumentu „Apple indeksuje podtytuł” **nie ma potwierdzenia w tych stronach** (wiedza branżowa, nie źródło) — wycofane. Skoro opis i podtytuł nie są potwierdzone jako indeksowane, ani „knitting”, ani „crochet” nie mogą polegać na podtytule: obie techniki są w słowach (`knitting`, `crochet`). „Knitting” zostaje w słowach (fraza główna niszy) i w podtytule „Knit & crochet” (czytelność dla człowieka). Skutek: brak potrzeby, by „knitting” był w opisie jednostki limitu.

## „What’s New”
Pierwsza wersja: pole nie jest dostępne („isn’t available for the first version”, App Store Connect Help, odczyt 18.10.2026), więc `releaseNotes` w pliku ("First release of Oczko.") to zapas na wypadek innego zachowania ASC; nie wgrywać, jeśli pole jest wyszarzone. Dla 1.0.1 i 1.1: szablon z kontraktu roli (lista zmian z `git log`, bez zmyślonych próśb; 2.3.12).

## Otwarte
1. **[DO USTALENIA] Kategoria** (Lifestyle vs Productivity): propozycja 11 w `docs/wzrost.md`; wybór w ASC przy wpisie (krok właściciela).
2. **Przegląd native speakera** nie dotyczy en; dla en wystarczy przegląd AI (D-027). Brzmienie tekstów promocyjnych rozstrzyga 04 (głos marki) — zgłoszenie po audycie.
3. Zrzuty (2.5): po audycie 04. Klasy do wykonania (`ios.supportsTablet = true`, `app.json`): iPhone z Dynamic Island, duży (1320×2868) jako bezpieczny nadzbiór klasy średniej, oraz iPad 13″ (2064×2752); format PNG/JPEG bez przezroczystości (App Store Connect Help, odczyt 18.10.2026; wymagane klasy potwierdzi pierwsza wysyłka [DO USTALENIA]).

## Po audycie 04 (2026-10-30; raport `oczko-warsztat` a8f3904, P-301) — wpływ na metadane en
- Jedyne rozstrzygnięcie dotykające tekstów: **04-studio-projektowe-007** (jednostka limitu). **Rozstrzygnięte przez koordynatora (P-302, 2026-10-30): „crafting days”.** Zmienione w `en.store.json` (`promoText`, akapit „FREE AND OCZKO PRO”) i w `notatka-recenzja.txt`. Do zmiany w aplikacji przez 08: 15 kluczy en o dniach (lista w raporcie 04, `dowody/knitting-klucze.txt`); test zgodności po zmianie: ta sama fraza w sklepie i w `limit.*`, `oferty.bez_pro`, `projekty.dni`.
- Podtytuł „Knit & crochet, no account” bez zmian; po P-302 sprzeczność znika.
- Pozostałe znaleziska (krój tytułowy, wersaliki, ✕ w ofertach, etykiety „Part”, ciemny motyw) nie zmieniają twierdzeń w metadanych. Klucze en do zamrożenia (2.2) nie występują w tekstach sklepu.
- Zrzuty: audyt 04 widział tylko iPhone, pion, jasny motyw (P1-002); iPad, poziom, AX5 i ciemny po pełnym przebiegu `[e2e-pelny]`. Plan zrzutów (`zrzuty-plan.md`) zakłada klasy iPhone i iPad, więc zależy od tego przebiegu i od scenariusza 08.
