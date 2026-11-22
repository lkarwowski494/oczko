# Atlas technik 1.1 — rola 05, build, E3 (błędy, prywatność, wydajność, kontrole) · 2026-10-26

Wejście: P-213 (STOP E2 przyjęty; E2-Q1a; „rób E3 i E4”; dane 06 w `docs/atlas/dane/` przepuścić przez walidator wersji 1). Bramka E3 połączona z E4 na polecenie koordynatora — wyjątek nazwany (zasada wspólna 7); tańsza kontrola: wynik E3 opisany osobno, przed README.

## 1. Praca w tle

Nie dotyczy (moduł `tlo-i-sensory-ios` nie stosowany, E0 §6): atlas nie ma zadań w tle, sensorów ani dźwięku.

## 2. Polityka błędów atlasu (na bazie wzorca roli)

| Rodzaj | Przykład | Zachowanie | Dowód / test |
|---|---|---|---|
| Uszkodzony albo nowszy katalog | manifest `format` > 1, zły JSON | cały katalog odrzucony, aplikacja zostaje przy treści z paczki; stan „atlas niedostępny” projektuje 04 | test „manifest nowszego formatu”, „uszkodzony manifest” |
| Zła karta | brak pliku, inny rozmiar, SHA-256, schemat, karta nowszego formatu | karta pominięta, reszta działa; wpis do dziennika bez danych osobowych (kod błędu, ID karty) | testy manifestu (6 przypadków) |
| Rysunek, którego silnik nie umie | faza `narzut`, operacja `warkocz`, drut lewy | **walidator przed wydaniem** zgłasza `rysunek-nieobslugiwany` / `faza-nieobslugiwana`; karta nie wchodzi do katalogu publikowanego, dopóki nie przejdzie | testy walidatora (24 + nowe przypadki 1.1) |
| Wyjątek silnika przy rysowaniu (nie powinien wystąpić po walidacji) | błąd danych przepuszczony mimo kontroli | walidator: `rysunek:wyjatek` zamiast awarii; w aplikacji (08): granica błędu wokół komponentu rysunku — karta bez rysunku z podpisem i krokami, bez awarii ekranu | test „ujęcie środkowe przy 2 oczkach”; komponent: 07/08 |
| Brak tekstu w języku | klucz `t()` bez wartości | strona: błąd generatora, nic nie zapisane; aplikacja: łańcuch zastępczy ADR-0017 kończy się na `en`, ale karta pokazywana tylko według `jezykKarty` (P-213) | test „brak tekstu → błąd i żadnych plików” |
| Brak adresu strony | domena niekupiona | generator kończy się błędem, nic nie zapisuje | test „brak adresu” |

Atlas nie zapisuje danych użytkownika, więc klasa „nieudany zapis” nie występuje.

## 3. Prywatność (`docs/architektura/prywatnosc.md` — dopisek dla roli 10 w przekazaniu E4)

| Dane | Skąd | Gdzie | Czy opuszczają urządzenie | Cel | Czas życia |
|---|---|---|---|---|---|
| (brak) — katalog tylko do odczytu z paczki | — | — | nie | — | — |
| Wybór języka karty | ustawienie `jezyk` 1.0 (ADR-0017) | jak w 1.0 | nie | wybór języka | jak w 1.0 |

- **Required reason API:** atlas w domenie nie wywołuje API z tej listy. `react-native-svg` 15.15.4 — manifest prywatności pakietu `[DO USTALENIA: 08 po instalacji]`: `find node_modules -name PrivacyInfo.xcprivacy -not -path '*/example/*'` (wzorzec roli); wynik do inwentarza roli 10.
- **Sieć:** brak (treść w paczce, ADR-0025 (1)).
- **Strona:** statyczna, bez skryptów analityki i ciasteczek (generator nie dodaje `<script>`; test sprawdza `<svg>`, dopisać do kontroli 07: brak `<script>` w HTML). Dzienniki serwera po stronie hostingu — informacja w polityce prywatności strony `[DO USTALENIA: 10, po decyzji Q2]`.

## 4. Budżety wydajności (pomiar bazowy; cel ustala właściciel na podstawie pomiaru)

| Scenariusz | Pomiar bazowy | Urządzenie | Dane | Miara | Metoda |
|---|---|---|---|---|---|
| Model + SVG jednego kroku (Node, generator) | p50 12,7–18,0 ms, p95 14,6–23,0 ms | serwer CI-podobny (Xeon 2,1 GHz, Node 22) | karty próbne 4 × 2–3 rzędy | p50, p95 z 20 powtórzeń po 5 rozgrzewkowych | `performance.now()` wokół `siatkaPetli` + `doSvg` (E1 §2) |
| Model kroku w aplikacji | `[DO ZMIERZENIA]` | najstarszy wspierany iPhone (iOS 18, ADR-0006) | 31 kart MVP, ≤ 3 kroki | p95 z 20 otwarć karty | build deweloperski 1.1, `performance.now()` wokół `siatkaPetli`; krok właściciela (bez Maca agent nie mierzy). Gdy p95 zbyt duże: modele liczone przy budowaniu do JSON (opcja do ADR) |
| Rysowanie kroku (`react-native-svg`) | `[DO ZMIERZENIA]`; liczba elementów: 127 (`<path>`/`<polygon>`/`<circle>`) w rysunku 4 × 3 | jw. | jw. | czas do pierwszej klatki, p95 | Instruments (Time Profiler) albo znacznik w kodzie; krok właściciela |
| Rozmiar SVG (strona) | 13,7–27,3 KB na krok | — | 5 rysunków próbnych | bajty | `generuj.mjs` wypisuje rozmiar |
| Strona karty (3 kroki, inline SVG) | 54,7 KB; 5,4 KB po gzip | — | k2tog | bajty | `strona.mjs` + `gzip -c … \| wc -c` |
| Katalog w paczce aplikacji | 62,6 KB (34 karty, format 1 po migracji) + teksty en 21,8 KB | — | dane 06 z P-212 | bajty | `wc -c` |
| Cała strona | ok. 31 kart × 3 języki × ≤ 60 KB ≈ 5,6 MB `[OCENA]` | — | MVP | bajty | suma po generatorze; limit hostingu 1 GB (rejestr E0) |

## 5. Dane roli 06 przez walidator wersji 1 (P-213)

Wejście: `docs/atlas/dane/katalog.json` (kopia 06, „przed weryfikacją E3”, kontrakt 0.1, 34 karty).

| Krok | Wynik |
|---|---|
| Walidator 1 na danych 0.1 | 459 błędów `schemat` w 34 kartach — różnica formatu 0.1 → 1 |
| Narzędzie przejścia `scripts/atlas/migruj-0-1.mjs` (tylko mechanicznie; nie nadpisuje danych 06) | zmiany: terminy → lista ×75, `null` usunięte ×8, `drut` ×12 i `faza_opis` ×24 z rozszerzeń kroków, `rysunek: null` ×8, `kroki: []` ×7, `wysokosc` → `narzuty` ×4, rzemiosło/rodzaj tabel ×5 i schematów ×3 |
| Walidator 1.1 po przejściu | **50 błędów** do decyzji 06 (lista karta po karcie: `kontrakt-krokow.md` „Rozbieżności”): brak twierdzenia z wartością przy rysunku operacji narzutu (1, reguła koordynatora), `rozszerzenie_06` w kartach (20) i krokach (22), brak `opis_alt` przy nabieraniu (3), `probka.rzedy` 1 (1), M1 bez `scianka`/`pochylenie` (pole `skret`) (3) |
| Rysunek (karty `siatka-petli`, bez pól rozszerzeń) | **przechodzą:** ściegi stst, garter, rib (tkanina). **Brak `drut.grot`** (Z-06-02): k, p, k2tog. **Silnik nie rysuje jeszcze:** fazy `narzut`, `przeciagniecie`, `zdjecie` (k, p, skp, s2kp2, warkocz, BO), operacja `narzut` (yo), drut lewy (ssk). **Ograniczenie geometrii (znalezione na prawdziwych danych):** ujęcie lewe p2tog i ujęcie 3 oczek s2kp2 — łatki przeplotu zasłaniają się nawzajem (`przeplot`), s2kp2 także `budowa`; walidator je blokuje, więc nie trafią na stronę z błędnym rysunkiem |

Zmiany kontraktu wynikające z danych 06 (wersja **1.1**, `format` bez zmian, zgodne wstecz — `kontrakt-krokow.md` „Historia”): `probka.rzedy` = rzędy tkaniny **przed** operacją, operacja tworzy rząd `rzedy` (interpretacja 06 — mój opis „operacja w rzędzie rzedy − 1” był niejednoznaczny; karty próbne zmienione z 3 na 2 rzędy, rysunki bajtowo bez zmian); twierdzenia wartości opcjonalne; `terminy` z `en-US` wymagane tylko dla technik i haseł skrótów; `podpis`, `opis_alt` opcjonalne (`opis_alt` wymagany przy rysunku); kroki bez rysunku dozwolone (same podpisy); `pozycje` tabeli opcjonalne; nowe pola `publikacja`, `klucze_dodatkowe`, `twierdzenia` (wspierające) w twierdzeniu i kroku, wartości `znaczenie_ws`, `pomocniczy`, `narzuty`, `petle_po_wyciagnieciu`, `pozostaje_na_drucie`; `na_wierzchu: srodkowe` (nieparzysta liczba oczek); `faza: null` tylko w nabieraniu z `faza_opis`; `drut` w każdej fazie (wymagany w `wklucie`), `drut.grot` opcjonalny w schemacie, wymagany do rysunku wkłucia.

Jedna karta = jedna technika: `druty.dodanie.m1` (M1R i M1L) i `druty.warkocz.2-2` (RC i LC) mają po dwa warianty pod jednym ID — walidator zgłosi powtórzone ID twierdzenia po usunięciu błędów schematu (Z-06-04).

## 6. Lista kontroli automatycznych dla roli 07

| # | Kontrola | Stan | Gdzie |
|---|---|---|---|
| K-A1 | Testy silnika, kontraktu, manifestu, strony | w `npm test` (Jest zbiera `scripts/atlas/*.test.ts`) | `scripts/atlas/silnik.test.ts`, `kontrakt.test.ts` |
| K-A2 | Schemat w repo = schemat z kodu | w testach | `kontrakt.test.ts` |
| K-A3 | Determinizm rysunków (bajty plików prototypu) | w testach | `silnik.test.ts` |
| K-A4 | Strażnik liter w każdym SVG (P-192) | w testach + w walidatorze każdej karty | `svg.ts` `straznikLiter` |
| K-A5 | Walidacja danych 06: `waliduj.mjs docs/atlas/dane/katalog.json` | **informacyjna** do czasu przejścia danych na format 1 (dziś kod 1); bramka po pierwszym zielonym przebiegu (zasada 07 nr 8) | do dodania w `jakosc:kontrole` przy przejściu 06 — zmiana `package.json` uruchamia CI iOS, więc razem z inną zmianą 08 |
| K-A6 | `granice.mjs src` obejmuje `src/domena/atlas` | po przeniesieniu (08, 1.1) | istniejący krok `verify` |
| K-A7 | Strona: brak `<script>` i brak stron spoza `jezyki_gotowe`/skrótów/„po-generatorze” | hreflang i strony w testach; `<script>` — dopisać | `kontrakt.test.ts` „strona statyczna” |
| K-A8 | Komponent rysunku: liczba elementów = model, jedna etykieta dostępności, brak `Text` | po wdrożeniu komponentu (08) | 07 |
| Na urządzeniu (krok właściciela) | rysunek w motywie jasnym, ciemnym, „Zwiększ kontrast”; VoiceOver czyta jeden opis; pomiar czasu §4 | przy TestFlight 1.1 | lista „tylko telefon” |
