# Atlas technik 1.1 — rola 05, build, E0 (rozpoznanie) · 2026-10-26

Zlecenie: koordynator (P-093 (2), P-095, P-178, P-179, P-192). Prompt roli: `prompts` @97ec212, `05-architekt --tryb build`, 70 691 znaków (moduły: dane-lokalne-sqlite, pakiety-tresci, tlo-i-sensory-ios). Zakres: ADR-y, kontrakt danych katalogu, prototyp ryzyka; **bez kodu aplikacji 1.0** (`app/`, `src/` nietknięte).

## 1. Środowisko (ETAP 0)

| Sprawdzenie | Wynik |
|---|---|
| System, Node, git | Linux x86_64 (chmura), Node v22.22.0, gałąź `claude/jolly-thompson-paz6d8` @855230e, `npm ci` kod 0 |
| GitHub | push na gałąź roboczą (proxy); `oczko-warsztat` dołączone z zapisem (P-010); repo Treningu tylko do odczytu (publiczne) |
| Przeglądarka do PNG | Chromium + Playwright wbudowane (`require('playwright')`); do renderu prototypu |
| Xcode / symulator | brak (Linux) — rysunek w aplikacji sprawdzi 08 na E2E iOS i właściciel w TestFlight |
| Sieć | strony Expo, npm, dokumentacja GitHub i Google czytelne |
| Widoczność repo | publiczne — w repo tylko kod, schemat i przykład `[PRZYKŁAD]`; treść kart w `oczko-warsztat` do czasu przeglądu (zasada modułu `pakiety-tresci`) |
| Ścieżki a CI iOS | `jakosc-ios.yml` reaguje na `app/**`, `src/**`, `modules/**`, `targets/**`, `e2e/**`, `assets/**`, `app.json`, `package.json`, `package-lock.json`, `scripts/ci/**`, `scripts/natywne/czlonkostwo-celu.mjs` (odczyt pliku, 2026-10-26). **`scripts/atlas/` i `docs/atlas/` nie uruchamiają CI iOS.** Zmiana `package.json` uruchomiłaby — dlatego w 1.1-prototypie nie dodaję pakietu ani skryptu npm. |
| Testy w `verify` bez `package.json` | Jest (`jest.config.js`, `testMatch` `**/?(*.)+(spec|test).[jt]s?(x)`) zbiera `*.test.ts` z każdego katalogu, więc testy w `scripts/atlas/` wejdą do `npm test` bez zmiany `package.json`; typy przez dopisanie ścieżki do `tsconfig.testy.json` (nie jest w ścieżkach CI iOS). |

Równolegle na tej samej gałęzi pracuje kilka sesji (05 fix-6, 06 atlas, 07, 08, 10, 12). Ryzyko kolizji numerów ADR: zajmuję **0022–0025** i sprawdzam przed każdym pushem; wspólnych plików (`docs/decyzje.md`, `docs/sztafeta.md`, `CLAUDE.md`) nie ruszam przed E4.

## 2. Wejście i założenia (hipotezy, nie prawda)

| Założenie | Skąd | Status | Uwaga |
|---|---|---|---|
| Atlas to 1.1–1.2, nie 1.0 | P-093 (2), P-179 | potwierdzone (decyzja) | Kontrakt zakresu W1 nie ma przepływów atlasu (F-44 „PÓŹNIEJ”). Zasada architekta 1: projektuję na decyzjach P-093/P-095/P-179 jako jawnie nazwanej następnej wersji; **przepływy atlasu do kontraktu dopisze rola 03** (zgłoszenie w przekazaniu). |
| Rysunek bez liter, jeden plik na wszystkie języki | P-192 | decyzja właściciela | strażnik liter w generatorze |
| Glify własne, bez symboli CYC | P-081 P7a, P-095 | decyzja | test `origin: "own"` |
| Rysunki tylko z danych, bez generatora obrazów AI | P-178 | decyzja | — |
| Strona: podkatalogi językowe, hreflang dwustronny + x-default, bez strony na każdy skrót | P-095 | decyzja + Google (rejestr niżej) | — |
| Języki treści tylko z przeczytanym źródłem terminologii (start en-US, sv, pt-BR szydełko, potem pl) | P-095 D1, OP-12 | decyzja | **napięcie z 35 językami aplikacji** → pytanie Q3 |
| Model JSON i 12 testów z raportu B §5.3–5.4 | raport researchu (opinia soczewki, zweryfikowana) | hipoteza do sprawdzenia prototypem | prototyp E1 sprawdza testy 1–3, 9, 10, 12 |
| k2tog: pochylenie w prawo, −1 oczko | CYC „Knitting Abbreviations Master List”: „k2tog — knit 2 stitches together; single right-leaning decrease” (kopia `oczko-warsztat/strona-katalog/2026-10-25-research/zrodla/B-cyc-knitting-abbreviations.txt:174–175`, odczyt źródła 2026-10-25; przeczytane surowo 2026-10-26) | szczebel 1 | ID twierdzenia nadaje rola 06 |

## 3. Tabela przepływ → technika (przepływy 1.1 według P-093/P-095; numeracja robocza A/S/G do nadania przez 03)

| Przepływ | Dane czytane / zapisywane | Zdarzenia | Tło | Offline | Uprawnienia | Stany wymagające wsparcia |
|---|---|---|---|---|---|---|
| A1 Lista atlasu w aplikacji (karty technik, słownik skrótów) | katalog (tylko odczyt); zapis: brak (ewentualnie „ostatnio oglądane” — poza zakresem, bez ADR) | użytkownik | nie | tak (dane w paczce, ADR-0025) | brak | język bez źródła terminologii (Q3); pusty filtr |
| A2 Karta techniki: rysunek, podpis, kroki, skróty US/UK | katalog + słownik `t()` | użytkownik | nie | tak | brak | motyw jasny/ciemny, „Zwiększ kontrast”, duża czcionka (podpis poza rysunkiem) |
| A3 VoiceOver | tekst alternatywny przez `t()` (P-192 (2)) | czytnik ekranu | nie | tak | brak | rysunek jako jeden obraz z opisem |
| S1 Strona statyczna: karta na język | ten sam katalog | żądanie HTTP | — | — | — | język bez treści → brak strony (P-095), nie pusty szablon |
| S2 hreflang, x-default, mapa strony | lista języków z gotową treścią | budowanie | — | — | — | — |
| S3 Odnośnik do App Store | ID aplikacji `[DO USTALENIA]` (rola 10) | użytkownik | — | — | — | — |
| G1 Generator i testy (budowanie, CI Linux) | katalog → SVG, HTML, PNG do oceny | `verify` | — | — | — | błąd walidacji = kod 1, bez częściowego wyniku |

## 4. Skala danych

- **MVP strony: 31 pozycji** (5 tabel słownikowych, 26 kart technik; P-095 D2); inwentarz 57 (raport B §3).
- Rysunki: 1–3 na kartę → szacunek 30–80 SVG `[OCENA]`; rozmiar pliku zmierzę na prototypie (E1) i podam w budżecie (E3).
- Języki treści na start: 3 (en-US, sv, pt-BR tylko szydełko), potem pl; podpisy w aplikacji przez `t()` — 35 kluczy na tekst, ale wartości tylko dla języków ze źródłem (Q3).
- Dane użytkownika: **żadnych** (katalog tylko do odczytu). Po 3 latach: wzrost liczby kart i języków, nie danych użytkownika.

## 5. Rejestr ograniczeń platformy (odczyt 2026-10-26)

| Ograniczenie | Wartość | Źródło i cytat | Wpływ |
|---|---|---|---|
| Wersja `react-native-svg` zgodna z SDK 57 | 15.15.4 | `expo/expo@sdk-57/packages/expo/bundledNativeModules.json:114`: `"react-native-svg": "15.15.4"` | wiersz ADR-0016 (1.1) |
| Wiek wersji (P-036: ≥ 14 dni) i licencja | 15.15.4 wydana 2026-03-18; MIT | rejestr npm (`time["15.15.4"]` = `2026-03-18T09:09:43.950Z`, `license` = `MIT`) | spełnia P-036; `licencje.mjs` |
| Ta sama wersja w Treningu | 15.15.4 | `trening/package.json:61` `"react-native-svg": "15.15.4"` | analogia P-087 |
| `expo-image` a SVG na iOS | obsługuje SVG z zastrzeżeniem | docs.expo.dev/versions/v57.0.0/sdk/image: „† On iOS, the system SVG decoder does not handle every valid path. An elliptical arc command ( A or a ) with more than one parameter set and packed large-arc-flag and sweep-flag values can render distorted or not render at all.” | opcja B w ADR-0024; generator nie używa łuków `A` |
| `expo-image` w SDK 57 | `~57.0.5` | `bundledNativeModules.json:51` | opcja B |
| hreflang | każda wersja wymienia siebie i wszystkie inne; x-default dla niedopasowanych | developers.google.com/search/docs/specialty/international/localized-versions: „Each language version must list itself as well as all other language versions.”; „Consider adding a fallback page for unmatched languages … Use the the x-default value” | ADR-0025, test generatora strony |
| Jedna strona Pages na repozytorium | 1 | docs GitHub „What is GitHub Pages”: „Maximum of one pages site per repository” | **repo Oczka ma już stronę produktu (`site/`, `pages.yml`)** → osobna domena atlasu wymaga osobnego repo albo innego hostingu (Q2) |
| Limity Pages | 1 GB strony, 100 GB/mies. miękko, wdrożenie ≤ 10 min | docs GitHub „GitHub Pages limits”: „Published GitHub Pages sites may be no larger than 1 GB.”; „soft bandwidth limit of 100 GB per month”; „deployments will timeout if they take longer than 10 minutes” | budżet rozmiaru strony (E3) |
| Przeznaczenie Pages | nie jako hosting działalności handlowej | tamże: „is not intended for or allowed to be used as a free web-hosting service to run your online business, e-commerce site, or any other website that is primarily directed at either facilitating commercial transactions …” | atlas to treść edukacyjna z odnośnikiem do sklepu, jak strona Treningu; ocena prawna nie moja — ryzyko R-A4 |

Kopie stron: `oczko-warsztat/05-architekt/2026-10-26-atlas/zrodla/` (bez danych osobowych).

## 6. Stosowalność modułów

| Moduł | Stosuję? | Powód |
|---|---|---|
| `dane-lokalne-sqlite` | **nie** | atlas nie zapisuje danych użytkownika; katalog tylko do odczytu, oddzielony od bazy 1.0 (ADR-0001 bez zmian) |
| `tlo-i-sensory-ios` | **nie** | brak pracy w tle, sensorów i dźwięku |
| `pakiety-tresci` | **tak, częściowo** | treść wersjonowana osobno od kodu i tworzona w innej roli (06); decyzja o dostarczeniu (w paczce / pobierane), format i integralność → ADR-0025 |
| Kod z innych aplikacji | Trening wskazany przez koordynatora: `docs/50-figury-v2.md`, `scripts/figures/` (odczytane) | przenoszę sposób: rodzina = funkcja z parametrami, kontrakt danych z własnym walidatorem i komunikatami z miejscem błędu, generator dokumentu, podgląd PNG przez Playwright, testy niezmienników dziedziczone przez każdą rodzinę |

## 7. ADR do podjęcia (E1, status „proponowana”)

| Nr | Problem | Opcje (≥ 2) | Wstępna rekomendacja |
|---|---|---|---|
| 0022 | Silnik rysunków: gdzie liczona geometria i w jakiej formie | A: czysty TS — model rysunku (ścieżki z rolami i warstwami) + serializator SVG; ten sam kod w aplikacji i w generatorze strony (Trening `lib/figures/v2`) · B: generator tylko w Node, aplikacja dostaje gotowe pliki · C: ręczne SVG | A |
| 0023 | Kontrakt danych katalogu: format, walidator | A: JSON + JSON Schema 2020-12 + własny walidator TS z komunikatami ścieżki (Trening `contract.ts`/`v2-validate.mjs`), bez zależności · B: walidator `ajv` (nowa zależność dev, zmiana `package.json`) · C: typy TS bez schematu | A |
| 0024 | Rysunek w aplikacji | A: `react-native-svg` 15.15.4 z modelu (jak Trening) · B: `expo-image` z pliku SVG · C: PNG generowane przy budowaniu | A (decyzja przy starcie 1.1, wiersz ADR-0016 „1.1”) |
| 0025 | Dostarczenie treści i strona statyczna | A: katalog w paczce aplikacji + strona generowana z tego samego JSON (hosting wg Q2) · B: pobierany pakiet treści · C: strona ręczna | A |

## 8. Pytania produktowe (do koordynatora wg P-087)

**Q1. Rysunek w aplikacji (ADR-0022 + 0024).**
- (a) Silnik TS w aplikacji, rysunek z modelu przez `react-native-svg` — jak Trening; motyw i „Zwiększ kontrast” z tokenów bez dodatkowych plików; koszt: nowa zależność natywna w 1.1 (wersja z SDK 57, MIT).
- (b) Pliki SVG z generatora, render `expo-image` — mniej kodu w aplikacji; koszt: plik na motyw (2–4 warianty), mniejsza kontrola dostępności, zastrzeżenie dekodera iOS.
- (c) PNG — bez zależności; koszt: rozmiar paczki × motywy × gęstości, rozmyte przy powiększeniu.
- **Rekomendacja: (a)** — bezpośrednia analogia z Treningiem; testy geometrii działają na tym samym kodzie, który rysuje w aplikacji.

**Q2. Hosting strony atlasu na osobnej domenie.**
- (a) Osobne publiczne repo (np. „oczko-atlas”) z własną stroną Pages; jego przepływ CI klonuje publiczne repo Oczka w wersji z tagu, uruchamia generator i wdraża — bez sekretów i bez kosztu poza domeną. Założenie repo i domena: konto właściciela.
- (b) Podkatalog obecnej strony produktu do czasu domeny — szybciej, ale sprzeczne z P-093 (3) „opisowa domena” i miesza dwie strony w jednym wdrożeniu.
- (c) Inny darmowy hosting statyczny — nowa usługa i konto (zasada 13: ADR z limitem).
- **Rekomendacja: (a)**; w ADR-0025 zostawiam pole na adres (`[DO USTALENIA: domena, właściciel]`).

**Q3. Atlas w aplikacji w języku bez źródła terminologii (dziś 32 z 35).**
- (a) Karta w języku użytkownika tylko, gdy treść ma źródło i przegląd; w pozostałych angielska wersja z widoczną informacją o języku (łańcuch zastępczy ADR-0017 kończy się na `en`).
- (b) Atlas ukryty w tych językach do czasu źródeł.
- (c) Tłumaczenie bez źródła — odrzucam z góry (R1: błędny termin psuje robótkę).
- **Rekomendacja: (a)**; pełna decyzja o ekranie należy do 03/04 — architektura obsłuży obie przez pole `jezyki_gotowe` w katalogu.

## 9. Plan i czas

| Etap | Praca agenta | Czekanie | Czas właściciela |
|---|---|---|---|
| E1: ADR 0022–0025 + prototyp ryzyka (silnik `loop-grid`, 3 rysunki: oczko prawe, oczko lewe, k2tog; testy geometrii i strażnik liter; PNG) | 3–4 h | odpowiedź koordynatora na Q1–Q3 | — |
| E2: kontrakt katalogu (schema, walidator, przykład karty), granice modułów, uzgodnienie pól z 06 | 1,5–2 h | odpowiedź 06 (przez koordynatora albo `docs/atlas/pola-katalogu.md`) | — |
| E3: błędy, prywatność (brak danych), budżety rozmiaru i czasu z metodą | 0,5–1 h | — | — |
| E4: README atlasu, przekazanie (03, 04, 06, 07, 08, 09, 10) | 0,5 h | — | — |
| Decyzje kosztowe (domena, nowe repo) | — | — | ok. 15 min przy starcie strony (P-093 D4) |

Danych od modelu ani płatnego API nie planuję: rysunki trzech technik liczy się szybciej z ograniczeń niż przez pilotaż z odpowiedziami modelu sprawdzanymi testami.

## 10. Ryzyka

- **R-A1** Geometria przeplotu (które pasmo na wierzchu) w 2D wymaga warstw i „obwódki” w kolorze tła — ryzyko artefaktów na złączach. Kontrola: prototyp E1 + test „każde skrzyżowanie między różnymi warstwami”.
- **R-A2** Rozjazd pól z rolą 06. Kontrola: wspólny plik pól w `docs/atlas/`, walidator na przykładzie 06.
- **R-A3** Kolizje numerów ADR przy równoległych sesjach. Kontrola: `ls docs/adr` przed pushem.
- **R-A4** Przeznaczenie hostingu Pages (cytat wyżej). Kontrola: treść edukacyjna, bez sprzedaży na stronie; decyzja przy starcie strony.
- **R-A5** Strona nie powinna publikować języka bez źródła (P-095). Kontrola: generator pomija język bez `jezyki_gotowe`, test.
